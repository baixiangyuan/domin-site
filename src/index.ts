import { Router } from './router';
import { PublicApiService } from './services-public-api';
import { authMiddleware } from './auth';
import { UserService, SubdomainService, AdminService, TurnstileService, EmailService } from './services';

export interface Env {
  KV: KVNamespace;
  CF_API_TOKEN: string;
  JWT_SECRET: string;
  TURNSTILE_SECRET: string;
  EMAIL_API_KEY: string;
}

function json(data: any, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(data), { ...init, headers });
}

const router = new Router<Env>();

// Health check
router.get('/api/health', async () => {
  return json({ status: 'ok' });
});

// Auth routes
router.post('/api/register', async (req, env) => {
  const data = await req.json();
  const userService = new UserService(env.KV, env.JWT_SECRET);
  const result = await userService.register(data);
  return json(result);
});

router.post('/api/login', async (req, env) => {
  const data = await req.json();
  const userService = new UserService(env.KV, env.JWT_SECRET);
  const result = await userService.login(data);
  return json(result);
});

router.get('/api/profile', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const userService = new UserService(env.KV, env.JWT_SECRET);
  const profile = await userService.getProfile(auth.userId);
  return json(profile);
});

router.put('/api/profile', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const data = await req.json();
  const userService = new UserService(env.KV, env.JWT_SECRET);
  const result = await userService.updateProfile(auth.userId, data);
  return json(result);
});

// Turnstile verify
router.post('/api/verify-turnstile', async (req, env) => {
  const data = await req.json();
  const turnstile = new TurnstileService(env.TURNSTILE_SECRET);
  const result = await turnstile.verify(data.token);
  return json(result);
});

// Send email code
router.post('/api/send-code', async (req, env) => {
  const data = await req.json();
  const emailService = new EmailService(env.EMAIL_API_KEY, env.KV);
  const result = await emailService.sendCode(data.email, data.token, env.TURNSTILE_SECRET);
  return json(result);
});

// Subdomain routes
router.get('/api/domains', async (req, env) => {
  const subdomainService = new SubdomainService(env.KV, env.CF_API_TOKEN);
  const domains = await subdomainService.getDomains();
  return json(domains);
});

router.get('/api/subdomains', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const subdomainService = new SubdomainService(env.KV, env.CF_API_TOKEN);
  const subdomains = await subdomainService.getUserSubdomains(auth.userId);
  return json({ subdomains });
});

router.post('/api/subdomains', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const data = await req.json();
  const subdomainService = new SubdomainService(env.KV, env.CF_API_TOKEN);
  const result = await subdomainService.create(auth.userId, data);
  return json(result);
});

router.get('/api/subdomains/:domain/:subdomain/info', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const { domain, subdomain } = req.params;
  const subdomainService = new SubdomainService(env.KV, env.CF_API_TOKEN);
  const result = await subdomainService.getInfo(auth.userId, domain, subdomain);
  return json({ subdomain: result });
});

router.put('/api/subdomains/:domain/:subdomain/edit', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const { domain, subdomain } = req.params;
  const data = await req.json();
  const subdomainService = new SubdomainService(env.KV, env.CF_API_TOKEN);
  const result = await subdomainService.edit(auth.userId, domain, subdomain, data);
  return json(result);
});

router.delete('/api/subdomains/:domain/:subdomain', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const { domain, subdomain } = req.params;
  const subdomainService = new SubdomainService(env.KV, env.CF_API_TOKEN);
  const result = await subdomainService.delete(auth.userId, domain, subdomain);
  return json(result);
});

// Admin routes
router.get('/api/admin/users', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const adminService = new AdminService(env.KV, env.CF_API_TOKEN);
  const result = await adminService.getUsers(auth.userId);
  return json(result);
});

router.get('/api/admin/subdomains', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const adminService = new AdminService(env.KV, env.CF_API_TOKEN);
  const result = await adminService.getAllSubdomains(auth.userId);
  return json(result);
});

router.post('/api/admin/max-domains', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const data = await req.json();
  const adminService = new AdminService(env.KV, env.CF_API_TOKEN);
  const result = await adminService.adjustMaxDomains(auth.userId, data);
  return json(result);
});

router.post('/api/admin/toggle-ban', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const data = await req.json();
  const adminService = new AdminService(env.KV, env.CF_API_TOKEN);
  const result = await adminService.toggleBan(auth.userId, data.username);
  return json(result);
});

router.post('/api/admin/domains', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const data = await req.json();
  const adminService = new AdminService(env.KV, env.CF_API_TOKEN);
  const result = await adminService.addDomain(auth.userId, data);
  return json(result);
});

router.delete('/api/admin/domains/:domain', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const adminService = new AdminService(env.KV, env.CF_API_TOKEN);
  const result = await adminService.deleteDomain(auth.userId, req.params.domain);
  return json(result);
});

router.delete('/api/admin/subdomains/:fullDomain', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const adminService = new AdminService(env.KV, env.CF_API_TOKEN);
  const result = await adminService.deleteSubdomain(auth.userId, req.params.fullDomain);
  return json(result);
});

router.post('/api/admin/cname', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const data = await req.json();
  const adminService = new AdminService(env.KV, env.CF_API_TOKEN);
  const result = await adminService.setDefaultCNAME(auth.userId, data.target);
  return json(result);
});

