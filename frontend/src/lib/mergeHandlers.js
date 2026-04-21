export function mergeHandlers(...sources) {
  const merged = {};
  for (const src of sources) {
    if (!src) continue;
    for (const key of Object.keys(src)) {
      const prev = merged[key];
      const next = src[key];
      merged[key] = prev
        ? (e) => { prev(e); next(e); }
        : next;
    }
  }
  return merged;
}
