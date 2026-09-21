import Tesseract from 'tesseract.js';

export interface ScanResult {
  actualAmount: string | null;
  calTime: string | null;
  rawText: string;
}

function extractActualAmount(text: string): string | null {
  const threeDecimal = text.match(/(\d+\.\d{3})/);
  if (threeDecimal) return threeDecimal[1];

  const anyDecimal = text.match(/(\d+\.\d+)/);
  if (anyDecimal) return anyDecimal[1];

  return null;
}

function extractCalTime(text: string): string | null {
  const lines = text.split('\n');

  for (const line of lines) {
    if (/cal/i.test(line) || /date/i.test(line) || /time/i.test(line)) {
      const times = [...line.matchAll(/(\d{1,2})\s*[:;.,]\s*(\d{2})/g)];
      if (times.length > 0) {
        const last = times[times.length - 1];
        const h = parseInt(last[1], 10);
        const m = parseInt(last[2], 10);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        }
      }
    }
  }

  const allTimes = [...text.matchAll(/(\d{1,2})\s*[:;.,]\s*(\d{2})/g)];
  for (const t of allTimes) {
    const h = parseInt(t[1], 10);
    const m = parseInt(t[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
  }

  return null;
}

function extractAmountAfterCalTime(fullText: string): string | null {
  const lines = fullText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/cal/i.test(lines[i]) && /(\d{1,2})\s*[:;.,]\s*(\d{2})/.test(lines[i])) {
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const match = lines[j].match(/(\d+\.\d{3})/);
        if (match) return match[1];
      }
    }
  }
  return null;
}

export async function scanImage(
  imageUri: string,
  imageWidth: number,
  imageHeight: number,
): Promise<ScanResult> {
  const worker = await Tesseract.createWorker('eng');

  try {
    const rowHeight = Math.round(imageHeight / 8);
    const calTimeTop = Math.round(imageHeight * 0.25);
    const actualAmountTop = calTimeTop + rowHeight;
    const regionWidth = Math.round(imageWidth * 0.9);
    const regionLeft = Math.round(imageWidth * 0.05);

    const calTimeResult = await worker.recognize(imageUri, {
      rectangle: { left: regionLeft, top: calTimeTop, width: regionWidth, height: rowHeight },
    });
    const actualAmountResult = await worker.recognize(imageUri, {
      rectangle: { left: regionLeft, top: actualAmountTop, width: regionWidth, height: rowHeight },
    });
    const fullResult = await worker.recognize(imageUri);

    const calTimeText = calTimeResult.data.text || '';
    const actualAmountText = actualAmountResult.data.text || '';
    const fullText = fullResult.data.text || '';

    let calTime = extractCalTime(calTimeText);
    if (!calTime) calTime = extractCalTime(fullText);

    let actualAmount = extractActualAmount(actualAmountText);
    if (!actualAmount) actualAmount = extractAmountAfterCalTime(fullText);
    if (!actualAmount) actualAmount = extractActualAmount(fullText);

    return { actualAmount, calTime, rawText: fullText };
  } finally {
    await worker.terminate();
  }
}
