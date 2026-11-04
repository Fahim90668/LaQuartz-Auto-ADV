import { DISCORD_EPOCH, SNOWFLAKE_PATTERN } from '../constants.js';

export function isSnowflake(value: unknown): value is string {
  return typeof value === 'string' && SNOWFLAKE_PATTERN.test(value);
}

export function assertSnowflake(value: unknown, name = 'ID'): string {
  if (!isSnowflake(value)) {
    throw new TypeError(`${name} is not a valid Discord snowflake.`);
  }
  return value;
}

export function snowflakeToDate(snowflake: string): Date {
  assertSnowflake(snowflake, 'snowflake');
  const ms = (BigInt(snowflake) >> 22n) + DISCORD_EPOCH;
  return new Date(Number(ms));
}

export function snowflakeFromDate(date: Date): string {
  const ms = BigInt(date.getTime()) - DISCORD_EPOCH;
  if (ms < 0n) {
    throw new RangeError('Date precedes the Discord epoch (2015-01-01).');
  }
  return (ms << 22n).toString();
}