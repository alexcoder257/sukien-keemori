/**
 * Hai nhà của gói Song Hỷ (thiệp riêng nhà trai / nhà gái) — gói này đã **gỡ**.
 * Kiểu còn lại chỉ để gõ cho hai cột di sản `card_guests.side` và `rsvps.side`:
 * mọi hàng mới là `groom`, hàng `bride` cũ được giữ nguyên.
 */
export const FAMILY_SIDES = ['groom', 'bride'] as const;
export type FamilySide = (typeof FAMILY_SIDES)[number];
