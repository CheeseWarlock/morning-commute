import CircularTrackSegment from "../engine/CircularTrackSegment";
import LinearTrackSegment from "../engine/LinearTrackSegment";
import Point from "../engine/Point";
import TrackSegment from "../engine/TrackSegment";

export const findCenter = (
  start: Point,
  end: Point,
  angle: number,
  counterClockWise: boolean,
) => {
  const chordLength = Math.sqrt(
    (start.x - end.x) ** 2 + (start.y - end.y) ** 2,
  );

  const radius = chordLength / (2 * Math.sin(angle / 2));

  const angleToEnd = Math.atan2(end.y - start.y, end.x - start.x);

  const angleToOrigin =
    angleToEnd +
    (angle / 2) * (counterClockWise ? 1 : -1) +
    (counterClockWise ? -Math.PI / 2 : Math.PI / 2);

  const centerPos = {
    x: start.x + Math.cos(angleToOrigin) * radius,
    y: start.y + Math.sin(angleToOrigin) * radius,
  };

  return centerPos;
};

const distance = (a: Point, b: Point) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

const lineIntersection = (
  a: Point,
  b: Point,
  dA: number,
  dB: number,
): { point: Point; u: number; v: number } | undefined => {
  // p is points
  // n is direction vectors
  // n1 => [Math.cos(dB), Math.sin(dB)] ...

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const det = Math.cos(dB) * Math.sin(dA) - Math.sin(dB) * Math.cos(dA);
  const u = (dy * Math.cos(dB) - dx * Math.sin(dB)) / det;
  const v = (dy * Math.cos(dA) - dx * Math.sin(dA)) / det;

  const m0 = Math.sin(dA) / Math.cos(dA);
  const m1 = Math.sin(dB) / Math.cos(dB);
  const b0 = a.y - m0 * a.x;
  const b1 = b.y - m1 * b.x;
  const x = (b1 - b0) / (m0 - m1);
  const y = m0 * x + b0;

  return Number.isFinite(x)
    ? {
        point: { x, y },
        u,
        v,
      }
    : undefined;
};

export const connectSegments = (
  segmentA: TrackSegment,
  isEndA: boolean,
  segmentB: TrackSegment,
  isEndB: TrackSegment,
): TrackSegment[] => {
  // Find the intersection point of the two rays
  let angleFromA;
  let angleFromB;

  if (isEndA) {
    angleFromA = segmentA.finalAngle;
  } else {
    angleFromA = segmentA.initialAngle + Math.PI;
  }
  if (isEndB) {
    angleFromB = segmentB.finalAngle;
  } else {
    angleFromB = segmentB.initialAngle + Math.PI;
  }
  const pointA = isEndA ? segmentA.end : segmentA.start;
  const pointB = isEndB ? segmentB.end : segmentB.start;
  const intersection = lineIntersection(pointA, pointB, angleFromA, angleFromB);

  if (!intersection) return [];
  if ((intersection?.u || 0) > 0 && (intersection?.v || 0) > 0) {
    // Rays intersect!
  } else {
    return [];
  }

  const segments: TrackSegment[] = [];
  let addedPoint: Point | undefined;
  // Extend one until distances match
  const distA = distance(pointA, intersection.point);
  const distB = distance(pointB, intersection.point);

  if (distA > distB) {
    // Extend A
    const dist = distA - distB;
    addedPoint = {
      x: pointA.x + dist * Math.cos(angleFromA),
      y: pointA.y + dist * Math.sin(angleFromA),
    };
    const segment = new LinearTrackSegment(pointA, addedPoint);
    segments.push(segment);
    const aaaa = lineIntersection(
      addedPoint,
      pointB,
      angleFromA + Math.PI / 2,
      angleFromB + Math.PI / 2,
    );
    if (!aaaa) {
      return [];
    }
    const circleSegment = new CircularTrackSegment(
      addedPoint,
      pointB,
      aaaa.point,
    );
    segments.push(circleSegment);
    return segments;
  } else {
    const dist = distB - distA;
    addedPoint = {
      x: pointB.x + dist * Math.cos(angleFromB),
      y: pointB.y + dist * Math.sin(angleFromB),
    };
    const segment = new LinearTrackSegment(pointB, addedPoint);
    segments.push(segment);
    const aaaa = lineIntersection(
      pointA,
      addedPoint,
      angleFromA + Math.PI / 2,
      angleFromB + Math.PI / 2,
    );
    if (!aaaa) {
      return [];
    }
    const circleSegment = new CircularTrackSegment(
      pointA,
      addedPoint,
      aaaa.point,
    );
    segments.push(circleSegment);
    return segments;
  }
};
