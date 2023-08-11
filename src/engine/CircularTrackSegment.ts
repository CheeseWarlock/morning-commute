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
  #theta: number;
  radius: number;
  initialAngle: number;
  finalAngle: number;

  constructor(
    start: Point,
    end: Point,
    center: Point,
    counterClockWise: boolean = false,
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
    this.initialAngle = initialAngle;
    this.finalAngle = finalAngle;

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
    this.#theta = Math.abs(finalAngle - initialAngle);
    this.radius = radius;
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
    /**/ if (
      this.start.x === segment.start.x &&
      this.start.y === segment.start.y
    ) {
      this.atStart.push(segment);
      segment.atStart.push(this);
    } else if (
      this.start.x === segment.end.x &&
      this.start.y === segment.end.y
    ) {
      this.atStart.push(segment);
      segment.atEnd.push(this);
    } else if (
      this.end.x === segment.start.x &&
      this.end.y === segment.start.y
    ) {
      this.atEnd.push(segment);
      segment.atStart.push(this);
    } else if (this.end.x === segment.end.x && this.end.y === segment.end.y) {
      this.atEnd.push(segment);
      segment.atEnd.push(this);
    }
  }

  getPositionAlong(
    distance: number,
    reverse: boolean = false,
  ): { point: Point; excess: number } {
    if (distance > this.length) {
      const point = reverse ? this.start : this.end;
      return {
        point: {
          x: point.x,
          y: point.y,
        },
        excess: distance - this.length,
      };
    }

    const theta = distance / this.radius;

    // The starting angle for this calculation
    const startingAngle = reverse ? this.finalAngle : this.initialAngle;
    let angleAlong = 0;

    // If we're in reverse, the CCWness of this segment is inverted for this calculation
    if (this.counterClockWise !== reverse) {
      angleAlong = startingAngle - theta;
    } else {
      angleAlong = startingAngle + theta;
    }

    return {
      point: {
        x: this.center.x + Math.cos(angleAlong) * this.radius,
        y: this.center.y + Math.sin(angleAlong) * this.radius,
      },
      excess: 0,
    };
  }
}

export default CircularTrackSegment;
