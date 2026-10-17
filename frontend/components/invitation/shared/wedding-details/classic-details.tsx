import { cn } from "@/lib/utils";
import { DetailsFamilies } from "./details-families";
import {
  DetailsInvitation,
  DetailsLunar,
  DetailsNames,
  DetailsTime,
  DetailsVenue,
} from "./details-text";
import { DetailsDate } from "./details-date";
import { DetailsAction } from "./details-action";
import type { DetailsLayoutProps } from "./wedding-details.types";

/**
 * font-1, font-2 — bốn dòng đối xứng quanh trục giữa.
 *
 * Thứ tự đọc: hai nhà → lời mời → tên → giờ → ngày → nơi tổ chức. Địa điểm chốt
 * ở cuối, ngược với `formal`.
 */
export function ClassicDetails({ data, classNames }: DetailsLayoutProps) {
  return (
    <>
      <DetailsFamilies
        sides={data.families}
        variant="classic"
        className={classNames?.families}
      />
      <DetailsInvitation className={classNames?.invitation}>
        {data.invitation}
      </DetailsInvitation>
      <DetailsNames names={data.coupleNames} className={classNames?.names} />
      <DetailsTime
        time={data.time}
        weekday={data.weekday}
        /* `classic` là bố cục duy nhất nối giờ và thứ bằng dấu phẩy, nên dấu
           phẩy nằm ở đây chứ không nằm trong chuỗi dữ liệu. */
        className={cn(
          "gap-x-[0.35em] [&>span:first-child]:after:content-[',']",
          classNames?.time,
        )}
      />
      {data.date ? (
        <DetailsDate date={data.date} variant="classic" className={classNames?.date} />
      ) : null}
      {data.lunar ? <DetailsLunar>{data.lunar}</DetailsLunar> : null}
      {data.venue ? (
        <DetailsVenue venue={data.venue} className={classNames?.venue} />
      ) : null}
      {data.action ? (
        <DetailsAction action={data.action} className={classNames?.action} />
      ) : null}
    </>
  );
}
