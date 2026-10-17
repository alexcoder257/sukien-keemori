import { ERROR_MESSAGES } from '@constant/error-messages';
import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PhotonProvider } from './photon.provider';
import type { PlaceDetails, PlaceSuggestion } from './places.types';

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const DETAILS_URL = 'https://places.googleapis.com/v1/places';
// Thiệp cưới trong nước: giới hạn vùng cho kết quả gọn và tránh trả về địa
// điểm trùng tên ở nước ngoài.
const REGION_CODES = ['vn'];
const LANGUAGE_CODE = 'vi';
// Google trả tối đa 5 gợi ý; cắt bớt nữa thì danh sách hụt lựa chọn đúng.
const MAX_SUGGESTIONS = 5;
// Truy vấn địa điểm cưới lặp lại rất nhiều ("trung tâm tiệc cưới…"), nên cache
// ngắn hạn cắt được phần lớn lượt gọi có trả tiền. 6 giờ đủ lâu để ăn được
// cùng một đợt soạn thiệp, đủ ngắn để địa điểm mới không bị khuất.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
/**
 * Trần mỗi tài khoản một ngày. Throttler chỉ chặn burst; người rê đều cả ngày
 * vẫn đốt hết hạn mức nếu không có con số này.
 */
const DAILY_QUOTA_PER_USER = 300;

interface GoogleAutocompleteResponse {
  suggestions?: {
    placePrediction?: {
      placeId?: string;
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
      text?: { text?: string };
    };
  }[];
  error?: { message?: string; status?: string };
}

interface GooglePlaceDetailsResponse {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  error?: { message?: string; status?: string };
}

/**
 * Gợi ý địa điểm cho các ô địa chỉ trong editor.
 *
 * **Hai nhà cung cấp, chọn theo cấu hình.** Không có `GOOGLE_PLACES_API_KEY` thì
 * đi bằng Photon (OpenStreetMap) — miễn phí, không hạn mức tính tiền, đủ tốt cho
 * đường sá và phường xã Việt Nam. Có key thì dùng Google Places, phủ tên thương
 * mại tốt hơn nhưng tính tiền theo lượt. Đây là mặc định **mở**: thiếu cấu hình
 * thì tính năng vẫn chạy, chỉ đổi nguồn dữ liệu.
 *
 * Phần dưới đây nói về nhánh Google.
 *
 * **Key không bao giờ ra tới trình duyệt.** Key trình duyệt chỉ giới hạn được
 * theo HTTP referrer, mà header đó do client tự khai nên giả được — ai copy key
 * từ tab Network cũng xài được hạn mức ta trả tiền. Đi vòng qua backend thì đổi
 * lại ta biết *ai* đang gọi, chặn được theo người và cache được.
 *
 * Bốn lớp tiết chế nằm ở đây; hai lớp còn lại nằm ngoài file này: guard đăng
 * nhập + `@Throttle` ở controller, và quota cứng đặt trong Google Cloud Console
 * (chốt chặn cuối, dù mọi lớp trong code thủng thì Google vẫn tự ngắt).
 */
