import { Check } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { GuideChecklistGroup } from "@/lib/data/guide";

type Props = {
  groups: GuideChecklistGroup[];
  dict: Dictionary["guide"]["checklist"];
};

/**
 * Danh sách cần chuẩn bị trước khi mở trình soạn thảo. `items` của mỗi nhóm là
 * text dịch được; số mục do dữ liệu quy định nên hai ngôn ngữ luôn cùng độ dài
 * — nếu lệch, phần thừa bị cắt ở đây chứ không render rỗng.
 */
export function GuideChecklist({ groups, dict }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {groups.map((group) => {
        const text = dict.groups[group.key];

        return (
          <section
            key={group.key}
            className="rounded-2xl bg-card p-8 ring-1 ring-foreground/10"
          >
            <h3 className="font-heading text-body-lg font-medium">
              {text.title}
            </h3>
            <ul className="mt-5 space-y-3">
              {text.items.slice(0, group.items).map((item) => (
                <li key={item} className="flex gap-3 text-small">
                  <Check
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-primary"
                  />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
