# 子域名分发系统 - Cloudflare 部署

## 技术栈
- **Cloudflare Workers** - API 后端
- **Cloudflare KV** - 数据存储
- **Cloudflare Pages** - 静态前端
- **Turnstile** - 人机验证

## 部署步骤

### 1. 安装依赖
```bash
npm install
```

### 2. 登录 Cloudflare
```bash
npx wrangler login
```

### 3. 创建 KV 命名空间
```bash
npx wrangler kv:namespace create "KV"
# 拿到 id 后更新 wrangler.toml
```

### 4. 设置 Secrets
```bash
npx wrangler secret put JWT_SECRET
# 输入一个强密码作为 JWT 密钥

npx wrangler secret put CF_API_TOKEN
# 输入 Cloudflare API Token

npx wrangler secret put TURNSTILE_SECRET
# 输入 Turnstile 密钥

npx wrangler secret put EMAIL_API_KEY
# 输入邮件 API 密钥 (Resend/SendGrid 等)
```

### 5. 部署 Workers (API)
```bash
npm run deploy
```

### 6. 部署 Pages (前端)
```bash
npm run deploy:static
```

### 7. 绑定自定义域名 (可选)
在 Cloudflare Dashboard 中为 Workers 和 Pages 绑定域名。

## 前端 API 地址修改
编辑 `frontend/index.html`，修改：
```javascript
var API = "https://your-worker-domain.workers.dev";
```

## API 文档

### 认证
- `POST /api/register` - 注册
- `POST /api/login` - 登录
- `GET /api/profile` - 获取个人信息
- `PUT /api/profile` - 更新个人信息

### 子域名管理
- `GET /api/domains` - 获取可用域名列表
- `GET /api/subdomains` - 获取用户子域名
- `POST /api/subdomains` - 创建子域名
- `GET /api/subdomains/:domain/:subdomain/info` - 获取子域名信息
- `PUT /api/subdomains/:domain/:subdomain/edit` - 编辑子域名
- `DELETE /api/subdomains/:domain/:subdomain` - 删除子域名

### 管理后台
- `GET /api/admin/users` - 用户列表
- `GET /api/admin/subdomains` - 所有子域名
- `POST /api/admin-gen/admin/points` - 调整积分
- `POST /api/admin/toggle-ban` - 封禁/解封用户
- `POST /api/admin/domains` - 添加域名
- `DELETE /api/admin/domains/:domain` - 删除域名
- `DELETE /api/admin/subdomains/:fullDomain` - 删除子域名
- `POST /api/admin/cname` - 设置默认 CNAME
- `GET /api/stats` - 统计数据
