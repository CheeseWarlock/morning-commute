import Station from "./Station";
import TrackSegment from "./TrackSegment";
import Train from "./Train";

/**
 * A set of Track Segments and other gameplay elements.
 */
class Network {
  segments: TrackSegment[] = [];
  trains: Train[] = [];
  stations: Station[] = [];

  constructor(segments?: TrackSegment[]) {
    if (segments) this.segments = segments;
  }

  /**
   * Connect all segments based on position.
   *
   * @param options.ignoreAngles Whether segments with matching start/end points
   * should be connected even if their angles don't match.
   */
  autoConnect(options?: { ignoreAngles?: boolean }) {
    const ignoreAngles = options?.ignoreAngles || false;
    this.segments.forEach((segmentA) => {
      this.segments.forEach((segmentB) => {
        if (segmentA !== segmentB) {
          segmentA.connect(segmentB, ignoreAngles);
        }
      });
    });
  }

  update() {
    this.trains.forEach((t) => t.update());
  }
}

export default Network;
