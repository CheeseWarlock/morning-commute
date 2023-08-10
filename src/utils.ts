import Point from "./engine/Point";
import TrackSegment from "./engine/TrackSegment";

/**
 * Best-effort navigation along a network of path segments.
 * Stops when there's a decision point.
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
): { point: Point; excess: number } {
  let distanceRemaining = distance + startingDistance;
  let currentSegment = segment;
  while (currentSegment) {
    const followCurrentSegment = currentSegment.getPositionAlong(
      distanceRemaining,
      reverse,
    );
    if (followCurrentSegment.excess === 0) {
      return followCurrentSegment;
    }

    distanceRemaining -= currentSegment.length;
    currentSegment = currentSegment.atEnd[0];
  }

  return {
    point: { x: 0, y: 0 },
    excess: 0,
  };
}

export function isNetworkCoherent(segments: TrackSegment[]): boolean {
  const visitedSegments = new Set<TrackSegment>();
  let segmentsToVisit: TrackSegment[] = [segments[0]];

  visitedSegments.add(segments[0]);
  while (visitedSegments.size < segments.length && segmentsToVisit.length) {
    console.log(visitedSegments.size < segments.length, segmentsToVisit.length);
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
      console.log("nstv", nextSegmentsToVisit.length);
    });
    segmentsToVisit = nextSegmentsToVisit;
  }
  return visitedSegments.size === segments.length;
}
