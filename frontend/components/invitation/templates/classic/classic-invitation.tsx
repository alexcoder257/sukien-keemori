import { InvitationAlbum } from "@/components/invitation/shared/invitation-album";
import {
  giftBoxForKind,
  invitationBlocks,
} from "@/components/invitation/shared/invitation-blocks";
import { invitationKindOf } from "@/constants/invitation";
import { InvitationCeremonies } from "./invitation-ceremonies";
import { InvitationCountdown } from "@/components/invitation/shared/invitation-countdown";
import { InvitationDressCode } from "./invitation-dress-code";
import { InvitationFamilies } from "./invitation-families";
import { InvitationGiftBox } from "@/components/invitation/shared/invitation-gift-box";
import { InvitationHero } from "./invitation-hero";
import { InvitationOccasionHero } from "./invitation-occasion-hero";
import { InvitationMusicToggle } from "@/components/invitation/shared/invitation-music-toggle";
import { InvitationReception } from "./invitation-reception";
import { InvitationSection } from "./invitation-section";
import { InvitationStory } from "./invitation-story";
import { InvitationWishes } from "@/components/invitation/shared/invitation-wishes";
import { InvitationRsvp } from "@/components/invitation/shared/invitation-rsvp";
import type { InvitationTemplateProps } from "@/components/invitation/shared/invitation-template";
import { InvitationThankYou } from "./invitation-thank-you";
import { InvitationTimeline } from "./invitation-timeline";

/**
 * Mẫu mặc định: một dải giấy sáng, các block xếp dọc cách nhau bằng đường kẻ
 * mảnh. Đây cũng là mẫu dự phòng cho slug chưa có mẫu riêng, nên nó phải dựng
 * được đủ 13 block mà không cần ảnh hay hoạ tiết nào.
 *
 * Nó cũng là mẫu của **mọi loại thiệp** (`DEFAULT_TEMPLATE_SLUG`): thiệp cưới
 * mở bằng tên cô dâu chú rể, loại khác mở bằng thông tin chính của dịp
 * (`InvitationOccasionHero`). Khối nào không thuộc loại đã bị
 * `invitationBlocks` tắt, và chữ của từng mục đã được trộn theo loại ở
 * `registry.ts` — mẫu này không phải tự rẽ nhánh thêm.
 */
export function ClassicInvitation({
  content,
  dict,
  ceremonyKindsDict,
  locale,
  photoSlots,
  showMusicToggle = true,
  musicTogglePlacement = "viewport",
}: InvitationTemplateProps) {
  // Mẫu mặc định thay cho mọi mẫu chưa có bản dựng riêng, nên nó phải dựng
  // được ô ảnh của bất kỳ mẫu nào: đọc đúng những ô mẫu đó khai, bỏ qua ảnh
  // của ô thuộc mẫu khác vẫn còn trong `content.photos`.
  const slotPhotos = photoSlots
    .map((slot) => content.photos[slot])
    .filter((photo): photo is string => Boolean(photo));
  const { show, ceremonies, timelineItems, dressCodeColors, approvedWishes } =
    invitationBlocks(content);
  const sections = dict.sections;

  return (
    <div className="theme-paper bg-background text-foreground">
      {invitationKindOf(content) === "wedding" ? (
        <InvitationHero
          content={content}
          showEnvelope={show.envelope}
          locale={locale}
        />
      ) : (
        <InvitationOccasionHero
          content={content}
          showEnvelope={show.envelope}
          dict={dict.kinds}
          locale={locale}
        />
      )}

      {show.families ? (
        <InvitationFamilies
          content={content}
          dict={sections.families}
          showCouple={show.couple}
        />
      ) : null}

      {show.ceremonies ? (
        <InvitationCeremonies
          ceremonies={ceremonies}
          dict={sections.ceremonies}
          kindDict={ceremonyKindsDict}
        />
      ) : null}

      {show.reception ? (
        <InvitationReception
          reception={content.reception}
          dict={sections.reception}
        />
      ) : null}

      {show.dressCode ? (
        <InvitationDressCode
          dressCode={{ ...content.dressCode, colors: dressCodeColors }}
          dict={sections.dressCode}
        />
      ) : null}

      {show.timeline ? (
        <InvitationTimeline
          timeline={{ ...content.timeline, items: timelineItems }}
          dict={sections.timeline}
        />
      ) : null}

      {show.countdown ? (
        <InvitationSection title={sections.countdown.title}>
          <InvitationCountdown
            content={content}
            dict={sections.countdown}
            locale={locale}
          />
        </InvitationSection>
      ) : null}

      {show.story ? (
        <InvitationStory message={content.story.message} dict={sections.story} />
      ) : null}

      {/* Ô ảnh trong thiết kế, không phải album: nó không có công tắc bật/tắt
          vì bố cục mẫu được dàn quanh nó. Ở mẫu mặc định thì "bố cục" chỉ là
          một dải ảnh — mẫu có bản dựng riêng đặt từng ô vào đúng chỗ của nó. */}
      {slotPhotos.length > 0 ? (
        <InvitationSection title={sections.photos.title}>
          <InvitationAlbum photos={slotPhotos} dict={sections.album} />
        </InvitationSection>
      ) : null}

      {show.album ? (
        <InvitationSection title={sections.album.title}>
          <InvitationAlbum photos={content.album.photos} dict={sections.album} />
        </InvitationSection>
      ) : null}

      {show.giftBox ? (
        <InvitationSection
          title={sections.giftBox.title}
          subtitle={sections.giftBox.subtitle}
        >
          <InvitationGiftBox
            giftBox={giftBoxForKind(content)}
            dict={sections.giftBox}
          />
        </InvitationSection>
      ) : null}

      {/* Sổ lưu bút: màn duy nhất khách viết vào thay vì chỉ đọc. Component
          dùng chung không mang màu riêng — nó ăn theo token ngữ nghĩa của mẫu
          nên tự ra đúng tông ở đây. */}
      {show.wishes ? (
        <InvitationSection
          title={sections.wishes.title}
          subtitle={sections.wishes.subtitle}
        >
          <InvitationWishes
            wishes={approvedWishes}
            dict={sections.wishes}
            errors={dict.errors}
            locale={locale}
          />
        </InvitationSection>
      ) : null}
      {show.rsvp ? (
        <InvitationSection
          title={sections.rsvp.title}
          subtitle={sections.rsvp.subtitle}
        >
          <InvitationRsvp
            dict={sections.rsvp}
            errors={dict.errors}
          />
        </InvitationSection>
      ) : null}

      {show.thankYou ? (
        <InvitationThankYou
          message={content.thankYou.message}
          dict={sections.thankYou}
        />
      ) : null}

      {show.music && showMusicToggle ? (
        <InvitationMusicToggle
          dict={dict}
          trackId={content.music.trackId}
          placement={musicTogglePlacement}
        />
      ) : null}
    </div>
  );
}
