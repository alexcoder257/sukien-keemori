import { cn } from "@/lib/utils";
import type { WeddingDetailsData } from "./wedding-details.types";

/**
 * Các slot chữ của khối. Mỗi slot tự mang `data-details-text` và tự đọc biến
 * font của vùng mình (`--details-font-*`), nên ba bố cục chỉ còn việc xếp chỗ.
 */

export function DetailsTitle({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <p
      data-details-text="title"
      className={cn(
        "m-0 text-(length:--tpl-h4) font-bold tracking-[0.12em] uppercase [font-family:var(--details-font-title,inherit)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function DetailsInvitation({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <p
      data-details-text="invitation"
      className={cn(
        "m-0 max-w-[26em] text-(length:--tpl-body) leading-[1.6] tracking-[0.06em] uppercase [font-family:var(--details-font-invitation,inherit)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * Tên cặp đôi và dấu `&` ngăn giữa.
 *
 * Trả về `null` khi cả hai tên rỗng — mẫu thiệp tắt block `couple` thì truyền
 * xuống chuỗi rỗng, và một dấu `&` đứng trơ giữa trang là chỗ hỏng dễ lọt nhất.
 */
export function DetailsNames({
  names,
  childOrders,
  className,
  gap = "gap-[var(--details-space-sm)]",
}: {
  names: WeddingDetailsData["coupleNames"];
  childOrders?: WeddingDetailsData["childOrders"];
  className?: string;
  gap?: string;
}) {
  if (!names[0]?.trim() && !names[1]?.trim()) return null;
  return (
    <h2
      data-details-part="names"
      className={cn("m-0 grid justify-items-center font-normal", gap, className)}
    >
      <DetailsName name={names[0]} role={childOrders?.[0]} />
      <DetailsAmpersand />
      <DetailsName name={names[1]} role={childOrders?.[1]} />
    </h2>
  );
}

/**
 * Một cái tên, kèm thứ bậc con nếu bố cục có.
 *
 * Cỡ chữ **co theo độ dài tên**: CSS không đo được chuỗi nhưng React thì biết,
 * nên độ dài đi xuống bằng `--details-name-length` (đặt ở `DetailsSurface`) và
 * cỡ chữ là một phép chia. `clamp()` chặn hai đầu — không vượt `--tpl-h1`,
 * không nhỏ hơn `--tpl-h4`: tên dài quá mức thì thà xuống dòng còn hơn nhỏ đến
 * mức không đọc được.
 *
 * Biến độ dài đặt ở component cha chứ không ở đây, vì nó lấy theo tên **dài hơn
 * trong hai người**: hai tên phải cùng một cỡ, nếu không thì "Anh" to gấp rưỡi
 * "Nguyễn Thị Bích Phượng" và tấm thiệp đọc ra như một người quan trọng hơn.
 */
function DetailsName({ name, role }: { name: string; role?: string }) {
  return (
    <span className="grid justify-items-center gap-[var(--details-space-xs)]">
      <span
        data-details-text="names"
        className="text-[clamp(var(--tpl-h4),calc(100cqi/(var(--details-name-length,10)*var(--details-name-density,0.6))),var(--tpl-h1))] leading-[1.25] [font-family:var(--details-font-names,inherit)]"
      >
        {name}
      </span>
      {role ? (
        <span
          data-details-text="role"
          className="text-(length:--tpl-caption) tracking-[0.24em] text-[var(--details-faint,currentColor)] uppercase [font-family:var(--details-font-role,inherit)]"
        >
          {role}
        </span>
      ) : null}
    </span>
  );
}

function DetailsAmpersand() {
  return (
    <span
      data-details-text="ampersand"
      aria-hidden
      className="text-(length:--tpl-h3) leading-none text-[var(--details-accent,currentColor)] [font-family:var(--details-font-ampersand,inherit)]"
    >
      &amp;
    </span>
  );
}

/**
 * Giờ và thứ là **hai vế tách rời**, khoảng cách do bố cục quyết định. Nối bằng
 * chuỗi thì `classic` — bố cục duy nhất dùng dấu phẩy — bắt hai bố cục kia mang
 * theo một ký tự chúng không dùng.
 */
export function DetailsTime({
  time,
  weekday,
  className,
}: {
  time?: string;
  weekday?: string;
  className?: string;
}) {
  if (!time && !weekday) return null;
  return (
    <p
      data-details-text="time"
      className={cn(
        "m-0 flex flex-wrap items-baseline justify-center gap-x-[var(--details-space-sm)] text-(length:--tpl-lead) tracking-[0.08em] uppercase text-[var(--details-muted,currentColor)] [font-family:var(--details-font-time,inherit)]",
        className,
      )}
    >
      {time ? <span>{time}</span> : null}
      {weekday ? <span>{weekday}</span> : null}
    </p>
  );
}

export function DetailsLunar({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <p
      data-details-text="lunar"
      className={cn(
        "m-0 text-(length:--tpl-body) italic text-[var(--details-faint,currentColor)] [font-family:var(--details-font-lunar,inherit)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * Nơi tổ chức. Ở `formal` nhãn và tên là **một câu liền** — cùng cỡ, cùng màu,
 * chỉ ngắt dòng; tách thành nhãn nhỏ cộng tiêu đề in hoa đậm thì nơi tổ chức
 * nặng ngang tên cô dâu chú rể và tranh mất tiêu điểm.
 */
export function DetailsVenue({
  venue,
  merged = false,
  className,
}: {
  venue: NonNullable<WeddingDetailsData["venue"]>;
  merged?: boolean;
  className?: string;
}) {
  return (
    <div
      data-details-part="venue"
      className={cn(
        "grid justify-items-center",
        merged
          ? "max-w-[24em] gap-[var(--details-space-2xs)]"
          : "max-w-[28em] gap-[var(--details-space-xs)]",
        className,
      )}
    >
      <p
        data-details-text="venueLabel"
        className={cn(
          "m-0 [font-family:var(--details-font-venue-label,inherit)]",
          merged
            ? "text-(length:--tpl-body) leading-[1.5] tracking-[0.06em] uppercase text-[var(--details-muted,currentColor)]"
            : "text-(length:--tpl-body)",
        )}
      >
        {venue.label}
      </p>
      <p
        data-details-text="venue"
        className={cn(
          "m-0 [font-family:var(--details-font-venue,inherit)]",
          merged
            ? "text-(length:--tpl-body) leading-[1.5] font-normal tracking-[0.06em] uppercase text-[var(--details-muted,currentColor)]"
            : "text-(length:--tpl-h4) leading-[1.3] font-bold tracking-[0.04em] uppercase",
        )}
      >
        {venue.name}
      </p>
      {venue.address ? (
        <p
          data-details-text="address"
          className={cn(
            "m-0 leading-[1.5] text-[var(--details-faint,currentColor)] [font-family:var(--details-font-address,inherit)]",
            merged ? "text-(length:--tpl-small)" : "text-(length:--tpl-body)",
          )}
        >
          {venue.address}
        </p>
      ) : null}
    </div>
  );
}
