/**
 * Phục vụ `keemori.com/uploads/*` thẳng từ bucket R2, không đi qua VPS.
 *
 * Không có Worker này thì `/uploads/*` đi vào Next trên VPS, rồi rewrite ở
 * `frontend/next.config.ts` **proxy** (không phải redirect) sang
 * `UPLOADS_ORIGIN` — tức mọi byte ảnh vẫn chạy qua máy 2 lõi, chỉ có chỗ lưu là
 * đổi. Route của Worker chặn request ở biên Cloudflare, trước khi nó tới VPS.
 *
 * Đường dẫn trong database giữ nguyên `/uploads/...` (xem `R2Provider`): khoá
 * trên R2 mang đúng tiền tố đó, nên khoá = pathname bỏ `/` đầu.
 *
 * Cache API là bắt buộc: response dựng từ binding R2 **không** tự vào cache của
 * zone như custom domain, nên thiếu nó thì mỗi lượt xem ảnh là một lượt đọc
 * Class B tính tiền. Tên tệp ngẫu nhiên và không bao giờ bị ghi đè, nên cache
 * vĩnh viễn là đúng.
 */
export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD' },
      });
    }

    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.slice(1));
    if (!key.startsWith('uploads/') || key.includes('..')) {
      return new Response('Not Found', { status: 404 });
    }

    // Bỏ query string khỏi khoá cache: `?v=...` tuỳ ý không được sinh thêm
    // lượt đọc R2 cho cùng một tệp.
    const cacheKey = new Request(`${url.origin}${url.pathname}`);
    let response = await caches.default.match(cacheKey);

    if (!response) {
      const object = await env.UPLOADS.get(key);
      if (!object) {
        return new Response('Not Found', {
          status: 404,
          headers: { 'Cache-Control': 'no-store' },
        });
      }
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('ETag', object.httpEtag);
      if (!headers.has('Cache-Control')) {
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
      response = new Response(object.body, { headers });
      ctx.waitUntil(caches.default.put(cacheKey, response.clone()));
    }

    if (request.method === 'HEAD') {
      return new Response(null, { headers: response.headers });
    }
    return response;
  },
};
