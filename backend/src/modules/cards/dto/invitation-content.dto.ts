import {
  CEREMONY_KINDS,
  GREETING_OCCASIONS,
  INVITATION_KINDS,
  TIMELINE_ACTIVITY_KINDS,
} from '@common/enums/invitation.enum';
import type {
  CeremonyKind,
  GreetingOccasion,
  InvitationBlock,
  InvitationKind,
  PhotoSlotKey,
  TimelineActivityKind,
} from '@common/enums/invitation.enum';
import {
  BANK_ACCOUNT_MAX_LENGTH,
  BANK_ACCOUNT_NAME_MAX_LENGTH,
  BANK_ACCOUNT_PATTERN,
  BANK_BIN_PATTERN,
  DRESS_CODE_MAX_COLORS,
  GUEST_LIST_MAX_LENGTH,
  HEX_COLOR_PATTERN,
  OCCASION_FIELD_MAX,
} from '@common/constants/invitation.constants';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  IsBlockVisibility,
  IsPhotoSlotMap,
} from '../decorators/content-map.decorator';

/**
 * Nội dung thiệp — bản đối chiếu của `frontend/lib/schemas/invitation/content.ts`.
 * Hai bản phải cùng shape; frontend validate để phản hồi sớm, đây mới là nơi
 * chốt thật.
 *
 * Một khác biệt có chủ đích: **`wishes.items` không nằm trong DTO này.** Lời
 * chúc do khách viết và được duyệt riêng nên nó là bảng riêng của module
 * `interactions`, không phải nội dung cặp đôi soạn. Nếu để nó vào content thì
 * mỗi lần chủ thiệp lưu bản nháp là ghi đè luôn dữ liệu khách gửi. Cờ bật/tắt
 * block `wishes` thì vẫn nằm trong `visibility` như 13 block còn lại.
 */

/** Chuỗi tuỳ chọn: rỗng là hợp lệ, chỉ chặn quá dài. */
const OPTIONAL_TEXT_MAX = 500;

export class EnvelopeDto {
  @IsString() @MaxLength(OPTIONAL_TEXT_MAX) greeting: string;
  @IsString() @MaxLength(OPTIONAL_TEXT_MAX) invitation: string;
}

/**
 * Tên cô dâu chú rể **được phép rỗng ở đây**: thiệp không phải thiệp cưới vẫn
 * mang khối này (một hình dạng nội dung cho mọi loại) nhưng để trống. Luật "thiệp
 * cưới bắt buộc đủ hai tên" nằm ở `CardsService.assertContentForKind`, vì DTO
 * lồng không đọc được `kind` ở cấp nội dung.
 */
export class CoupleDto {
  @IsString() @MaxLength(120) groomFullName: string;
  @IsString() @MaxLength(120) brideFullName: string;
  /** Bỏ trống thì tên gọi thân mật được trích từ họ tên đầy đủ. */
  @IsString() @MaxLength(120) groomNickname: string;
  @IsString() @MaxLength(120) brideNickname: string;
  @IsString() @MaxLength(60) groomChildOrder: string;
  @IsString() @MaxLength(60) brideChildOrder: string;
}

export class FamiliesDto {
  @IsString() @MaxLength(120) groomFather: string;
  @IsString() @MaxLength(120) groomMother: string;
  @IsString() @MaxLength(120) brideFather: string;
  @IsString() @MaxLength(120) brideMother: string;
  @IsString() @MaxLength(255) groomAddress: string;
  @IsString() @MaxLength(255) brideAddress: string;
}

/**
 * Địa điểm người dùng chọn từ gợi ý Google Places. Chỉ là **phần bổ nghĩa** cho
 * ô địa chỉ dạng chữ, không thay thế nó: rất nhiều lễ diễn ra ở "Nhà gái, thôn
 * 3, xã X" — chỗ không có trên bản đồ — nên ô chữ vẫn là nguồn sự thật của nội
 * dung thiệp, còn khối này chỉ giúp bản đồ trỏ đúng điểm thay vì đoán theo
 * chuỗi chữ.
 *
 * `null` khi người dùng tự gõ hoặc đã sửa tay lại chữ sau khi chọn — sửa chữ
 * mà giữ toạ độ cũ thì bản đồ chỉ sai chỗ khác.
 */
