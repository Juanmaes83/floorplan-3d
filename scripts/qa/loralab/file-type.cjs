// Content type of an evidence file by its bytes, never by its name: a LoRA LAB download saved as `.json` turned out
// to be a PNG (18-10-2026). Returns 'png', 'jpeg', 'webp', 'zip', 'json' (an object or array) or 'otro'.
function fileType(bytes) {
 const starts = sig => bytes.length >= sig.length && sig.every((b, i) => b === null || bytes[i] === b);
 if (starts([137, 80, 78, 71, 13, 10, 26, 10])) return 'png';
 if (starts([255, 216, 255])) return 'jpeg';
 if (starts([82, 73, 70, 70, null, null, null, null, 87, 69, 66, 80])) return 'webp';
 if (starts([80, 75, 3, 4]) || starts([80, 75, 5, 6])) return 'zip';
 try {
  const value = JSON.parse(bytes.toString('utf8').replace(/^﻿/, ''));
  if (value !== null && typeof value === 'object') return 'json';
 } catch {}
 return 'otro';
}
module.exports = {fileType};
