import { createToken } from './auth';

// ==================== UserService ====================
export class UserService {
  constructor(private kv: KVNamespace, private jwtSecret: string) {}

  private async getUser(username: string): Promise<any> {
    return await this.kv.get(`user:${username}`, 'json');
  }

  private async setUser(username: string, user: any) {
    await this.kv.put(`user:${username}`, JSON.stringify(user));
  }

  async register(data: { username: string; password: string; email: string; code: string }): Promise<{ token: string; user: any }> {
    const { username, password, email, code } = data;
    if (!username || !password || password.length < 6) {
      throw new Error('用户名或密码不符合要求');
    }
    const existing = await this.getUser(username);
    if (existing) throw new Error('用户名已存在');

    const verifyCode = await this.kv.get(`verify:${email}`);
    if (verifyCode !== code) throw new Error('验证码错误');

    const user = {
      username,
      password, // 生产环境应该哈希
      email,
      role: username === 'admin' ? 'admin' : 'user',
      points: 100,
      subdomains: [],
      createdAt: new Date().toISOString(),
      banned: false,
    };
    await this.setUser(username, user);
    const token = await createToken(username, this.jwtSecret);
    return { token, user: { ...user, password: undefined } };
  }

  async login(data: { username: string; password: string }): Promise<{ token: string; user: any }> {
    const user = await this.getUser(data.username);
    if (!user) throw new Error('用户名或密码错误');
    if (user.password !== data.password) throw new Error('用户名或密码错误');
    if (user.banned) throw new Error('账号已被封禁');
    const token = await createToken(data.username, this.jwtSecret);
    return { token, user: { ...user, password: undefined } };
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('用户不存在');
    // 获取用户的子域名详细信息
    const subdomains: any[] = [];
    const list = await this.kv.list({ prefix: `subdomain:${userId}:` });
    for (const key of list.keys) {
      const sub = await this.kv.get(key.name, 'json');
      if (sub) subdomains.push(sub);
    }
    return { ...user, subdomains, points: user.points || 0, password: undefined };
  }

  async updateProfile(userId: string, data: any): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('用户不存在');
    if (data.email) user.email = data.email;
    await this.setUser(userId, user);
    return { success: true };
  }
}

// ==================== SubdomainService ====================
export class SubdomainService {
  constructor(private kv: KVNamespace, private cfToken: string) {}

  async getDomains(): Promise<{ domains: any[] }> {
    let domains = await this.kv.get('config:domains', 'json');
    if (!domains || domains.length === 0) {
      // 初始化默认域名
      domains = [{ domain: 'bxya.top', zoneId: 'f582c9cdf4c74cedac73fb66c2135ec6' }];
      await this.kv.put('config:domains', JSON.stringify(domains));
    }
    return { domains };
  }

  async getUserSubdomains(userId: string): Promise<any[]> {
    const prefix = `subdomain:${userId}:`;
    const list = await this.kv.list({ prefix });
    const subdomains: any[] = [];
    for (const key of list.keys) {
      const sub = await this.kv.get(key.name, 'json');
      if (sub) subdomains.push(sub);
    }
    return subdomains;
  }

  async create(userId: string, data: any): Promise<any> {
    const { subdomain, domain, target, recordType } = data;
    if (!subdomain || !domain) throw new Error('子域名和域名为必填');

    // 禁止直接使用根域名
    if (subdomain.trim() === '' || subdomain.trim() === '@') {
      throw new Error('不能使用根域名');
    }

    const key = `subdomain:${userId}:${domain}:${subdomain}`;
    const existing = await this.kv.get(key, 'json');
    if (existing) throw new Error('子域名已存在');

    const fullDomain = `${subdomain}.${domain}`;
    const subData = {
      domain,
      subdomain,
      fullDomain,
      target: target || '',
      recordType: recordType || 'CNAME',
      owner: userId,
      createdAt: new Date().toISOString(),
    };

    // 调用 Cloudflare API 创建 DNS 记录
    const domains = await this.kv.get('config:domains', 'json') || [];
    const domainConfig = domains.find((d: any) => d.domain === domain);
    if (domainConfig) {
      // 检查 Cloudflare 上是否已有该子域名的 DNS 记录
      const hasExisting = await this.checkExistingRecord(domainConfig.zoneId, fullDomain);
      if (hasExisting) {
        throw new Error('该子域名已有 DNS 记录，不可使用');
      }
      await this.createCFRecord(domainConfig.zoneId, subData);
    }

    await this.kv.put(key, JSON.stringify(subData));
    return { subdomain: subData };
  }