export class PlaceRefDto {
  @IsString() @MaxLength(255) placeId: string;
  @IsLatitude() latitude: number;
  @IsLongitude() longitude: number;
}

export class CeremonyDto {
  @IsIn(CEREMONY_KINDS) kind: CeremonyKind;
  /** Chỉ dùng khi `kind` là `other`; service kiểm ràng buộc chéo này. */
  @IsString() @MaxLength(60) customKind: string;
  @IsString() @IsNotEmpty() @MaxLength(120) dateTime: string;
  @IsString() @IsNotEmpty() @MaxLength(255) venue: string;

  @IsOptional()
  @ValidateIf((dto: CeremonyDto) => dto.venuePlace !== null)
  @ValidateNested()
  @Type(() => PlaceRefDto)
  venuePlace: PlaceRefDto | null;

  @IsString() @MaxLength(OPTIONAL_TEXT_MAX) note: string;
}

export class ReceptionDto {
  @IsString() @MaxLength(60) date: string;
  @IsString() @MaxLength(30) welcomeTime: string;
  @IsString() @MaxLength(30) startTime: string;
  @IsString() @MaxLength(255) venueAddress: string;
  /**
   * Bỏ trống thì thiệp dùng nhãn mặc định trong dictionary. Optional vì thiệp
   * lưu trước khi có trường này không mang nó.
   */
  @IsOptional() @IsString() @MaxLength(80) venueLabel?: string;

  @IsOptional()
  @ValidateIf((dto: ReceptionDto) => dto.venuePlace !== null)
  @ValidateNested()
  @Type(() => PlaceRefDto)
  venuePlace: PlaceRefDto | null;
  /**
   * Rỗng hoặc một URL thật — khớp `z.union([z.literal(""), z.string().url()])`
   * phía frontend. Dùng `@ValidateIf` chứ **không** `@IsOptional`: `IsOptional`
   * chỉ bỏ qua `null`/`undefined`, còn ô địa chỉ bản đồ chưa điền thì editor
   * gửi lên chuỗi rỗng.
   */
  @ValidateIf((dto: ReceptionDto) => dto.mapUrl !== '')
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  mapUrl: string;
}

export class DressCodeDto {
  /** Bỏ trống thì thiệp dùng nhãn mặc định trong dictionary. */
  @IsString() @MaxLength(120) title: string;
  @IsString() @MaxLength(OPTIONAL_TEXT_MAX) description: string;

  @IsArray()
  @ArrayMaxSize(DRESS_CODE_MAX_COLORS)
  @Matches(HEX_COLOR_PATTERN, { each: true })
  colors: string[];
}

export class TimelineItemDto {
  @IsString() @IsNotEmpty() @MaxLength(30) startTime: string;
  /**
   * Giờ kết thúc **được phép rỗng**, khớp `timelineItemSchema` bên frontend.
   * Lịch trình cưới thường chỉ ghi mốc bắt đầu ("17:30 Đón khách"), và kho mẫu
   * đã dựng sẵn cho trường hợp đó: mọi template render bằng
   * `[startTime, endTime].filter(Boolean)`. `@IsNotEmpty()` ở đây từng chặn cả
   * dữ liệu do chính `showcase-cards.seed.ts` sinh ra.
   */
  @IsString() @MaxLength(30) endTime: string;
  @IsString() @IsNotEmpty() @MaxLength(255) activity: string;
  /**
   * Loại hoạt động, quyết định nghĩa của biểu tượng. **Tuỳ chọn**: thiệp tạo
   * trước khi có trường này không mang nó, và `null` là "Tự động" (đoán từ
   * `activity`). Phải khai ở đây vì `forbidNonWhitelisted` từ chối field lạ.
   */
  @IsOptional()
  @IsIn(TIMELINE_ACTIVITY_KINDS)
  kind?: TimelineActivityKind | null;
}

export class TimelineDto {
  @IsString() @MaxLength(120) title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineItemDto)
  items: TimelineItemDto[];

  @IsBoolean() autoTranslate: boolean;
}

