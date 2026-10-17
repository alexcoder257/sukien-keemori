import Image from "next/image";
import { BRAND_ASSETS } from "@/constants/brand";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  alt?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  surface?: "adaptive" | "dark" | "light";
  variant?: "horizontal" | "stacked";
};

type BrandSurface = NonNullable<BrandLogoProps["surface"]>;

const SURFACE_COLOR: Record<BrandSurface, string> = {
  adaptive: "text-forest-ink dark:text-champagne",
  dark: "text-champagne",
  light: "text-forest-ink",
};

/** Vector wordmark: giữ nét chữ sắc ở mọi DPR và lấy màu từ `currentColor`. */
function WordmarkSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 432 43"
      fill="none"
      aria-hidden
      focusable="false"
      className={className}
    >
      <text
        x="216"
        y="35.5"
        fill="currentColor"
        textAnchor="middle"
        textLength="414"
        lengthAdjust="spacing"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 40,
          fontWeight: 500,
        }}
      >
        KEEMORI
      </text>
    </svg>
  );
}

/**
 * Monogram K dạng vector. Nhánh lá và nét lượn dưới chân giữ tinh thần của dấu
 * thương hiệu gốc, còn toàn bộ hình dùng `currentColor` để đổi màu theo nền.
 */
function MonogramSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 312 259"
      fill="none"
      aria-hidden
      focusable="false"
      className={className}
    >
      <text
        x="53"
        y="190"
        fill="currentColor"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 190,
          fontWeight: 500,
        }}
      >
        K
      </text>
      <path
        d="M61 174C58 213 90 227 129 213C156 203 177 183 205 188C235 193 248 229 280 232C290 233 299 230 305 224C296 238 278 242 262 236C238 228 225 207 204 202C179 196 156 215 128 224C91 236 54 218 61 174Z"
        fill="currentColor"
      />
      <path
        d="M62 168C44 147 34 123 31 96"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M33 114C19 112 10 104 7 91C20 91 30 99 33 114ZM39 132C28 134 19 130 13 121C24 118 34 122 39 132ZM29 96C18 91 13 82 14 71C26 76 31 84 29 96ZM44 146C34 151 25 149 18 141C28 136 38 138 44 146Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Logo thương hiệu có một nguồn dùng chung. `surface` nói màu nền đang nằm
 * phía sau logo; `adaptive` bám theo class `.dark` của toàn ứng dụng.
 */
export function BrandLogo({
  alt = "Keemori",
  className,
  priority = false,
  sizes = "240px",
  surface = "adaptive",
  variant = "horizontal",
}: BrandLogoProps) {
  const sources = BRAND_ASSETS.logo[variant];
  const imageClassName = cn(
    "object-contain",
    variant === "stacked" ? "object-center" : "object-left",
  );

  return (
    <span className={cn("relative block", className)}>
      {surface === "adaptive" ? (
        <>
          <Image
            src={sources.lightSurface}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            className={cn(imageClassName, "dark:hidden")}
          />
          <Image
            src={sources.darkSurface}
            alt=""
            aria-hidden
            fill
            priority={priority}
            sizes={sizes}
            className={cn(imageClassName, "hidden dark:block")}
          />
        </>
      ) : (
        <Image
          src={
            surface === "dark"
              ? sources.darkSurface
              : sources.lightSurface
          }
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={imageClassName}
        />
      )}
    </span>
  );
}

type HeaderBrandLogoProps = Pick<
  BrandLogoProps,
  "className" | "priority" | "surface"
>;

type BrandWordmarkProps = Pick<
  BrandLogoProps,
  "className" | "priority" | "sizes" | "surface"
>;

/** Wordmark KEEMORI không kèm monogram hay tagline. */
export function BrandWordmark({
  className,
  surface = "adaptive",
}: BrandWordmarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative block aspect-[432/43]",
        SURFACE_COLOR[surface],
        className,
      )}
    >
      <WordmarkSvg className="block size-full overflow-visible" />
    </span>
  );
}

/** Header dùng monogram trên mobile và wordmark không tagline từ tablet trở lên. */
export function HeaderBrandLogo({
  className,
  surface = "adaptive",
}: HeaderBrandLogoProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-9 items-center",
        SURFACE_COLOR[surface],
        className,
      )}
    >
      <span className="relative block h-full aspect-[312/259] shrink-0 md:hidden">
        <MonogramSvg className="block size-full overflow-visible" />
      </span>
      <span className="relative hidden h-[48%] aspect-[432/43] md:block">
        <WordmarkSvg className="block size-full overflow-visible" />
      </span>
    </span>
  );
}

type BrandIconProps = Pick<
  BrandLogoProps,
  "alt" | "className" | "priority" | "sizes" | "surface"
>;

/** Monogram vuông dùng ở auth và các vị trí cần dấu thương hiệu thu gọn. */
export function BrandIcon({
  alt = "Keemori",
  className,
  priority = false,
  sizes = "48px",
  surface = "adaptive",
}: BrandIconProps) {
  const { darkSurface, lightSurface } = BRAND_ASSETS.icon;

  return (
    <span className={cn("relative block overflow-hidden rounded-[22%]", className)}>
      {surface === "adaptive" ? (
        <>
          <Image
            src={lightSurface}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            className="object-cover dark:hidden"
          />
          <Image
            src={darkSurface}
            alt=""
            aria-hidden
            fill
            priority={priority}
            sizes={sizes}
            className="hidden object-cover dark:block"
          />
        </>
      ) : (
        <Image
          src={surface === "dark" ? darkSurface : lightSurface}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      )}
    </span>
  );
}
