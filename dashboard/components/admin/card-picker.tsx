"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs } from "antd";
import { Search, X } from "lucide-react";
import type { AdminCard } from "@/apis/cards";
import type { Template } from "@/apis/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAdminCardsQuery } from "@/hooks/use-cards";
import { useAllTemplatesQuery } from "@/hooks/use-catalog";
import { templatePosterSrc } from "@/lib/card-preview";
import type { ShowcaseKind } from "@/constants/showcase";

export type ShowcaseTarget = { kind: ShowcaseKind; slug: string };

export type CardPickerLabels = {
  choose: string;
  change: string;
  clear: string;
  search: string;
  empty: string;
  loading: string;
  title: string;
  cancel: string;
  draftHint: string;
  templateHint: string;
  unknown: string;
  failed: string;
  tabTemplate: string;
  tabCard: string;
};

type Props = {
  /** Đang chọn gì; `slug` rỗng là chưa chọn. */
  value: ShowcaseTarget;
  onChange: (next: ShowcaseTarget, card: AdminCard | null) => void;
  labels: CardPickerLabels;
};

/** Khung ảnh dùng chung cho mọi ô trong lưới và cho bản xem trước. */
function Poster({
  src,
  className,
}: {
  src: string | null;
  className: string;
}) {
  if (!src) {
    // Ô trống thay vì đoán một đường dẫn ảnh: ảnh vỡ trông như lỗi giao diện,
    // còn ô trống kèm slug nói đúng chuyện đang xảy ra.
    return <div className={`${className} border-dashed`} />;
  }
  /* Thẻ `img` thuần chứ không `next/image`: ảnh đi qua rewrite sang frontend
     (xem `next.config.ts`), và bộ tối ưu của Next không giúp gì cho một bản
     xem trước chỉ người vận hành nhìn thấy. */
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={src} alt="" loading="lazy" className={className} />;
}

/**
 * Chọn một thiệp bằng **ảnh**, không bằng slug.
 *
 * Người vận hành không nhớ `tuan-anh-nhu-binh` là tấm nào — chỉ có ảnh bìa mới
 * nói được điều đó. Poster lấy theo mẫu (`templatePosterSrc`) chứ không phải
 * ảnh riêng của từng thiệp: bố cục và art direction là của mẫu, và ảnh của mẫu
 * là thứ duy nhất chắc chắn tồn tại cho cả hai tab.
 *
 * **Hai tab, hai loại đích đến khác hẳn nhau.**
 *
 * Tab *mẫu thiệp* trỏ tới `/mau-thiep/<slug>/demo` — trang demo mà **mẫu nào
 * cũng có sẵn**. Đây là tab rộng: kho có hơn 60 mẫu, trong khi thiệp demo dựng
 * sẵn chỉ có mười mấy, nên nếu chỉ chọn được trong số thiệp đã dựng thì người
 * vận hành bị nhốt trong một phần năm kho mẫu.
 *
 * Tab *thiệp đã tạo* trỏ tới `/t/<slug>` — một thiệp có thật, có nội dung thật.
 * Ở đây có cả thiệp demo mình tự dựng lẫn thiệp của khách, phân biệt bằng một
 * nhãn nhỏ đọc từ vai trò chủ thiệp: đem thiệp khách lên trang chủ là chuyện
 * phải xin phép, và ranh giới đó không được biến mất lúc người vận hành đang
 * lướt nhanh tìm một tấm ảnh đẹp.
 *
 * Chỉ liệt kê thiệp **đã xuất bản**: thiệp nháp chưa có đường `/t/<slug>` nào
 * mở được, đem lên trang chủ là một ô bấm vào ra 404. Mẫu thì ngược lại — kể cả
 * mẫu chưa xuất bản vẫn có trang demo, nhưng vẫn lọc bỏ để trang chủ không dẫn
 * tới thứ khách chưa mua được.
 */
