import { parseMapUrl } from './map-link.service';

// Link thật, lấy từ nút "Chia sẻ" của Google Maps rồi đi theo redirect.
const REAL_URL =
  'https://www.google.com/maps/place/Nguy%C3%AAn+%C4%90%C3%ACnh+Tr%C6%B0%C6%A1ng+%C4%90%E1%BB%8Bnh/@20.9850463,105.8439469,17z/data=!3m1!4b1!4m6!3m5!1s0x3135ad0b5b21188b:0x800edf9e89b274e1!8m2!3d20.9850413!4d105.8465218!16s%2Fg%2F11fm3p7lwd?entry=tts';

describe('parseMapUrl', () => {
  it('đọc tên và toạ độ điểm ghim từ link thật', () => {
    expect(parseMapUrl(REAL_URL)).toEqual({
      latitude: 20.9850413,
      longitude: 105.8465218,
      name: 'Nguyên Đình Trương Định',
      precision: 'pin',
    });
  });

  /**
   * Nhánh quan trọng nhất: cùng một link có hai cặp toạ độ. `@` là tâm khung
   * nhìn lúc bấm chia sẻ, lệch ~280m so với điểm ghim ở link trên — đủ để ghim
   * sang bên kia đường, nên không được lấy nhầm.
   */
  it('ưu tiên điểm ghim hơn tâm khung nhìn', () => {
    const result = parseMapUrl(REAL_URL);
    expect(result?.longitude).toBe(105.8465218);
    expect(result?.longitude).not.toBe(105.8439469);
  });

  it('rơi về tâm khung nhìn khi link không có điểm ghim', () => {
    expect(
      parseMapUrl('https://www.google.com/maps/@20.98,105.84,17z'),
    ).toMatchObject({
      latitude: 20.98,
      longitude: 105.84,
      precision: 'viewport',
    });
  });

  it('đọc được link tự dựng dạng ?q=lat,lng', () => {
    expect(
      parseMapUrl('https://maps.google.com/maps?q=20.98,105.84'),
    ).toMatchObject({ latitude: 20.98, longitude: 105.84, precision: 'pin' });
  });

  it('trả null khi link không có toạ độ nào', () => {
    expect(
      parseMapUrl('https://www.google.com/maps/search/tiec+cuoi'),
    ).toBeNull();
  });

  /** Chuỗi `!3d` của thứ khác lọt vào thì vẫn phải là toạ độ hợp lệ. */
  it('bỏ qua toạ độ ngoài dải hợp lệ', () => {
    expect(
      parseMapUrl('https://www.google.com/maps/place/x/!3d999!4d888'),
    ).toBeNull();
  });
});
