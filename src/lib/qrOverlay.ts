import { PNG } from "pngjs";
import QRCode from "qrcode";

const CHARACTER_PATTERNS: Record<string, string[]> = {
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
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10011", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "01010", "00100", "00100", "00100", "01010", "10001"],
  Y: ["10001", "01010", "00100", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
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

function drawCharacter({
  character,
  png,
  scale,
  x,
  y,
}: {
  character: string;
  png: PNG;
  scale: number;
  x: number;
  y: number;
}) {
  const pattern = CHARACTER_PATTERNS[character];

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

function getCharacterColumns(character: string) {
  return character === " " ? 3 : 5;
}

function getTextColumns(text: string) {
  return [...text].reduce((total, character, index) => {
    const spacing = index === 0 ? 0 : 1;
    return total + spacing + getCharacterColumns(character);
  }, 0);
}

function drawOverlayText({
  overlayText,
  png,
  rectangle,
}: {
  overlayText: string;
  png: PNG;
  rectangle: { x: number; y: number; width: number; height: number };
}) {
  const characters = overlayText.toUpperCase().split("");
  const cellColumns = getTextColumns(overlayText);
  const scale = Math.max(
    1,
    Math.min(
      4,
      Math.floor((rectangle.width - 12) / cellColumns),
      Math.floor((rectangle.height - 8) / 7),
    ),
  );
  const textWidth = cellColumns * scale;
  const textHeight = 7 * scale;
  let cursorX = rectangle.x + Math.round((rectangle.width - textWidth) / 2);
  const textY = rectangle.y + Math.round((rectangle.height - textHeight) / 2);

  characters.forEach((character, index) => {
    if (index > 0) {
      cursorX += scale;
    }

    if (character !== " ") {
      drawCharacter({ character, png, scale, x: cursorX, y: textY });
    }

    cursorX += getCharacterColumns(character) * scale;
  });
}

export async function createQrPngWithRoomOverlay({
  overlayText,
  qrSize,
  url,
}: {
  overlayText: string;
  qrSize: number;
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
    width: Math.round(qrSize * 0.25),
    height: Math.round(qrSize * 0.072),
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
  drawOverlayText({ overlayText, png, rectangle });

  return PNG.sync.write(png);
}