export function CardPicker({ value, onChange, labels }: Props) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ShowcaseKind>(value.kind);

  // Hoãn 250ms trước khi gọi: gõ một từ khoá bảy chữ mà bắn bảy request thì cái
  // trả về sau cùng chưa chắc là cái khớp chữ đang hiện trong ô.
  useEffect(() => {
    const id = setTimeout(() => setQuery(term.trim()), 250);
    return () => clearTimeout(id);
  }, [term]);

  /* ------------------------------------------------------------ tab: mẫu */

  // Kho mẫu tải một lần rồi lọc tại chỗ: route `/admin/templates` trả cả kho
  // trong một lượt (không phân trang), nên hỏi lại backend mỗi lần gõ chỉ thêm
  // độ trễ mà không thêm kết quả nào.
  const templatesQuery = useAllTemplatesQuery();
  const templates = useMemo(() => {
    const needle = query.toLowerCase();
    return (templatesQuery.data?.items ?? [])
      .filter((template) => template.isPublished)
      .filter(
        (template) =>
          !needle ||
          template.name.toLowerCase().includes(needle) ||
          template.slug.toLowerCase().includes(needle),
      );
  }, [templatesQuery.data?.items, query]);

  /* ----------------------------------------------------------- tab: thiệp */

  // Tìm kiếm thiệp chạy ở **backend**: trần của `limit` là 100
  // (`QueryAdminCardsDto`), nên lọc trong trang chỉ tìm được trong 100 thiệp
  // mới nhất và người vận hành sẽ kết luận nhầm là thiệp không tồn tại.
  const cardsQuery = useAdminCardsQuery(
    { limit: 100, ...(query ? { q: query } : {}) },
    // Chỉ hỏi khi đang mở đúng tab đó: component này nằm sẵn trên mọi form có ô
    // chọn thiệp, và tab mẫu không cần tới danh sách này.
    { enabled: open && tab === "card" },
  );
  const cards = useMemo(
    () => (cardsQuery.data?.items ?? []).filter((card) => card.status !== "draft"),
    [cardsQuery.data],
  );

  /* ------------------------------------------------------- đang chọn gì */

  /**
   * Thứ đang chọn tra bằng **truy vấn riêng**, không tra trong danh sách đang
   * hiện: danh sách co lại theo ô tìm kiếm, nên gõ một chữ không khớp sẽ làm
   * bản xem trước đổi thành "không còn tồn tại" trong khi người dùng chưa bỏ
   * chọn gì. Với thiệp nó còn tra được slug nằm ngoài 100 thiệp mới nhất.
   */
  const selectedCardQuery = useAdminCardsQuery(
    { q: value.slug, limit: 5 },
    { enabled: value.kind === "card" && Boolean(value.slug) },
  );

  const selected = useMemo((): {
    name: string;
    poster: string | null;
    caption: string;
    card: AdminCard | null;
  } | null => {
    if (!value.slug) return null;
    if (value.kind === "template") {
      const template = (templatesQuery.data?.items ?? []).find(
        (item) => item.slug === value.slug,
      );
      return template
        ? {
            name: template.name,
            poster: templatePosterSrc(template.slug),
            caption: `/mau-thiep/${template.slug}/demo`,
            card: null,
          }
        : null;
    }
    const card = (selectedCardQuery.data?.items ?? []).find(
      (item) => item.slug === value.slug,
    );
    return card
      ? {
          name: card.title,
          poster: templatePosterSrc(card.templateSlug),
          caption: `/t/${card.slug}`,
          card,
        }
      : null;
  }, [value, templatesQuery.data?.items, selectedCardQuery.data]);

  function pickTemplate(template: Template) {
    onChange({ kind: "template", slug: template.slug }, null);
    setOpen(false);
  }

  function pickCard(card: AdminCard) {
    onChange({ kind: "card", slug: card.slug }, card);
    setOpen(false);
  }

  const isLoading =
    tab === "template" ? templatesQuery.isLoading : cardsQuery.isLoading;
  const isError = tab === "template" ? templatesQuery.isError : cardsQuery.isError;
  const isEmpty =
    tab === "template" ? templates.length === 0 : cards.length === 0;

  const tile =
    "w-full space-y-2 rounded-lg border border-input p-2 text-left transition-colors hover:border-primary aria-pressed:border-primary";
  const tilePoster = "aspect-[3/4] w-full rounded-md object-cover object-top";

  return (
    <div className="space-y-2">
      {value.slug ? (
        <div className="flex items-start gap-3 rounded-lg border border-input p-3">
          <Poster
            src={selected?.poster ?? null}
            className="h-24 w-[4.5rem] shrink-0 rounded-md border border-input object-cover object-top"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="truncate font-medium">
              {selected ? selected.name : labels.unknown}
            </div>
            <div className="truncate text-caption text-muted-foreground">
              {selected ? selected.caption : value.slug}
            </div>
            <Badge variant="outline" size="sm">
              {value.kind === "template" ? labels.tabTemplate : labels.tabCard}
            </Badge>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setOpen(true)}
            >
              {labels.change}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              aria-label={labels.clear}
              title={labels.clear}
              onClick={() => onChange({ kind: value.kind, slug: "" }, null)}
            >
              <X />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
        >
          <Search />
          {labels.choose}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{labels.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Tabs
              activeKey={tab}
              onChange={(key) => setTab(key as ShowcaseKind)}
              items={[
                { key: "template", label: labels.tabTemplate },
                { key: "card", label: labels.tabCard },
              ]}
              className="-mb-2"
            />

            <Input
              value={term}
              placeholder={labels.search}
              onChange={(event) => setTerm(event.target.value)}
            />

            <p className="text-caption text-muted-foreground">
              {tab === "template" ? labels.templateHint : labels.draftHint}
            </p>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <p className="text-small text-muted-foreground">
                  {labels.loading}
                </p>
              ) : isError ? (
                /* Hỏng khác rỗng, và gộp hai thứ đó vào một câu "không có gì
                   khớp" là cách chắc chắn nhất để một lỗi API bị hiểu thành
                   một kho trống. */
                <p className="text-small text-destructive">{labels.failed}</p>
              ) : isEmpty ? (
                <p className="text-small text-muted-foreground">
                  {labels.empty}
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {tab === "template"
                    ? templates.map((template) => (
                        <li key={template.slug}>
                          <button
                            type="button"
                            onClick={() => pickTemplate(template)}
                            aria-pressed={
                              value.kind === "template" &&
                              value.slug === template.slug
                            }
                            className={tile}
                          >
                            <Poster
                              src={templatePosterSrc(template.slug)}
                              className={tilePoster}
                            />
                            <span className="block truncate text-small font-medium">
                              {template.name}
                            </span>
                            <span className="block truncate text-caption text-muted-foreground">
                              {template.slug}
                            </span>
                          </button>
                        </li>
                      ))
                    : cards.map((card) => (
                        <li key={card.id}>
                          <button
                            type="button"
                            onClick={() => pickCard(card)}
                            aria-pressed={
                              value.kind === "card" && value.slug === card.slug
                            }
                            className={tile}
                          >
                            <Poster
                              src={templatePosterSrc(card.templateSlug)}
                              className={tilePoster}
                            />
                            <span className="block truncate text-small font-medium">
                              {card.title}
                            </span>
                            <span className="block truncate text-caption text-muted-foreground">
                              {card.slug}
                            </span>
                          </button>
                        </li>
                      ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose>{labels.cancel}</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
