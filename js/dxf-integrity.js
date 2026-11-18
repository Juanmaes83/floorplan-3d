/* G-02: use auxiliary geometry only for an intact RUBIK export. The checksum is not a signature. */
(function (root) {
  'use strict';
  const auxiliaryLayer = 'RUBIK_WALL_FOOTPRINT';
  const marker = '\n999\nRUBIK-G02-SHA256 ';
  const eof = '0\nEOF';
  const sealLine = /^([a-f0-9]{64})\n0\nEOF\n?$/;

  async function digest(text) {
    const bytes = await root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function seal(text) {
    if (!text.endsWith(eof)) throw new Error('El dibujo DXF está incompleto.');
    const body = text.slice(0, -eof.length - 1);
    return body + marker + await digest(text) + '\n' + eof;
  }

  async function inspect(source) {
    const text = source.replace(/\r\n?/g, '\n');
    const index = text.indexOf(marker);
    if (index < 0) return { marked: false, verified: false };
    const match = sealLine.exec(text.slice(index + marker.length));
    const verified = !!match && !!root.crypto?.subtle && match[1] === await digest(text.slice(0, index) + '\n' + eof);
    return { marked: true, verified };
  }

  const api = { auxiliaryLayer, seal, inspect };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FloorPlanDxfIntegrity = api;
})(globalThis);