export class CountdownDto {
  @IsString() @MaxLength(60) weddingDate: string;
  @IsBoolean() googleCalendar: boolean;
  @IsBoolean() appleCalendar: boolean;
}

export class StoryDto {
  @IsString() @MaxLength(2000) message: string;
}

export class AlbumDto {
  /**
   * Ảnh album — loại ảnh do **gói** quy định (chỉ Diamond). Trần thật và quyền
   * mở kiểm ở service theo `planTier`, không kiểm ở đây: DTO không biết thiệp
   * đang ở gói nào.
   */
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  photos: string[];
}

/**
 * Tài khoản nhận mừng cưới. Khoá là **BIN 6 số của NAPAS**, không phải tên ngân
 * hàng người dùng gõ: payload VietQR định danh ngân hàng bằng BIN, nên chuỗi
 * "Vietcombank" không sinh được QR.
 *
 * Chỉ kiểm định dạng, **không đối chiếu với danh sách ngân hàng**. Bảng ngân
 * hàng đầy đủ nằm ở `frontend/constants/banks.ts` và là ảnh chụp một thời điểm;
 * chép nó sang backend là tạo ra hai bản sẽ lệch nhau, mà lệch ở đây thì hậu quả
 * là khách không lưu nổi thiệp. Select trong editor giới hạn giá trị hợp lệ,
 * còn BIN chết thì thiệp chỉ mất QR chứ không mất dữ liệu.
 */
export class BankAccountDto {
  @IsString() @Matches(BANK_BIN_PATTERN) bankBin: string;

  @IsString()
  @Matches(BANK_ACCOUNT_PATTERN)
  @MaxLength(BANK_ACCOUNT_MAX_LENGTH)
  accountNumber: string;

  /** Chỉ để khách đối chiếu khi quét; không nằm trong payload QR. */
  @IsString() @MaxLength(BANK_ACCOUNT_NAME_MAX_LENGTH) accountName: string;
}

export class GiftBoxDto {
  @ValidateNested() @Type(() => BankAccountDto) groom: BankAccountDto;
  @ValidateNested() @Type(() => BankAccountDto) bride: BankAccountDto;
}

export class MusicDto {
  @IsString() @MaxLength(60) trackId: string;
}

export class ThankYouDto {
  @IsString() @MaxLength(2000) message: string;
}

/**
 * Link mời riêng cho từng khách. **Không phải một block** trong `visibility`:
 * nó không vẽ ra section nào, chỉ đổi lời chào trên màn mở đầu.
 *
 * `guestList` giữ nguyên văn ô nhập (mỗi dòng một khách) để editor mở lại đúng
 * thứ cặp đôi đã gõ. Trần số khách và độ dài từng tên kiểm ở service, vì phải
 * tách dòng trước mới đếm được. Mã link nằm ở bảng `card_guests`, không ở đây.
 *
 * Tắt thì danh sách **vẫn giữ** — kể cả mã link: bật lại là mọi link đã gửi
 * hoạt động như cũ.
 */
export class GuestInviteDto {
  @IsBoolean() enabled: boolean;
  @IsString() @MaxLength(GUEST_LIST_MAX_LENGTH) guestList: string;
}

/**
 * Nhân vật chính / chủ đề của thiệp không phải thiệp cưới — khối lõi, **không
 * có công tắc** nên không nằm trong `visibility`. Mỗi loại chỉ dùng một phần các
 * ô (sinh nhật: tên + tuổi; tốt nghiệp: tên + trường, ngành, khoá; sự kiện: tên
 * sự kiện + đơn vị tổ chức; kỷ niệm: tên + số năm; chúc mừng: dịp, người nhận,
 * người gửi, lời chúc); ô không dùng để rỗng. `name` bắt buộc với mọi loại khác
 * thiệp cưới — kiểm ở service, cùng lý do với `CoupleDto`.
 */
