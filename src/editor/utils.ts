import CircularTrackSegment from "../engine/CircularTrackSegment";
import LinearTrackSegment from "../engine/LinearTrackSegment";
import Point from "../engine/Point";
import TrackSegment from "../engine/TrackSegment";

const normalizeAngle = (angle: number) => {
  return (angle + Math.PI * 2) % (Math.PI * 2);
};

const normalizeAngleHalf = (angle: number) => {
  return (angle + Math.PI) % Math.PI;
};

const almostEqual = (a: number, b: number) => {
  return Math.abs(a - b) < 0.000001;
};

const anglesAlmostEqual = (a: number, b: number) => {
  return (
    almostEqual(normalizeAngle(a), normalizeAngle(b)) ||
    almostEqual(Math.abs(normalizeAngle(a) - normalizeAngle(b)), Math.PI)
  );
};

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

  if (dA % (Math.PI / 2) === 0) {
    // Ughhh workaround
    console.log("ughh");
  }
  const x = a.x + u * Math.cos(dA);
  const y = a.y + u * Math.sin(dA);

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
  isEndB: boolean,
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
  let intersectAhead = false;
  let parallel = false;

  if (anglesAlmostEqual(angleFromA, angleFromB)) {
    parallel = true;
  } else if (
    normalizeAngleHalf(angleFromA) === normalizeAngleHalf(angleFromB)
  ) {
    return [];
  }

  if (!intersection) {
    parallel = true;
    // They're parallel
  }
  if ((intersection?.u || 0) > 0 && (intersection?.v || 0) > 0) {
    // Intersect ahead
    intersectAhead = true;
  }

  const segments: TrackSegment[] = [];
  let addedPoint: Point | undefined;
  // Extend one until distances match
  let distA;
  let distB;

  if (parallel) {
    // Where does the 90 degree line from A hit B?
    const inters = lineIntersection(
      pointA,
      pointB,
      angleFromA + Math.PI / 2,
      angleFromB,
    );
    console.log(inters);
    if (!inters) return [];
    if (inters.v < 0) {
      // A is "ahead"
      // Extend B by -v
    } else {
      // B is ahead
      // Extend A by v
    }
    distA = inters.v;
    distB = 0;
  } else {
    distA = distance(pointA, intersection!.point);
    distB = distance(pointB, intersection!.point);
  }

  let curvePointA = pointA;
  let curvePointB = pointB;

  if (distA > distB === intersectAhead) {
    // Extend A if intersection is ahead
    // Extend B if intersection behind
    const dist = Math.abs(distA - distB);
    if (!almostEqual(dist, 0)) {
      addedPoint = {
        x: pointA.x + dist * Math.cos(angleFromA),
        y: pointA.y + dist * Math.sin(angleFromA),
      };
      const segment = new LinearTrackSegment(pointA, addedPoint);
      segments.push(segment);
      curvePointA = addedPoint;
    }
  } else {
    const dist = Math.abs(distB - distA);
    if (!almostEqual(dist, 0)) {
      addedPoint = {
        x: pointB.x + dist * Math.cos(angleFromB),
        y: pointB.y + dist * Math.sin(angleFromB),
      };
      const segment = new LinearTrackSegment(pointB, addedPoint);
      segments.push(segment);
      curvePointB = addedPoint;
    }
  }

  let secondIntersection: Point;
  if (parallel) {
    secondIntersection = {
      x: (curvePointA.x + curvePointB.x) / 2,
      y: (curvePointA.y + curvePointB.y) / 2,
    };
  } else {
    secondIntersection = lineIntersection(
      curvePointA,
      curvePointB,
      angleFromA + Math.PI / 2,
      angleFromB + Math.PI / 2,
    )!.point;
  }
  if (secondIntersection == null) {
    return segments;
  }

  // Try both?
  const circleSegmentA = new CircularTrackSegment(
    curvePointA,
    curvePointB,
    secondIntersection,
  );
  const circleSegmentB = new CircularTrackSegment(
    curvePointA,
    curvePointB,
    secondIntersection,
    true,
  );

  if (
    almostEqual(
      normalizeAngle(circleSegmentA.initialAngle),
      normalizeAngle(
        isEndA ? segmentA.finalAngle : segmentA.initialAngle + Math.PI,
      ),
    )
  ) {
    segments.push(circleSegmentA);
  } else if (
    almostEqual(
      normalizeAngle(circleSegmentB.initialAngle),
      normalizeAngle(
        isEndA ? segmentA.finalAngle : segmentA.initialAngle + Math.PI,
      ),
    )
  ) {
    segments.push(circleSegmentB);
  } else {
    // Should not happen
    console.log("BAD");
    return [];
  }

  return segments;
};
