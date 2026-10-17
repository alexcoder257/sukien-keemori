import type { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MAIL_SENDER_NAME, MailService, senderAddress } from './mail.service';

jest.mock('nodemailer');

describe('senderAddress', () => {
  it('bóc địa chỉ khỏi dạng có tên', () => {
    expect(senderAddress('Thiệp Cưới Online <no-reply@keemori.com>')).toBe(
      'no-reply@keemori.com',
    );
  });

  it('giữ nguyên chuỗi chỉ có địa chỉ', () => {
    expect(senderAddress(' no-reply@keemori.com ')).toBe(
      'no-reply@keemori.com',
    );
  });
});

describe('MailService', () => {
  it('luôn gửi với tên Keemori, bỏ qua tên cũ trong MAIL_FROM', async () => {
    const sendMail = jest.fn().mockResolvedValue({});
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
    const env: Record<string, string> = {
      MAIL_HOST: 'smtp.resend.com',
      MAIL_USER: 'resend',
      MAIL_PASSWORD: 're_test',
      MAIL_FROM: 'Thiệp Cưới Online <no-reply@keemori.com>',
    };
    const service = new MailService({
      get: (key: string) => env[key],
    } as unknown as ConfigService);

    await service.sendResetPasswordEmail(
      'an@example.com',
      'An',
      'https://keemori.com/x',
      30,
    );

    const [options] = sendMail.mock.calls[0] as [{ from: unknown }];
    expect(options.from).toEqual({
      name: MAIL_SENDER_NAME,
      address: 'no-reply@keemori.com',
    });
    expect(MAIL_SENDER_NAME).toBe('Keemori - Thiệp Cưới Online');
  });
});