  async getInfo(userId: string, domain: string, subdomain: string): Promise<any> {
    const key = `subdomain:${userId}:${domain}:${subdomain}`;
    const data = await this.kv.get(key, 'json');
    if (!data) throw new Error('子域名不存在');
    return data;
  }

  async edit(userId: string, domain: string, subdomain: string, data: any): Promise<any> {
    const key = `subdomain:${userId}:${domain}:${subdomain}`;
    const existing = await this.kv.get(key, 'json');
    if (!existing) throw new Error('子域名不存在');

    existing.recordType = data.recordType || existing.recordType;
    existing.target = data.target || existing.target;

    // 更新 Cloudflare DNS
    const domains = await this.kv.get('config:domains', 'json') || [];
    const domainConfig = domains.find((d: any) => d.domain === domain);
    if (domainConfig) {
      await this.updateCFRecord(domainConfig.zoneId, existing);
    }

    await this.kv.put(key, JSON.stringify(existing));
    return { success: true };
  }

  async delete(userId: string, domain: string, subdomain: string): Promise<any> {
    const key = `subdomain:${userId}:${domain}:${subdomain}`;
    const data = await this.kv.get(key, 'json');
    if (!data) throw new Error('子域名不存在');

    // 删除 Cloudflare DNS
    const domains = await this.kv.get('config:domains', 'json') || [];
    const domainConfig = domains.find((d: any) => d.domain === domain);
    if (domainConfig) {
      await this.deleteCFRecord(domainConfig.zoneId, data);
    }

    await this.kv.delete(key);
    return { success: true };
  }

