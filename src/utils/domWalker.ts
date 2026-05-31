/**
 * domWalker.ts
 *
 * Collects all visible leaf Text nodes from the document body, stores their
 * original values so they can be reverted, and patches translated text back
 * in-place without disturbing the surrounding HTML structure.
 */

export interface TextNodeEntry {
  node: Text;
  originalText: string;
}

/** Tags whose content must never be translated. */
const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEXTAREA',
  'CODE',
  'PRE',
  'SVG',
  'MATH',
]);

/**
 * Returns true if the element (or any of its ancestors up to `root`) carries
 * a `data-no-translate` attribute, signalling opt-out.
 */
function isNoTranslate(node: Node): boolean {
  let current: Node | null = node;
  while (current && current.nodeType !== Node.DOCUMENT_NODE) {
    if (
      current.nodeType === Node.ELEMENT_NODE &&
      (current as Element).hasAttribute('data-no-translate')
    ) {
      return true;
    }
    current = current.parentNode;
  }
  return false;
}

/**
 * Walk `root` (defaults to `document.body`) and collect every leaf Text node
 * that:
 *  - has non-whitespace content
 *  - is not inside a skipped tag
 *  - is not inside an element with `data-no-translate`
 */
export function collectTextNodes(root: Node = document.body): TextNodeEntry[] {
  const entries: TextNodeEntry[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, {
    acceptNode(node: Node): number {
      // Skip entire branches for certain element types
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
        if (el.hasAttribute('data-no-translate')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_SKIP;
      }

      // Only accept text nodes with visible content
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node as Text).nodeValue ?? '';
        if (!text.trim()) return NodeFilter.FILTER_SKIP;
        if (isNoTranslate(node)) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      }

      return NodeFilter.FILTER_SKIP;
    },
  });

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    entries.push({ node: textNode, originalText: textNode.nodeValue ?? '' });
  }

  return entries;
}

/**
 * Patch translated strings back onto the collected text nodes.
 * `translations` must be in the same order as the entries from `collectTextNodes`.
 */
export function applyTranslations(
  entries: TextNodeEntry[],
  translations: string[]
): void {
  entries.forEach((entry, i) => {
    const translated = translations[i];
    if (translated != null && translated !== '') {
      entry.node.nodeValue = translated;
    }
  });
}

/**
 * Restore all collected text nodes to their original content.
 */
export function revertTranslations(entries: TextNodeEntry[]): void {
  entries.forEach(entry => {
    entry.node.nodeValue = entry.originalText;
  });
}
