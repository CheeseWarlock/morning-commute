import TrackSegment from "./TrackSegment";

/**
 * A set of Track Segments and other gameplay elements.
 */
class Network {
  segments: TrackSegment[] = [];
  trains: any[] = [];

  constructor(segments?: TrackSegment[]) {
    if (segments) this.segments = segments;
  }

  /**
   * Connect all segments based on position.
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
