import { Request, Response } from 'express';
import {
  createNotFoundDelayMiddleware,
  parseNotFoundDelayMs,
} from './not-found-delay.middleware';

describe('not found delay middleware', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('treats undefined, zero and invalid values as disabled', () => {
    expect(parseNotFoundDelayMs(undefined)).toBe(0);
    expect(parseNotFoundDelayMs('')).toBe(0);
    expect(parseNotFoundDelayMs('0')).toBe(0);
    expect(parseNotFoundDelayMs('-1')).toBe(0);
    expect(parseNotFoundDelayMs('abc')).toBe(0);
  });

  it('uses positive millisecond values', () => {
    expect(parseNotFoundDelayMs('250')).toBe(250);
    expect(parseNotFoundDelayMs('25.9')).toBe(25);
  });

  it('delays 404 responses before ending them', () => {
    jest.useFakeTimers();

    const end = jest.fn();
    const req = {
      isAuthenticated: () => false,
    } as unknown as Request;
    const res = {
      statusCode: 404,
      end,
    } as unknown as Response;
    const next = jest.fn();

    createNotFoundDelayMiddleware(100)(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    res.end('not found');
    expect(end).not.toHaveBeenCalled();

    jest.advanceTimersByTime(99);
    expect(end).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(end).toHaveBeenCalledWith('not found');
  });

  it('does not delay non-404 responses', () => {
    jest.useFakeTimers();

    const end = jest.fn();
    const res = {
      statusCode: 200,
      end,
    } as unknown as Response;

    createNotFoundDelayMiddleware(100)({} as Request, res, jest.fn());

    res.end('ok');
    expect(end).toHaveBeenCalledWith('ok');
  });

  it('does not delay authenticated 404 responses', () => {
    jest.useFakeTimers();

    const end = jest.fn();
    const req = {
      isAuthenticated: () => true,
    } as unknown as Request;
    const res = {
      statusCode: 404,
      end,
    } as unknown as Response;

    createNotFoundDelayMiddleware(100)(req, res, jest.fn());

    res.end('not found');
    expect(end).toHaveBeenCalledWith('not found');
  });
});
