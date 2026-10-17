/**
 * Nhúng một khối JSON-LD vào trang.
 *
 * `<script type="application/ld+json">` chứ không phải thẻ meta: đây là dữ liệu
 * có cấu trúc cho máy đọc, trình duyệt bỏ qua hoàn toàn. Server Component nên
 * khối này nằm sẵn trong HTML server trả về — đúng thứ con bò cần, vì nó không
 * chờ JavaScript chạy xong.
 *
 * `JSON.stringify` xử lý luôn việc thoát ký tự, nhưng còn một lỗ: chuỗi
 * `</script>` nằm trong dữ liệu sẽ đóng thẻ sớm và phần còn lại rơi ra ngoài
 * thành HTML — với nội dung do admin nhập trong CMS thì đó là một đường XSS.
 * Vì vậy `<` được thoát thành `<`; JSON vẫn hợp lệ và trình phân tích của
 * Google đọc y hệt.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
