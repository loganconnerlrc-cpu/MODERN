import Tesseract from 'tesseract.js';

export interface ScanResult {
  actualAmount: string | null;
  calTime: string | null;
  rawText: string;
}

function cleanOcrText(text: string): string {
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
      const scale = Math.max(2, Math.min(4, 2000 / Math.max(img.width, img.height)));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUri);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      const gray = new Float32Array(w * h);
      for (let i = 0; i < gray.length; i++) {
        const p = i * 4;
        gray[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
      }

      const sharpened = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
            sharpened[idx] = gray[idx];
            continue;
          }
          const center = gray[idx] * 5;
          const neighbors =
            gray[idx - 1] + gray[idx + 1] + gray[idx - w] + gray[idx + w];
          sharpened[idx] = Math.max(0, Math.min(255, center - neighbors));
        }
      }

      const blockSize = 31;
      const halfBlock = (blockSize - 1) >> 1;
      const cOffset = 12;

      const integral = new Float64Array((w + 1) * (h + 1));
      for (let y = 0; y < h; y++) {
        let rowSum = 0;
        for (let x = 0; x < w; x++) {
          rowSum += sharpened[y * w + x];
          integral[(y + 1) * (w + 1) + (x + 1)] =
            rowSum + integral[y * (w + 1) + (x + 1)];
        }
      }

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const x1 = Math.max(0, x - halfBlock);
          const y1 = Math.max(0, y - halfBlock);
          const x2 = Math.min(w - 1, x + halfBlock);
          const y2 = Math.min(h - 1, y + halfBlock);
          const count = (x2 - x1 + 1) * (y2 - y1 + 1);

          const sum =
            integral[(y2 + 1) * (w + 1) + (x2 + 1)] -
            integral[y1 * (w + 1) + (x2 + 1)] -
            integral[(y2 + 1) * (w + 1) + x1] +
            integral[y1 * (w + 1) + x1];

          const threshold = sum / count - cOffset;
          const bw = sharpened[y * w + x] < threshold ? 0 : 255;
          const p = (y * w + x) * 4;
          data[p] = bw;
          data[p + 1] = bw;
          data[p + 2] = bw;
        }
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

  const worker = await Tesseract.createWorker('eng');
  await worker.setParameters({
    tessedit_char_whitelist: '0123456789.:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/ -',
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
  });

  const result = await worker.recognize(processedUri);
  await worker.terminate();

  const rawText = result.data.text || '';
  const { actualAmount, calTime } = extractData(rawText);

  return { actualAmount, calTime, rawText };
}
