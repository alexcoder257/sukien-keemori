"use client"

import { useState } from "react"
import { Button as AntButton, Tooltip } from "antd"

/**
 * Sắc của nút thao tác theo **nghĩa** của việc nó làm, không theo ý thích:
 *
 * - `view` — xem, không đổi gì.
 * - `primary` — sửa / thao tác chính của dòng.
 * - `success` — cho phép, mở lại, duyệt.
 * - `warning` — tạm dừng, thu hồi: đổi trạng thái nhưng hoàn tác được.
 * - `danger` — xoá, từ chối: khó hoặc không hoàn tác.
 *
 * Mỗi sắc là một preset màu của antd, không phải hue tự chọn (`CLAUDE.md` mục 6).
 */
export type ActionTone = "view" | "primary" | "success" | "warning" | "danger"

const COLOR = {
  view: "geekblue",
  primary: "primary",
  success: "green",
  warning: "orange",
  danger: "danger",
} as const satisfies Record<ActionTone, string>

type Props = {
  /** Chữ của tooltip, đồng thời là `aria-label` — nút chỉ có icon. */
  label: string
  icon: React.ReactNode
  tone?: ActionTone
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
}

/**
 * Nút thao tác trong cột "Thao tác" của mọi bảng CMS: ô vuông chỉ có icon,
 * nền nhạt theo sắc (`filled`), đậm hẳn khi rê chuột (`solid`), tên thao tác
 * hiện ở tooltip.
 *
 * Một kiểu cho mọi bảng là để người vận hành đọc cột thao tác bằng màu và vị
 * trí chứ không phải đọc chữ từng nút. Đặt nhiều nút cạnh nhau trong
 * `ActionGroup` để chúng cách đều và thẳng hàng ở mọi dòng.
 */
export function ActionButton({
  label,
  icon,
  tone = "primary",
  onClick,
  disabled,
  loading,
}: Props) {
  const [hovered, setHovered] = useState(false)
  return (
    <Tooltip title={label}>
      <AntButton
        htmlType="button"
        aria-label={label}
        color={COLOR[tone]}
        // Đậm lên khi rê chuột: `filled` của antd chỉ nhích nền một chút, không
        // đủ để biết chắc mình đang trỏ vào nút nào giữa một hàng nút cùng cỡ.
        variant={hovered && !disabled ? "solid" : "filled"}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
        disabled={disabled}
        loading={loading}
        icon={icon}
        className="[&_svg]:size-4"
      />
    </Tooltip>
  )
}

/** Dãy nút thao tác của một dòng — căn phải, cách đều. */
export function ActionGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-1.5">{children}</div>
}
