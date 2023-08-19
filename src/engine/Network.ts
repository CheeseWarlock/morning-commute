import GameObject from "./GameObject";
import Passenger from "./Passenger";
import Station from "./Station";
import TrackSegment from "./TrackSegment";
import Train from "./Train";
import { getExtentForTrackSegment } from "./networks/trackutils";

/**
 * A set of Track Segments and other gameplay elements.
 */
class Network implements GameObject {
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

  update(deltaT: number) {
    this.generatePassengers();
    this.trains.forEach((t) => t.update(deltaT));
    this.detectCollisions();
  }

  /**
   * This is currently a VERY naive implementation.
   */
  detectCollisions() {
    this.trains.forEach((t1) => {
      this.trains.forEach((t2) => {
        if (t1 !== t2) {
          const d = Math.sqrt(
            (t1.position.x - t2.position.x) ** 2 +
              (t1.position.y - t2.position.y) ** 2,
          );
          if (d < 10) {
            t1.passengers = [];
            t2.passengers = [];
          }
        }
      });
    });
  }

  generatePassengers() {
    this.stations.forEach((station) => {
      if (Math.random() > 0.995) {
        const destinations = this.stations.filter((s) => s !== station);
        const destination =
          destinations[Math.floor(Math.random() * destinations.length)];
        station.waitingPassengers.push(new Passenger(station, destination));
      }
    });
  }
}

export default Network;
