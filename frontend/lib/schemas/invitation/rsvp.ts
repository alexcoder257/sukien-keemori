import { z } from "zod";
import {
  RSVP_MAX_PARTY_SIZE,
  RSVP_NAME_MAX_LENGTH,
} from "@/constants/invitation";
import { fill } from "@/lib/format";
import type { InvitationErrors } from "./content";

/**
 * Một phản hồi tham dự như backend trả cho chủ thiệp. `guestId` khác `null`
 * nghĩa là phản hồi gửi từ link mời riêng — đứng tên đúng một khách trong danh
 * sách, và khách đó gửi lại là sửa dòng này.
 */
export const rsvpSchema = z.object({
  id: z.string(),
  guestId: z.string().nullable(),
  name: z.string(),
  attending: z.boolean(),
  /** Tính cả người gửi; `0` khi không tham dự. */
  partySize: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Form khách điền. `attending` không có giá trị mặc định: chọn sẵn "có" là đếm
 * oan một người chưa hề trả lời, chọn sẵn "không" thì ngược lại.
 */
export const rsvpFormSchema = (e: InvitationErrors) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, e.required)
      .max(RSVP_NAME_MAX_LENGTH, fill(e.tooLong, { max: RSVP_NAME_MAX_LENGTH })),
    attending: z.boolean({ error: e.rsvpChoiceRequired }),
    partySize: z.number().int().min(1).max(RSVP_MAX_PARTY_SIZE),
  });

export type Rsvp = z.infer<typeof rsvpSchema>;
export type RsvpForm = z.infer<ReturnType<typeof rsvpFormSchema>>;