export class OccasionDto {
  @IsString() @MaxLength(OCCASION_FIELD_MAX.name) name: string;
  @IsString() @MaxLength(OCCASION_FIELD_MAX.nickname) nickname: string;
  @IsString() @MaxLength(OCCASION_FIELD_MAX.age) age: string;
  @IsString() @MaxLength(OCCASION_FIELD_MAX.school) school: string;
  @IsString() @MaxLength(OCCASION_FIELD_MAX.major) major: string;
  @IsString() @MaxLength(OCCASION_FIELD_MAX.classOf) classOf: string;
  @IsString() @MaxLength(OCCASION_FIELD_MAX.organizer) organizer: string;
  @IsString() @MaxLength(OCCASION_FIELD_MAX.years) years: string;
  @IsString() @MaxLength(OCCASION_FIELD_MAX.sender) sender: string;
  @IsIn(GREETING_OCCASIONS) greetingOccasion: GreetingOccasion;
  @IsString() @MaxLength(OCCASION_FIELD_MAX.message) message: string;
}

/** Optional để thiệp cũ tiếp tục dùng ảnh Keemori, không backfill dữ liệu. */
export class SharePreviewDto {
  @IsIn(['auto', 'photo', 'brand']) mode: 'auto' | 'photo' | 'brand';
  @IsString() @MaxLength(2048) photoUrl: string;
  @IsInt() @Min(0) @Max(100) positionY: number;
  /** Hai trường dưới do server sinh; dữ liệu client luôn bị bỏ qua khi lưu. */
  @IsOptional() @IsString() @MaxLength(2048) sourceUrl?: string;
  @IsOptional() @IsString() @MaxLength(2048) imageUrl?: string;
}

export class InvitationContentDto {
  /**
   * Loại thiệp. Thiếu là `wedding` (thiệp tạo trước khi có loại). Không đổi
   * được sau khi tạo — `CardsService.update` từ chối nội dung mang loại khác.
   */
  @IsOptional() @IsIn(INVITATION_KINDS) kind?: InvitationKind;

  /** Thiếu ở thiệp cưới; bắt buộc (có `name`) ở mọi loại khác. */
  @IsOptional()
  @ValidateNested()
  @Type(() => OccasionDto)
  occasion?: OccasionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SharePreviewDto)
  sharePreview?: SharePreviewDto;
  @ValidateNested() @Type(() => EnvelopeDto) envelope: EnvelopeDto;
  @ValidateNested() @Type(() => CoupleDto) couple: CoupleDto;
  @ValidateNested() @Type(() => FamiliesDto) families: FamiliesDto;

  /** Được rỗng ở đây — "thiệp cưới cần ít nhất một nghi lễ" kiểm ở service. */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CeremonyDto)
  ceremonies: CeremonyDto[];

  @ValidateNested() @Type(() => ReceptionDto) reception: ReceptionDto;
  @ValidateNested() @Type(() => DressCodeDto) dressCode: DressCodeDto;
  @ValidateNested() @Type(() => TimelineDto) timeline: TimelineDto;
  @ValidateNested() @Type(() => CountdownDto) countdown: CountdownDto;
  @ValidateNested() @Type(() => StoryDto) story: StoryDto;

  @IsObject()
  @IsPhotoSlotMap()
  photos: Partial<Record<PhotoSlotKey, string>>;

  @ValidateNested() @Type(() => AlbumDto) album: AlbumDto;
  @ValidateNested() @Type(() => GiftBoxDto) giftBox: GiftBoxDto;
  @ValidateNested() @Type(() => MusicDto) music: MusicDto;
  @ValidateNested() @Type(() => ThankYouDto) thankYou: ThankYouDto;
  @ValidateNested() @Type(() => GuestInviteDto) guestInvite: GuestInviteDto;

  /**
   * Di sản của gói Song Hỷ đã gỡ. Vẫn **chấp nhận** (không kiểm nội dung) để
   * thiệp cũ và editor cũ lưu lại được dưới `forbidNonWhitelisted`; service bỏ
   * khoá này trước khi ghi, nên nó không bao giờ được lưu mới.
   */
  @IsOptional() @IsObject() familySplit?: Record<string, unknown>;

  /** Như `familySplit`: trường trình bày cũ của thiệp nhà gái, chỉ để chấp nhận rồi bỏ. */
  @IsOptional() @IsIn(['groom', 'bride']) viewSide?: 'groom' | 'bride';

  @IsObject()
  @IsBlockVisibility()
  visibility: Record<InvitationBlock, boolean>;
}
