"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { resolveMapLink } from "@/apis";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/i18n/dictionaries";
import { editorFieldSurface } from "./editor-field";
import { MapLinkGuide } from "./map-link-guide";
import type { PlaceRef } from "./place-field";

type Props = {
  label: string;
  placeholder?: string;
  error?: string;
  className?: string;
  value: string;
  onChange: (value: string) => void;
  /** Toạ độ bóc được từ link — `null` khi link trống hoặc không đọc được. */
  onPlaceChange: (place: PlaceRef) => void;
  /** Địa chỉ đầy đủ dựng từ link — đổ thẳng vào ô địa chỉ để khỏi gõ tay. */
  onPlaceName: (address: string) => void;
  dict: Dictionary["editor"]["places"];
};

// Đợi người dùng dán xong hẳn rồi mới gọi; dán là một thao tác một nhịp nên
// không cần chờ lâu như gõ tay.
const DEBOUNCE_MS = 600;

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "pin"; name: string }
  | { kind: "viewport" }
  | { kind: "failed" };

/**
 * Ô "Bản đồ Google Maps": người dùng dán link chia sẻ, backend bóc ra toạ độ.
 *
 * Đây là nguồn vị trí **chính xác nhất** mà không tốn một đồng nào — người dùng
 * vốn đã dán link cho ta rồi, trước đây ta chỉ dùng nó làm nút "Mở bản đồ" còn
 * bản đồ nhúng thì vẫn đoán theo chuỗi chữ địa chỉ. Nay link quyết định điểm
 * ghim, còn chuỗi chữ chỉ để hiển thị.
 *
 * Mọi nhánh hỏng đều im lặng theo nghĩa không chặn: link giữ nguyên, mất toạ độ,
 * bản đồ quay về tra theo địa chỉ như cũ.
 */
export function EditorMapLinkField({
  label,
  placeholder,
  error,
  className,
  value,
  onChange,
  onPlaceChange,
  onPlaceName,
  dict,
}: Props) {
  const id = useId();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // Link đã bóc rồi thì đừng gọi lại khi component render lại vì lý do khác.
  const resolvedFor = useRef<string | null>(null);

  useEffect(() => {
    const url = value.trim();
    // Ô trống thì không có gì để đọc, và cũng không đặt lại state ở đây: phần
    // render tự ẩn dòng trạng thái khi ô trống.
    if (!url || resolvedFor.current === url) return;

    const timer = window.setTimeout(() => {
      resolvedFor.current = url;
      setStatus({ kind: "loading" });
      resolveMapLink(url)
        .then((result) => {
          onPlaceChange({
            // Link Maps không mang `placeId` của Places API — để trống là hợp
            // lệ, vì thứ ta cần ở đây chỉ là toạ độ.
            placeId: "",
            latitude: result.latitude,
            longitude: result.longitude,
          });
          const address = result.address || result.name;
          if (address) onPlaceName(address);
          setStatus(
            result.precision === "pin"
              ? { kind: "pin", name: result.name }
              : { kind: "viewport" },
          );
        })
        .catch(() => {
          onPlaceChange(null);
          setStatus({ kind: "failed" });
        });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
    // `onPlaceChange`/`onPlaceName` đổi tham chiếu mỗi lần render của form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-2">
        {label}
      </Label>
      <Input
        id={id}
        type="url"
        inputMode="url"
        autoComplete="off"
        className={editorFieldSurface}
        placeholder={placeholder}
        aria-invalid={!!error}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p className="mt-2 text-caption text-destructive">{error}</p>
      ) : value.trim() ? (
        <MapLinkStatus status={status} dict={dict} />
      ) : null}

      <MapLinkGuide dict={dict} />
    </div>
  );
}

function MapLinkStatus({
  status,
  dict,
}: {
  status: Status;
  dict: Dictionary["editor"]["places"];
}) {
  if (status.kind === "idle") return null;

  if (status.kind === "loading") {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-caption text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        {dict.linkReading}
      </p>
    );
  }

  if (status.kind === "pin") {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-caption text-success">
        <CheckCircle2 className="size-3.5" aria-hidden />
        {status.name ? `${dict.linkPinned}: ${status.name}` : dict.linkPinned}
      </p>
    );
  }

  // Hai nhánh còn lại đều là "vẫn dùng được nhưng kém chính xác hơn", nên dùng
  // giọng nhắc chứ không phải giọng lỗi — người dùng không làm gì sai cả.
  return (
    <p className="mt-2 flex items-center gap-1.5 text-caption text-muted-foreground">
      <TriangleAlert className="size-3.5" aria-hidden />
      {status.kind === "viewport" ? dict.linkApproximate : dict.linkFailed}
    </p>
  );
}
