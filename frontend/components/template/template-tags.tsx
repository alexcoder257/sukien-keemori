import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/i18n/dictionaries";
import type { TemplateTag } from "@/constants/invitation";
import { cn } from "@/lib/utils";
import styles from "./template-tags.module.css";

type Props = {
  tags: readonly TemplateTag[];
  dict: Dictionary["common"]["tag"];
  className?: string;
};

/**
 * Dải tag "Mới"/"Hot" đặt chồng lên ảnh mẫu thiệp.
 *
 * Tách khỏi `TemplateCard` vì trang chủ (`FeaturedTemplateCard`) và kho mẫu
 * dùng chung đúng một cách vẽ: hai màn cạnh nhau mà tag khác màu thì đọc ra là
 * hai loại nhãn khác nhau, trong khi chúng nói cùng một điều.
 */
export function TemplateTagBadges({ tags, dict, className }: Props) {
  if (tags.length === 0) return null;

  return (
    <div className={cn("absolute top-3 left-3 flex gap-2", className)}>
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="solid"
          size="xs"
          className={styles.marketingTag}
          data-template-tag={tag}
        >
          {dict[tag]}
        </Badge>
      ))}
    </div>
  );
}
