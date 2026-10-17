"use client"

import * as React from "react"
import { Empty, Grid, Pagination, Skeleton, Table } from "antd"
import type { ColumnType, ColumnsType, TableProps } from "antd/es/table"

import { fill } from "@/lib/format"
import { cn } from "@/lib/utils"

type AdminTableProps<T> = {
  columns: ColumnsType<T>
  dataSource: T[]
  rowKey: string | ((record: T) => string)
  loading?: boolean
  emptyText?: React.ReactNode
  className?: string
  /** Tắt hàng tiêu đề cho các bảng key-value không có `<thead>` gốc. */
  showHeader?: boolean
  /**
   * Hai chế độ phân trang, chọn theo chỗ dữ liệu được cắt.
   *
   * **Phía server** (`page`/`total`/`onChange`): backend có `limit`/`offset`,
   * mỗi lần lật trang là một request. `page` giữ quy ước 0-index như các hook
   * fetch dữ liệu đang dùng (`useState(0)`) — quy đổi sang 1-index của antd
   * ngay bên trong, chỗ gọi không cần đổi quy ước.
   *
   * **Phía client** (chỉ `pageSize`): route trả cả danh sách trong một lượt và
   * không có tham số phân trang. Cắt tại chỗ chứ không thêm `limit`/`offset`
   * vào backend, vì những danh sách này (FAQ, mẫu thiệp, lời chứng thực) đều
   * có **thứ tự do người vận hành sắp**, và sắp thứ tự thì phải nhìn thấy cả
   * danh sách mới làm được — phân trang ở đây là để đọc cho dễ, không phải để
   * đỡ tải.
   */
  pagination?:
    | {
        page: number
        pageSize: number
        total: number
        onChange: (page: number) => void
      }
    | { pageSize: number }
    | false
  /**
   * Câu hiện số lượng, dạng mẫu có `{count}` (ví dụ "Tổng {count} mục").
   *
   * Đây là chỗ **thống kê số lượng** của mỗi bảng: một danh sách đã phân trang
   * mà không nói tổng thì người vận hành không biết mình đang xem 20 trên bao
   * nhiêu.
   */
  totalLabel?: string
  /** Thay phần tử dựng bảng của antd — ví dụ hàng kéo thả được (`SortableRow`). */
  components?: TableProps<T>["components"]
}

/**
 * Bọc mỏng `antd.Table` — không tự fetch dữ liệu, React Query hook ở call
 * site vẫn là nguồn dữ liệu và phân trang duy nhất.
 *
 * **Dưới `md` (768px) bảng thành danh sách thẻ** (`AdminCardList`): một bảng
 * năm bảy cột trên màn 390px hoặc bị cắt cụt, hoặc bắt người vận hành cuộn
 * ngang để tìm nút Sửa. Thẻ dựng lại từ chính `columns` — cùng `title`, cùng
 * `render` — nên không bảng nào phải khai thêm gì. Hai trường hợp giữ bảng
 * (cuộn ngang): bảng có `components` riêng (hàng kéo thả — thẻ không mang
 * được tay nắm của `SortableRow`) và bảng key-value `showHeader={false}`.
 */
function AdminTable<T extends object>(props: AdminTableProps<T>) {
  const screens = Grid.useBreakpoint()
  // `useBreakpoint` trả `{}` ở lượt render đầu (server chưa biết bề rộng
  // màn): coi như desktop cho tới khi trình duyệt trả lời, tránh lệch hydrate.
  const isMobile = screens.md === false
  const cardMode =
    isMobile && !props.components && props.showHeader !== false

  return cardMode ? (
    <AdminCardList {...props} />
  ) : (
    <AdminAntTable {...props} />
  )
}

function AdminAntTable<T extends object>({
  columns,
  dataSource,
  rowKey,
  loading,
  emptyText,
  className,
  pagination,
  totalLabel,
  showHeader,
  components,
}: AdminTableProps<T>) {
  const showTotal = totalLabel
    ? (total: number) => fill(totalLabel, { count: total })
    : undefined

  return (
    <Table<T>
      columns={columns}
      dataSource={dataSource}
      rowKey={rowKey}
      loading={loading}
      showHeader={showHeader}
      components={components}
      locale={emptyText ? { emptyText } : undefined}
      className={className}
      // Bảng rộng hơn khung thì cuộn ngang bên trong khung, không đẩy cả
      // trang tràn ra ngoài màn hình.
      scroll={{ x: "max-content" }}
      pagination={
        !pagination
          ? false
          : "page" in pagination
            ? {
                current: pagination.page + 1,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => pagination.onChange(page - 1),
                showSizeChanger: false,
                showTotal,
              }
            : {
                // Chế độ client: antd tự giữ trang hiện tại và tự tính tổng từ
                // `dataSource`, nên không có `current`/`total` ở đây.
                pageSize: pagination.pageSize,
                showSizeChanger: false,
                hideOnSinglePage: false,
                showTotal,
              }
      }
    />
  )
}

