import TrackSegment from "./TrackSegment";
import Station from "./Station";
import { getExtentForTrackSegment } from "./networks/trackutils";

/**
 * A set of Track Segments and other gameplay elements.
 */
class Network {
  segments: TrackSegment[] = [];

  constructor(segments?: TrackSegment[]) {
    if (segments) this.segments = segments;
  }

  /**
   * Get all stations from all segments.
   */
  get stations(): Station[] {
    return this.segments.flatMap((segment) => segment.stations);
  }

  /**
   * Connect all segments based on position.
   *
   * @param options.ignoreAngles Whether segments with matching start/end points
   * should be connected even if their angles don't match.
   */
  autoConnect(options?: { ignoreAngles?: boolean }) {
    const priorConnections = this.segments.reduce((acc, segment) => {
      return acc + segment.atStart.length + segment.atEnd.length;
    }, 0);

    const ignoreAngles = options?.ignoreAngles || false;
    this.segments.forEach((segmentA) => {
      this.segments.forEach((segmentB) => {
        if (segmentA !== segmentB) {
          segmentA.connect(segmentB, ignoreAngles);
        }
      });
    });

    const afterConnections = this.segments.reduce((acc, segment) => {
      return acc + segment.atStart.length + segment.atEnd.length;
    }, 0);

    if (afterConnections !== priorConnections) {
      console.warn(
        `Auto-connected ${afterConnections - priorConnections} connections`,
      );
    }
  }

  getBounds() {
    const gameBounds = this.segments.map((segment: TrackSegment) =>
      getExtentForTrackSegment(segment),
    );
    const minX = Math.min(
      ...gameBounds.map((b: { min: { x: number } }) => b.min.x),
    );
    const maxX = Math.max(
      ...gameBounds.map((b: { max: { x: number } }) => b.max.x),
    );
    const minY = Math.min(
      ...gameBounds.map((b: { min: { y: number } }) => b.min.y),
    );
    const maxY = Math.max(
      ...gameBounds.map((b: { max: { y: number } }) => b.max.y),
    );

    return {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY },
    };
  }
}

export default Network;
