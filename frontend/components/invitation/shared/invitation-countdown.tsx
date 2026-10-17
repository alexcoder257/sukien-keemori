"use client";

import { CalendarPlus } from "lucide-react";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { InvitationContent } from "@/lib/schemas/invitation";
import { invitationDisplayName } from "./invitation-display-name";
import { InvitationCalendar } from "./invitation-calendar";

type Props = {
  content: InvitationContent;
  dict: Dictionary["invitation"]["sections"]["countdown"];
  locale: Locale;
  /** Template may group the existing calendar links into a disclosure. */
  renderCalendarActions?: (links: ReactNode) => ReactNode;
};

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function remainingUntil(target: number, now: number): Remaining | null {
  const diff = target - now;
  if (diff <= 0) return null;
  const seconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(seconds / 86_400),
    hours: Math.floor((seconds % 86_400) / 3_600),
    minutes: Math.floor((seconds % 3_600) / 60),
    seconds: seconds % 60,
  };
}

/** Định dạng UTC `YYYYMMDDTHHMMSSZ` dùng cho cả Google Calendar và file .ics. */
function toCalendarStamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

/**
 * Chỉ vẽ phần ruột — tiêu đề và khung section do template bọc ngoài quyết định.
 */
export function InvitationCountdown({ content, dict, locale, renderCalendarActions }: Props) {
  const target = new Date(content.countdown.weddingDate).getTime();
  const now = useNow();
  // `now === 0`: chưa đo được thời gian trên client (server render / lần paint
  // đầu) — hiển thị 00 thay vì kết luận lễ cưới đã diễn ra.
  const measured = now > 0;
  const remaining = measured ? remainingUntil(target, now) : null;

  if (Number.isNaN(target)) return null;

  const couple = invitationDisplayName(content);
  const start = new Date(target);
  const end = new Date(target + 3 * 60 * 60 * 1000);
  const location = content.reception.venueAddress;

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    couple,
  )}&dates=${toCalendarStamp(start)}/${toCalendarStamp(end)}&location=${encodeURIComponent(
    location,
  )}`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${couple}`,
    `DTSTART:${toCalendarStamp(start)}`,
    `DTEND:${toCalendarStamp(end)}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const icsUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;

  const calendarLinks = (
    <div className="flex flex-wrap justify-center gap-3">
      {content.countdown.googleCalendar ? (
        <a href={googleUrl} target="_blank" rel="noreferrer noopener"
          className={buttonVariants({ variant: "outline", size: "sm", className: "gap-2" })}>
          <CalendarPlus aria-hidden />{dict.google}
        </a>
      ) : null}
      {content.countdown.appleCalendar ? (
        <a href={icsUrl} download={`${couple || "wedding"}.ics`}
          className={buttonVariants({ variant: "outline", size: "sm", className: "gap-2" })}>
          <CalendarPlus aria-hidden />{dict.apple}
        </a>
      ) : null}
    </div>
  );

  const units = remaining
    ? [
        { label: dict.days, value: remaining.days },
        { label: dict.hours, value: remaining.hours },
        { label: dict.minutes, value: remaining.minutes },
        { label: dict.seconds, value: remaining.seconds },
      ]
    : [
        { label: dict.days, value: 0 },
        { label: dict.hours, value: 0 },
        { label: dict.minutes, value: 0 },
        { label: dict.seconds, value: 0 },
      ];

  return (
    <div className="space-y-8">
      {remaining || !measured ? (
        <dl className="grid grid-cols-4 gap-3">
          {units.map((unit) => (
            <div
              key={unit.label}
              className="space-y-1 rounded-xl bg-card py-4 text-center ring-1 ring-foreground/10"
            >
              <dd className="font-heading text-h4 font-medium tabular-nums">
                {String(unit.value).padStart(2, "0")}
              </dd>
              <dt className="text-caption text-muted-foreground">
                {unit.label}
              </dt>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-center text-body text-muted-foreground">
          {dict.passed}
        </p>
      )}

      {/* Lịch tháng chứa ngày cưới: đồng hồ đếm ngược cho biết còn bao lâu,
          lịch nhắc lại đúng ngày nào trong tháng. */}
      <div className="flex justify-center">
        <InvitationCalendar
          date={start}
          locale={locale}
          dict={dict.calendar}
        />
      </div>

      {content.countdown.googleCalendar || content.countdown.appleCalendar ? (
        renderCalendarActions ? renderCalendarActions(calendarLinks) : calendarLinks
      ) : null}
    </div>
  );
}
