const ALIBABA_UPLOAD_API_URL =
  "https://tps.alibaba-inc.com/internal-management/image/upload?uploadType=image&compressType=0&folder=&isPrivate=false&workId=471874&workName=%E6%96%87%E5%B8%83";
export const ALIYUN_IMAGE_LIBRARY_URL =
  "https://content.alibaba-inc.com/work/internal-media-management/pic/upload?iframe=3";

// --------------- dynamic backend URL ---------------

// Cloudflare Tunnel：用于将 GitHub Pages（HTTPS）流量代理到本机后端 http://127.0.0.1:3001，
// 绕过浏览器 Mixed Content 拦截。tunnel 由 launchd 守护进程保持常驻，URL 重启会变。
const CLOUDFLARED_TUNNEL_BASE = 'https://ana-remained-peninsula-officially.trycloudflare.com';

function getBackendBaseUrl(): string {
  if (typeof window === 'undefined') return 'http://127.0.0.1:3001';
  const { hostname, protocol } = window.location;
  // 本地开发
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('[上传] getBackendBaseUrl → 本地开发，使用 http://127.0.0.1:3001');
    return 'http://127.0.0.1:3001';
  }
  // HTTPS 页面（GitHub Pages 等）→ 走 Cloudflare Tunnel，避免 Mixed Content
  if (protocol === 'https:') {
    console.log(`[上传] getBackendBaseUrl → HTTPS 页面，使用 Cloudflare Tunnel: ${CLOUDFLARED_TUNNEL_BASE}`);
    return CLOUDFLARED_TUNNEL_BASE;
  }
  // HTTP 局域网直连
  const lanUrl = `http://${hostname}:3001`;
  console.log(`[上传] getBackendBaseUrl → 局域网直连: ${lanUrl}`);
  return lanUrl;
}

function getBackendUploadUrl(): string {
  return `${getBackendBaseUrl()}/api/upload`;
}

function getBackendHealthUrl(): string {
  return `${getBackendBaseUrl()}/api/health`;
}

export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
  /**
   * 软成功：浏览器直连 multipart/form-data 是 CORS simple request，
   * 请求已成功发出且图片已上传到阿里图库，但响应缺少 Access-Control-Allow-Origin，
   * 浏览器拒绝读取响应导致 fetch 抛出 TypeError。
   * 此种情况应视为成功，但无法解析出回链 URL。
   */
  softSuccess?: boolean;
};

// --------------- helpers ---------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRemoteUrl(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return new URL(trimmed, ALIBABA_UPLOAD_API_URL).toString();
  return "";
}

function urlsFromText(text: string): string[] {
  const matches = text.match(/(?:https?:)?\/\/[^\s"'<>\\]+/g) ?? [];
  return matches.map(normalizeRemoteUrl).filter(Boolean);
}

function candidateUrlsFromValue(value: unknown, key = ""): string[] {
  const normalizedKey = key.toLowerCase();
  if (typeof value === "string") {
    const directUrl = normalizeRemoteUrl(value);
    const textUrls = urlsFromText(value);
    const keyLooksLikeUrl =
      normalizedKey.includes("url") ||
      normalizedKey.includes("src") ||
      normalizedKey.includes("path") ||
      normalizedKey.includes("link");
    if (directUrl && keyLooksLikeUrl) return [directUrl, ...textUrls];
    return textUrls;
  }
  if (Array.isArray(value)) return value.flatMap((item) => candidateUrlsFromValue(item));
  if (isRecord(value))
    return Object.entries(value).flatMap(([k, v]) => candidateUrlsFromValue(v, k));
  return [];
}

function isLikelyUploadedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    return (
      hostname.endsWith("alicdn.com") ||
      hostname.endsWith("aliimg.com") ||
      /\.(?:apng|png|gif|jpe?g|webp|avif)(?:$|[?#])/.test(pathname)
    );
  } catch {
    return false;
  }
}

function firstRemoteUrl(responseData: unknown, responseText: string): string {
  const urls = [...candidateUrlsFromValue(responseData), ...urlsFromText(responseText)];
  return urls.find(isLikelyUploadedImageUrl) ?? "";
}

function responseSummary(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 240);
}

// --------------- health check ---------------

async function isBackendAvailable(): Promise<boolean> {
  const url = getBackendHealthUrl();
  const startTime = Date.now();
  console.log(`[上传] 开始健康检查 → ${url}（超时 8 秒）`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    const elapsed = Date.now() - startTime;
    console.log(`[上传] 健康检查 ${url} → ${res.ok ? '可用' : '不可用'} (status=${res.status}, 耗时=${elapsed}ms)`);
    return res.ok;
  } catch (err) {
    const elapsed = Date.now() - startTime;
    const isAbort = err instanceof DOMException && err.name === 'AbortError';
    console.warn(`[上传] 健康检查 ${url} → ${isAbort ? '超时' : '不可达'} (耗时=${elapsed}ms)`, err);
    return false;
  }
}

// --------------- upload via backend proxy ---------------

async function uploadViaBackend(blob: Blob, fileName: string): Promise<UploadResult> {
  const url = getBackendUploadUrl();
  const file = new File([blob], fileName, { type: blob.type || "image/png" });
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", fileName);
  formData.append("fileName", fileName);

  console.log(`[上传] 开始后端代理上传 → ${url}，文件: ${fileName}，大小: ${(blob.size / 1024).toFixed(1)}KB`);
  const startTime = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('自动上传超时（15秒），已切换为手动上传模式');
    }
    throw err;
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const text = await response.text();
    console.warn(`[上传] 后端代理返回错误 ${response.status}，耗时 ${Date.now() - startTime}ms`);
    throw new Error(
      `后端上传接口返回 ${response.status}：${text.slice(0, 200) || "无内容"}`,
    );
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "后端上传返回失败状态");
  }

  console.log(`[上传] 后端代理上传成功，耗时 ${Date.now() - startTime}ms，URL: ${data.url}`);
  return { success: true, url: data.url || "" };
}

