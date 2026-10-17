import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    // Phải đứng sau Tailwind: nó đọc khối `@supports (color:color-mix(...))`
    // mà Tailwind sinh ra. Chỉ thêm khối dự phòng, không sửa CSS gốc.
    //
    // Turbopack bundle cả file này lẫn plugin vào `.next/`, nên đường dẫn phải
    // là `new URL("...", import.meta.url)` viết thẳng (nó nhận ra và chép plugin
    // theo), còn `globals.css` thì tính từ thư mục chạy build.
    [fileURLToPath(new URL("./postcss-color-mix-fallback.cjs", import.meta.url))]: {
      globalsCss: resolve(process.cwd(), "app/globals.css"),
    },
  },
};

export default config;
