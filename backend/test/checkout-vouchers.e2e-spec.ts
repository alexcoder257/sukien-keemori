import { Test } from '@nestjs/testing';
import {
  type ExecutionContext,
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { CommerceController } from '@modules/commerce/commerce.controller';
import { CommerceService } from '@modules/commerce/commerce.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';

describe('Checkout vouchers API', () => {
  let app: INestApplication<App>;
  const availableVouchers = jest.fn().mockResolvedValue([]);

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [CommerceController],
      providers: [
        { provide: CommerceService, useValue: { availableVouchers } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context.switchToHttp().getRequest<{
            headers: Record<string, string>;
            user?: { userId: string };
          }>();
          if (!req.headers['x-test-user']) throw new UnauthorizedException();
          req.user = { userId: req.headers['x-test-user'] };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(() => app.close());
  beforeEach(() => availableVouchers.mockClear());

  it('requires authentication', async () => {
    await request(app.getHttpServer())
      .post('/orders/available-vouchers')
      .send({})
      .expect(401);
    expect(availableVouchers).not.toHaveBeenCalled();
  });

  it('uses the authenticated account, never a user ID or amount from the client', async () => {
    await request(app.getHttpServer())
      .post('/orders/available-vouchers')
      .set('x-test-user', 'owner-1')
      .send({ userId: 'another-user', amount: 1 })
      .expect(200, []);
    // The service only ever receives the authenticated user ID: the price is
    // looked up server-side, so there is no client-controlled amount.
    expect(availableVouchers).toHaveBeenCalledTimes(1);
    expect(availableVouchers).toHaveBeenCalledWith('owner-1');
  });
});
