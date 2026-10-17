"use client";

import { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
  /** Trễ theo bậc để các phần tử cùng hàng hiện lần lượt thay vì cùng lúc. */
  delay?: number;
  className?: string;
};

/** Khoảng cách từ đáy khung nhìn mà khối bắt đầu hiện. */
const TRIGGER_OFFSET = 80;

/**
 * Một hàng đợi dùng chung cho mọi khối chờ hiện, thay vì mỗi khối một
 * IntersectionObserver. Lý do không dùng IntersectionObserver: nó chỉ gọi lại
 * khi trạng thái giao cắt *thay đổi*, nên nếu người dùng nhảy một mạch qua giữa
 * trang (bấm "lên đầu trang", vuốt mạnh trên mobile) sẽ có khối không nhận được
 * lần gọi nào và kẹt vĩnh viễn ở trạng thái trong suốt — mất nội dung thiệp.
 */
const pending = new Set<HTMLElement>();
let frame = 0;
let listening = false;
/**
 * Nội dung thiệp chỉ có layout sau khi khách bấm mở phong bì — đó không phải
 * một lần cuộn nên `scroll` không bắt được. Theo dõi chiều cao trang để chạy
 * lại phép đo ngay khi thiệp mở ra (và khi ảnh tải xong làm trang dài thêm).
 */
let sizeObserver: ResizeObserver | null = null;

function flush() {
  frame = 0;
  const limit = window.innerHeight - TRIGGER_OFFSET;

  for (const node of pending) {
    const rect = node.getBoundingClientRect();
    // Kích thước 0: khối chưa có layout — trước khi khách mở phong bì, toàn bộ
    // nội dung thiệp còn nằm trong một khối `display: none`, mọi toạ độ đều
    // bằng 0 và sẽ bị hiểu nhầm là "đang ở đầu khung nhìn".
    if (rect.width === 0 && rect.height === 0) continue;
    if (rect.top >= limit) continue;
    node.dataset.shown = "true";
    pending.delete(node);
  }

  if (pending.size === 0) stopListening();
}

/**
 * Chỉ đo vị trí sau khi trang tải xong. Trước mốc đó layout chưa phải layout
 * thật — ở dev, CSS Module được nạp bằng JS nên lần mount đầu mọi khối còn dồn
 * lên đầu trang và sẽ bị coi là "đã nằm trong khung nhìn", hiện hết một lượt.
 */
function whenSettled(run: () => void) {
  if (document.readyState === "complete") {
    run();
    return;
  }

  let done = false;
  const once = () => {
    if (done) return;
    done = true;
    window.removeEventListener("load", once);
    run();
  };

  window.addEventListener("load", once, { once: true });
  // Lưới an toàn: không để nội dung kẹt ở trạng thái trong suốt nếu vì lý do
  // nào đó sự kiện `load` không bao giờ tới.
  window.setTimeout(once, 2000);
}

function schedule() {
  if (frame) return;
  frame = window.requestAnimationFrame(flush);
}

function startListening() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  sizeObserver = new ResizeObserver(schedule);
  sizeObserver.observe(document.body);
}

function stopListening() {
  if (!listening) return;
  listening = false;
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
  sizeObserver?.disconnect();
  sizeObserver = null;
}

/**
 * Hiện nội dung khi cuộn tới. Thiệp là một trang cuộn dọc rất dài nên chuyển
 * động nhỏ này là thứ phân biệt "một trang đã điền dữ liệu" với "một tấm thiệp".
 *
 * Mặc định render ở trạng thái đã hiện rồi mới ẩn đi trong effect: nếu JS chưa
 * chạy hoặc người dùng tắt chuyển động thì nội dung vẫn đọc được bình thường.
 * Trạng thái nằm trên `dataset` thay vì `useState` vì đây thuần tuý là hiệu ứng
 * DOM — không có gì trong React cần render lại theo nó.
 */
export function Reveal({ children, delay = 0, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    node.dataset.shown = "false";
    pending.add(node);
    startListening();
    whenSettled(schedule);

    return () => {
      pending.delete(node);
      if (pending.size === 0) stopListening();
    };
  }, []);

  return (
    <div
      ref={ref}
      data-shown="true"
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={className}
    >
      {children}
    </div>
  );
}
