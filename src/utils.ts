import Point from "./engine/Point";
import TrackSegment from "./engine/TrackSegment";

/**
 * Best-effort navigation along a network of path segments.
 * Chooses randomly when there's a decision point.
 * @param segment
 * @param startingDistance distance already traveled along the current segment
 * @param reverse
 * @param distance the distance to travel
 */
export function easyNavigate(
  segment: TrackSegment,
  startingDistance: number,
  reverse: boolean,
  distance: number,
  targetSegment?: TrackSegment,
): {
  point: Point;
  excess: number;
  finalSegment: TrackSegment;
  reversing: boolean;
} {
  let distanceRemaining = distance + startingDistance;
  let currentSegment = segment;
  let currentlyReversing = reverse;
  while (currentSegment) {
    const followCurrentSegment = currentSegment.getPositionAlong(
      distanceRemaining,
      currentlyReversing,
    );
    if (followCurrentSegment.excess === 0) {
      return {
        point: followCurrentSegment.point,
        excess: 0,
        finalSegment: currentSegment,
        reversing: currentlyReversing,
      };
    }

    distanceRemaining -= currentSegment.length;
    const targetList = currentlyReversing
      ? currentSegment.atStart
      : currentSegment.atEnd;
    let nextSegment;
    if (targetSegment && targetList.includes(targetSegment)) {
      nextSegment = targetSegment;
    } else {
      nextSegment = targetList[Math.floor(Math.random() * targetList.length)];
    }

    // Determine if we're reversing on the new segment
    const isNextSegmentFlippedFromCurrent = !(
      (currentSegment.end.x === nextSegment.start.x &&
        currentSegment.end.y === nextSegment.start.y) ||
      (currentSegment.start.x === nextSegment.end.x &&
        currentSegment.start.y === nextSegment.end.y)
    );
    currentlyReversing = currentlyReversing !== isNextSegmentFlippedFromCurrent;
    currentSegment = nextSegment;
  }

  return {
    point: { x: 0, y: 0 },
    excess: 0,
    finalSegment: segment,
    reversing: currentlyReversing,
  };
}

export function isNetworkCoherent(segments: TrackSegment[]): boolean {
  const visitedSegments = new Set<TrackSegment>();
  let segmentsToVisit: TrackSegment[] = [segments[0]];
  if (segments.length === 1) return false;

  visitedSegments.add(segments[0]);
  while (visitedSegments.size < segments.length && segmentsToVisit.length) {
    const nextSegmentsToVisit: TrackSegment[] = [];
    segmentsToVisit.forEach((segment) => {
      visitedSegments.add(segment);
      nextSegmentsToVisit.push(
        ...segment.atStart.filter(
          (startSegment) => !visitedSegments.has(startSegment),
        ),
      );
      nextSegmentsToVisit.push(
        ...segment.atEnd.filter(
          (endSegment) => !visitedSegments.has(endSegment),
        ),
      );
    });
    segmentsToVisit = nextSegmentsToVisit;
  }
  return visitedSegments.size === segments.length;
}

export function areAnglesEqual(angleA: number, angleB: number) {
  return (
    (angleA + 2 * Math.PI) % (2 * Math.PI) ===
    (angleB + 2 * Math.PI) % (2 * Math.PI)
  );
}

/**
 * Turns "distance effort" into distance, to handle slowdown near a station.
 * @param distance the amount of effort moved along the track
 * @param stationPosition the position of the station along the track
 * @param slowdownAmount the amount of extra effort it should take to go across this track
 */
export function distanceEffortToDistance(
  distanceEffort: number,
  stationPosition: number,
  slowdownAmount: number,
) {
  const stationPositionInDistanceEffort = stationPosition + slowdownAmount / 2;
  let result = 0;
  if (distanceEffort < stationPositionInDistanceEffort - slowdownAmount) {
    result = distanceEffort;
  } else if (distanceEffort < stationPositionInDistanceEffort) {
    result =
      -(
        (distanceEffort - stationPositionInDistanceEffort) ** 2 /
        (2 * slowdownAmount)
      ) +
      stationPositionInDistanceEffort -
      slowdownAmount / 2;
  } else if (
    distanceEffort <
    stationPositionInDistanceEffort + slowdownAmount
  ) {
    result =
      (distanceEffort - stationPositionInDistanceEffort) ** 2 /
        (2 * slowdownAmount) +
      stationPositionInDistanceEffort -
      slowdownAmount / 2;
  } else {
    result = distanceEffort - slowdownAmount;
  }
  return result;
}

export function generateName(p: number) {
  const v = "eaoiuy";
  const c = "tnshrdlwpfgcvbmjkzxq";
  const f = (a: string) => {
    const val = Math.random();
    return a[Math.floor(val ** p * a.length)];
  };
  return f(c).toUpperCase() + f(v) + f(c) + f(v) + f(c);
}

export function getNextJunction(segment: TrackSegment, reversing: boolean) {
  let upcoming = reversing ? segment.atStart : segment.atEnd;
  let safetyValve = 100;
  let currentConnectionPoint = reversing ? segment.start : segment.end;
  let angleAt = reversing ? segment.initialAngle + Math.PI : segment.finalAngle;
  while (safetyValve > 0 && upcoming.length === 1) {
    safetyValve -= 1;

    const connectsAtStart =
      upcoming[0].start.x === currentConnectionPoint.x &&
      upcoming[0].start.y === currentConnectionPoint.y;
    reversing = !connectsAtStart;
    segment = upcoming[0];
    upcoming = reversing ? segment.atStart : segment.atEnd;
    // figure out if we'll be reversing on this segment
    currentConnectionPoint = reversing ? segment.start : segment.end;
    angleAt = reversing ? segment.initialAngle + Math.PI : segment.finalAngle;
  }

  return {
    segments: upcoming,
    position: currentConnectionPoint,
    angle: angleAt,
  };
}
