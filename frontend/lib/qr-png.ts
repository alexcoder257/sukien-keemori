/** Cạnh của ảnh PNG tải về — đủ nét để in lên thiệp giấy hoặc standee. */
const DEFAULT_SIZE = 1024;
/** Lề trắng quanh mã, tính theo tỉ lệ chuẩn của QR (4 module). */
const DEFAULT_PADDING = 64;

/**
 * Tải mã QR mà `react-qr-code` vẽ ra (SVG) về dưới dạng PNG.
 *
 * Dán thẳng SVG vào thiệp thì phần lớn công cụ in ấn và ứng dụng chat không mở
 * được. Nên vẽ lại lên canvas rồi xuất PNG: nền trắng tô trước, mã vẽ chồng
 * lên, chừa lề trắng để máy quét bắt được viền.
 *
 * Dùng chung cho hộp chia sẻ của thiệp và công cụ tạo mã QR công khai.
 */
export function downloadQrPng(
  svg: SVGElement,
  filename: string,
  { size = DEFAULT_SIZE, padding = DEFAULT_PADDING } = {},
): void {
  const clone = svg.cloneNode(true) as SVGElement;
  const inner = size - padding * 2;
  clone.setAttribute("width", String(inner));
  clone.setAttribute("height", String(inner));

  const source = new XMLSerializer().serializeToString(clone);
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.drawImage(image, padding, padding, inner, inner);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(href);
    }, "image/png");
  };
  // `encodeURIComponent` thay cho base64: nội dung SVG có dấu tiếng Việt
  // trong nhãn nào đó là `btoa` ném lỗi.
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
}
