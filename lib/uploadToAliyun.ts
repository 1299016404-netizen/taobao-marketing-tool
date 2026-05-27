const ALIBABA_UPLOAD_API_URL =
  "https://tps.alibaba-inc.com/internal-management/image/upload?uploadType=image&compressType=0&folder=&isPrivate=false&workId=471874&workName=%E6%96%87%E5%B8%83";
export const ALIYUN_IMAGE_LIBRARY_URL =
  "https://content.alibaba-inc.com/work/internal-media-management/pic/upload?iframe=3";

// --------------- dynamic backend URL ---------------

// Cloudflare Tunnel：用于将 GitHub Pages（HTTPS）流量代理到本机后端 http://127.0.0.1:3001，
// 绕过浏览器 Mixed Content 拦截。tunnel 由 launchd 守护进程保持常驻，URL 重启会变。
const CLOUDFLARED_TUNNEL_BASE = 'https://trinity-knowledge-succeed-significant.trycloudflare.com';

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

// 健康检查：12 秒宽松超时 + 单次重试（应对 Cloudflare Tunnel 冷启动 / 偶发抖动）
async function isBackendAvailable(): Promise<boolean> {
  const url = getBackendHealthUrl();
  for (let attempt = 1; attempt <= 2; attempt++) {
    const startTime = Date.now();
    console.log(`[上传] 健康检查 ${attempt}/2 → ${url}（超时 12 秒）`);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);
      const elapsed = Date.now() - startTime;
      if (res.ok) {
        console.log(`[上传] 健康检查通过 (status=${res.status}, 耗时=${elapsed}ms)`);
        return true;
      }
      console.warn(`[上传] 健康检查返回 ${res.status} (耗时=${elapsed}ms)`);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      console.warn(`[上传] 健康检查 ${isAbort ? '超时' : '不可达'} (耗时=${elapsed}ms)`, err);
    }
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 800));
    }
  }
  return false;
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

// 唯一上传策略：backend 代理 + 自动重试 3 次（间隔 1.5s）。
// 不再降级到浏览器直连——浏览器直连必然落入 CORS softSuccess（拿不到 CDN 链接），
// 对用户毫无价值；真正失败时给出可执行的诊断信息，比软成功文案更有意义。
export async function uploadToAliyun(blob: Blob, fileName: string): Promise<UploadResult> {
  console.log(`[上传] === 开始上传 === 文件: ${fileName}, 大小: ${(blob.size / 1024).toFixed(1)}KB`);
  console.log(`[上传] 当前页面: ${typeof window !== 'undefined' ? window.location.href : '(SSR)'}`);

  // 1) 健康检查（带宽松超时 + 单次重试）
  const backendAvailable = await isBackendAvailable();
  if (!backendAvailable) {
    return {
      success: false,
      error: `本地后端服务（${getBackendBaseUrl()}）当前不可达。\n\n请确认：\n1) backend 是否在运行（launchctl list | grep apng-upload）\n2) Cloudflare Tunnel 是否在运行（launchctl list | grep cloudflared）\n3) 网络是否可访问 tunnel 域名`,
    };
  }

  // 2) backend 代理上传：最多 3 次尝试（每次 15s 超时，间隔 1.5s）
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`[上传] backend 上传尝试 ${attempt}/3`);
    try {
      const result = await uploadViaBackend(blob, fileName);
      if (result.success && result.url) {
        console.log(`[上传] ✅ 第 ${attempt} 次尝试成功`);
        return result;
      }
      // success=false 直接抛错走重试，不要返回 success=true url="" 死态
      throw new Error(result.error || 'backend 返回成功但缺少 CDN 链接');
    } catch (err) {
      lastError = err;
      console.warn(`[上传] 第 ${attempt} 次失败:`, err);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  // 3) 三次都失败：返回明确错误，不再 softSuccess
  const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
  return {
    success: false,
    error: `上传失败（重试 3 次均失败）：${errMsg}\n\n如持续失败，请刷新页面（⌘+⇧+R）重试，或联系开发者排查 backend 日志。`,
  };
}

// 保留：浏览器直连函数仅供内网静态部署场景调试使用，主链路不再调用
// （删除会破坏 import 引用，但实际运行已不会进入此分支）
export async function _uploadViaBrowserDirectForDebug(blob: Blob, fileName: string): Promise<UploadResult> {
  return uploadViaBrowserDirect(blob, fileName);
}
