// ============================================
// 多边形裁剪工具 (Sutherland-Hodgman 算法)
// ============================================

/**
 * 使用 Sutherland-Hodgman 算法将多边形裁剪到另一个多边形内
 * @param subject 被裁剪的多边形（区域）
 * @param clip 裁剪边界多边形（大陆）
 * @returns 裁剪后的多边形顶点数组
 */
export function clipPolygonToPolygon(
  subject: { x: number; y: number }[],
  clip: { x: number; y: number }[]
): { x: number; y: number }[] {
  if (subject.length < 3 || clip.length < 3) return subject;

  let output = [...subject];

  // 用裁剪多边形的每条边去裁剪
  for (let i = 0; i < clip.length; i++) {
    if (output.length === 0) break;

    const input = output;
    output = [];

    const edgeStart = clip[i];
    const edgeEnd = clip[(i + 1) % clip.length];

    for (let j = 0; j < input.length; j++) {
      const current = input[j];
      const next = input[(j + 1) % input.length];

      const currentInside = isLeft(edgeStart, edgeEnd, current);
      const nextInside = isLeft(edgeStart, edgeEnd, next);

      if (currentInside) {
        output.push(current);
        if (!nextInside) {
          // 从内到外，添加交点
          const intersection = lineSegmentIntersection(
            current, next, edgeStart, edgeEnd
          );
          if (intersection) output.push(intersection);
        }
      } else if (nextInside) {
        // 从外到内，添加交点
        const intersection = lineSegmentIntersection(
          current, next, edgeStart, edgeEnd
        );
        if (intersection) output.push(intersection);
      }
    }
  }

  return output;
}

/**
 * 判断点是否在边的左侧（内侧）
 */
function isLeft(
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
  point: { x: number; y: number }
): boolean {
  return (
    (lineEnd.x - lineStart.x) * (point.y - lineStart.y) -
    (lineEnd.y - lineStart.y) * (point.x - lineStart.x)
  ) >= 0;
}

/**
 * 计算两条线段的交点
 */
function lineSegmentIntersection(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): { x: number; y: number } | null {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 1e-10) return null;

  const t = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const u = -((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
    };
  }
  return null;
}

/**
 * 检查多边形是否完全在另一个多边形内（用于判断是否需要裁剪）
 */
export function isPolygonInsidePolygon(
  inner: { x: number; y: number }[],
  outer: { x: number; y: number }[]
): boolean {
  return inner.every(point => isPointInPolygon(point, outer));
}

/**
 * 判断点是否在多边形内（射线法）
 */
function isPointInPolygon(
  point: { x: number; y: number },
  polygon: { x: number; y: number }[]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * 计算多边形面积（用于区域选择器显示）
 */
export function polygonArea(polygon: { x: number; y: number }[]): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return Math.abs(area) / 2;
}
