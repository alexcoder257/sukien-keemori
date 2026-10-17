import type { Dictionary } from "@/i18n/dictionaries";
import type { GuideTip } from "@/lib/data/guide";

type Props = { tips: GuideTip[]; dict: Dictionary["guide"]["tips"] };

/** Bốn mẹo ngắn, đặt trên nền tối để tách hẳn khỏi phần hướng dẫn phía trên. */
export function GuideTips({ tips, dict }: Props) {
  return (
    <section className="theme-forest bg-background text-foreground">
      <div className="container-page py-16 lg:py-20">
        <h2 className="font-heading text-h4 font-medium">{dict.title}</h2>

        <ul className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
          {tips.map((tip) => {
            const text = dict.items[tip.key];

            return (
              <li key={tip.key} className="border-t border-border pt-5">
                <h3 className="font-heading text-body-lg font-medium">
                  {text.title}
                </h3>
                <p className="mt-3 text-small text-muted-foreground">
                  {text.body}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