@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  /** Cache theo truy vấn đã chuẩn hoá; đủ nhỏ để giữ trong bộ nhớ tiến trình. */
  private readonly cache = new Map<
    string,
    { expiresAt: number; suggestions: PlaceSuggestion[] }
  >();
  /**
   * Đếm lượt gọi trong ngày của từng tài khoản. Cố tình để trong bộ nhớ: mất
   * khi restart và không dùng chung giữa nhiều instance, nhưng đây là hàng rào
   * chống lạm dụng chứ không phải sổ sách tính tiền. Cần chính xác tuyệt đối
   * thì chuyển sang Redis, đừng chuyển sang bảng trong Postgres — mỗi phím gõ
   * một lượt ghi là đổi một vấn đề rẻ lấy một vấn đề đắt.
   */
  private readonly usage = new Map<string, { day: string; count: number }>();

  constructor(
    private readonly configService: ConfigService,
    private readonly photon: PhotonProvider,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async autocomplete(
    userId: string | null,
    query: string,
    sessionToken?: string,
  ): Promise<PlaceSuggestion[]> {
    const normalized = query.trim().replace(/\s+/g, ' ').toLowerCase();
    const cached = this.readCache(normalized);
    // Trả từ cache **trước khi** trừ quota: lượt này không tốn tiền của ai.
    if (cached) return cached;

    // Không có key Google thì đi bằng Photon: miễn phí nên không trừ quota,
    // nhưng vẫn cache để không nện vào một dịch vụ cộng đồng.
    if (!this.isConfigured()) {
      const suggestions = await this.photon.autocomplete(query.trim());
      this.writeCache(normalized, suggestions);
      return suggestions;
    }

    // Từ đây trở xuống là nhánh Google, mỗi lượt gọi là một khoản tiền — nên
    // phải biết ai đang gọi mới trừ được hạn mức và mới chặn được người lạm
    // dụng. Khách chưa đăng nhập không tới được chỗ này.
    if (!userId) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.UNAUTHORIZED);
    }
    this.consumeQuota(userId);

    const response = await fetch(AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
      },
      body: JSON.stringify({
        input: query.trim(),
        languageCode: LANGUAGE_CODE,
        includedRegionCodes: REGION_CODES,
        // Google tính tiền cả chuỗi gõ + lần chọn cuối như MỘT session khi có
        // token này. Thiếu nó thì mỗi phím gõ là một lượt tính tiền riêng.
        ...(sessionToken ? { sessionToken } : {}),
      }),
    });

    const body = (await response.json()) as GoogleAutocompleteResponse;
    if (!response.ok) {
      // Không log key; chỉ thông điệp lỗi Google trả về.
      this.logger.error(
        `Places autocomplete thất bại: ${body.error?.message ?? response.status}`,
      );
      throw new ServiceUnavailableException(ERROR_MESSAGES.PLACE.LOOKUP_FAILED);
    }

    const suggestions = (body.suggestions ?? [])
      .map((item) => item.placePrediction)
      .filter((prediction) => prediction?.placeId)
      .slice(0, MAX_SUGGESTIONS)
      .map((prediction) => ({
        placeId: prediction!.placeId!,
        mainText:
          prediction!.structuredFormat?.mainText?.text ??
          prediction!.text?.text ??
          '',
        secondaryText: prediction!.structuredFormat?.secondaryText?.text ?? '',
      }));

    this.writeCache(normalized, suggestions);
    return suggestions;
  }

  /**
   * Đổi `placeId` lấy địa chỉ đầy đủ và toạ độ, gọi khi người dùng **chọn** một
   * gợi ý. Toạ độ là thứ khiến bản đồ trên thiệp trỏ đúng điểm thay vì đoán
   * theo chuỗi chữ.
   */
  async details(
    userId: string | null,
    placeId: string,
    sessionToken?: string,
  ): Promise<PlaceDetails> {
    this.assertConfigured();
    if (!userId) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.UNAUTHORIZED);
    }
    this.consumeQuota(userId);

    const params = new URLSearchParams({ languageCode: LANGUAGE_CODE });
    // Cùng session token với bước autocomplete thì cả chuỗi tính tiền một lần.
    if (sessionToken) params.set('sessionToken', sessionToken);

    const response = await fetch(
      `${DETAILS_URL}/${encodeURIComponent(placeId)}?${params.toString()}`,
      {
        headers: {
          'X-Goog-Api-Key': this.apiKey,
          // Chỉ xin đúng bốn trường ta dùng — field mask càng rộng càng đắt.
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
        },
      },
    );

    const body = (await response.json()) as GooglePlaceDetailsResponse;
    if (!response.ok || !body.id || !body.location) {
      this.logger.error(
        `Places details thất bại: ${body.error?.message ?? response.status}`,
      );
      throw new ServiceUnavailableException(ERROR_MESSAGES.PLACE.LOOKUP_FAILED);
    }

    return {
      placeId: body.id,
      name: body.displayName?.text ?? '',
      address: body.formattedAddress ?? '',
      latitude: body.location.latitude ?? 0,
      longitude: body.location.longitude ?? 0,
    };
  }

  // ===== helpers =====

  private readCache(key: string): PlaceSuggestion[] | null {
    const hit = this.cache.get(key);
    if (!hit) return null;
    if (hit.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return hit.suggestions;
  }

  private writeCache(key: string, suggestions: PlaceSuggestion[]): void {
    // Map giữ thứ tự chèn, nên phần tử đầu là phần tử cũ nhất — bỏ nó đi là đủ
    // để bộ nhớ không phình theo số truy vấn.
    if (this.cache.size >= CACHE_MAX_ENTRIES) {
      const [oldest] = this.cache.keys();
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(key, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      suggestions,
    });
  }

  private consumeQuota(userId: string): void {
    const today = new Date().toISOString().slice(0, 10);
    const current = this.usage.get(userId);
    const count = current?.day === today ? current.count : 0;

    if (count >= DAILY_QUOTA_PER_USER) {
      throw new ForbiddenException(ERROR_MESSAGES.PLACE.DAILY_LIMIT_REACHED);
    }
    this.usage.set(userId, { day: today, count: count + 1 });
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        ERROR_MESSAGES.PLACE.NOT_CONFIGURED,
      );
    }
  }

  private get apiKey(): string {
    return this.configService.get<string>('GOOGLE_PLACES_API_KEY') ?? '';
  }
}
