export function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function isFirefox() {
  if (typeof navigator === 'undefined') return false;
  return /Firefox\//i.test(navigator.userAgent);
}
