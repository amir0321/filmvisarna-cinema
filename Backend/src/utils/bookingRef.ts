import { randomInt } from 'node:crypto';

export const BOOKING_REF_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ' as const;
export const BOOKING_REF_PREFIX = 'FV-' as const;
export const BOOKING_REF_CODE_LENGTH = 5 as const;
export const DEFAULT_MAX_RETRIES = 5 as const;

export const BOOKING_REF_REGEX = new RegExp(
  `^${BOOKING_REF_PREFIX}[${BOOKING_REF_ALPHABET}]{${BOOKING_REF_CODE_LENGTH}}$`
);

export type CheckRefExistsFn = (ref: string) => Promise<boolean>;
export type BookingRefGeneratorFn = () => string;

export class BookingRefGenerationError extends Error {
  readonly attempts: number;

  constructor(attempts: number, message?: string) {
    super(
      message ??
        `Kunde inte generera en unik bokningsreferens efter ${attempts} försök på grund av kollisioner.`
    );
    this.name = 'BookingRefGenerationError';
    this.attempts = attempts;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BookingRefGenerationError);
    }
  }
}

export function generateBookingRefCode(
  length: number = BOOKING_REF_CODE_LENGTH,
  prefix: string = BOOKING_REF_PREFIX,
  alphabet: string = BOOKING_REF_ALPHABET
): string {
  if (length < 1) {
    throw new RangeError('Bokningskodens längd måste vara minst 1 tecken.');
  }
  if (!alphabet || alphabet.length < 2) {
    throw new RangeError('Alfabetet måste innehålla minst 2 unika tecken.');
  }

  let randomPart = '';
  const alphabetLength = alphabet.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = randomInt(0, alphabetLength);
    randomPart += alphabet.charAt(randomIndex);
  }

  return `${prefix}${randomPart}`;
}

export async function generateUniqueBookingRef(
  checkExists: CheckRefExistsFn,
  maxRetries: number = DEFAULT_MAX_RETRIES,
  generator: BookingRefGeneratorFn = generateBookingRefCode
): Promise<string> {
  if (typeof checkExists !== 'function') {
    throw new TypeError('checkExists måste vara en funktion.');
  }

  if (maxRetries < 1 || !Number.isInteger(maxRetries)) {
    throw new RangeError('maxRetries måste vara ett positivt heltal större än eller lika med 1.');
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const candidateRef = generator();
    const exists = await checkExists(candidateRef);

    if (!exists) {
      return candidateRef;
    }
  }

  throw new BookingRefGenerationError(
    maxRetries,
    `Kunde inte generera en unik bokningsreferens efter ${maxRetries} försök på grund av kollisioner i databasen.`
  );
}
