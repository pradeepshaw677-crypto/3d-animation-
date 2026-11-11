export interface ProcessedAssets {
  models: Record<number, string>;
  pieces: Record<number, string>;
  ready: boolean;
}

const STATIC_ASSETS: ProcessedAssets = {
  models: {},
  pieces: {},
  ready: true,
};

/**
 * All 20 models and 40 products now use static pre-processed transparent PNGs
 * and native SVG sheets, so zero runtime canvas processing is required.
 */
export function processAllCollectionAssets(
  onProgress?: (partial: ProcessedAssets) => void
): Promise<ProcessedAssets> {
  onProgress?.(STATIC_ASSETS);
  return Promise.resolve(STATIC_ASSETS);
}
