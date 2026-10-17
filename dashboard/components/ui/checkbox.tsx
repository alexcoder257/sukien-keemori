"use client"

import { Checkbox as AntCheckbox } from "antd"

function Checkbox({
  checked,
  onCheckedChange,
  ...props
}: Omit<React.ComponentProps<typeof AntCheckbox>, "onChange"> & {
  onCheckedChange?: (checked: boolean) => void
}) {
  return (
    <AntCheckbox
      data-slot="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      {...props}
    />
  )
}

export { Checkbox }
