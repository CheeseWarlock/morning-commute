import { generateName } from "../utils";
import TrackSegment from "./TrackSegment";

/**
 * The side of a Track on which an element exists.
 * Relative to the track's direction.
 */
export enum ALIGNMENT {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

/**
 * A place where Passengers are picked up and dropped off.
 */
class Station {
  trackSegment: TrackSegment;
  distanceAlong: number;
  alignment: ALIGNMENT;
  name: string;

  constructor(
    trackSegment: TrackSegment,
    distanceAlong: number,
    alignment: ALIGNMENT,
  ) {
    this.trackSegment = trackSegment;
    this.distanceAlong = distanceAlong;
    this.alignment = alignment;
    this.name = generateName(2);
  }

  get position() {
    const positionAlong = this.trackSegment.getPositionAlong(
      this.distanceAlong,
    ).point;
    let angleFromForward = this.trackSegment.getAngleAlong(this.distanceAlong);
    angleFromForward +=
      this.alignment === ALIGNMENT.LEFT ? -Math.PI / 2 : Math.PI / 2;

    positionAlong.x += Math.cos(angleFromForward) * 5;
    positionAlong.y += Math.sin(angleFromForward) * 5;
    return { x: positionAlong.x, y: positionAlong.y };
  }
}

export default Station;
