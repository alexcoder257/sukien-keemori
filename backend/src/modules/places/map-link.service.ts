import { ERROR_MESSAGES } from '@constant/error-messages';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PhotonProvider } from './photon.provider';

/** Host được phép đi theo redirect — xem chú thích SSRF ở DTO. */
const ALLOWED_HOSTS = [
  'maps.app.goo.gl',
  'goo.gl',
  'maps.google.com',
  'www.google.com',
  'google.com',
];
// Link rút gọn của Maps thường chỉ một nhịp; để 3 cho chắc, hơn nữa là vòng lặp.
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 5000;
// Link đã bóc rồi thì không đổi nữa — người dùng dán đi dán lại vẫn một kết quả.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 300;

export interface ResolvedMapLink {
  latitude: number;
  longitude: number;
  /** Tên địa điểm đọc từ đoạn `/place/…` của URL; rỗng nếu link không có. */
  name: string;
  /**
   * Địa chỉ đầy đủ, dựng từ tên trong link + kết quả dịch ngược toạ độ qua
   * Photon. Đây là thứ đổ thẳng vào ô "Địa chỉ nhà hàng" để người dùng khỏi gõ.
   */
  address: string;
  /** Toạ độ lấy từ điểm ghim hay từ tâm khung nhìn — xem chú thích bên dưới. */
  precision: 'pin' | 'viewport';
}

/**
 * Bóc toạ độ và tên địa điểm từ một link chia sẻ Google Maps.
 *
 * Đây **không phải API có hợp đồng** mà là đọc URL công khai, nên nó có thể hỏng
 * bất cứ lúc nào Google đổi định dạng link. Vì vậy mọi nhánh hỏng đều trả lỗi
 * hiền: editor giữ nguyên link người dùng dán, chỉ mất toạ độ, và bản đồ quay
 * về tra theo chuỗi chữ như trước. Đổi lại: không cần API key, không quota,
 * không tốn tiền — trong khi người dùng vốn đã dán sẵn link cho ta rồi.
 *
 * Hai nguồn toạ độ trong một URL Maps, và chúng **không giống nhau**:
 *
 * - `!3d<lat>!4d<lng>` là điểm ghim của chính địa điểm — đây là thứ ta muốn.
 * - `@<lat>,<lng>,<zoom>z` là tâm khung nhìn lúc người dùng bấm chia sẻ. Thử
 *   với một link thật thì hai giá trị lệch nhau gần 300m, đủ để ghim sang bên
 *   kia đường. Chỉ dùng khi không có cái trên.
 */
@Injectable()
export class MapLinkService {
  private readonly logger = new Logger(MapLinkService.name);
  private readonly cache = new Map<
    string,
    { expiresAt: number; value: ResolvedMapLink }
  >();

  constructor(private readonly photon: PhotonProvider) {}

  async resolve(url: string): Promise<ResolvedMapLink> {
    const cached = this.readCache(url);
    if (cached) return cached;

    const finalUrl = await this.followRedirects(url);
    const parsed = parseMapUrl(finalUrl);
    if (!parsed) {
      throw new BadRequestException(ERROR_MESSAGES.PLACE.LINK_UNREADABLE);
    }

    // Link Google chỉ mang **tên** địa điểm, không có số nhà và quận huyện.
    // Dịch ngược toạ độ qua Photon để có địa chỉ đầy đủ mà không tốn tiền; hỏng
    // thì vẫn còn tên, ô địa chỉ chỉ nghèo hơn chứ không trống.
    const street = await this.photon.reverse(parsed.latitude, parsed.longitude);
    const resolved: ResolvedMapLink = {
      ...parsed,
      address: [parsed.name, street].filter(Boolean).join(', '),
    };

    this.writeCache(url, resolved);
    return resolved;
  }

  /**
   * Đi theo `Location` từng nhịp một thay vì để `fetch` tự chuyển hướng: mỗi
   * nhịp phải kiểm lại host, nếu không thì một link `goo.gl` trỏ ra ngoài là
   * kéo được backend đi gọi hộ bất kỳ đâu.
   */
  private async followRedirects(startUrl: string): Promise<string> {
    let current = startUrl;

    for (let hop = 0; hop < MAX_REDIRECTS; hop += 1) {
      this.assertAllowedHost(current);
      // Link đầy đủ đã chứa toạ độ thì khỏi gọi mạng.
      if (parseMapUrl(current)) return current;

      const response = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      const location = response.headers.get('location');
      if (!location) return current;
      current = new URL(location, current).toString();
    }

    return current;
  }

  private assertAllowedHost(url: string): void {
    let host: string;
    try {
      host = new URL(url).hostname;
    } catch {
      throw new BadRequestException(ERROR_MESSAGES.PLACE.LINK_UNREADABLE);
    }
    if (!ALLOWED_HOSTS.includes(host)) {
      this.logger.warn(`Chặn redirect ra host lạ: ${host}`);
      throw new BadRequestException(ERROR_MESSAGES.PLACE.LINK_UNREADABLE);
    }
  }

  private readCache(key: string): ResolvedMapLink | null {
    const hit = this.cache.get(key);
    if (!hit) return null;
    if (hit.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return hit.value;
  }

  private writeCache(key: string, value: ResolvedMapLink): void {
    if (this.cache.size >= CACHE_MAX_ENTRIES) {
      const [oldest] = this.cache.keys();
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
  }
}

/** Toạ độ hợp lệ — chặn cả `!3d` của thứ khác lọt vào. */
function isCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

/** Tên địa điểm nằm ở `/place/Ten+Dia+Diem/`; dấu `+` là khoảng trắng. */
function parsePlaceName(url: string): string {
  const match = /\/maps\/place\/([^/@?]+)/.exec(url);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1].replace(/\+/g, ' ')).trim();
  } catch {
    return '';
  }
}

/** Phần đọc được từ chính URL, chưa có địa chỉ đầy đủ. */
export type ParsedMapUrl = Omit<ResolvedMapLink, 'address'>;

export function parseMapUrl(url: string): ParsedMapUrl | null {
  const name = parsePlaceName(url);

  const pin = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/.exec(url);
  if (pin) {
    const [lat, lng] = [Number(pin[1]), Number(pin[2])];
    if (isCoordinate(lat, lng)) {
      return { latitude: lat, longitude: lng, name, precision: 'pin' };
    }
  }

  // `?q=`/`?query=`/`?ll=` là dạng link tự dựng, toạ độ trong đó là điểm thật.
  const query = /[?&](?:q|query|ll)=(-?\d+\.?\d*),(-?\d+\.?\d*)/.exec(url);
  if (query) {
    const [lat, lng] = [Number(query[1]), Number(query[2])];
    if (isCoordinate(lat, lng)) {
      return { latitude: lat, longitude: lng, name, precision: 'pin' };
    }
  }

  const viewport = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/.exec(url);
  if (viewport) {
    const [lat, lng] = [Number(viewport[1]), Number(viewport[2])];
    if (isCoordinate(lat, lng)) {
      return { latitude: lat, longitude: lng, name, precision: 'viewport' };
    }
  }

  return null;
}
