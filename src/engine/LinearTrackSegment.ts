import Point from "./Point";
import TrackSegment from "./TrackSegment";

/**
 * A segment of straight track.
 */
class LinearTrackSegment extends TrackSegment {
  start: Point;
  end: Point;
  atStart: TrackSegment[];
  atEnd: TrackSegment[];

  constructor(start: Point, end: Point) {
    super();
    this.start = { x: start.x, y: start.y };
    this.end = { x: end.x, y: end.y };
    this.atStart = [];
    this.atEnd = [];
  }

  get length() {
    return Math.sqrt(
      (this.start.x - this.end.x) ** 2 + (this.start.y - this.end.y) ** 2,
    );
  }

  get initialAngle() {
    return Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x);
  }

  get finalAngle() {
    return Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x);
  }

  distanceToPosition(point: Point): number {
    const x = point.x;
    const y = point.y;
    const x1 = this.start.x;
    const x2 = this.end.x;
    const y1 = this.start.y;
    const y2 = this.end.y;

    var A = x - x1;
    var B = y - y1;
    var C = x2 - x1;
    var D = y2 - y1;

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0)
      //in case of 0 length line
      param = dot / len_sq;

    var xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    var dx = x - xx;
    var dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getPositionAlong(
    distance: number,
    reverse: boolean = false,
  ): { point: Point; excess: number } {
    const dx = (this.end.x - this.start.x) / this.length;
    const dy = (this.end.y - this.start.y) / this.length;

    if (distance > this.length) {
      if (reverse) {
        return {
          point: {
            x: this.start.x,
            y: this.start.y,
          },
          excess: distance - this.length,
        };
      } else {
        return {
          point: {
            x: this.end.x,
            y: this.end.y,
          },
          excess: distance - this.length,
        };
      }
    } else if (distance < 0) {
      if (reverse) {
        return {
          point: {
            x: this.end.x,
            y: this.end.y,
          },
          excess: -distance,
        };
      } else {
        return {
          point: {
            x: this.start.x,
            y: this.start.y,
          },
          excess: -distance,
        };
      }
    } else {
      if (reverse) {
        return {
          point: {
            x: this.end.x - dx * distance,
            y: this.end.y - dy * distance,
          },
          excess: 0,
        };
      } else {
        return {
          point: {
            x: this.start.x + dx * distance,
            y: this.start.y + dy * distance,
          },
          excess: 0,
        };
      }
    }
  }

  getAngleAlong(_distance: number, _reverse: boolean = false) {
    return this.initialAngle + (_reverse ? Math.PI : 0);
  }
}

export default LinearTrackSegment;
