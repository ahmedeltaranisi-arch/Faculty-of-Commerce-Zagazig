type StreamResponse<T> = { success: boolean; result?: T; errors?: Array<{ message?: string }> };

function streamConfig() {
  const accountId = process.env.STREAM_ACCOUNT_ID;
  const apiToken = process.env.STREAM_API_TOKEN;
  if (!accountId || !apiToken) throw new Error("Cloudflare Stream is not configured");
  return { accountId, apiToken };
}

async function streamRequest<T>(path: string, init?: RequestInit) {
  const { accountId, apiToken } = streamConfig();
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream${path}`, { ...init, headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json", ...(init?.headers ?? {}) }, cache: "no-store" });
  const payload = await response.json() as StreamResponse<T>;
  if (!response.ok || !payload.success) throw new Error(payload.errors?.[0]?.message ?? "Cloudflare Stream request failed");
  return payload.result as T;
}

export async function createDirectUpload(maxDurationSeconds = 7200) {
  return streamRequest<{ uid: string; uploadURL: string }>("/direct_upload", { method: "POST", body: JSON.stringify({ maxDurationSeconds, requireSignedURLs: true }) });
}

export async function createPlaybackToken(videoId: string) {
  const result = await streamRequest<{ token: string }>(`/${encodeURIComponent(videoId)}/token`, { method: "POST" });
  const base = process.env.STREAM_PLAYBACK_BASE_URL ?? "https://videodelivery.net";
  return { token: result.token, manifestUrl: `${base}/${result.token}/manifest/video.m3u8`, thumbnailUrl: `${base}/${result.token}/thumbnails/thumbnail.jpg` };
}

export async function deleteStreamVideo(videoId: string) {
  await streamRequest(`/${encodeURIComponent(videoId)}`, { method: "DELETE" });
}
