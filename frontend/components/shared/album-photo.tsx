import Image from "next/image";
import { MediaPlaceholder } from "@/components/shared/media-placeholder";
import { cn } from "@/lib/utils";

/**
 * Một ô ảnh album. Ảnh chờ upload dùng URL `blob:` nên phải bỏ qua tối ưu của
 * Next; thiệp mẫu chưa có ảnh thật thì vẫn rơi về ô giữ chỗ.
 */
export function AlbumPhoto({
  src,
  label,
  className,
  natural = false,
  ratio,
  onRatio,
  sizes = "(max-width: 640px) 50vw, 320px",
}: {
  src: string;
  label?: string;
  className?: string;
  /**
   * Giữ đúng khung hình gốc của ảnh thay vì cắt vào ô vuông. Dùng cho ảnh
   * khách nhìn thấy trên thiệp; thumbnail trong editor vẫn để ô vuông cho
   * lưới đều nhau.
   */
  natural?: boolean;
  /**
   * Tỉ lệ rộng/cao đã biết. Có nó thì ô ảnh chiếm sẵn đúng chỗ trước khi ảnh
   * tải xong; không có thì chiều cao tự suy theo ảnh (dùng cho trình xem ảnh,
   * nơi chỉ có một tấm nên không sợ xô layout).
   */
  ratio?: number;
  /** Báo tỉ lệ thật khi ảnh tải xong, để nơi gọi xếp lại lưới. */
  onRatio?: (ratio: number) => void;
  sizes?: string;
}) {
  const isImage = /^(blob:|data:|https?:|\/)/.test(src);

  const reportRatio = onRatio
    ? (event: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        if (naturalWidth > 0 && naturalHeight > 0) {
          onRatio(naturalWidth / naturalHeight);
        }
      }
    : undefined;

  if (!isImage) {
    return (
      <MediaPlaceholder
        label={label}
        className={cn("aspect-square", className)}
      />
    );
  }

  if (natural && ratio) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-foreground/10 bg-secondary/60",
          className,
        )}
        style={{ aspectRatio: ratio }}
      >
        {/* Ô đã đúng tỉ lệ ảnh nên `object-cover` không cắt gì cả — nó chỉ lấp
            trọn ô trong lúc tỉ lệ tạm còn là giá trị đoán. */}
        <Image
          src={src}
          alt={label ?? ""}
          fill
          unoptimized
          sizes={sizes}
          onLoad={reportRatio}
          className="object-cover"
        />
      </div>
    );
  }

  if (natural) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-foreground/10 bg-secondary/60",
          className,
        )}
      >
        {/* `width`/`height` = 0 là cách khai báo của Next cho ảnh chưa biết
            kích thước thật (ảnh `blob:` lúc chờ upload): CSS bên dưới quyết
            định bề rộng, chiều cao tự suy theo tỉ lệ gốc. */}
        <Image
          src={src}
          alt={label ?? ""}
          width={0}
          height={0}
          unoptimized
          sizes={sizes}
          onLoad={reportRatio}
          className="h-auto max-h-[inherit] w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-xl border border-foreground/10 bg-secondary/60",
        className,
      )}
    >
      <Image
        src={src}
        alt={label ?? ""}
        fill
        unoptimized
        sizes="200px"
        className="object-cover"
      />
    </div>
  );
}
