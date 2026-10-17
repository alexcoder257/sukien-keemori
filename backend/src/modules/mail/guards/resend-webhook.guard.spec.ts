import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import {
  ResendWebhookGuard,
  verifySvixSignature,
} from './resend-webhook.guard';

const KEY = Buffer.from('keemori-test-signing-key');
const SECRET = `whsec_${KEY.toString('base64')}`;
const NOW = 1_790_000_000;
const BODY = Buffer.from(
  '{"type":"email.received","data":{"from":"An <a@b.c>"}}',
);

function sign(id: string, timestamp: number, body: Buffer, key = KEY) {
  return createHmac('sha256', key)
    .update(`${id}.${timestamp}.${body.toString()}`)
    .digest('base64');
}

function input(overrides: Partial<Parameters<typeof verifySvixSignature>[0]>) {
  return {
    secret: SECRET,
    id: 'msg_1',
    timestamp: String(NOW),
    signature: `v1,${sign('msg_1', NOW, BODY)}`,
    rawBody: BODY,
    nowSeconds: NOW,
    ...overrides,
  };
}

describe('verifySvixSignature', () => {
  it('nhận chữ ký đúng', () => {
    expect(verifySvixSignature(input({}))).toBe(true);
  });

  it('nhận khi một trong nhiều chữ ký khớp (đang xoay secret)', () => {
    const other = sign('msg_1', NOW, BODY, Buffer.from('old-key'));
    const valid = sign('msg_1', NOW, BODY);
    expect(
      verifySvixSignature(input({ signature: `v1,${other} v1,${valid}` })),
    ).toBe(true);
  });

  it('từ chối khi body bị sửa', () => {
    expect(
      verifySvixSignature(input({ rawBody: Buffer.from('{"type":"x"}') })),
    ).toBe(false);
  });

  it('từ chối khi ký bằng secret khác', () => {
    const forged = sign('msg_1', NOW, BODY, Buffer.from('attacker'));
    expect(verifySvixSignature(input({ signature: `v1,${forged}` }))).toBe(
      false,
    );
  });

  it('từ chối timestamp lệch quá 5 phút', () => {
    expect(verifySvixSignature(input({ nowSeconds: NOW + 301 }))).toBe(false);
  });

  it('từ chối khi thiếu header hoặc raw body', () => {
    expect(verifySvixSignature(input({ id: undefined }))).toBe(false);
    expect(verifySvixSignature(input({ signature: undefined }))).toBe(false);
    expect(verifySvixSignature(input({ rawBody: undefined }))).toBe(false);
  });
});

describe('ResendWebhookGuard', () => {
  function context(headers: Record<string, string>, rawBody?: Buffer) {
    return {
      switchToHttp: () => ({ getRequest: () => ({ headers, rawBody }) }),
    } as unknown as ExecutionContext;
  }

  function guard(secret?: string) {
    return new ResendWebhookGuard({
      get: () => secret,
    } as unknown as ConfigService);
  }

  it('trả 503 khi chưa cấu hình secret', () => {
    expect(() => guard().canActivate(context({}))).toThrow(
      ServiceUnavailableException,
    );
  });

  it('trả 401 khi không có chữ ký', () => {
    expect(() => guard(SECRET).canActivate(context({}, BODY))).toThrow(
      UnauthorizedException,
    );
  });

  it('cho qua request ký đúng', () => {
    const now = Math.floor(Date.now() / 1000);
    const headers = {
      'svix-id': 'msg_2',
      'svix-timestamp': String(now),
      'svix-signature': `v1,${sign('msg_2', now, BODY)}`,
    };
    expect(guard(SECRET).canActivate(context(headers, BODY))).toBe(true);
  });
});
