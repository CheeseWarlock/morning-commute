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
    almostEqual(Math.abs(normalizeAngle(a) - normalizeAngle(b)), Math.PI * 2)
  );
};

const anglesAlmostHalfEqual = (a: number, b: number) => {
  return (
    almostEqual(normalizeAngleHalf(a), normalizeAngleHalf(b)) ||
    almostEqual(
      Math.abs(normalizeAngleHalf(a) - normalizeAngleHalf(b)),
      Math.PI,
    )
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
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const det = Math.cos(dB) * Math.sin(dA) - Math.sin(dB) * Math.cos(dA);
  const u = (dy * Math.cos(dB) - dx * Math.sin(dB)) / det;
  const v = (dy * Math.cos(dA) - dx * Math.sin(dA)) / det;

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

/**
 * Connect two track segments via up to one Linear segment and up to one Circular segment.
 * @returns an array of track segments created. If the segments cannot be connected, the array will be empty.
 */
export const connectSegments = (
  segmentA: TrackSegment,
  isEndA: boolean,
  segmentB: TrackSegment,
  isEndB: boolean,
): TrackSegment[] => {
  if (segmentA === segmentB) return [];
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
  } else if (anglesAlmostHalfEqual(angleFromA, angleFromB)) {
    // They're facing each other- if they're collinear we can connect them, otherwise we can't
    const aYAtX0 = pointA.y - Math.tan(angleFromA) * pointA.x;
    const bYAtX0 = pointB.y - Math.tan(angleFromB) * pointB.x;
    if (Math.abs(aYAtX0 - bYAtX0) < 0.0001) {
      return [new LinearTrackSegment({ ...pointA }, { ...pointB })];
    }

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

  // If one is behind and the other is ahead, the curve will be > 180 degrees
  //
  if (intersection && intersection?.u > 0 && intersection?.v < 0) {
    distA = distA + distB;
    distB = 0;
    intersectAhead = true;
  } else if (intersection && intersection?.v > 0 && intersection?.u < 0) {
    distB = distA + distB;
    distA = 0;
    intersectAhead = true;
  }

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
    console.log("Bad things have happened...");
    return [];
  }

  return segments;
};

/**
 * Calculate the center point for a circular arc between two points.
 * Uses perpendicular lines to find the intersection point.
 */
export function calculateCircularCenter(
  start: Point,
  end: Point,
  angle: number = Math.PI / 4,
  counterClockWise: boolean = true,
): Point {
  // Calculate the angle from start to end
  const startToEndAngle = Math.atan2(end.y - start.y, end.x - start.x);

  // For a 90-degree clockwise curve, the tangent at start is rotated 45 degrees counterclockwise
  // For a 90-degree counterclockwise curve, the tangent at start is rotated 45 degrees clockwise
  const startTangentAngle =
    startToEndAngle + (counterClockWise ? angle / 2 : -angle / 2);

  // The tangent at end is rotated 45 degrees in the opposite direction
  const endTangentAngle =
    startToEndAngle + (counterClockWise ? -angle / 2 : angle / 2);

  // Calculate perpendicular lines (normal to the tangent)
  const startPerpAngle = startTangentAngle + Math.PI / 2;
  const endPerpAngle = endTangentAngle + Math.PI / 2;

  // Find intersection of the two perpendicular lines
  // Line 1: start + t1 * (cos(startPerpAngle), sin(startPerpAngle))
  // Line 2: end + t2 * (cos(endPerpAngle), sin(endPerpAngle))

  const cos1 = Math.cos(startPerpAngle);
  const sin1 = Math.sin(startPerpAngle);
  const cos2 = Math.cos(endPerpAngle);
  const sin2 = Math.sin(endPerpAngle);

  // Solve for intersection using parametric line equations
  // start.x + t1*cos1 = end.x + t2*cos2
  // start.y + t1*sin1 = end.y + t2*sin2

  const det = cos1 * sin2 - sin1 * cos2;
  if (Math.abs(det) < 1e-10) {
    // Lines are parallel, use midpoint as fallback
    return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  }

  const t1 = ((end.x - start.x) * sin2 - (end.y - start.y) * cos2) / det;

  return {
    x: start.x + t1 * cos1,
    y: start.y + t1 * sin1,
  };
}

/**
 * Calculate the center of a circle that connects a start point at a given angle to a target point.
 * The circle must be tangent to the start angle at the start point and pass through the target point.
 */
export function calculateConstrainedCircleCenter(
  start: Point,
  startAngle: number,
  target: Point,
): Point {
  // The center must lie on the line perpendicular to the start angle
  // and the circle must pass through both the start and target points

  // Calculate the direction perpendicular to the start angle
  const perpAngle = startAngle + Math.PI / 2;

  // The center is at: start + r * (cos(perpAngle), sin(perpAngle))
  // The circle must pass through both start and target points
  // So the distance from center to start = distance from center to target = radius

  // Let's solve this algebraically:
  // Let center = start + t * (cos(perpAngle), sin(perpAngle))
  // Then |center - start| = |center - target|
  // |t * (cos(perpAngle), sin(perpAngle))| = |start + t * (cos(perpAngle), sin(perpAngle)) - target|
  // |t| = |start - target + t * (cos(perpAngle), sin(perpAngle))|

  const dx = -(target.x - start.x);
  const dy = -(target.y - start.y);

  const cosPerp = Math.cos(perpAngle);
  const sinPerp = Math.sin(perpAngle);

  // Square both sides: t² = (dx + t*cosPerp)² + (dy + t*sinPerp)²
  // t² = dx² + 2*dx*t*cosPerp + t²*cosPerp² + dy² + 2*dy*t*sinPerp + t²*sinPerp²
  // t² = dx² + dy² + 2*t*(dx*cosPerp + dy*sinPerp) + t²*(cosPerp² + sinPerp²)
  // Since cosPerp² + sinPerp² = 1, this simplifies to:
  // t² = dx² + dy² + 2*t*(dx*cosPerp + dy*sinPerp) + t²
  // 0 = dx² + dy² + 2*t*(dx*cosPerp + dy*sinPerp)
  // t = -(dx² + dy²) / (2*(dx*cosPerp + dy*sinPerp))

  const numerator = -(dx * dx + dy * dy);
  const denominator = 2 * (dx * cosPerp + dy * sinPerp);

  if (Math.abs(denominator) < 1e-10) {
    // Fallback: use a reasonable radius
    const radius = 100;
    return {
      x: start.x + radius * cosPerp,
      y: start.y + radius * sinPerp,
    };
  }

  const t = numerator / denominator;

  return {
    x: start.x + t * cosPerp,
    y: start.y + t * sinPerp,
  };
}
