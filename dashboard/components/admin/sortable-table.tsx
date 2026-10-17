"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

const HANDLE_ATTR = "data-drag-handle";

function startsOnHandle(target: EventTarget | null): boolean {
  return (
    target instanceof Element && target.closest(`[${HANDLE_ATTR}]`) !== null
  );
}

/*
 * Listener của dnd-kit gắn lên cả `<tr>`, nhưng hai sensor dưới đây chỉ nhận
 * sự kiện **bắt đầu từ tay nắm**: hàng còn chứa nút Sửa/Xoá, kéo được từ bất
 * kỳ đâu thì mỗi cú bấm hơi rung tay là thành một lần đổi thứ tự. Lọc ở sensor
 * thay vì truyền `setActivatorNodeRef` xuống ô qua context — đường đó bị lint
 * của React Compiler coi là đọc ref lúc render.
 */
class HandlePointerSensor extends PointerSensor {
  static activators = PointerSensor.activators.map((activator) => ({
    ...activator,
    handler: (...args: Parameters<typeof activator.handler>) =>
      startsOnHandle(args[0].nativeEvent.target) && activator.handler(...args),
  }));
}

class HandleKeyboardSensor extends KeyboardSensor {
  static activators = KeyboardSensor.activators.map((activator) => ({
    ...activator,
    handler: (...args: Parameters<typeof activator.handler>) =>
      startsOnHandle(args[0].nativeEvent.target) && activator.handler(...args),
  }));
}

/** Chỉ cho kéo theo trục dọc: bảng không có gì để thả sang ngang. */
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

type SortableTableProps = {
  ids: string[];
  /** Thứ tự mới của **cả danh sách** sau khi thả; không gọi nếu thả về chỗ cũ. */
  onReorder: (ids: string[]) => void;
  /**
   * `list` (mặc định): một cột, chỉ kéo theo trục dọc. `grid`: lưới thẻ nhiều
   * cột, kéo tự do theo cả hai trục.
   */
  layout?: "list" | "grid";
  children: ReactNode;
};

/**
 * Bọc quanh `AdminTable` có `components={{ body: { row: SortableRow } }}`,
 * mỗi hàng đặt một `DragHandle` trong ô của nó. Bàn phím cũng kéo được: Tab
 * tới tay nắm, Space, mũi tên lên/xuống, Space để thả.
 */
export function SortableTable({
  ids,
  onReorder,
  layout = "list",
  children,
}: SortableTableProps) {
  const sensors = useSensors(
    // Phải rê quá 4px mới tính là kéo, để một cú bấm thường vào tay nắm
    // không bị hiểu thành kéo về đúng chỗ cũ.
    useSensor(HandlePointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(HandleKeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={layout === "list" ? [verticalOnly] : undefined}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={ids}
        strategy={
          layout === "list" ? verticalListSortingStrategy : rectSortingStrategy
        }
      >
        {children}
      </SortableContext>
    </DndContext>
  );
}

type RowProps = HTMLAttributes<HTMLTableRowElement> & {
  "data-row-key"?: string;
};

/**
 * Hàng `<tr>` của antd, kéo được. antd gắn `rowKey` vào `data-row-key`, nên đó
 * là id dùng cho dnd-kit — `rowKey` của bảng phải trùng với `ids` của
 * `SortableTable`.
 *
 * Cố ý không rải `attributes` của dnd-kit lên `<tr>`: chúng biến cả hàng thành
 * một nút có `tabIndex`, trong khi chỗ cần focus là tay nắm.
 */
export function SortableRow(props: RowProps) {
  const id = props["data-row-key"] ?? "";
  const { listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !id });

  const style: CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    // Hàng đang kéo nổi lên trên các hàng nó đi ngang qua.
    ...(isDragging ? { position: "relative", zIndex: 10, opacity: 0.9 } : {}),
  };

  return <tr {...props} {...listeners} ref={setNodeRef} style={style} />;
}

/** Tay nắm đặt trong một ô của `SortableRow`; `label` là `aria-label`. */
export function DragHandle({ label }: { label: string }) {
  return (
    <button
      type="button"
      {...{ [HANDLE_ATTR]: "" }}
      aria-label={label}
      aria-roledescription="sortable"
      title={label}
      className="inline-flex size-8 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary active:cursor-grabbing"
    >
      <GripVertical className="size-4" />
    </button>
  );
}

/**
 * Bản `<li>` của `SortableRow`, cho danh sách không phải bảng antd. Đặt trong
 * `SortableTable`, `id` trùng một phần tử của `ids`, và một `DragHandle` ở bên
 * trong — vẫn chỉ kéo được từ tay nắm.
 */
export function SortableListItem({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const { listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: "relative", zIndex: 10, opacity: 0.9 } : {}),
  };

  return (
    <li {...listeners} ref={setNodeRef} style={style} className={className}>
      {children}
    </li>
  );
}
