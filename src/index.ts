import { Router } from './router';
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
