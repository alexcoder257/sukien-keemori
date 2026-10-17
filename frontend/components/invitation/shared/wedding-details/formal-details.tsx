import { cn } from "@/lib/utils";
import { DetailsFamilies } from "./details-families";
import {
  DetailsInvitation,
  DetailsLunar,
  DetailsNames,
  DetailsTime,
  DetailsTitle,
  DetailsVenue,
} from "./details-text";
import { DetailsDate } from "./details-date";
import { DetailsAction } from "./details-action";
import type { DetailsLayoutProps } from "./wedding-details.types";

/**
 * font-3 — có măng sét, hai nhà ngăn bằng gạch dọc, tên kèm thứ bậc con.
 *
 * Bố cục duy nhất **đảo thứ tự khối**: nơi cử hành đứng ngay dưới câu báo tin,
 * trước giờ và ngày — ảnh gốc đọc là "lễ thành hôn được cử hành tại X, vào lúc
 * Y". Hai bố cục kia đọc ngược lại, giờ và ngày trước rồi mới tới địa điểm.
 *
 * Nhịp cũng thoáng hơn hẳn: `--details-space-lg` giữa các cụm, còn tên với thứ
 * bậc con thì sát nhau để đọc ra một cụm. Nhịp đều làm mọi khối nặng ngang nhau,
 * và đó chính là cảm giác "nhét chữ cho vừa".
 */
export function FormalDetails({ data, classNames }: DetailsLayoutProps) {
  const schedule = (
    <>
      {data.venue ? (
        <DetailsVenue venue={data.venue} merged className={classNames?.venue} />
      ) : null}
      <DetailsTime time={data.time} weekday={data.weekday} className={classNames?.time} />
      {data.date ? (
        <DetailsDate date={data.date} variant="formal" className={classNames?.date} />
      ) : null}
      {data.lunar ? (
        <DetailsLunar className="text-(length:--tpl-small) tracking-[0.04em] uppercase not-italic">
          {data.lunar}
        </DetailsLunar>
      ) : null}
      {data.action ? (
        <DetailsAction action={data.action} className={classNames?.action} />
      ) : null}
    </>
  );
  const hasSchedule = Boolean(
    data.venue || data.time || data.weekday || data.date || data.lunar || data.action,
  );

  return (
    <>
      {data.title ? (
        <DetailsTitle className={classNames?.title}>{data.title}</DetailsTitle>
      ) : null}
      <DetailsFamilies
        sides={data.families}
        variant="formal"
        className={classNames?.families}
      />
      <DetailsInvitation
        className={cn(
          "max-w-[22em] leading-[1.75] tracking-[0.1em]",
          classNames?.invitation,
        )}
      >
        {data.invitation}
      </DetailsInvitation>
      <DetailsNames
        names={data.coupleNames}
        childOrders={data.childOrders}
        gap="gap-[var(--details-space-lg)]"
        className={classNames?.names}
      />
      {hasSchedule && classNames?.schedule ? (
        <div data-details-part="schedule" className={classNames.schedule}>
          {schedule}
        </div>
      ) : schedule}
    </>
  );
}