router.get('/api/stats', async (req, env) => {
  const adminService = new AdminService(env.KV, env.CF_API_TOKEN);
  const result = await adminService.getStats();
  return json(result);
});


// ==================== Public API Routes ====================
const publicApiService = new PublicApiService();

// Wenan
router.get('/api/yiyan', async () => json(await publicApiService.getYiyan()));
router.get('/api/saohua', async () => json(await publicApiService.getSaohua()));
router.get('/api/mingren', async () => json(await publicApiService.getMingren()));
router.get('/api/pyq', async () => json(await publicApiService.getPyq()));
router.get('/api/anwei', async () => json(await publicApiService.getAnwei()));
router.get('/api/dujitang', async () => json(await publicApiService.getDujitang()));
router.get('/api/miyu', async () => json(await publicApiService.getMiyu()));
router.get('/api/chengyu', async () => json(await publicApiService.getChengyu()));
router.get('/api/xiaohua', async () => json(await publicApiService.getXiaohua()));
router.get('/api/tiangou', async () => json(await publicApiService.getTiangou()));

// Hot search
router.get('/api/douyin', async () => json(await publicApiService.getDouyin()));
router.get('/api/bilibili', async () => json(await publicApiService.getBilibili()));
router.get('/api/weibo', async () => json(await publicApiService.getWeibo()));
router.get('/api/baidu', async () => json(await publicApiService.getBaidu()));

// News
router.get('/api/news', async () => json(await publicApiService.getNews()));

// Tools
router.get('/api/myip', async (req) => json(await publicApiService.getMyIp(req)));
router.get('/api/uuid', async () => json(await publicApiService.getUuid()));
router.get('/api/md5', async (req) => {
  const url = new URL(req.url);
  return json(await publicApiService.getMd5(url.searchParams.get('text') || ''));
});
router.get('/api/base64', async (req) => {
  const url = new URL(req.url);
  return json(await publicApiService.getBase64(url.searchParams.get('text') || ''));
});
router.get('/api/urlencode', async (req) => {
  const url = new URL(req.url);
  return json(await publicApiService.getUrlEncode(url.searchParams.get('text') || ''));
});
router.get('/api/unicode', async (req) => {
  const url = new URL(req.url);
  return json(await publicApiService.getUnicode(url.searchParams.get('text') || ''));
});
router.get('/api/httpcode', async (req) => {
  const url = new URL(req.url);
  return json(await publicApiService.getHttpCode(url.searchParams.get('code') || ''));
});
router.get('/api/tianqi', async (req) => {
  const url = new URL(req.url);
  return json(await publicApiService.getWeather(url.searchParams.get('city') || ''));
});
router.get('/api/fanyi', async (req) => {
  const url = new URL(req.url);
  return json(await publicApiService.getTranslate(url.searchParams.get('text') || ''));
});
router.get('/api/xingming', async () => json(await publicApiService.getXingming()));
router.get('/api/timestamp', async (req) => {
  const url = new URL(req.url);
  return json(await publicApiService.getTimestamp(url.searchParams.get('ts') || undefined));
});

// QQ
router.get('/api/qq', async (req) => {
  const url = new URL(req.url);
  return json(await publicApiService.getQq(url.searchParams.get('qq') || ''));
});

// Query
router.get('/api/whois', async (req) => {
  const url = new URL(req.url);
  return json(await publicApiService.getWhois(url.searchParams.get('domain') || ''));
});
router.get('/api/icp', async (req) => {
  const url = new URL(req.url);
  return json(await publicApiService.getIcp(url.searchParams.get('url') || ''));
});
router.get('/api/phone', async (req) => {
  const url = new URL(req.url);
  return json(await publicApiService.getPhone(url.searchParams.get('num') || ''));
});

// Generate
router.get('/api/qrcode', async (req) => {
  const url = new URL(req.url);
  return json(await publicApiService.getQrcode(url.searchParams.get('text') || '', url.searchParams.get('size') || ''));
});
router.get('/api/music', async (req) => {
  const url = new URL(req.url);
  return json(await publicApiService.getMusic(url.searchParams.get('s') || ''));
});
router.get('/api/bizhi', async () => json(await publicApiService.getBizhi()));
router.get('/api/bing', async () => json(await publicApiService.getBing()));
router.get('/api/touxiang', async () => json(await publicApiService.getTouxiang()));
router.get('/api/biaoqing', async () => json(await publicApiService.getBiaoqing()));

// Change password routes
router.post('/api/send-auth-code', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const userService = new UserService(env.KV, env.JWT_SECRET);
  const profile = await userService.getProfile(auth.userId);
  const emailService = new EmailService(env.EMAIL_API_KEY, env.KV);
  return json(await emailService.sendAuthCode(profile.email));
});

router.post('/api/change-password', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const data = await req.json();
  const userService = new UserService(env.KV, env.JWT_SECRET);
  return json(await userService.changePassword(auth.userId, data.oldPassword, data.newPassword, data.code));
});

router.delete('/api/profile', async (req, env) => {
  const auth = await authMiddleware(req, env);
  if (auth instanceof Response) return auth;
  const userService = new UserService(env.KV, env.JWT_SECRET);
  const result = await userService.deleteAccount(auth.userId);
  return json(result);
});
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORS handling for preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    const response = await router.handle(request, env);

    // Clone response and add CORS headers properly
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
    return newResponse;
  }
};