  private async createCFRecord(zoneId: string, record: any): Promise<void> {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.cfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: record.recordType,
        name: record.fullDomain,
        content: record.target || (record.recordType === 'CNAME' ? 'bxya.top' : ''),
        ttl: 1,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errors?.[0]?.message || 'Cloudflare API 错误');
    }
  }

  // 检查 Cloudflare 上是否已有该子域名的 DNS 记录
  private async checkExistingRecord(zoneId: string, fullDomain: string): Promise<boolean> {
    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${encodeURIComponent(fullDomain)}`, {
        headers: { 'Authorization': `Bearer ${this.cfToken}` },
      });
      const data = await res.json() as any;
      return data.result && data.result.length > 0;
    } catch {
      return false;
    }
  }

  private async updateCFRecord(zoneId: string, record: any): Promise<void> {
    // 简化为删除后重建
    await this.deleteCFRecord(zoneId, record);
    await this.createCFRecord(zoneId, record);
  }

  private async deleteCFRecord(zoneId: string, record: any): Promise<void> {
    // 需要DNS记录ID - 这里简化处理
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${record.subdomain}`, {
      headers: { 'Authorization': `Bearer ${this.cfToken}` },
    });
    const data = await res.json() as any;
    if (data.result && data.result.length > 0) {
      for (const r of data.result) {
        await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${r.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.cfToken}` },
        });
      }
    }
  }
}

// ==================== AdminService ====================
export class AdminService {
  constructor(private kv: KVNamespace, private cfToken: string) {}

  private async checkAdmin(userId: string) {
    const user = await this.kv.get(`user:${userId}`, 'json');
    if (!user || user.role !== 'admin') throw new Error('没有权限');
    return user;
  }

  async getUsers(userId: string): Promise<{ users: any[] }> {
    await this.checkAdmin(userId);
    const users: any[] = [];
    const list = await this.kv.list({ prefix: 'user:' });
    for (const key of list.keys) {
      const u = await this.kv.get(key.name, 'json');
      if (u) users.push({ ...u, password: undefined });
    }
    return { users };
  }

  async getAllSubdomains(userId: string): Promise<{ subdomains: any[] }> {
    await this.checkAdmin(userId);
    const subdomains: any[] = [];
    const list = await this.kv.list({ prefix: 'subdomain:' });
    for (const key of list.keys) {
      const s = await this.kv.get(key.name, 'json');
      if (s) subdomains.push(s);
    }
    return { subdomains };
  }

  async adjustPoints(userId: string, data: { username: string; points: number; action: string }): Promise<any> {
    await this.checkAdmin(userId);
    const user = await this.kv.get(`user:${data.username}`, 'json');
    if (!user) throw new Error('用户不存在');
    if (data.action === 'add') {
      user.points = (user.points || 0) + data.points;
    } else if (data.action === 'set') {
      user.points = data.points;
    }
    await this.kv.put(`user:${data.username}`, JSON.stringify(user));
    return { success: true };
  }

  async toggleBan(userId: string, targetUsername: string): Promise<any> {
    await this.checkAdmin(userId);
    const user = await this.kv.get(`user:${targetUsername}`, 'json');
    if (!user) throw new Error('用户不存在');
    user.banned = !user.banned;
    await this.kv.put(`user:${targetUsername}`, JSON.stringify(user));
    return { success: true };
  }

  async addDomain(userId: string, data: { domain: string; zoneId: string }): Promise<any> {
    await this.checkAdmin(userId);
    const domains = await this.kv.get('config:domains', 'json') || [];
    domains.push(data);
    await this.kv.put('config:domains', JSON.stringify(domains));
    return { success: true };
  }

  async deleteDomain(userId: string, domain: string): Promise<any> {
    await this.checkAdmin(userId);
    let domains = await this.kv.get('config:domains', 'json') || [];
    domains = domains.filter((d: any) => d.domain !== domain);
    await this.kv.put('config:domains', JSON.stringify(domains));
    return { success: true };
  }

  async deleteSubdomain(userId: string, fullDomain: string): Promise<any> {
    await this.checkAdmin(userId);
    const list = await this.kv.list({ prefix: 'subdomain:' });
    for (const key of list.keys) {
      const sub = await this.kv.get(key.name, 'json');
      if (sub && sub.fullDomain === fullDomain) {
        await this.kv.delete(key.name);
        break;
      }
    }
    return { success: true };
  }

  async setDefaultCNAME(userId: string, target: string): Promise<any> {
    await this.checkAdmin(userId);
    await this.kv.put('config:defaultCNAME', target);
    return { success: true };
  }

  async getStats(): Promise<any> {
    const userList = await this.kv.list({ prefix: 'user:' });
    const subList = await this.kv.list({ prefix: 'subdomain:' });
    return {
      userCount: userList.keys.length,
      subdomainCount: subList.keys.length,
    };
  }
}

// ==================== TurnstileService ====================
export class TurnstileService {
  constructor(private secret: string) {}

  async verify(token: string): Promise<{ success: boolean }> {
    // Debug: check if secret is set
    if (!this.secret || this.secret === 'undefined') {
      console.error('TURNSTILE_SECRET is not set!');
      throw new Error('服务器配置错误，请联系管理员');
    }

    const body = new URLSearchParams();
    body.append('secret', this.secret);
    body.append('response', token);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json() as any;
    console.log('Turnstile verify response:', JSON.stringify(data)); // Debug log

    if (!data.success) {
      console.error('Turnstile verify failed:', data['error-codes']);
    }

    return { success: data.success };
  }
}

// ==================== EmailService ====================
export class EmailService {
  constructor(private apiKey: string, private kv: KVNamespace) {}

  async sendCode(email: string, token: string, turnstileSecret: string): Promise<{ message: string }> {
    const ts = new TurnstileService(turnstileSecret);
    const verify = await ts.verify(token);
    if (!verify.success) throw new Error('人机验证失败');

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await this.kv.put(`verify:${email}`, code, { expirationTtl: 600 });

    // 使用 Resend 发送验证码邮件
    await this.sendEmail(email, code);

    return { message: '验证码已发送' };
  }

  private async sendEmail(to: string, code: string): Promise<void> {
    const fromEmail = 'dns@bxya.top'; // Resend 验证域名邮箱
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: to,
        subject: '【验证码】子域名分发系统',
        html: `<div style="font-family:'Microsoft YaHei',Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;color:#333; background:#f5f7fa;">
  <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
    <h2 style="color:#1a73e8;font-size:22px;margin-bottom:24px;">🔐 验证码</h2>
    <p style="font-size:15px;color:#555;line-height:1.8;">您好，</p>
    <p style="font-size:15px;color:#555;line-height:1.8;">您正在进行注册验证，验证码如下：</p>
    <div style="text-align:center;margin:32px 0;">
      <div style="display:inline-block;background:#f0f4ff;border:1px dashed #1a73e8;border-radius:8px;padding:16px 40px;font-size:32px;font-weight:bold;color:#1a73e8;letter-spacing:8px;font-family:'Courier New',monospace;">${code}</div>
    </div>
    <p style="font-size:13px;color:#888;text-align:center;">此验证码有效期为 10 分钟，请勿泄露给他人。</p>
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
    <p style="font-size:12px;color:#aaa;text-align:center;">dns.bxya.top 子域名分发系统</p>
  </div>
</div>`,
        text: `验证码：${code}，有效期10分钟。dns.bxya.top 子域名分发系统`,
      }),
    });

    if (!res.ok) {
      const err = await res.json() as any;
      throw new Error(err.message || '邮件发送失败');
    }
  }
}
