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
 * font-4 — nhãn hai nhà cỡ lớn không giãn chữ, dải ngày kẻ khung trên dưới.
 *
 * Cùng thứ tự đọc với `classic`; khác biệt nằm ở sức nặng của nhãn và ở dải
 * ngày, không ở cấu trúc.
 */
export function ModernDetails({ data, classNames }: DetailsLayoutProps) {
  return (
    <>
      <DetailsFamilies
        sides={data.families}
        variant="modern"
        className={classNames?.families}
      />
      <DetailsInvitation
        className={`tracking-[0.04em] ${classNames?.invitation ?? ""}`}
      >
        {data.invitation}
      </DetailsInvitation>
      <DetailsNames
        names={data.coupleNames}
        gap="gap-[var(--details-space-xs)]"
        className={classNames?.names}
      />
      <DetailsTime time={data.time} weekday={data.weekday} className={classNames?.time} />
      {data.date ? (
        <DetailsDate date={data.date} variant="modern" className={classNames?.date} />
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
