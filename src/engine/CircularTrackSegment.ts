import Point from "./Point";
import TrackSegment from "./TrackSegment";

/**
 * A segment of track with a circular curve.
 */
class CircularTrackSegment extends TrackSegment {
  start: Point;
  end: Point;
  atStart: TrackSegment[];
  atEnd: TrackSegment[];
  center: Point;
  counterClockWise: boolean;

  constructor(
    start: Point,
    end: Point,
    center: Point,
    counterClockWise: boolean = false,
  ) {
    super();
    this.start = { x: start.x, y: start.y };
    this.end = { x: end.x, y: end.y };
    this.center = center;
    this.counterClockWise = counterClockWise;
    this.atStart = [];
    this.atEnd = [];
  }

  get radius() {
    const radius = Math.sqrt(
      (this.center.x - this.start.x) ** 2 + (this.center.y - this.start.y) ** 2,
    );
    return radius;
  }

  /**
   * Initial angle (direction of travel)
   */
  get initialAngle() {
    // Angles from start/end to center...
    let initialAngle = Math.atan2(
      this.start.y - this.center.y,
      this.start.x - this.center.x,
    );

    // So rotate by 90 degrees
    if (this.counterClockWise) {
      initialAngle -= Math.PI / 2;
    } else {
      initialAngle += Math.PI / 2;
    }

    return initialAngle;
  }

  /**
   * Final angle (direction of travel)
   */
  get finalAngle() {
    let finalAngle = Math.atan2(
      this.end.y - this.center.y,
      this.end.x - this.center.x,
    );

    // So rotate by 90 degrees
    if (this.counterClockWise) {
      finalAngle -= Math.PI / 2;
    } else {
      finalAngle += Math.PI / 2;
    }

    return finalAngle;
  }

  get length() {
    // Angles from start/end to center...
    let initialAngle = Math.atan2(
      this.start.y - this.center.y,
      this.start.x - this.center.x,
    );
    let finalAngle = Math.atan2(
      this.end.y - this.center.y,
      this.end.x - this.center.x,
    );

    // So rotate by 90 degrees
    if (this.counterClockWise) {
      initialAngle -= Math.PI / 2;
      finalAngle -= Math.PI / 2;
    } else {
      initialAngle += Math.PI / 2;
      finalAngle += Math.PI / 2;
    }

    // Convert angles to range of [0 - 2*Pi]
    initialAngle = (initialAngle + 2 * Math.PI) % (2 * Math.PI);
    finalAngle = (finalAngle + 2 * Math.PI) % (2 * Math.PI);

    // Then make the correct one larger based on CCW
    if (this.counterClockWise) {
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
      (this.center.x - this.start.x) ** 2 + (this.center.y - this.start.y) ** 2,
    );
    return Math.abs(finalAngle - initialAngle) * radius;
  }

  get theta() {
    return this.length / this.radius;
  }

  distanceToPosition(point: Point) {
    let angleToPoint = Math.atan2(
      point.y - this.center.y,
      point.x - this.center.x,
    );

    let angleToStart = Math.atan2(
      this.start.y - this.center.y,
      this.start.x - this.center.x,
    );

    let angleToEnd = Math.atan2(
      this.end.y - this.center.y,
      this.end.x - this.center.x,
    );

    // Convert angles to range of [0 - 2*Pi]
    angleToPoint = (angleToPoint + 2 * Math.PI) % (2 * Math.PI);
    angleToStart = (angleToStart + 2 * Math.PI) % (2 * Math.PI);
    angleToEnd = (angleToEnd + 2 * Math.PI) % (2 * Math.PI);

    // Then make the correct one larger based on CCW
    if (this.counterClockWise) {
      // Final should be less
      if (angleToEnd > angleToStart) {
        angleToStart += 2 * Math.PI;
      }
    } else {
      if (angleToStart > angleToEnd) {
        angleToEnd += 2 * Math.PI;
      }
    }

    if (this.counterClockWise) {
      if (angleToPoint > angleToStart) {
        angleToPoint -= Math.PI * 2;
      }
      if (angleToPoint < angleToEnd) {
        angleToPoint += Math.PI * 2;
      }
    } else {
      if (angleToPoint < angleToStart) {
        angleToPoint += Math.PI * 2;
      }
      if (angleToPoint > angleToEnd) {
        angleToPoint -= Math.PI * 2;
      }
    }

    const isInsideCone =
      (!this.counterClockWise &&
        angleToStart < angleToPoint &&
        angleToPoint < angleToEnd) ||
      (this.counterClockWise &&
        angleToEnd < angleToPoint &&
        angleToPoint < angleToStart);

    if (isInsideCone) {
      // Inside the cone
      const distanceToCenter = Math.sqrt(
        (this.center.x - point.x) ** 2 + (this.center.y - point.y) ** 2,
      );
      const proportionAlong = this.counterClockWise
        ? (angleToPoint - angleToEnd) / (angleToStart - angleToEnd)
        : (angleToPoint - angleToStart) / (angleToEnd - angleToStart);
      return {
        point,
        distance: Math.abs(distanceToCenter - this.radius),
        distanceAlong: proportionAlong,
      };
    } else {
      const distanceToStart = Math.sqrt(
        (this.start.x - point.x) ** 2 + (this.start.y - point.y) ** 2,
      );
      const distanceToEnd = Math.sqrt(
        (this.end.x - point.x) ** 2 + (this.end.y - point.y) ** 2,
      );

      return {
        point,
        distance: Math.min(distanceToStart, distanceToEnd),
        distanceAlong: 1,
      };
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

    if (distance < 0) {
      const point = reverse ? this.end : this.start;
      return {
        point: {
          x: point.x,
          y: point.y,
        },
        excess: -distance,
      };
    }

    const theta = distance / this.radius;

    // The starting angle for this calculation
    const startingAngle = reverse
      ? this.finalAngle + Math.PI
      : this.initialAngle;
    let angleAlong = 0;

    // If we're in reverse, the CCWness of this segment is inverted for this calculation
    if (this.counterClockWise !== reverse) {
      angleAlong = startingAngle - theta + Math.PI / 2;
    } else {
      angleAlong = startingAngle + theta - Math.PI / 2;
    }

    return {
      point: {
        x: this.center.x + Math.cos(angleAlong) * this.radius,
        y: this.center.y + Math.sin(angleAlong) * this.radius,
      },
      excess: 0,
    };
  }

  getAngleAlong(distance: number, reverse: boolean = false): number {
    // if clockwise, angle is increasing
    const theta = distance / this.radius;

    // The starting angle for this calculation
    const startingAngle = reverse
      ? this.finalAngle + Math.PI
      : this.initialAngle;
    let angleAlong = 0;

    // If we're in reverse, the CCWness of this segment is inverted for this calculation
    if (this.counterClockWise !== reverse) {
      angleAlong = startingAngle - theta;
    } else {
      angleAlong = startingAngle + theta;
    }

    // TODO: is this edge case real?
    if (Math.abs(angleAlong + Math.PI) < 0.0000001) {
      return Math.PI;
    }
    // Convert to -PI - +PI
    return ((angleAlong + Math.PI) % (Math.PI * 2)) - Math.PI;
  }
}

export default CircularTrackSegment;
