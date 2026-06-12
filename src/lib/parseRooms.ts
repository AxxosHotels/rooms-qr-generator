const MAX_ROOMS_PER_REQUEST = 100;

export type ParseRoomsErrorCode =
  | "empty"
  | "invalid"
  | "positive"
  | "rangeFormat"
  | "rangeOrder"
  | "tooMany";

export class ParseRoomsError extends Error {
  code: ParseRoomsErrorCode;

  constructor(code: ParseRoomsErrorCode) {
    super(code);
    this.code = code;
  }
}

function parseRoomNumber(value: string): number {
  if (!/^\d+$/.test(value)) {
    throw new ParseRoomsError("invalid");
  }

  const room = Number(value);

  if (!Number.isSafeInteger(room) || room <= 0) {
    throw new ParseRoomsError("positive");
  }

  return room;
}

export function parseRooms(input: string): number[] {
  const normalizedInput = input.trim();

  if (!normalizedInput) {
    throw new ParseRoomsError("empty");
  }

  const rangeParts = normalizedInput.split("-").map((part) => part.trim());

  if (rangeParts.length === 1) {
    return [parseRoomNumber(rangeParts[0])];
  }

  if (rangeParts.length !== 2 || !rangeParts[0] || !rangeParts[1]) {
    throw new ParseRoomsError("rangeFormat");
  }

  const start = parseRoomNumber(rangeParts[0]);
  const end = parseRoomNumber(rangeParts[1]);

  if (start > end) {
    throw new ParseRoomsError("rangeOrder");
  }

  const count = end - start + 1;

  if (count > MAX_ROOMS_PER_REQUEST) {
    throw new ParseRoomsError("tooMany");
  }

  return Array.from({ length: count }, (_, index) => start + index);
}
