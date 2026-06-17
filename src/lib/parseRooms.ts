const MAX_ROOMS_PER_REQUEST = 100;

type ParsedRoom = {
  numberText: string;
  prefix: string;
  number: number;
};

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

function parseRoom(value: string): ParsedRoom {
  const match = value.match(/^([A-Za-z]*)(\d+)$/);

  if (!match) {
    throw new ParseRoomsError("invalid");
  }

  const [, prefix, roomNumber] = match;
  const room = Number(roomNumber);

  if (!Number.isSafeInteger(room) || room <= 0) {
    throw new ParseRoomsError("positive");
  }

  return {
    numberText: roomNumber,
    prefix: prefix.toUpperCase(),
    number: room,
  };
}

function formatRoomWithPadding({
  number,
  padding,
  prefix,
}: {
  number: number;
  padding: number;
  prefix: string;
}) {
  return `${prefix}${String(number).padStart(padding, "0")}`;
}

export function parseRooms(input: string): string[] {
  const normalizedInput = input.trim();

  if (!normalizedInput) {
    throw new ParseRoomsError("empty");
  }

  const rangeParts = normalizedInput.split("-").map((part) => part.trim());

  if (rangeParts.length === 1) {
    const room = parseRoom(rangeParts[0]);

    return [`${room.prefix}${room.numberText}`];
  }

  if (rangeParts.length !== 2 || !rangeParts[0] || !rangeParts[1]) {
    throw new ParseRoomsError("rangeFormat");
  }

  const start = parseRoom(rangeParts[0]);
  const end = parseRoom(rangeParts[1]);

  if (start.prefix !== end.prefix) {
    throw new ParseRoomsError("rangeFormat");
  }

  if (start.number > end.number) {
    throw new ParseRoomsError("rangeOrder");
  }

  const count = end.number - start.number + 1;

  if (count > MAX_ROOMS_PER_REQUEST) {
    throw new ParseRoomsError("tooMany");
  }

  return Array.from({ length: count }, (_, index) =>
    formatRoomWithPadding({
      padding: start.numberText.length,
      prefix: start.prefix,
      number: start.number + index,
    }),
  );
}
