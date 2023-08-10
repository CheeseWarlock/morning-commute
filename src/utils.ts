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
): { point: Point; excess: number; finalSegment: TrackSegment } {
  let distanceRemaining = distance + startingDistance;
  let currentSegment = segment;
  while (currentSegment) {
    const followCurrentSegment = currentSegment.getPositionAlong(
      distanceRemaining,
      reverse,
    );
    if (followCurrentSegment.excess === 0) {
      return {
        point: followCurrentSegment.point,
        excess: 0,
        finalSegment: currentSegment,
      };
    }

    distanceRemaining -= currentSegment.length;
    currentSegment =
      currentSegment.atEnd[
        Math.floor(Math.random() * currentSegment.atEnd.length)
      ];
  }

  return {
    point: { x: 0, y: 0 },
    excess: 0,
    finalSegment: segment,
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
