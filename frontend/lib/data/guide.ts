import "server-only";

export interface GuideStep {
  /** Khớp với key trong `dictionaries.guide.steps` — mọi chữ nằm ở dictionary. */
  key: "choose" | "content" | "share";
  /** Thời lượng ước tính, đơn vị phút. */
  minutes: number;
  imageSrc: string;
  actionPath: string;
}

export interface GuideChecklistGroup {
  key: "couple" | "ceremony" | "media" | "guests";
  /** Số mục trong nhóm; chữ của từng mục nằm ở dictionary. */
  items: number;
}

export interface GuideTip {
  key: "mobile" | "map" | "music" | "qr";
}

/**
 * Cấu trúc của trang hướng dẫn. Ở đây chỉ có *hình dạng* (thứ tự, thời lượng,
 * ảnh minh hoạ); toàn bộ chữ nằm trong `dictionaries.guide` để dịch được cả
 * hai ngôn ngữ.
 */
export function getGuideSteps(): GuideStep[] {
  return [
    {
      key: "choose",
      minutes: 3,
      imageSrc: "/images/site/steps/choose-template.avif",
      actionPath: "/mau-thiep",
    },
    {
      key: "content",
      minutes: 12,
      imageSrc: "/images/site/steps/fill-details.avif",
      actionPath: "/mau-thiep",
    },
    {
      key: "share",
      minutes: 5,
      imageSrc: "/images/site/steps/share-link-qr.avif",
      actionPath: "/thiep-cua-toi",
    },
  ];
}

export function getGuideChecklist(): GuideChecklistGroup[] {
  return [
    { key: "couple", items: 4 },
    { key: "ceremony", items: 4 },
    { key: "media", items: 3 },
    { key: "guests", items: 3 },
  ];
}

export function getGuideTips(): GuideTip[] {
  return [{ key: "mobile" }, { key: "map" }, { key: "music" }, { key: "qr" }];
}
