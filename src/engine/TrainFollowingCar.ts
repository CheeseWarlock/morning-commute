import Point from "./Point";
import TrackSegment from "./TrackSegment";

class TrainFollowingCar {
  position: Point;
  currentSegment: TrackSegment;
  distanceAlong: number;
  isReversing: boolean;

  constructor(
    p: Point,
    currentSegment: TrackSegment,
    distanceAlong: number,
    isReversing: boolean,
  ) {
    this.position = p;
    this.currentSegment = currentSegment;
    this.distanceAlong = distanceAlong;
    this.isReversing = isReversing;
  }
}

export default TrainFollowingCar;
