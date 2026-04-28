import "server-only";

const READ_ONLY_METHODS = new Set(["GET", "HEAD"]);
const DEFAULT_BLOCKED_HOSTS = new Set(["maroma.com", "www.maroma.com"]);

type MaromaReadonlyConfig = {
  apiBaseUrl: URL;
  consumerKey: string;
  consumerSecret: string;
  blockedHosts: Set<string>;
  allowedHosts: Set<string>;
};

function parseHosts(value: string | undefined): Set<string> {
  if (!value) {
    return new Set();
  }
  return new Set(
    value
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
  );
}

function getConfig(): MaromaReadonlyConfig {
  const apiBase = process.env.MAROMA_API_BASE_URL;
  const consumerKey = process.env.MAROMA_CONSUMER_KEY;
  const consumerSecret = process.env.MAROMA_CONSUMER_SECRET;

  if (!apiBase || !consumerKey || !consumerSecret) {
    throw new Error(
      "Missing Maroma readonly config. Set MAROMA_API_BASE_URL, MAROMA_CONSUMER_KEY, and MAROMA_CONSUMER_SECRET."
    );
  }

  const apiBaseUrl = new URL(apiBase);
  const blockedHosts = parseHosts(process.env.MAROMA_BLOCKED_HOSTS);
  for (const host of DEFAULT_BLOCKED_HOSTS) {
    blockedHosts.add(host);
  }

  const allowedHosts = parseHosts(process.env.MAROMA_ALLOWED_HOSTS);
  if (allowedHosts.size === 0) {
    allowedHosts.add(apiBaseUrl.hostname.toLowerCase());
  }

  return {
    apiBaseUrl,
    consumerKey,
    consumerSecret,
    blockedHosts,
    allowedHosts
  };
}

function assertReadonlyMethod(method: string) {
  const normalized = method.toUpperCase();
  if (!READ_ONLY_METHODS.has(normalized)) {
    throw new Error(`Blocked non-readonly method: ${normalized}`);
  }
}

function assertSafeHost(url: URL, config: MaromaReadonlyConfig) {
  const host = url.hostname.toLowerCase();

  if (config.blockedHosts.has(host)) {
    throw new Error(`Blocked production host: ${host}`);
  }

  if (!config.allowedHosts.has(host)) {
    throw new Error(`Host is not in MAROMA_ALLOWED_HOSTS: ${host}`);
  }
}

export async function maromaReadonlyFetch(
  resourcePath: string,
  init?: Omit<RequestInit, "method">
) {
  const config = getConfig();
  const targetUrl = new URL(resourcePath, config.apiBaseUrl);
  assertSafeHost(targetUrl, config);

  const method = "GET";
  assertReadonlyMethod(method);

  const authHeader = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString(
    "base64"
  );

  return fetch(targetUrl, {
    ...init,
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${authHeader}`,
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });
}

export function assertInboundReadonlyRequest(method: string) {
  assertReadonlyMethod(method);
}
