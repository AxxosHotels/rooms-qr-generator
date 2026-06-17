import { PNG } from "pngjs";
import QRCode from "qrcode";

const DIGIT_PATTERNS: Record<string, string[]> = {
  "0": ["11111", "10001", "10011", "10101", "11001", "10001", "11111"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["11111", "00001", "00001", "11111", "10000", "10000", "11111"],
  "3": ["11111", "00001", "00001", "11111", "00001", "00001", "11111"],
  "4": ["10001", "10001", "10001", "11111", "00001", "00001", "00001"],
  "5": ["11111", "10000", "10000", "11111", "00001", "00001", "11111"],
  "6": ["11111", "10000", "10000", "11111", "10001", "10001", "11111"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["11111", "10001", "10001", "11111", "10001", "10001", "11111"],
  "9": ["11111", "10001", "10001", "11111", "00001", "00001", "11111"],
};

const BLACK = [0, 0, 0, 255] as const;
const WHITE = [255, 255, 255, 255] as const;

function setPixel(png: PNG, x: number, y: number, color: readonly number[]) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) {
    return;
  }

  const index = (png.width * y + x) * 4;
  png.data[index] = color[0];
  png.data[index + 1] = color[1];
  png.data[index + 2] = color[2];
  png.data[index + 3] = color[3];
}

function drawRoundedRectangle({
  color,
  height,
  png,
  radius,
  width,
  x,
  y,
}: {
  color: readonly number[];
  height: number;
  png: PNG;
  radius: number;
  width: number;
  x: number;
  y: number;
}) {
  for (let pixelY = y; pixelY < y + height; pixelY += 1) {
    for (let pixelX = x; pixelX < x + width; pixelX += 1) {
      const left = pixelX - x;
      const right = x + width - 1 - pixelX;
      const top = pixelY - y;
      const bottom = y + height - 1 - pixelY;
      const cornerX = Math.min(left, right);
      const cornerY = Math.min(top, bottom);

      if (cornerX >= radius || cornerY >= radius) {
        setPixel(png, pixelX, pixelY, color);
        continue;
      }

      const distanceX = radius - cornerX - 1;
      const distanceY = radius - cornerY - 1;

      if (distanceX * distanceX + distanceY * distanceY <= radius * radius) {
        setPixel(png, pixelX, pixelY, color);
      }
    }
  }
}

function drawDigit({
  digit,
  png,
  scale,
  x,
  y,
}: {
  digit: string;
  png: PNG;
  scale: number;
  x: number;
  y: number;
}) {
  const pattern = DIGIT_PATTERNS[digit];

  if (!pattern) {
    return;
  }

  pattern.forEach((row, rowIndex) => {
    [...row].forEach((cell, columnIndex) => {
      if (cell !== "1") {
        return;
      }

      for (let offsetY = 0; offsetY < scale; offsetY += 1) {
        for (let offsetX = 0; offsetX < scale; offsetX += 1) {
          setPixel(
            png,
            x + columnIndex * scale + offsetX,
            y + rowIndex * scale + offsetY,
            BLACK,
          );
        }
      }
    });
  });
}

function drawRoomNumber({
  png,
  room,
  rectangle,
}: {
  png: PNG;
  room: number;
  rectangle: { x: number; y: number; width: number; height: number };
}) {
  const digits = String(room).split("");
  const cellColumns = digits.length * 5 + Math.max(0, digits.length - 1);
  const scale = Math.max(
    2,
    Math.min(
      4,
      Math.floor((rectangle.width - 10) / cellColumns),
      Math.floor((rectangle.height - 8) / 7),
    ),
  );
  const textWidth = cellColumns * scale;
  const textHeight = 7 * scale;
  let cursorX = rectangle.x + Math.round((rectangle.width - textWidth) / 2);
  const textY = rectangle.y + Math.round((rectangle.height - textHeight) / 2);

  digits.forEach((digit) => {
    drawDigit({ digit, png, scale, x: cursorX, y: textY });
    cursorX += 6 * scale;
  });
}

export async function createQrPngWithRoomOverlay({
  qrSize,
  room,
  url,
}: {
  qrSize: number;
  room: number;
  url: string;
}) {
  const qrPng = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    margin: 0,
    type: "png",
    width: qrSize,
  });
  const png = PNG.sync.read(qrPng);
  const rectangle = {
    width: Math.round(qrSize * 0.15),
    height: Math.round(qrSize * 0.064),
    x: 0,
    y: 0,
  };

  rectangle.x = Math.round((qrSize - rectangle.width) / 2);
  rectangle.y = Math.round(qrSize * 0.725 - rectangle.height / 2);

  drawRoundedRectangle({
    color: WHITE,
    height: rectangle.height,
    png,
    radius: Math.round(rectangle.height * 0.28),
    width: rectangle.width,
    x: rectangle.x,
    y: rectangle.y,
  });
  drawRoomNumber({ png, room, rectangle });

  return PNG.sync.write(png);
}
