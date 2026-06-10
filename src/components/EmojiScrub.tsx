"use client";

import { useEffect } from "react";

// In edge (black & white) mode the app should read as clean monochrome type —
// no colourful emoji. Rather than fork every title/label/button string, we strip
// pictographic emoji from the live DOM while edge mode is active and restore
// them when it's switched off. Retro dingbats (✦ ✧ ⋆ °) aren't pictographic, so
// they survive; a tiny allow-list keeps the ◀ ▶ nav arrows too.

const KEEP = new Set([0x25b6, 0x25c0]); // ▶ ◀
// One emoji grapheme: a pictographic base + optional VS16 + ZWJ sequences.
const EMOJI = /\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic})*/gu;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT"]);

// Returns the scrubbed string, or the same reference if nothing changed.
function scrub(value: string): string {
  if (!value) return value;
  let removed = false;
  const out = value.replace(EMOJI, (m) => {
    if ([...m].length === 1 && KEEP.has(m.codePointAt(0)!)) return m;
    removed = true;
    return "";
  });
  if (!removed) return value;
  // Tidy the gaps the removal left behind (e.g. "🌅 Breakfast" -> "Breakfast").
  return out.replace(/ {2,}/g, " ").replace(/^ | $/g, "");
}

export default function EmojiScrub() {
  useEffect(() => {
    // Latest pre-scrub value per text node, so toggling edge off restores them.
    const originals = new Map<Text, string>();
    let observer: MutationObserver | null = null;

    const processText = (node: Text) => {
      const v = node.nodeValue ?? "";
      const nv = scrub(v);
      if (nv !== v) {
        originals.set(node, v); // track latest React truth
        node.nodeValue = nv;
      }
    };

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const parent = node.parentNode as Element | null;
        if (parent && SKIP_TAGS.has(parent.nodeName)) return;
        processText(node as Text);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (SKIP_TAGS.has((node as Element).nodeName)) return;
        node.childNodes.forEach(walk);
      }
    };

    const enable = () => {
      if (observer) return;
      walk(document.body);
      observer = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.type === "characterData") walk(m.target);
          else m.addedNodes.forEach(walk);
        }
      });
      observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    };

    const disable = () => {
      observer?.disconnect();
      observer = null;
      originals.forEach((val, node) => { if (node.isConnected) node.nodeValue = val; });
      originals.clear();
    };

    const sync = () => {
      if (document.documentElement.getAttribute("data-theme") === "edge") enable();
      else disable();
    };

    sync();
    window.addEventListener("themechange", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("themechange", sync);
      window.removeEventListener("storage", sync);
      disable();
    };
  }, []);

  return null;
}
