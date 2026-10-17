import { cn } from "@/lib/utils";

/**
 * Các slot chữ của một nghi lễ. Ba bố cục **xếp chúng theo trật tự riêng** thay
 * vì nhận cờ `timeFirst`/`withIcons` như bản trước — cờ boolean chỉ che giấu
 * việc ba bố cục thật sự khác nhau ở cấu trúc, và mỗi khác biệt mới lại đẻ thêm
 * một cờ.
 *
 * Năm hạng thị giác, cố ý cách nhau xa:
 *
 * 1. `time`   — con số, cỡ lớn nhất, màu đậm nhất. Thứ khách mời phải nhớ.
 * 2. `name`   — chữ hoa giãn rộng, cỡ nhỏ. Nhãn dẫn vào, không tranh với giờ.
 * 3. `date`   — chữ hoa nhỏ, chìm một bậc. Xác nhận chứ không phải tiêu điểm.
 * 4. `venue`  — thân bài.
 * 5. `note`   — nghiêng, cùng sắc độ với `venue`.
 *
 * Bản trước để `time` và `venue` **cùng cỡ cùng màu**, nên "khi nào" và "ở đâu"
 * đọc ra ngang hàng và mắt không biết bám vào đâu.
 */

export function CeremonyTime({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <p
      data-ceremony-text="time"
      className={cn(
        "m-0 text-(length:--tpl-h3) leading-none font-normal tabular-nums [font-family:var(--ceremony-font-time,inherit)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * `font-weight: 500`, không phải 400.
 *
 * Chữ hoa giãn rộng ở cỡ nhỏ **mỏng đi theo hai đường cùng lúc**: chữ hoa không
 * có nét lên nét xuống để mắt bám như chữ thường, còn giãn chữ thì tách các nét
 * đứng ra xa nhau nên mảng chữ loãng. Serif tương phản cao như Cormorant SC ở
 * weight 400 và 16px thì nét thanh gần như biến mất — nhãn đọc ra như bị mờ.
 *
 * Bù bằng weight chứ không bằng cỡ chữ: tăng cỡ thì nhãn tranh chỗ với con số
 * giờ, vốn là neo thị giác của cả khối. Bốn font dùng cho vai này đều có bộ
 * weight thật (Cormorant SC 5 bậc rời, ba font kia là variable), nên đây là
 * chữ đậm thật chứ không phải trình duyệt tự làm đậm.
 */
export function CeremonyName({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <h3
      data-ceremony-text="name"
      className={cn(
        "m-0 text-(length:--tpl-small) leading-[1.4] font-medium tracking-[0.2em] uppercase [font-family:var(--ceremony-font-name,inherit)]",
        className,
      )}
    >
      {children}
    </h3>
  );
}

export function CeremonyDate({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <p
      data-ceremony-text="date"
      className={cn(
        "m-0 text-(length:--tpl-caption) leading-[1.5] font-medium tracking-[0.12em] text-[var(--ceremony-muted,currentColor)] uppercase [font-family:var(--ceremony-font-date,inherit)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function CeremonyVenue({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <p
      data-ceremony-text="venue"
      className={cn(
        "m-0 text-(length:--tpl-body) leading-[1.55] text-[var(--ceremony-muted,currentColor)] [font-family:var(--ceremony-font-venue,inherit)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * Lời thông báo dùng `--ceremony-muted`, **không phải `--ceremony-faint`**.
 * Đây là chữ người dùng tự viết, tức nội dung thật; đo bản trước thì nó chỉ đạt
 * 2.96:1 trên nền giấy — dưới ngưỡng AA khá xa. `faint` để dành cho hoạ tiết.
 */
export function CeremonyNote({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <p
      data-ceremony-text="note"
      className={cn(
        "m-0 text-(length:--tpl-small) leading-[1.55] text-[var(--ceremony-muted,currentColor)] italic [font-family:var(--ceremony-font-note,inherit)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Măng sét của cả khối. */
export function CeremoniesTitle({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <h2
      data-ceremony-text="title"
      className={cn(
        "m-0 text-(length:--tpl-h3) leading-[1.2] font-normal text-[var(--ceremony-accent,currentColor)] [font-family:var(--ceremony-font-title,inherit)]",
        className,
      )}
    >
      {children}
    </h2>
  );
}
