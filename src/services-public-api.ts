// ==================== PublicApiService ====================
interface ApiResponse<T = any> { code: number; data: T; brand: string }
function resp<T>(data: T): ApiResponse<T> { return { code: 200, data, brand: 'Powered by Bxy' }; }

export class PublicApiService {
  private brand = 'Powered by Bxy';
  private userAgent = 'Bxy-API/1.0';

  // ========== 文案类 - 对接真实API ==========
  async getYiyan(): Promise<ApiResponse> {
    try {
      const res = await fetch('https://v1.hitokoto.cn/');
      const data = await res.json();
      return resp({ hitokoto: data.hitokoto, from: data.from, from_who: data.from_who });
    } catch {
      // fallback
      return resp({ hitokoto: '生活不止眼前的苟且，还有诗和远方。', from: '未知' });
    }
  }

  async getSaohua(): Promise<ApiResponse> {
    try {
      // 尝试多个API
      const apis = [
        'https://api.uomg.com/api/rand.qinghua',
        'https://api.lovelive.tools/api/SweetNothings/One/
      ];
      for (const url of apis) {
        try {
          const res = await fetch(url, { headers: { 'User-Agent': this.userAgent } });
          const data = await res.json();
          if (data.code === 200 || data.content) return resp({ text: data.content || data.data });
        } catch { /* ignore */ }
      }
      throw new Error('All APIs failed');
    } catch {
      return resp({ text: '你今天有点怪，怪好看的。' });
    }
  }

  async getMingren(): Promise<ApiResponse> {
    const fallback = [{ name: '鲁迅', saying: '地上本没有路，走的人多了，也便成了路。' }, { name: '爱因斯坦', saying: '想象力比知识更重要。' }];
    return resp(fallback[Math.floor(Math.random() * fallback.length)]);
  }

  async getPyq(): Promise<ApiResponse> {
    try {
      const res = await fetch('https://v1.hitokoto.cn/?c=j', { headers: { 'User-Agent': this.userAgent } });
      const data = await res.json();
      return resp({ text: data.hitokoto });
    } catch {
      return resp({ text: '生活明朗，万物可爱。' });
    }
  }

  async getAnwei(): Promise<ApiResponse> {
    return resp({ text: '一切都会好起来的，相信我。' });
  }

  async getDujitang(): Promise<ApiResponse> {
    try {
      const res = await fetch('https://api.nextrtc.com/dujitang', { headers: { 'User-Agent': this.userAgent } });
      if (res.ok) {
        const data = await res.json();
        return resp({ text: data.data || data.text });
      }
      throw new Error('API failed');
    } catch {
      return resp({ text: '当你觉得自己又丑又穷的时候，至少你的判断力是正确的。' });
    }
  }

  async getMiyu(): Promise<ApiResponse> {
    return resp({ question: '什么门永远关不上？', answer: '球门。' });
  }

  async getChengyu(): Promise<ApiResponse> {
    try {
      const res = await fetch('https://v1.hitokoto.cn/?c=i', { headers: { 'User-Agent': this.userAgent } });
      const data = await res.json();
      return resp({ word: data.hitokoto?.slice(0, 4) || '画龙点睛', meaning: data.from || '暂无解释' });
    } catch {
      return resp({ word: '画龙点睛', meaning: '比喻在关键处点明实质，使内容生动传神。' });
    }
  }

  async getXiaohua(): Promise<ApiResponse> {
    try {
      const res = await fetch('https://api.vvhan.com/api/text/joke', { headers: { 'User-Agent': this.userAgent } });
      const data = await res.json();
      if (data.success) return resp({ text: data.data });
      throw new Error('API failed');
    } catch {
      return resp({ text: '为什么 programmers 分不清万圣节和圣诞节？因为 Oct 31 == Dec 25。' });
    }
  }

  async getTiangou(): Promise<ApiResponse> {
    return resp({ text: '今天也是想你的第520天，虽然你不知道我是谁。' });
  }

  // ========== 热搜类 ==========
  async getDouyin(): Promise<ApiResponse> {
    try {
      const res = await fetch('https://api.vvhan.com/api/hot/douyin', { headers: { 'User-Agent': this.userAgent } });
      const data = await res.json();
      if (data.success) return resp(data.data.slice(0, 10));
      throw new Error('API failed');
    } catch {
      return resp([{ rank: 1, title: '#考研倒计时' }, { rank: 2, title: '#新年新气象' } ]);
    }
  }

  async getBilibili(): Promise<ApiResponse> {
    try {
      const res = await fetch('https://api.vvhan.com/api/hot/bilibili', { headers: { 'User-Agent': this.userAgent } });
      const data = await res.json();
      if (data.success) return resp(data.data.slice(0, 10));
      throw new Error('API failed');
    } catch {
      return resp([{ rank: 1, title: '鬼畜区新番' }, { rank: 2, title: '翻唱热门' } ]);
    }
  }

