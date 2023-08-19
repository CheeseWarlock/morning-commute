import CircularTrackSegment from "../CircularTrackSegment";
import LinearTrackSegment from "../LinearTrackSegment";
import TrackSegment from "../TrackSegment";

export function getExtentForTrackSegment(trackSegment: TrackSegment): {
  min: { x: number; y: number };
  max: { x: number; y: number };
} {
  if (trackSegment instanceof CircularTrackSegment) {
    return {
      min: {
        x: trackSegment.center.x - trackSegment.radius,
        y: trackSegment.center.y - trackSegment.radius,
      },
      max: {
        x: trackSegment.center.x + trackSegment.radius,
        y: trackSegment.center.y + trackSegment.radius,
      },
    };
  } else if (trackSegment instanceof LinearTrackSegment) {
    const xs = [trackSegment.start.x, trackSegment.end.x];
    const ys = [trackSegment.start.y, trackSegment.end.y];

    return {
      min: {
        x: Math.min(...xs),
        y: Math.min(...ys),
      },
      max: {
        x: Math.max(...xs),
        y: Math.max(...ys),
      },
    };
  }
  return {
    min: { x: 0, y: 0 },
    max: { x: 10, y: 10 },
  };
}
