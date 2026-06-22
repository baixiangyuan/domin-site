// ==================== PublicApiService ====================
interface ApiResponse<T = any> { code: number; data: T; brand: string }
function resp<T>(data: T): ApiResponse<T> { return { code: 200, data, brand: 'Powered by Bxy' }; }

export class PublicApiService {
  private brand = 'Powered by Bxy';
  private userAgent = 'Bxy-API/1.0';

  async getYiyan(): Promise<ApiResponse> {
    try {
      const res = await fetch('https://v1.hitokoto.cn/');
      const data = await res.json() as any;
      return resp({ hitokoto: data.hitokoto, from: data.from, from_who: data.from_who });
    } catch {
      return resp({ hitokoto: '生活不止眼前的苟且，还有诗和远方。', from: '未知' });
    }
  }

  async getSaohua(): Promise<ApiResponse> {
    return resp({ text: '你今天有点怪，怪好看的。' });
  }

  async getMingren(): Promise<ApiResponse> {
    return resp({ name: '鲁迅', saying: '地上本没有路，走的人多了，也便成了路。' });
  }

  async getPyq(): Promise<ApiResponse> {
    return resp({ text: '生活明朗，万物可爱。' });
  }

  async getAnwei(): Promise<ApiResponse> {
    return resp({ text: '一切都会好起来的，相信我。' });
  }

  async getDujitang(): Promise<ApiResponse> {
    return resp({ text: '当你觉得自己又丑又穷的时候，至少你的判断力是正确的。' });
  }

  async getMiyu(): Promise<ApiResponse> {
    return resp({ question: '什么门永远关不上？', answer: '球门。' });
  }

  async getChengyu(): Promise<ApiResponse> {
    return resp({ word: '画龙点睛', meaning: '比喻在关键处点明实质，使内容生动传神。' });
  }

  async getXiaohua(): Promise<ApiResponse> {
    return resp({ text: '为什么 programmers 分不清万圣节和圣诞节？因为 Oct 31 == Dec 25。' });
  }

  async getTiangou(): Promise<ApiResponse> {
    return resp({ text: '今天也是想你的第520天，虽然你不知道我是谁。' });
  }

  async getDouyin(): Promise<ApiResponse> {
    return resp([{ rank: 1, title: '#考研倒计时' }]);
  }

  async getBilibili(): Promise<ApiResponse> {
    return resp([{ rank: 1, title: '鬼畜区新番' }]);
  }

  async getWeibo(): Promise<ApiResponse> {
    return resp([{ rank: 1, title: '#娱乐圈大事件' }]);
  }

  async getBaidu(): Promise<ApiResponse> {
    return resp([{ rank: 1, title: 'AI技术突破' }]);
  }

  async getNews(): Promise<ApiResponse> {
    return resp({ title: '60秒每日新闻', items: ['国内前三季度GDP同比增长4.8%'] });
  }

  async getMyIp(req: Request): Promise<ApiResponse> {
    return resp({ ip: req.headers.get('CF-Connecting-IP') || 'unknown' });
  }

  async getUuid(): Promise<ApiResponse> {
    return resp({ uuid: crypto.randomUUID() });
  }

  async getMd5(text: string): Promise<ApiResponse> {
    const e = new TextEncoder();
    const b = await crypto.subtle.digest('MD5', e.encode(text));
    const h = Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
    return resp({ text, md5: h });
  }

  async getBase64(text: string): Promise<ApiResponse> {
    return resp({ text, base64: btoa(unescape(encodeURIComponent(text))) });
  }

  async getUrlEncode(text: string): Promise<ApiResponse> {
    return resp({ text, encoded: encodeURIComponent(text) });
  }

  async getUnicode(text: string): Promise<ApiResponse> {
    return resp({ text, unicode: Array.from(text).map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join('') });
  }

  async getHttpCode(code: string): Promise<ApiResponse> {
    return resp({ code, meaning: 'OK' });
  }

  async getWeather(city: string): Promise<ApiResponse> {
    return resp({ city, temperature: '25°C', weather: 'sunny' });
  }

  async getTranslate(text: string): Promise<ApiResponse> {
    return resp({ text, en: '[Translation] ' + text });
  }

  async getXingming(): Promise<ApiResponse> {
    return resp({ name: '张伟' });
  }

  async getTimestamp(ts?: string): Promise<ApiResponse> {
    return resp({ timestamp: Date.now() });
  }

  async getQq(qq: string): Promise<ApiResponse> {
    return resp({ qq, nickname: 'User' });
  }

  async getWhois(domain: string): Promise<ApiResponse> {
    return resp({ domain, registrar: 'Example Inc.' });
  }

  async getIcp(url: string): Promise<ApiResponse> {
    return resp({ url, icp: '京ICP备12345678号' });
  }

  async getPhone(num: string): Promise<ApiResponse> {
    return resp({ num, province: 'Beijing', carrier: 'CMCC' });
  }

  async getQrcode(text: string, size: string): Promise<ApiResponse> {
    return resp({ url: 'https://api.qrserver.com/v1/create-qr-code/?size=' + (size || '200') + 'x' + (size || '200') + '&data=' + encodeURIComponent(text) });
  }

  async getMusic(s: string): Promise<ApiResponse> {
    return resp({ s, songs: [{ title: s + ' - Song' }] });
  }

  async getBizhi(): Promise<ApiResponse> {
    return resp({ url: 'https://picsum.photos/1920/1080?random=' + Date.now() });
  }

  async getBing(): Promise<ApiResponse> {
    return resp({ url: 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1' });
  }

  async getTouxiang(): Promise<ApiResponse> {
    return resp({ url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Date.now() });
  }

  async getBiaoqing(): Promise<ApiResponse> {
    return resp({ url: 'https://picsum.photos/300/300?random=' + Date.now() });
  }

  async getWenan(type: string): Promise<ApiResponse> {
    return resp({ text: 'Hello' });
  }
}
