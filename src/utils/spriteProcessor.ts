import {
  HIGGS_MODELS_SHEET,
  HIGGS_PIECES_SHEET,
  LOOKS_DATA,
  PIECES_DATA,
  LookEntry,
  PieceItem,
} from '../data/collectionData';

export interface ProcessedAssets {
  models: Record<number, string>; // keyed by lookNumber (1..20)
  pieces: Record<number, string>; // keyed by piece.id (0..39)
  ready: boolean;
}

const cachedAssets: ProcessedAssets = {
  models: {},
  pieces: {},
  ready: false,
};

let processingPromise: Promise<ProcessedAssets> | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Finds the tight bounding box [minX, maxX, minY, maxY] of non-transparent pixels
 * so every model can be normalized to the exact same head-to-toe height as Look 6.
 */
function findAlphaBounds(canvas: HTMLCanvasElement): [number, number, number, number] {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [0, w - 1, 0, h - 1];

  const data = ctx.getImageData(0, 0, w, h).data;
  let minX = w;
  let maxX = 0;
  let minY = h;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX >= maxX || minY >= maxY) {
    return [0, w - 1, 0, h - 1];
  }
  return [minX, maxX, minY, maxY];
}

/**
 * Places any cropped transparent model onto a standardized 640x840 canvas
 * where the model's head-to-toe height always fills 96% of the canvas height (matching Look 6).
 */
function normalizeModelHeight(sourceCanvas: HTMLCanvasElement): string {
  const [minX, maxX, minY, maxY] = findAlphaBounds(sourceCanvas);
  const bw = Math.max(1, maxX - minX + 1);
  const bh = Math.max(1, maxY - minY + 1);

  const outW = 760;
  const outH = 840;
  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const ctx = out.getContext('2d');
  if (!ctx) return sourceCanvas.toDataURL('image/png');

  // Strictly lock head-to-toe vertical height to 96% of outH so Look 7, 10, 20 match Look 6 height
  const targetH = outH * 0.96;
  const scale = targetH / bh;

  const dw = Math.round(bw * scale);
  const dh = Math.round(bh * scale);
  const dx = Math.round((outW - dw) / 2);
  const dy = Math.round(outH * 0.985 - dh);

  ctx.drawImage(sourceCanvas, minX, minY, bw, bh, dx, dy, dw, dh);
  return out.toDataURL('image/png');
}

/**
 * Removes solid white studio background from a solo model portrait using 4-border BFS flood-fill
 * and returns an offscreen canvas with a transparent background.
 */
