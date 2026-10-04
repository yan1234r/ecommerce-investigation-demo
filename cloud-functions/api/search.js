const SEARCH_URL = "https://open.feedcoopapi.com/search_api/web_search";
const SCOPES = {
  web: { label: "公开网页", suffix: "", hosts: [] },
  douyin: { label: "抖音店铺公开页", suffix: "site:douyin.com 抖音店铺", hosts: ["douyin.com", "jinritemai.com"] },
  chanmama: { label: "蝉妈妈公开页", suffix: "site:chanmama.com", hosts: ["chanmama.com"] },
  qcc: { label: "企查查公开页", suffix: "site:qcc.com", hosts: ["qcc.com"] },
};
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 4;
const recentByIp = new Map();

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

function limited(ip) {
  const now = Date.now();
  const recent = (recentByIp.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  recentByIp.set(ip, recent);
  if (recentByIp.size > 500) for (const [key, times] of recentByIp) {
    if (!times.some((time) => now - time < WINDOW_MS)) recentByIp.delete(key);
  }
  return false;
}

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function allowedHost(url, hosts) {
  if (!hosts.length) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return hosts.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch { return false; }
}

export async function onRequestPost({ request, env, clientIp }) {
  const apiKey = env?.SEARCH_API_KEY || env?.AI_GATEWAY_API_KEY;
  if (!apiKey) return json({ error: "服务端尚未配置 Agent Plan 搜索密钥。" }, 503);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 2048) return json({ error: "搜索词过长。" }, 413);
  let input;
  try { input = await request.json(); } catch { return json({ error: "请求格式无效。" }, 400); }
  const query = clean(input?.query, 101);
  if (!query || query.length > 100) return json({ error: "请输入 1 至 100 个字符的搜索词。" }, 400);
  const scope = clean(input?.scope, 20) || "web";
  if (!Object.hasOwn(SCOPES, scope)) return json({ error: "不支持该搜索来源。" }, 400);
  if (limited(String(clientIp || "unknown"))) return json({ error: "搜索太频繁，请一分钟后重试。" }, 429);
  const source = SCOPES[scope];

  try {
    const upstream = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "x-traffic-tag": "xj_hackathon_demo",
      },
      body: JSON.stringify({
        Query: source.suffix ? `${query} ${source.suffix}` : query,
        SearchType: "web",
        Count: scope === "web" ? 8 : 20,
        Filter: { NeedUrl: true, NeedContent: false },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!upstream.ok) return json({ error: `豆包搜索暂不可用（${upstream.status}）。请检查搜索 Harness 是否已开启。` }, 502);
    const data = await upstream.json();
    if (data?.ResponseMetadata?.Error) return json({ error: "豆包搜索未开通、额度不足或暂不可用。" }, 502);
    const raw = data?.Result?.WebResults || data?.Result?.Results || [];
    const results = (Array.isArray(raw) ? raw : []).map((item) => {
      const url = clean(item?.Url, 1000);
      if (!/^https?:\/\//i.test(url) || !allowedHost(url, source.hosts)) return null;
      return {
        title: clean(item?.Title, 180) || "未命名网页",
        url,
        source: clean(item?.SiteName, 100),
        scope,
        scopeLabel: source.label,
        snippet: clean(item?.Summary || item?.Snippet, 800),
        publishedAt: clean(item?.PublishTime, 80),
      };
    }).filter(Boolean).slice(0, 8);
    return json({ query, scope, scopeLabel: source.label, results, searchedAt: new Date().toISOString() });
  } catch (error) {
    return json({ error: error?.name === "TimeoutError" ? "搜索超时，请稍后重试。" : "搜索返回内容不可用，请稍后重试。" }, 502);
  }
}

export function onRequestGet() {
  return json({ ready: true, route: "/api/search", method: "POST" });
}