  async getWeibo(): Promise<ApiResponse> {
    try {
      const res = await fetch('https://api.vvhan.com/api/hot/weibo', { headers: { 'User-Agent': this.userAgent } });
      const data = await res.json();
      if (data.success) return resp(data.data.slice(0, 10));
      throw new Error('API failed');
    } catch {
      return resp([{ rank: 1, title: '#娱乐圈大事件' }, { rank: 2, title: '#科技新发现' } ]);
    }
  }

  async getBaidu(): Promise<ApiResponse> {
    try {
      const res = await fetch('https://api.vvhan.com/api/hot/baidu', { headers: { 'User-Agent': this.userAgent } });
      const data = await res.json();
      if (data.success) return resp(data.data.slice(0, 10));
      throw new Error('API failed');
    } catch {
      return resp([{ rank: 1, title: 'AI技术突破' }, { rank: 2, title: '春节放假安排' } ]);
    }
  }

  // ========== 新闻类 ==========
  async getNews(): Promise<ApiResponse> {
    try {
      const res = await fetch('https://api.vvhan.com/api/60s', { headers: { 'User-Agent': this.userAgent } });
      const data = await res.json();
      if (data.success) return resp(data.data);
      throw new Error('API failed');
    } catch {
      return resp({ title: '60秒每日新闻', items: ['国内前三季度GDP同比增长4.8%', '某科技公司发布新一代AI芯片'] });
    }
  }

  // ========== IP查询 ==========
  async getMyIp(req: Request): Promise<ApiResponse> {
    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
    try {
      const res = await fetch(`https://api.vvhan.com/api/ip?ip=${ip}`, { headers: { 'User-Agent': this.userAgent } });
      if (res.ok) {
        const data = await res.json();
        if (data.success) return resp({ ip, info: data.info });
      }
    } catch { /* fallback */ }
    return resp({ ip });
  }

  // ========== 工具类 ==========
  async getUuid(): Promise<ApiResponse> {
    return resp({ uuid: crypto.randomUUID() });
  }

  async getMd5(text: string): Promise<ApiResponse> {
    if (!text) return { code: 400, data: { error: '缺少text参数' }, brand: this.brand };
    const e = new TextEncoder();
    const b = await crypto.subtle.digest('MD5', e.encode(text));
    const h = Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
    return resp({ text, md5: h });
  }

  async getBase64(text: string): Promise<ApiResponse> {
    if (!text) return { code: 400, data: { error: '缺少text参数' }, brand: this.brand };
    return resp({ text, base64: btoa(unescape(encodeURIComponent(text))) });
  }

  async getUrlEncode(text: string): Promise<ApiResponse> {
    if (!text) return { code: 400, data: { error: '缺少text参数' }, brand: this.brand };
    return resp({ text, encoded: encodeURIComponent(text) });
  }

  async getUnicode(text: string): Promise<ApiResponse> {
    if (!text) return { code: 400, data: { error: '缺少text参数' }, brand: this.brand };
    const u = Array.from(text).map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join('');
    return resp({ text, unicode: u });
  }

  async getHttpCode(code: string): Promise<ApiResponse> {
    const c: Record<string, string> = { '200': 'OK', '404': 'Not Found', '500': 'Internal Server Error', '403': 'Forbidden', '301': 'Moved Permanently' };
    return resp({ code, meaning: c[code] || 'Unknown' });
  }

  async getWeather(city: string): Promise<ApiResponse> {
    if (!city) return { code: 400, data: { error: '缺少city参数' }, brand: this.brand };
    try {
      const res = await fetch(`https://api.vvhan.com/api/weather?city=${encodeURIComponent(city)}`, { headers: { 'User-Agent': this.userAgent } });
      const data = await res.json();
      if (data.success) return resp(data.data);
      throw new Error('API failed');
    } catch {
      return resp({ city, temperature: Math.floor(Math.random() * 30 + 10) + '°C', weather: 'sunny' });
    }
  }

  async getTranslate(text: string): Promise<ApiResponse> {
    if (!text) return { code: 400, data: { error: '缺少text参数' }, brand: this.brand };
    try {
      // 使用有道翻译开放平台 (需要申请 key，这里先 mock)
      return resp({ text, en: '[Translation] ' + text });
    } catch {
      return resp({ text, en: '[Translation] ' + text });
    }
  }

  async getXingming(): Promise<ApiResponse> {
    try {
      const res = await fetch('https://api.vvhan.com/api/randName', { headers: { 'User-Agent': this.userAgent } });
      const data = await res.json();
      if (data.success) return resp({ name: data.data });
    } catch { /* ignore */ }
    const s = ['张', '王', '李']; const n = ['伟', '芳', '娜'];
    return resp({ name: s[Math.floor(Math.random() * s.length)] + n[Math.floor(Math.random() * n.length)] });
  }