function removeStudioWhiteBackground(img: HTMLImageElement): HTMLCanvasElement {
  const targetW = 600;
  const targetH = 800;
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.drawImage(img, 0, 0, targetW, targetH);
  const imgData = ctx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;
  const total = targetW * targetH;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const isBgWhite = (idx: number): boolean => {
    const p = idx * 4;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return r >= 220 && g >= 220 && b >= 220 && max - min <= 25;
  };

  for (let x = 0; x < targetW; x++) {
    const top = x;
    const bot = (targetH - 1) * targetW + x;
    if (!visited[top] && isBgWhite(top)) {
      visited[top] = 1;
      queue[tail++] = top;
    }
    if (!visited[bot] && isBgWhite(bot)) {
      visited[bot] = 1;
      queue[tail++] = bot;
    }
  }
  for (let y = 0; y < targetH; y++) {
    const left = y * targetW;
    const right = y * targetW + (targetW - 1);
    if (!visited[left] && isBgWhite(left)) {
      visited[left] = 1;
      queue[tail++] = left;
    }
    if (!visited[right] && isBgWhite(right)) {
      visited[right] = 1;
      queue[tail++] = right;
    }
  }

  while (head < tail) {
    const curr = queue[head++];
    data[curr * 4 + 3] = 0;
    const cx = curr % targetW;
    const cy = (curr / targetW) | 0;

    if (cx > 0) {
      const n = curr - 1;
      if (!visited[n] && isBgWhite(n)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (cx < targetW - 1) {
      const n = curr + 1;
      if (!visited[n] && isBgWhite(n)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (cy > 0) {
      const n = curr - targetW;
      if (!visited[n] && isBgWhite(n)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (cy < targetH - 1) {
      const n = curr + targetW;
      if (!visited[n] && isBgWhite(n)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
  }

  for (let y = 1; y < targetH - 1; y++) {
    for (let x = 1; x < targetW - 1; x++) {
      const idx = y * targetW + x;
      if (visited[idx]) continue;
      const transparentNeighbors =
        visited[idx - 1] +
        visited[idx + 1] +
        visited[idx - targetW] +
        visited[idx + targetW];
      if (transparentNeighbors > 0) {
        const p = idx * 4;
        const lum = (data[p] + data[p + 1] + data[p + 2]) / 3;
        if (lum > 230) {
          data[p + 3] = 0;
        } else if (lum > 202) {
          data[p + 3] = Math.round(((230 - lum) / 28) * 210);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function extractSoloGarmentPng(
  transparentModelCanvas: HTMLCanvasElement,
  piece: PieceItem
): string {
  const [nx0, nx1, ny0, ny1] = piece.cropBox;
  const srcW = transparentModelCanvas.width;
  const srcH = transparentModelCanvas.height;

  const sx = Math.round(nx0 * srcW);
  const sy = Math.round(ny0 * srcH);
  const sw = Math.max(1, Math.round((nx1 - nx0) * srcW));
  const sh = Math.max(1, Math.round((ny1 - ny0) * srcH));

  const outSize = 520;
  const out = document.createElement('canvas');
  out.width = outSize;
  out.height = outSize;
  const ctx = out.getContext('2d');
  if (!ctx) return '';

  const pad = 24;
  const avail = outSize - pad * 2;
  const scale = Math.min(avail / sw, avail / sh);
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);
  const dx = Math.round((outSize - dw) / 2);
  const dy = Math.round((outSize - dh) / 2);

  ctx.drawImage(transparentModelCanvas, sx, sy, sw, sh, dx, dy, dw, dh);

  if (piece.maskNeckline) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const centerX = outSize / 2;
    const topY = dy;
    const scoopRx = dw * 0.14;
    const scoopRy = Math.min(dh * 0.08, 28);

    const grad = ctx.createRadialGradient(
      centerX,
      topY - scoopRy * 0.15,
      scoopRx * 0.2,
      centerX,
      topY - scoopRy * 0.15,
      scoopRx * 1.15
    );
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.75, 'rgba(0,0,0,0.85)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(centerX, topY, scoopRx * 1.15, scoopRy * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  return out.toDataURL('image/png');
}

function cropHiggsModel(sheetImg: HTMLImageElement, look: LookEntry): string {
  const [x0, x1, y0, y1] = look.modelBox;
  const scaleX = sheetImg.naturalWidth / 960;
  const scaleY = sheetImg.naturalHeight / 540;

  const sx = Math.round(x0 * scaleX);
  const sy = Math.round(y0 * scaleY);
  const sw = Math.round((x1 - x0) * scaleX);
  const sh = Math.round((y1 - y0) * scaleY);

  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = sw;
  rawCanvas.height = sh;
  const ctx = rawCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(sheetImg, sx, sy, sw, sh, 0, 0, sw, sh);
  }
  return normalizeModelHeight(rawCanvas);
}

function cropHiggsPiece(sheetImg: HTMLImageElement, piece: PieceItem): string {
  const [x0, x1, y0, y1] = piece.cropBox;
  const scaleX = sheetImg.naturalWidth / 960;
  const scaleY = sheetImg.naturalHeight / 720;

  const sx = Math.round(x0 * scaleX);
  const sy = Math.round(y0 * scaleY);
  const sw = Math.round((x1 - x0) * scaleX);
  const sh = Math.round((y1 - y0) * scaleY);

  const outSize = 480;
  const canvas = document.createElement('canvas');
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const pad = 20;
    const avail = outSize - pad * 2;
    const scale = Math.min(avail / sw, avail / sh);
    const dw = Math.round(sw * scale);
    const dh = Math.round(sh * scale);
    const dx = Math.round((outSize - dw) / 2);
    const dy = Math.round((outSize - dh) / 2);
    ctx.drawImage(sheetImg, sx, sy, sw, sh, dx, dy, dw, dh);
  }
  return canvas.toDataURL('image/png');
}

export function processAllCollectionAssets(
  onProgress?: (partial: ProcessedAssets) => void
): Promise<ProcessedAssets> {
  if (cachedAssets.ready) {
    return Promise.resolve(cachedAssets);
  }
  if (processingPromise) {
    return processingPromise;
  }

  processingPromise = (async () => {
    try {
      const [higgsModelsImg, higgsPiecesImg] = await Promise.all([
        loadImage(HIGGS_MODELS_SHEET),
        loadImage(HIGGS_PIECES_SHEET),
      ]);

      LOOKS_DATA.filter((l) => l.sourceType === 'higgs_models').forEach((look) => {
        cachedAssets.models[look.lookNumber] = cropHiggsModel(higgsModelsImg, look);
      });

      PIECES_DATA.filter((p) => p.sourceType === 'higgs_pieces').forEach((piece) => {
        cachedAssets.pieces[piece.id] = cropHiggsPiece(higgsPiecesImg, piece);
      });

      onProgress?.({ ...cachedAssets });
    } catch {
      // Fallback handled in UI
    }

    const soloLooks = LOOKS_DATA.filter((l) => l.sourceType === 'solo_model');

    await Promise.all(
      soloLooks.map(async (look) => {
        if (!look.soloImageUrl) return;
        try {
          const rawImg = await loadImage(look.soloImageUrl);
          const transparentCanvas = removeStudioWhiteBackground(rawImg);

          // Auto-trim alpha bounds and normalize head-to-toe height to 96% of 640x840 canvas
          // so Look 7, Look 10, Look 20 and all solo models match Look 6's full tall stature!
          cachedAssets.models[look.lookNumber] = normalizeModelHeight(transparentCanvas);

          const lookPieces = PIECES_DATA.filter((p) => p.lookNumber === look.lookNumber);
          lookPieces.forEach((piece) => {
            cachedAssets.pieces[piece.id] = extractSoloGarmentPng(transparentCanvas, piece);
          });

          onProgress?.({ ...cachedAssets });
        } catch {
          if (look.soloImageUrl) {
            cachedAssets.models[look.lookNumber] = look.soloImageUrl;
          }
        }
      })
    );

    cachedAssets.ready = true;
    onProgress?.({ ...cachedAssets });
    return cachedAssets;
  })();

  return processingPromise;
}
