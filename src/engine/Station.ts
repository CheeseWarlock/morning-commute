import Passenger from "./Passenger";
import TrackSegment from "./TrackSegment";

/**
 * The side of a Track on which an element exists.
 * Relative to the track's direction.
 */
export enum ALIGNMENT {
  LEFT,
  RIGHT,
}

/**
 * A place where Passengers are picked up and dropped off.
 */
class Station {
  waitingPassengers: Passenger[] = [];
  trackSegment: TrackSegment;
  distanceAlong: number;
  alignment: ALIGNMENT;

  constructor(
    trackSegment: TrackSegment,
    distanceAlong: number,
    alignment: ALIGNMENT,
  ) {
    this.trackSegment = trackSegment;
    this.distanceAlong = distanceAlong;
    this.alignment = alignment;
  }

  get position() {
    const positionAlong = this.trackSegment.getPositionAlong(
      this.distanceAlong,
    );
    return { x: positionAlong.point.x, y: positionAlong.point.y };
  }
}

export default Station;
