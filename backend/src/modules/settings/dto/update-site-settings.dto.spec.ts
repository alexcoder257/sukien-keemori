import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateSiteSettingsDto } from './update-site-settings.dto';

/** Chạy đúng hai bước của `ValidationPipe`: transform rồi validate. */
async function parse(body: Record<string, unknown>) {
  const dto = plainToInstance(UpdateSiteSettingsDto, body);
  const errors = await validate(dto);
  return { dto, errors };
}

describe('UpdateSiteSettingsDto — số Zalo', () => {
  it('bỏ khoảng trắng và dấu chấm của số dán vào', async () => {
    const { dto, errors } = await parse({ zaloPhone: '0358 465.162' });

    expect(errors).toHaveLength(0);
    expect(dto.zaloPhone).toBe('0358465162');
  });

  it('chuỗi rỗng là gỡ số, không phải lỗi', async () => {
    const { dto, errors } = await parse({ zaloPhone: '  ' });

    expect(errors).toHaveLength(0);
    expect(dto.zaloPhone).toBeNull();
  });

  it.each(['358465162', '+84358465162', '03584651620', 'zalo.me/0358465162'])(
    'từ chối %s — link dựng từ nó sẽ mở ra tài khoản không tồn tại',
    async (zaloPhone) => {
      const { errors } = await parse({ zaloPhone });

      expect(errors.map((error) => error.property)).toContain('zaloPhone');
    },
  );
});