/* ---------------------------------------------------------------- mobile */

type Column<T> = ColumnType<T> & { dataIndex?: unknown }

function isActionsColumn<T>(column: Column<T>): boolean {
  return column.key === "actions" || column.dataIndex === "actions"
}

function cellValue<T>(column: Column<T>, record: T, index: number) {
  const path = column.dataIndex
  const keys = Array.isArray(path) ? path : path == null ? [] : [path]
  const value = keys.reduce<unknown>(
    (current, key) =>
      current == null
        ? current
        : (current as Record<string, unknown>)[String(key)],
    record,
  )
  if (column.render) {
    const rendered = column.render(value, record, index)
    // `render` có thể trả `{ children, props }` (cú pháp gộp ô cũ của antd).
    if (rendered && typeof rendered === "object" && "children" in rendered) {
      return (rendered as { children: React.ReactNode }).children
    }
    return rendered as React.ReactNode
  }
  return value == null ? null : (value as React.ReactNode)
}

function columnTitle<T>(column: Column<T>): React.ReactNode {
  return typeof column.title === "function"
    ? column.title({})
    : column.title
}

function AdminCardList<T extends object>({
  columns,
  dataSource,
  rowKey,
  loading,
  emptyText,
  className,
  pagination,
  totalLabel,
}: AdminTableProps<T>) {
  // Phân trang phía client: bảng antd tự giữ trang, thẻ thì phải tự cắt.
  const [clientPage, setClientPage] = React.useState(1)

  const visible = (columns as Column<T>[]).filter((column) => !column.hidden)
  const [head, ...rest] = visible.filter((column) => !isActionsColumn(column))
  const actions = visible.find(isActionsColumn)

  const isServer = pagination && "page" in pagination
  const pageSize = pagination ? pagination.pageSize : dataSource.length
  const total = isServer ? pagination.total : dataSource.length
  // Danh sách co lại (vừa xoá mục cuối của trang cuối) thì lùi về trang cuối
  // còn dữ liệu thay vì hiện một trang rỗng.
  const lastPage = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
  const page = Math.min(clientPage, lastPage)
  const current = isServer ? pagination.page + 1 : page
  const items =
    pagination && !isServer
      ? dataSource.slice((page - 1) * pageSize, page * pageSize)
      : dataSource
  const offset = pagination && !isServer ? (page - 1) * pageSize : 0

  const keyOf = (record: T) =>
    typeof rowKey === "function"
      ? rowKey(record)
      : String((record as Record<string, unknown>)[rowKey])

  if (loading && dataSource.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <Skeleton active title paragraph={{ rows: 2 }} />
          </div>
        ))}
      </div>
    )
  }

  if (dataSource.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card px-4 py-8 shadow-card",
          className,
        )}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={emptyText}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "space-y-3 transition-opacity",
        loading && "pointer-events-none opacity-60",
        className,
      )}
      aria-busy={loading || undefined}
    >
      {totalLabel && pagination ? (
        <p className="px-1 text-caption text-muted-foreground">
          {fill(totalLabel, { count: total })}
        </p>
      ) : null}

      <ul className="space-y-3">
        {items.map((record, i) => {
          const index = offset + i
          return (
            <li
              key={keyOf(record)}
              className="rounded-xl border border-border bg-card p-4 shadow-card"
            >
              {head ? (
                <div className="min-w-0 text-small break-words">
                  {cellValue(head, record, index)}
                </div>
              ) : null}

              {rest.length > 0 ? (
                <dl className="mt-3 grid grid-cols-[minmax(5.5rem,34%)_1fr] gap-x-3 gap-y-2.5 border-t border-border pt-3 text-small">
                  {rest.map((column, columnIndex) => (
                    <React.Fragment key={String(column.key ?? columnIndex)}>
                      <dt className="text-caption leading-5 text-muted-foreground">
                        {columnTitle(column)}
                      </dt>
                      <dd className="min-w-0 break-words">
                        {cellValue(column, record, index)}
                      </dd>
                    </React.Fragment>
                  ))}
                </dl>
              ) : null}

              {actions ? (
                <div className="mt-3 flex justify-end border-t border-border pt-3">
                  {cellValue(actions, record, index)}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      {pagination && total > pageSize ? (
        <div className="flex justify-center pt-1">
          <Pagination
            simple
            current={current}
            pageSize={pageSize}
            total={total}
            showSizeChanger={false}
            onChange={(page) => {
              if (isServer) pagination.onChange(page - 1)
              else setClientPage(page)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

export { AdminTable }
