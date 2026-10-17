"use client"

import { Select as AntSelect } from "antd"

type SelectOption<T extends string | number> = {
  value: T
  label: React.ReactNode
}

type SelectProps<T extends string | number> = {
  /** `undefined` = chưa chọn, antd hiện `placeholder`. */
  value: T | undefined
  onChange: (value: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  /** Chữ hiện trong dropdown khi `options` rỗng. */
  notFoundContent?: React.ReactNode
  /** Gõ để lọc theo nhãn, không phân biệt hoa thường lẫn dấu tiếng Việt. */
  searchable?: boolean
  disabled?: boolean
  "aria-label"?: string
  className?: string
}

/**
 * Thay cho `<select>` thô — antd tự vẽ dropdown, không phụ thuộc mũi tên
 * native của hệ điều hành nên không còn kẹt chữ như bản HTML thuần trước đây.
 * Không chỉnh chiều cao hay bo góc: để đúng cỡ mặc định của antd thì nó mới
 * thẳng hàng với `Input`, `Button` đứng cạnh trong cùng một thanh lọc.
 */
function Select<T extends string | number>({
  value,
  onChange,
  options,
  placeholder,
  notFoundContent,
  searchable,
  disabled,
  className,
  ...props
}: SelectProps<T>) {
  return (
    <AntSelect<T>
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      notFoundContent={notFoundContent}
      showSearch={
        searchable
          ? {
              filterOption: (input, option) =>
                foldText(String(option?.label ?? "")).includes(foldText(input)),
            }
          : undefined
      }
      disabled={disabled}
      className={className ?? "min-w-32"}
      {...props}
    />
  )
}

/**
 * Bỏ dấu và hạ chữ thường để "dang" tìm ra "Đặng": người vận hành gõ tên cửa
 * hàng không dấu là chuyện thường. `đ` không tách được bằng NFD nên thay tay.
 */
function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
}

export { Select }