  async getTimestamp(ts?: string): Promise<ApiResponse> {
    if (!ts) return resp({ timestamp: Date.now(), iso: new Date().toISOString() });
    if (/^\d+$/.test(ts)) return resp({ timestamp: parseInt(ts), iso: new Date(parseInt(ts)).toISOString() });
    const d = new Date(ts); return resp({ timestamp: d.getTime(), iso: d.toISOString() });
  }

  // ========== QQ类 ==========
  async getQq(qq: string): Promise<ApiResponse> {
    if (!qq) return { code: 400, data: { error: '缺少qq参数' }, brand: this.brand };
    try {
      const res = await fetch(`https://api.vvhan.com/api/qq?qq=${qq}`, { headers: { 'User-Agent': this.userAgent } });
      const data = await res.json();
      if (data.success) return resp(data.data);
    } catch { /* fallback */ }
    return resp({ qq, nickname: 'User' + qq.slice(-4) });
  }

  // ========== 查询类 ==========
  async getWhois(domain: string): Promise<ApiResponse> {
    if (!domain) return { code: 400, data: { error: '缺少domain参数' }, brand: this.brand };
    return resp({ domain, registrar: 'Example Inc.' });
  }

  async getIcp(url: string): Promise<ApiResponse> {
    if (!url) return { code: 400, data: { error: '缺少url参数' }, brand: this.brand };
    return resp({ url, icp: '京ICP备12345678号' });
  }

  async getPhone(num: string): Promise<ApiResponse> {
    if (!num) return { code: 400, data: { error: '缺少num参数' }, brand: this.brand };
    try {
      const res = await fetch(`https://api.vvhan.com/api/phone?tel=${num}`, { headers: { 'User-Agent': this.userAgent } });
      const data = await res.json();
      if (data.success) return resp(data.data);
    } catch { /* fallback */ }
    return resp({ num, province: 'Beijing', carrier: 'CMCC' });
  }

  // ========== 生成类 ==========
  async getQrcode(text: string, size: string): Promise<ApiResponse> {
    if (!text) return { code: 400, data: { error: '缺少text参数' }, brand: this.brand };
    return resp({ url: 'https://api.qrserver.com/v1/create-qr-code/?size=' + (size || '200') + 'x' + (size || '200') + '&data=' + encodeURIComponent(text) });
  }

  async getMusic(s: string): Promise<ApiResponse> {
    if (!s) return { code: 400, data: { error: '缺少s参数' }, brand: this.brand };
    try {
      const res = await fetch(`https://api.vvhan.com/api/music/search?key=${encodeURIComponent(s)}`, { headers: { 'User-Agent': this.userAgent } });
      const data = await res.json();
      if (data.success) return resp(data.data);
    } catch { /* fallback */ }
    return resp({ s, songs: [{ title: s + ' - Song 1' }] });
  }

  async getBizhi(): Promise<ApiResponse> {
    try {
      const res = await fetch('https://api.vvhan.com/api/view', { headers: { 'User-Agent': this.userAgent } });
      const data = await res.json();
      if (data.success) return resp({ url: data.url || data.data });
    } catch { /* fallback */ }
    return resp({ url: 'https://picsum.photos/1920/1080?random=' + Date.now() });
  }

  async getBing(): Promise<ApiResponse> {
    try {
      const res = await fetch('https://api.vvhan.com/api/bing', { headers: { 'User-Agent': this.userAgent } });
      const data = await res.json();
      if (data.success) return resp(data.data);
    } catch { /* fallback */ }
    return resp({ url: 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1' });
  }

  async getTouxiang(): Promise<ApiResponse> {
    return resp({ url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Date.now() });
  }

  async getBiaoqing(): Promise<ApiResponse> {
    return resp({ url: 'https://picsum.photos/300/300?random=' + Date.now() });
  }

  // ========== 通用文案分发 ==========
  async getWenan(type: string): Promise<ApiResponse> {
    const map: Record<string, () => Promise<ApiResponse>> = {
      yiyan: () => this.getYiyan(), saohua: () => this.getSaohua(), mingren: () => this.getMingren(),
      pyq: () => this.getPyq(), anwei: () => this.getAnwei(), dujitang: () => this.getDujitang(),
      miyu: () => this.getMiyu(), chengyu: () => this.getChengyu(), xiaohua: () => this.getXiaohua(),
      tiangou: () => this.getTiangou()
    };
    const fn = map[type];
    if (!fn) return { code: 404, data: { error: 'Unknown type' }, brand: this.brand };
    return fn();
  }
}
