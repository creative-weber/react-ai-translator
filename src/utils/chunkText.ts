/**
 * chunkText.ts
 *
 * Splits an array of strings into batches that stay within a character limit.
 * This keeps individual translation requests small so the NMT model doesn't
 * time-out or produce degraded output on very large pages.
 *
 * Each chunk is an array of { index, text } pairs so results can be
 * reassembled in the original order even if chunks are processed concurrently.
 */

export interface TextItem {
  index: number;
  text: string;
}

export interface Chunk {
  items: TextItem[];
}

/**
 * Group `texts` into chunks where the total character count per chunk stays
 * below `maxCharsPerChunk`.
 *
 * Individual strings longer than `maxCharsPerChunk` are placed in their own
 * chunk rather than being silently truncated.
 *
 * @param texts            Ordered array of strings to translate.
 * @param maxCharsPerChunk Maximum total characters per chunk (default 1500).
 */
export function chunkTexts(
  texts: string[],
  maxCharsPerChunk = 1500
): Chunk[] {
  const chunks: Chunk[] = [];
  let currentItems: TextItem[] = [];
  let currentLength = 0;

  texts.forEach((text, index) => {
    const len = text.length;

    // If adding this item would exceed the limit (and we already have items),
    // flush the current chunk first.
    if (currentLength + len > maxCharsPerChunk && currentItems.length > 0) {
      chunks.push({ items: currentItems });
      currentItems = [];
      currentLength = 0;
    }

    currentItems.push({ index, text });
    currentLength += len;

    // If this single item already fills a chunk on its own, flush immediately.
    if (currentLength >= maxCharsPerChunk) {
      chunks.push({ items: currentItems });
      currentItems = [];
      currentLength = 0;
    }
  });

  if (currentItems.length > 0) {
    chunks.push({ items: currentItems });
  }

  return chunks;
}

/**
 * Merge an array of partial result maps back into a flat ordered array.
 *
 * @param originalCount Total number of texts (length of original `texts` array).
 * @param results        Map from original index → translated string.
 */
export function mergeChunkResults(
  originalCount: number,
  results: Map<number, string>
): string[] {
  return Array.from({ length: originalCount }, (_, i) => results.get(i) ?? '');
}
