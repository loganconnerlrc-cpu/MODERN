import Tesseract from 'tesseract.js';

export interface ScanResult {
  actualAmount: string | null;
  calTime: string | null;
  rawText: string;
}

function cleanOcrText(text: string): string {
  // Replace l/I/| with 1 when adjacent to digits or decimal points
  return text.replace(/([0-9.])([lI|])/g, '$11').replace(/([lI|])([0-9.])/g, '1$2');
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
  const cleaned = cleanOcrText(fullText);
  const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);

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

function preprocessImage(imageUri: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUri);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const bw = gray > 140 ? 255 : 0;
        data[i] = bw;
        data[i + 1] = bw;
        data[i + 2] = bw;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(imageUri);
    img.src = imageUri;
  });
}

export async function scanImage(
  imageUri: string,
  _imageWidth: number,
  _imageHeight: number,
): Promise<ScanResult> {
  const processedUri = await preprocessImage(imageUri);

  const result = await Tesseract.recognize(processedUri, 'eng', {
    logger: () => {},
  } as unknown as Partial<Tesseract.WorkerOptions>);

  const rawText = result.data.text || '';
  const { actualAmount, calTime } = extractData(rawText);

  return { actualAmount, calTime, rawText };
}
