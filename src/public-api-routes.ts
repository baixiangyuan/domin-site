import { Router } from './router';
import { PublicApiService } from './services-public-api';
import type { Env } from './index';

const apiService = new PublicApiService();
const router = new Router<Env>();

function json(data: any, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(data), { ...init, headers });
}

// 文案类
router.get('/api/yiyan', async () => json(await apiService.getYiyan()));
router.get('/api/saohua', async () => json(await apiService.getSaohua()));
router.get('/api/mingren', async () => json(await apiService.getMingren()));
router.get('/api/pyq', async () => json(await apiService.getPyq()));
router.get('/api/anwei', async () => json(await apiService.getAnwei()));
router.get('/api/dujitang', async () => json(await apiService.getDujitang()));
router.get('/api/miyu', async () => json(await apiService.getMiyu()));
router.get('/api/chengyu', async () => json(await apiService.getChengyu()));
router.get('/api/xiaohua', async () => json(await apiService.getXiaohua()));
router.get('/api/tiangou', async () => json(await apiService.getTiangou()));

// 热搜类
router.get('/api/douyin', async () => json(await apiService.getDouyin()));
router.get('/api/bilibili', async () => json(await apiService.getBilibili()));
router.get('/api/weibo', async () => json(await apiService.getWeibo()));
router.get('/api/baidu', async () => json(await apiService.getBaidu()));

// 新闻
router.get('/api/news', async () => json(await apiService.getNews()));

// 工具类
router.get('/api/myip', async (req) => json(await apiService.getMyIp(req)));
router.get('/api/uuid', async () => json(await apiService.getUuid()));
router.get('/api/md5', async (req) => {
  const url = new URL(req.url);
  return json(await apiService.getMd5(url.searchParams.get('text') || ''));
});
router.get('/api/base64', async (req) => {
  const url = new URL(req.url);
  return json(await apiService.getBase64(url.searchParams.get('text') || ''));
});
router.get('/api/urlencode', async (req) => {
  const url = new URL(req.url);
  return json(await apiService.getUrlEncode(url.searchParams.get('text') || ''));
});
router.get('/api/unicode', async (req) => {
  const url = new URL(req.url);
  return json(await apiService.getUnicode(url.searchParams.get('text') || ''));
});
router.get('/api/httpcode', async (req) => {
  const url = new URL(req.url);
  return json(await apiService.getHttpCode(url.searchParams.get('code') || ''));
});
router.get('/api/tianqi', async (req) => {
  const url = new URL(req.url);
  return json(await apiService.getWeather(url.searchParams.get('city') || ''));
});
router.get('/api/fanyi', async (req) => {
  const url = new URL(req.url);
  return json(await apiService.getTranslate(url.searchParams.get('text') || ''));
});
router.get('/api/xingming', async () => json(await apiService.getXingming()));
router.get('/api/timestamp', async (req) => {
  const url = new URL(req.url);
  return json(await apiService.getTimestamp(url.searchParams.get('ts') || undefined));
});

// QQ类
router.get('/api/qq', async (req) => {
  const url = new URL(req.url);
  return json(await apiService.getQq(url.searchParams.get('qq') || ''));
});

// 查询类
router.get('/api/whois', async (req) => {
  const url = new URL(req.url);
  return json(await apiService.getWhois(url.searchParams.get('domain') || ''));
});
router.get('/api/icp', async (req) => {
  const url = new URL(req.url);
  return json(await apiService.getIcp(url.searchParams.get('url') || ''));
});
router.get('/api/phone', async (req) => {
  const url = new URL(req.url);
  return json(await apiService.getPhone(url.searchParams.get('num') || ''));
});

// 生成类
router.get('/api/qrcode', async (req) => {
  const url = new URL(req.url);
  return json(await apiService.getQrcode(url.searchParams.get('text') || '', url.searchParams.get('size') || ''));
});
router.get('/api/music', async (req) => {
  const url = new URL(req.url);
  return json(await apiService.getMusic(url.searchParams.get('s') || ''));
});
router.get('/api/bizhi', async () => json(await apiService.getBizhi()));
router.get('/api/bing', async () => json(await apiService.getBing()));
router.get('/api/touxiang', async () => json(await apiService.getTouxiang()));
router.get('/api/biaoqing', async () => json(await apiService.getBiaoqing()));

export default router;
