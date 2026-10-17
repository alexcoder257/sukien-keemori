import { IsString, MaxLength, Matches } from 'class-validator';

/**
 * Link chia sẻ từ Google Maps. Chỉ nhận đúng những host của Google: hàm xử lý
 * đi theo redirect, nên nếu để lọt host tuỳ ý thì đây thành một cỗ máy gọi hộ
 * request tới mạng nội bộ (SSRF).
 */
export class ResolveMapLinkDto {
  @IsString()
  @MaxLength(2000)
  @Matches(
    /^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|(www\.)?google\.[a-z.]{2,6}\/maps|maps\.google\.[a-z.]{2,6})\//,
    { message: 'Chỉ nhận link chia sẻ của Google Maps' },
  )
  url: string;
}
