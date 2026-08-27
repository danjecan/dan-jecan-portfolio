// Topographic contour generator — shared by tools/build-topo.mjs.
//
// Marching squares over a smooth noise field, then the per-cell segments are
// STITCHED into continuous polylines and emitted as quadratic-bezier paths
// through edge midpoints. That last step is what makes the small innermost
// loops read as round circles instead of 4- or 6-sided polygons.

function mulberryHash(ix, iy, seed) {
  let h = ix * 374761393 + iy * 668265263 + seed * 2246822519;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 100000) / 100000;
}

function smoothstep(t) { return t * t * (3 - 2 * t); }

function makeNoise(seed) {
  return function noise2(x, y) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const sx = smoothstep(x - x0), sy = smoothstep(y - y0);
    const n00 = mulberryHash(x0, y0, seed), n10 = mulberryHash(x0 + 1, y0, seed);
    const n01 = mulberryHash(x0, y0 + 1, seed), n11 = mulberryHash(x0 + 1, y0 + 1, seed);
    const ix0 = n00 + (n10 - n00) * sx;
    const ix1 = n01 + (n11 - n01) * sx;
    return ix0 + (ix1 - ix0) * sy;
  };
}

const EDGE_TABLE = {
  1: [[3, 2]], 2: [[2, 1]], 3: [[3, 1]], 4: [[0, 1]],
  5: [[0, 3], [2, 1]], 6: [[0, 2]], 7: [[0, 3]], 8: [[0, 3]],
  9: [[0, 2]], 10: [[0, 1], [2, 3]], 11: [[0, 1]], 12: [[3, 1]],
  13: [[2, 1]], 14: [[3, 2]],
};

const keyOf = (p) => p[0].toFixed(2) + '|' + p[1].toFixed(2);
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const fmt = (p) => p[0].toFixed(1) + ',' + p[1].toFixed(1);

// Turn a bag of unordered [p1, p2] segments into ordered polylines. Each interior
// crossing point has degree 2, so we can just walk the chain from both ends.
function stitch(segments) {
  const adj = new Map();
  segments.forEach((seg, i) => {
    for (const [a, b] of [[0, 1], [1, 0]]) {
      const k = keyOf(seg[a]);
      if (!adj.has(k)) adj.set(k, []);
      adj.get(k).push({ i, to: seg[b] });
    }
  });

  const used = new Array(segments.length).fill(false);
  const polylines = [];

  for (let s = 0; s < segments.length; s++) {
    if (used[s]) continue;
    used[s] = true;
    const poly = [segments[s][0], segments[s][1]];

    for (let dir = 0; dir < 2; dir++) {
      for (let guard = 0; guard < segments.length; guard++) {
        const end = dir === 0 ? poly[poly.length - 1] : poly[0];
        const next = (adj.get(keyOf(end)) || []).find((c) => !used[c.i]);
        if (!next) break;
        used[next.i] = true;
        if (dir === 0) poly.push(next.to);
        else poly.unshift(next.to);
        if (keyOf(poly[0]) === keyOf(poly[poly.length - 1])) break; // closed
      }
    }
    polylines.push(poly);
  }
  return polylines;
}

// Quadratic bezier through the midpoint of every edge, using the original
// vertices as control points. A 4-point loop becomes a smooth near-circle.
function smoothPath(poly) {
  const closed = poly.length > 3 && keyOf(poly[0]) === keyOf(poly[poly.length - 1]);
  const pts = closed ? poly.slice(0, -1) : poly;
  const n = pts.length;
  if (n < 3) return 'M' + pts.map(fmt).join('L');

  if (closed) {
    let d = 'M' + fmt(mid(pts[n - 1], pts[0]));
    for (let i = 0; i < n; i++) {
      d += 'Q' + fmt(pts[i]) + ' ' + fmt(mid(pts[i], pts[(i + 1) % n]));
    }
    return d + 'Z';
  }
  let d = 'M' + fmt(pts[0]);
  for (let i = 1; i < n - 1; i++) {
    d += 'Q' + fmt(pts[i]) + ' ' + fmt(mid(pts[i], pts[i + 1]));
  }
  return d + 'L' + fmt(pts[n - 1]);
}

export function buildContours(width, height, seed, cols, rows, bumps, levels) {
  const noise2 = makeNoise(seed);

  const fieldAt = (xFrac, yFrac) => {
    const x = xFrac * width, y = yFrac * height;
    let total = 0;
    for (const b of bumps) {
      const dx = x - b.cx, dy = y - b.cy;
      const ang = b.rot || 0;
      const rx = dx * Math.cos(ang) + dy * Math.sin(ang);
      const ry = -dx * Math.sin(ang) + dy * Math.cos(ang);
      const sy = b.sy || 1;
      const dist = Math.sqrt(rx * rx + (ry / sy) * (ry / sy));
      total += b.amp * Math.exp(-dist / b.r);
    }
    const wob1 = (noise2(xFrac * 2.2, yFrac * 2.2) - 0.5) * 2 * 0.16;
    const wob2 = (noise2(xFrac * 5 + 50, yFrac * 5 + 50) - 0.5) * 2 * 0.064;
    return total + wob1 + wob2;
  };

  const field = [];
  let minV = Infinity, maxV = -Infinity;
  for (let r = 0; r <= rows; r++) {
    const row = [];
    for (let c = 0; c <= cols; c++) {
      const v = fieldAt(c / cols, r / rows);
      row.push(v);
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    field.push(row);
  }

  const out = [];
  for (let li = 0; li < levels; li++) {
    const t = minV + ((li + 0.5) / levels) * (maxV - minV);
    const segments = [];
    for (let rr = 0; rr < rows; rr++) {
      for (let cc = 0; cc < cols; cc++) {
        const x0 = (cc / cols) * width, x1 = ((cc + 1) / cols) * width;
        const y0 = (rr / rows) * height, y1 = ((rr + 1) / rows) * height;
        const va = field[rr][cc], vb = field[rr][cc + 1], vc = field[rr + 1][cc + 1], vd = field[rr + 1][cc];
        let cs = 0;
        if (va >= t) cs |= 8;
        if (vb >= t) cs |= 4;
        if (vc >= t) cs |= 2;
        if (vd >= t) cs |= 1;
        const edges = EDGE_TABLE[cs];
        if (!edges) continue;
        const pts = [
          [x0 + ((t - va) / (vb - va)) * (x1 - x0), y0],
          [x1, y0 + ((t - vb) / (vc - vb)) * (y1 - y0)],
          [x0 + ((t - vd) / (vc - vd)) * (x1 - x0), y1],
          [x0, y0 + ((t - va) / (vd - va)) * (y1 - y0)],
        ];
        for (const [ea, eb] of edges) {
          const p1 = pts[ea], p2 = pts[eb];
          if (isFinite(p1[0]) && isFinite(p1[1]) && isFinite(p2[0]) && isFinite(p2[1])) {
            segments.push([p1, p2]);
          }
        }
      }
    }

    const d = stitch(segments).map(smoothPath).join(' ');
    out.push({ d, indexLine: li % 5 === 0 });
  }
  return out;
}
