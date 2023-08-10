import Point from "./Point";
import TrackSegment from "./TrackSegment";

class CircularTrackSegment implements TrackSegment {
  start: Point;
  end: Point;
  atStart: TrackSegment[];
  atEnd: TrackSegment[];
  center: Point;
  counterClockWise: boolean;
  _length: number;

  constructor(
    start: Point,
    end: Point,
    center: Point,
    counterClockWise: boolean = true,
  ) {
    this.start = start;
    this.end = end;
    this.center = center;
    this.counterClockWise = counterClockWise;

    let initialAngle = Math.atan2(
      this.start.y - this.center.y,
      this.start.x - this.center.x,
    );
    let finalAngle = Math.atan2(
      this.end.y - this.center.y,
      this.end.x - this.center.x,
    );

    // Convert angles to range of [0 - 2*Pi]
    initialAngle = (initialAngle + 2 * Math.PI) % (2 * Math.PI);
    finalAngle = (finalAngle + 2 * Math.PI) % (2 * Math.PI);

    // Then make the correct one larger based on CCW
    if (counterClockWise) {
      // Final should be less
      if (finalAngle > initialAngle) {
        initialAngle += 2 * Math.PI;
      }
    } else {
      if (initialAngle > finalAngle) {
        finalAngle += 2 * Math.PI;
      }
    }

    const radius = Math.sqrt(
      (center.x - start.x) ** 2 + (center.y - start.y) ** 2,
    );
    this._length = Math.abs(finalAngle - initialAngle) * radius;
    this.atStart = [];
    this.atEnd = [];
  }

  get length() {
    return this._length;
  }

  get isWellConnected() {
    return this.atStart?.length > 0 && this.atEnd.length > 0;
  }

  /**
   * Connects the end of this segment to the start of another.
   * @param segment
   */
  connect(segment: TrackSegment) {
    this.atEnd.push(segment);
    segment.atStart.push(this);
  }

  getPositionAlong(
    distance: number,
    reverse: boolean = false,
  ): { point: Point; excess: number } {
    return {
      point: {
        x: 0,
        y: 0,
      },
      excess: 0,
    };
  }
}

export default CircularTrackSegment;
