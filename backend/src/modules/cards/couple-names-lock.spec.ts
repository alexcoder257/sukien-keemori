import { coupleNamesLockAt, isCoupleNamesLocked } from './couple-names-lock';

const DAY_MS = 24 * 60 * 60 * 1000;
const paidAt = new Date('2026-09-01T00:00:00Z');

describe('couple names lock', () => {
  it('locks exactly 15 days after the first payment', () => {
    expect(coupleNamesLockAt(paidAt)?.toISOString()).toBe(
      '2026-09-16T00:00:00.000Z',
    );
  });

  it('keeps names editable inside the 15-day window', () => {
    const now = new Date(paidAt.getTime() + 15 * DAY_MS - 1);
    expect(
      isCoupleNamesLocked(
        { status: 'paid', paidAt, coupleNamesUnlocked: false },
        now,
      ),
    ).toBe(false);
  });

  it('locks names once the window has passed', () => {
    const now = new Date(paidAt.getTime() + 15 * DAY_MS);
    expect(
      isCoupleNamesLocked(
        { status: 'paid', paidAt, coupleNamesUnlocked: false },
        now,
      ),
    ).toBe(true);
  });

  it('lets an admin unlock override the window', () => {
    const now = new Date(paidAt.getTime() + 60 * DAY_MS);
    expect(
      isCoupleNamesLocked(
        { status: 'paid', paidAt, coupleNamesUnlocked: true },
        now,
      ),
    ).toBe(false);
  });

  it('never locks cards that are not paid', () => {
    const now = new Date(paidAt.getTime() + 60 * DAY_MS);
    expect(
      isCoupleNamesLocked(
        { status: 'draft', paidAt: null, coupleNamesUnlocked: false },
        now,
      ),
    ).toBe(false);
  });
});
