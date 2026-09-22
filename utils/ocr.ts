import Tesseract from 'tesseract.js';

export interface ScanResult {
  actualAmount: string | null;
  calTime: string | null;
  rawText: string;
}

function findTimeInLine(line: string): string | null {
  const times = [...line.matchAll(/(\d{1,2})\s*[:;.,]\s*(\d{2})/g)];
  for (const t of times) {
    const h = parseInt(t[1], 10);
    const m = parseInt(t[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
  }
  return null;
}

function extractData(fullText: string): { actualAmount: string | null; calTime: string | null } {
  const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);

  let amountLineIndex = -1;
  let actualAmount: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/(\d+\.\d{3})/);
    if (match) {
      actualAmount = match[1];
      amountLineIndex = i;
      break;
    }
  }

  let calTime: string | null = null;

  if (amountLineIndex > 0) {
    for (let i = amountLineIndex - 1; i >= 0; i--) {
      const time = findTimeInLine(lines[i]);
      if (time) {
        calTime = time;
        break;
      }
    }
  }

  if (!calTime) {
    for (let i = 0; i < lines.length; i++) {
      if (amountLineIndex >= 0 && i > amountLineIndex) continue;
      const time = findTimeInLine(lines[i]);
      if (time) {
        calTime = time;
        break;
      }
    }
  }

  return { actualAmount, calTime };
}

export async function scanImage(
  imageUri: string,
  _imageWidth: number,
  _imageHeight: number,
): Promise<ScanResult> {
  const result = await Tesseract.recognize(imageUri, 'eng', {
    logger: () => {},
  } as unknown as Partial<Tesseract.WorkerOptions>);

  const rawText = result.data.text || '';
  const { actualAmount, calTime } = extractData(rawText);

  return { actualAmount, calTime, rawText };
}
