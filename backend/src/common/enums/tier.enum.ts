/**
 * Cấp thiết kế của **mẫu thiệp** (`templates.tier`, `wedding_cards.template_tier`).
 * Bản sao có chủ đích của `frontend/constants/invitation.ts`.
 *
 * Đây không còn là gói dịch vụ: site bán một gói duy nhất và thiệp nào cũng có
 * đủ tính năng. Cột `wedding_cards.plan_tier` còn trong database như một cột di
 * sản (luôn `diamond`) và dùng lại kiểu này, nhưng không code nào rẽ nhánh theo
 * nó nữa.
 */
export const TIERS = ['free', 'gold', 'diamond'] as const;
export type Tier = (typeof TIERS)[number];
