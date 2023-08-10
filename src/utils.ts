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
    const nextSegment = targetList[Math.floor(0.999 * targetList.length)];

    // Determine if we're reversing on the new segment
    const isNextSegmentFlippedFromCurrent = !(
      currentSegment.end.x === nextSegment.start.x &&
      currentSegment.end.y === nextSegment.start.y
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
