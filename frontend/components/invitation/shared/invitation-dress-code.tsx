import type { ReactNode } from "react";

import { fill } from "@/lib/format";
import { cn } from "@/lib/utils";

import styles from "./invitation-dress-code.module.css";

type DressCodeClassNames = {
  title?: string;
  description?: string;
  swatches?: string;
  swatch?: string;
};

type Props = {
  title?: string;
  fallbackTitle: string;
  description?: string;
  colors: readonly string[];
  colorLabel: string;
  className?: string;
  classNames?: DressCodeClassNames;
  after?: ReactNode;
};

function displayDressCodeTitle(title: string | undefined, fallbackTitle: string) {
  const customTitle = title?.trim();
  return customTitle?.localeCompare(fallbackTitle, undefined, {
    sensitivity: "accent",
  }) === 0
    ? fallbackTitle
    : customTitle || fallbackTitle;
}

export function InvitationDressCodeTitle({
  title,
  fallbackTitle,
  className,
}: {
  title?: string;
  fallbackTitle: string;
  className?: string;
}) {
  return (
    <h2
      data-dress-code-title
      className={cn(styles.title, className)}
      style={{
        fontFamily: "var(--template-font-accent)",
        textTransform: "none",
      }}
    >
      {displayDressCodeTitle(title, fallbackTitle)}
    </h2>
  );
}

/**
 * Nội dung và accessibility dùng chung của block Dress code. Mỗi template chỉ
 * truyền class cho bố cục/màu; tiêu đề luôn kế thừa font accent của chính mẫu.
 */
export function InvitationDressCode({
  title,
  fallbackTitle,
  description,
  colors,
  colorLabel,
  className,
  classNames,
  after,
}: Props) {
  const visibleColors = colors.filter(Boolean);
  const displayTitle = displayDressCodeTitle(title, fallbackTitle);

  return (
    <div data-dress-code-root className={cn(styles.root, className)}>
      <InvitationDressCodeTitle
        title={title}
        fallbackTitle={fallbackTitle}
        className={classNames?.title}
      />
      {description ? (
        <p
          data-dress-code-description
          className={cn(styles.description, classNames?.description)}
        >
          {description}
        </p>
      ) : null}
      {visibleColors.length > 0 ? (
        <ul
          data-dress-code-swatches
          className={cn(styles.swatches, classNames?.swatches)}
          aria-label={displayTitle}
        >
          {visibleColors.map((color, index) => (
            <li key={`${color}-${index}`}>
              <span
                data-dress-code-swatch
                className={cn(styles.swatch, classNames?.swatch)}
                role="img"
                aria-label={fill(colorLabel, { color })}
                style={{ backgroundColor: color }}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {after}
    </div>
  );
}