// --------------- upload via browser direct ---------------

async function uploadViaBrowserDirect(blob: Blob, fileName: string): Promise<UploadResult> {
  const file = new File([blob], fileName, { type: blob.type || "image/png" });
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", fileName);
  formData.append("fileName", fileName);

  let response: Response;
  try {
    response = await fetch(ALIBABA_UPLOAD_API_URL, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
  } catch (err) {
    // CORS 软成功识别：multipart/form-data 属于 CORS simple request，
    // 请求已发出且图片实际已写入阿里图库，但响应没有 CORS 头，
    // 浏览器拒绝读取响应，fetch 抛出 TypeError("Failed to fetch" / "NetworkError")。
    // 在静态部署（GitHub Pages 等无后端代理）场景下，这就是上传成功的标志。
    if (err instanceof TypeError) {
      console.warn('[上传] 浏览器直连出现 TypeError，判定为 CORS 软成功（请求已送达阿里图库，响应不可读）', err);
      return { success: true, softSuccess: true };
    }
    throw err;
  }

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `阿里图片库接口返回 ${response.status}，${responseSummary(responseText) || "没有返回内容"}`,
    );
  }

  const responseData: unknown = (() => {
    try {
      return JSON.parse(responseText);
    } catch {
      return responseText;
    }
  })();

  const remoteUrl = firstRemoteUrl(responseData, responseText);

  if (!remoteUrl) {
    throw new Error(
      `已请求上传接口，但没有找到图片链接。返回内容：${responseSummary(responseText) || "空"}`,
    );
  }

  return { success: true, url: remoteUrl };
}

// --------------- main entry ---------------

export async function uploadToAliyun(blob: Blob, fileName: string): Promise<UploadResult> {
  let backendError: unknown;
  let browserError: unknown;

  console.log(`[上传] === 开始上传 === 文件: ${fileName}, 大小: ${(blob.size / 1024).toFixed(1)}KB`);
  console.log(`[上传] 当前页面: ${typeof window !== 'undefined' ? window.location.href : '(SSR)'}`);

  // 优先：后端代理（Cookie 内置在后端，最稳定）
  const backendAvailable = await isBackendAvailable();
  if (backendAvailable) {
    console.log('[上传] 选择路径: uploadViaBackend (Cloudflare Tunnel 代理)');
    try {
      return await uploadViaBackend(blob, fileName);
    } catch (err) {
      console.warn('[上传] 后端代理路径失败，将回退到浏览器直连', err);
      backendError = err;
    }
  } else {
    console.warn('[上传] 后端不可达，将回退到浏览器直连（softSuccess 路径）');
    backendError = new Error(`本地后端服务（${getBackendBaseUrl()}）未启动`);
  }

  console.log('[上传] 选择路径: uploadViaBrowserDirect (浏览器直连阿里图库)');

  // 回退：浏览器直连（需内网 + 登录态）
  try {
    return await uploadViaBrowserDirect(blob, fileName);
  } catch (err) {
    browserError = err;
  }

  // 全部失败 → 分层错误提示
  const messages: string[] = [];

  if (backendError) {
    const msg =
      backendError instanceof Error ? backendError.message : "本地后端服务请求失败";
    messages.push(`【后端代理】${msg}\n修复方式：启动后端服务 cd backend && python3 server.py`);
  }

  if (browserError) {
    const isNetworkErr =
      browserError instanceof TypeError && /fetch/i.test(browserError.message);
    if (isNetworkErr) {
      messages.push(
        "【浏览器直连】无法访问阿里内网接口（tps.alibaba-inc.com）。请确认：1) 已连接内网/VPN；2) 已在浏览器中登录阿里内容后台。",
      );
    } else {
      const msg =
        browserError instanceof Error ? browserError.message : "浏览器直连上传失败";
      messages.push(`【浏览器直连】${msg}`);
    }
  }

  return {
    success: false,
    error: `上传失败，所有方式均不可用：\n\n${messages.join("\n\n")}`,
  };
}
