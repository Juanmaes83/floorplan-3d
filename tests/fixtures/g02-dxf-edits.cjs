'use strict';

// A DXF group is two lines. A coordinate value of "0" is not an entity boundary.
function editVisibleWalls(text, { remove = false } = {}) {
  const lines = text.split('\n'), edited = [];
  for (let i = 0; i < lines.length; i += 2) {
    if (lines[i] !== '0' || lines[i + 1] !== 'LWPOLYLINE') {
      edited.push(lines[i], lines[i + 1]);
      continue;
    }
    let end = i + 2;
    while (end < lines.length && lines[end] !== '0') end += 2;
    const entity = lines.slice(i, end);
    const layer = entity.findIndex((value,index) => index % 2 === 0 && value === '8');
    const visibleWall = /^WALLS_(?:EXISTING|NEW)$/.test(entity[layer + 1]);
    if (visibleWall && !remove) {
      for (let j = 0; j < entity.length; j += 2) if (entity[j] === '10') entity[j + 1] = String(2 * Number(entity[j + 1]));
    }
    if (!visibleWall || !remove) edited.push(...entity);
    i = end - 2;
  }
  return edited.join('\n');
}

module.exports = { editVisibleWalls };
