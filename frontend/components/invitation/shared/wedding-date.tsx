"use client";

import { CalendarPlus } from "lucide-react";
import { InvitationCalendar } from "@/components/invitation/shared/invitation-calendar";
import { invitationDisplayName } from "@/components/invitation/shared/invitation-display-name";
import type { InvitationTemplateProps } from "@/components/invitation/shared/invitation-template";
import { useNow } from "@/hooks/use-now";

type Props = Pick<InvitationTemplateProps, "content" | "dict" | "locale"> & {
  monthOnly?: boolean;
  weekStartsOn?: 0 | 1;
  classes: {
    countdown?: string;
    caption?: string;
    calendar?: string;
    calendarActions?: string;
  };
};

/** Dates entered in the editor describe a wedding in Vietnam, regardless of a guest's timezone. */
export function weddingInstant(value: string): Date | null {
  if (!value) return null;
  const explicitZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const iso = explicitZone
    ? value
    : `${value}${value.includes("T") ? "" : "T00:00:00"}+07:00`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function WeddingCountdown({ content, dict, classes }: Props) {
  const now = useNow();
  const target = weddingInstant(content.countdown.weddingDate);
  if (!target) return null;
  const seconds = now
    ? Math.max(0, Math.floor((target.getTime() - now) / 1000))
    : 0;
  const values = [
    Math.floor(seconds / 86400),
    Math.floor(seconds / 3600) % 24,
    Math.floor(seconds / 60) % 60,
    seconds % 60,
  ];
  const copy = dict.sections.countdown;
  return (
    <div>
      <dl className={classes.countdown} aria-label={copy.title}>
        {[copy.days, copy.hours, copy.minutes, copy.seconds].map(
          (label, index) => (
            <div key={label}>
              <dd>{String(values[index]).padStart(2, "0")}</dd>
              <dt>{label}</dt>
            </div>
          ),
        )}
      </dl>
      {now > target.getTime() ? (
        <p className={classes.caption}>{copy.passed}</p>
      ) : null}
    </div>
  );
}

function escapeCalendarText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function WeddingCalendar({
  content,
  dict,
  locale,
  classes,
  monthOnly,
  weekStartsOn,
}: Props) {
  const date = weddingInstant(content.countdown.weddingDate);
  if (!date) return null;
  const copy = dict.sections.countdown;
  // Construct a local noon from Vietnam's civil date so calendar cells never shift a day.
  const civil = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) =>
    Number(civil.find((item) => item.type === type)?.value);
  const calendarDate = new Date(
    part("year"),
    part("month") - 1,
    part("day"),
    12,
  );
  const stamp = (value: Date) =>
    value
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const start = stamp(date);
  const end = stamp(new Date(date.getTime() + 3 * 60 * 60 * 1000));
  const couple = invitationDisplayName(content);
  const location = content.reception.venueAddress;
  const google = `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: "TEMPLATE", text: couple, dates: `${start}/${end}`, location })}`;
  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Keemori//Wedding//VI",
    "BEGIN:VEVENT",
    `UID:${start}-${encodeURIComponent(couple)}@keemori`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeCalendarText(couple)}`,
    `LOCATION:${escapeCalendarText(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  return (
    <div className={classes.calendar}>
      <InvitationCalendar
        date={calendarDate}
        locale={locale}
        dict={copy.calendar}
        monthOnly={monthOnly}
        weekStartsOn={weekStartsOn}
      />
      <div className={classes.calendarActions}>
        {content.countdown.googleCalendar ? (
          <a href={google} target="_blank" rel="noopener noreferrer">
            <CalendarPlus aria-hidden />
            {copy.google}
          </a>
        ) : null}
        {content.countdown.appleCalendar ? (
          <a
            href={`data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`}
            download="wedding.ics"
          >
            <CalendarPlus aria-hidden />
            {copy.apple}
          </a>
        ) : null}
      </div>
    </div>
  );
}
