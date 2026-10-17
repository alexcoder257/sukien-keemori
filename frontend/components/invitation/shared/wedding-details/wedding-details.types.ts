import type {
  DetailsPalette,
  DetailsVariant,
} from "@/components/invitation/shared/details-presets";
import type { DetailsTypography } from "@/components/invitation/shared/details-typography";

/**
 * Nội dung khối, đã **dựng sẵn thành chuỗi**. Component không nhận `content` thô
 * lẫn `dict`: ngày âm, thứ trong tuần và câu chữ đều được `weddingDetailsData`
 * lo trước, đúng cách `WeddingOpeningData` làm.
 *
 * Nhờ vậy khối này vẽ được cả những thứ không đến từ editor — thumbnail kho mẫu,
 * ảnh preview, trang demo — mà không phải dựng một `InvitationContent` giả.
 */
export type WeddingDetailsData = {
  /** Măng sét; chỉ `formal` vẽ. Bỏ trống thì không có dòng nào. */
  title?: string;
  families: DetailsFamilySide[];
  coupleNames: [string, string];
  /** Thứ bậc con ("Trưởng nam"/"Út nữ"); chỉ `formal` vẽ. */
  childOrders?: [string, string];
  /** Câu mời hoặc câu báo tin, tuỳ bố cục. */
  invitation: string;
  /** Giờ và thứ tách rời — khoảng cách giữa hai vế do bố cục quyết định. */
  time?: string;
  weekday?: string;
  /** Bỏ trống thì cả dải ngày không vẽ. */
  date?: { day: string; month: string; year: string };
  lunar?: string;
  venue?: { label: string; name: string; address?: string };
  action?: { label: string; href: string };
};

export type DetailsFamilySide = {
  key: "groom" | "bride";
  label: string;
  /** Đã gồm tiền tố "Ông"/"Bà"; mỗi dòng là một khối không ngắt. */
  parents: string[];
  address?: string;
};

/** Tailwind đè lên từng phần nhìn thấy được; autocomplete liệt kê các slot. */
export type DetailsClassNames = Partial<
  Record<
    | "root"
    | "title"
    | "families"
    | "side"
    | "invitation"
    | "names"
    // Optional formal-layout wrapper around venue, time, date and action.
    | "schedule"
    | "time"
    | "date"
    | "venue"
    | "action",
    string
  >
>;

export type DetailsDesignProps = {
  variant: DetailsVariant;
  data: WeddingDetailsData;
  colors?: Partial<DetailsPalette>;
  typography?: DetailsTypography;
  classNames?: DetailsClassNames;
};

export type WeddingDetailsProps = DetailsDesignProps & {
  className?: string;
};

/** Hợp đồng nội bộ mà ba bố cục cùng thực hiện. */
export type DetailsLayoutProps = DetailsDesignProps;
