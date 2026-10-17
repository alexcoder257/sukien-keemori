/**
 * Đường dẫn của request hiện tại, do `proxy.ts` chuyển tiếp xuống server.
 *
 * `not-found.tsx` là file **không nhận props** — Next không truyền `params` cho
 * nó — nên nó không có cách nào biết mình đang ở locale nào. Header này là
 * đường duy nhất: proxy đã chạy trước mọi render và đã biết chắc locale (nó vừa
 * tự gắn prefix xong).
 *
 * Bản sao có chủ đích của `frontend/constants/http.ts` — hai app không import
 * xuyên nhau (xem `CLAUDE.md` mục 1), sửa một bên thì sửa nốt bên kia.
 */
export const PATHNAME_HEADER = "x-pathname";
