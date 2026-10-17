import { Injectable, Logger } from '@nestjs/common';
import type { PlaceSuggestion } from './places.types';

const PHOTON_SEARCH_URL = 'https://photon.komoot.io/api/';
const PHOTON_REVERSE_URL = 'https://photon.komoot.io/reverse';
const FETCH_TIMEOUT_MS = 5000;
const MAX_RESULTS = 5;
/**
 * Hộp bao Việt Nam `minLon,minLat,maxLon,maxLat`. Đây là **bộ lọc cứng**, không
 * phải ưu tiên: gõ "104" mà chỉ bias theo toạ độ thì Photon trả về Reykjavík và
 * Đài Bắc trước cả Đà Nẵng. Kèm thêm lọc `countrycode` vì hộp bao có liếm sang
 * biên giới Lào, Campuchia và Trung Quốc.
 */
const VN_BBOX = '102.1,8.1,110.0,23.5';
const VN_COUNTRY_CODE = 'VN';
/** Điểm bias để cùng trong hộp bao thì chỗ gần trung tâm đất nước lên trước. */
const VN_CENTER = { lat: 16.0, lon: 107.9 };
/**
 * Photon yêu cầu định danh ứng dụng trong `User-Agent` để họ chặn được bên lạm
 * dụng mà không phải chặn cả dải IP. Đây là dịch vụ miễn phí do Komoot chạy —
 * cư xử tử tế là điều kiện để còn được dùng.
 */
const USER_AGENT = 'thiep-cuoi-online/1.0 (+https://thiepcuoi.online)';

interface PhotonFeature {
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    osm_id?: number;
    osm_type?: string;
  };
  geometry?: { coordinates?: [number, number] };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

/**
 * Gợi ý địa điểm bằng **Photon** — máy tìm kiếm mở chạy trên dữ liệu
 * OpenStreetMap. Không cần API key, không hạn mức tính tiền, không hồ sơ thanh
 * toán, nên nó là nguồn mặc định của dự án này; Google Places chỉ bật khi có key
 * và khi thật sự cần độ phủ tên thương mại.
 *
 * Đánh đổi cần biết: OSM mạnh ở đường sá, phường xã, địa danh công cộng và yếu
 * hơn Google ở tên nhà hàng tiệc cưới mới mở. Với ô "Địa chỉ nhà trai/nhà gái"
 * thì đây lại đúng thứ cần; còn với nhà hàng thì đường chính xác nhất vẫn là dán
 * link Google Maps (xem `MapLinkService`).
 *
 * **Bắt buộc ghi công**: dữ liệu © OpenStreetMap contributors, và UI phải hiện
 * dòng đó ở nơi người dùng thấy danh sách gợi ý.
 */
@Injectable()
export class PhotonProvider {
  private readonly logger = new Logger(PhotonProvider.name);

  async autocomplete(query: string): Promise<PlaceSuggestion[]> {
    const params = new URLSearchParams({
      q: query,
      // Xin dư một ít rồi tự lọc: vài kết quả trong hộp bao vẫn thuộc nước khác.
      limit: String(MAX_RESULTS * 2),
      bbox: VN_BBOX,
      lat: String(VN_CENTER.lat),
      lon: String(VN_CENTER.lon),
    });

    const body = await this.get<PhotonResponse>(
      `${PHOTON_SEARCH_URL}?${params.toString()}`,
    );
    if (!body) return [];

    return (body.features ?? [])
      .filter((feature) => feature.properties?.countrycode === VN_COUNTRY_CODE)
      .map((feature) => toSuggestion(feature))
      .filter((item): item is PlaceSuggestion => item !== null)
      .slice(0, MAX_RESULTS);
  }

  /**
   * Toạ độ → địa chỉ chữ. Dùng sau khi bóc được toạ độ từ link Google Maps: link
   * chỉ mang **tên** địa điểm, còn số nhà và quận huyện thì phải hỏi ngược lại,
   * và đây là cách hỏi mà không tốn tiền.
   */
  async reverse(latitude: number, longitude: number): Promise<string> {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
    });

    const body = await this.get<PhotonResponse>(
      `${PHOTON_REVERSE_URL}?${params.toString()}`,
    );
    const feature = body?.features?.[0];
    if (!feature) return '';

    // Bỏ `name` ở đây: tên nơi chốn theo OSM thường lệch với tên thương mại mà
    // người dùng biết, mà tên thì link Google đã cho rồi.
    return formatAddress(feature, { includeName: false });
  }

  private async get<T>(url: string): Promise<T | null> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(`Photon trả ${response.status}`);
        return null;
      }
      return (await response.json()) as T;
    } catch (error) {
      // Gợi ý là tiện ích: hỏng thì im lặng trả rỗng, người dùng gõ tay tiếp.
      this.logger.warn(
        `Gọi Photon thất bại: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return null;
    }
  }
}

/** Ghép các mảnh địa chỉ theo thứ tự người Việt đọc địa chỉ: hẹp → rộng. */
function formatAddress(
  feature: PhotonFeature,
  { includeName }: { includeName: boolean },
): string {
  const p = feature.properties ?? {};
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  return (
    [
      includeName ? p.name : undefined,
      street,
      p.district,
      p.city ?? p.county,
      p.state,
    ]
      .map((part) => part?.trim())
      .filter((part): part is string => !!part)
      // Photon hay lặp lại cùng một tên ở hai cấp (district = city ở thành phố
      // trực thuộc trung ương); lặp trong địa chỉ đọc rất kỳ.
      .filter((part, index, all) => all.indexOf(part) === index)
      .join(', ')
  );
}

function toSuggestion(feature: PhotonFeature): PlaceSuggestion | null {
  const p = feature.properties ?? {};
  const coordinates = feature.geometry?.coordinates;
  // Nhiều điểm OSM không có `name`; lúc đó số nhà + đường mới là thứ người dùng
  // nhận ra, và nếu cả hai đều trống thì rơi tiếp xuống cấp hành chính.
  const mainText =
    p.name ||
    [p.housenumber, p.street].filter(Boolean).join(' ') ||
    p.district ||
    p.city ||
    '';
  if (!mainText || !coordinates) return null;

  const [longitude, latitude] = coordinates;
  return {
    // OSM không có "place id" như Google; cặp type:id là khoá ổn định của họ.
    placeId: `${p.osm_type ?? 'n'}:${p.osm_id ?? ''}`,
    mainText,
    secondaryText: formatAddress(feature, { includeName: false }),
    latitude,
    longitude,
  };
}
