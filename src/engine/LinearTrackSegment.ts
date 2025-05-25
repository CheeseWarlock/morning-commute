import Point from "./Point";
import { ALIGNMENT } from "./Station";
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

  distanceToPosition(point: Point) {
    const startX = this.start.x;
    const endX = this.end.x;
    const startY = this.start.y;
    const endY = this.end.y;

    var A = point.x - startX;
    var B = point.y - startY;
    var C = endX - startX;
    var D = endY - startY;

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0)
      //in case of 0 length line
      param = dot / len_sq;

    var xx, yy;

    if (param < 0) {
      xx = startX;
      yy = startY;
    } else if (param > 1) {
      xx = endX;
      yy = endY;
    } else {
      xx = startX + param * C;
      yy = startY + param * D;
    }

    var dx = point.x - xx;
    var dy = point.y - yy;

    // Get the angle now
    let angleA = Math.atan2(point.y - this.start.y, point.x - this.start.x);
    const angleB = Math.atan2(
      this.end.y - this.start.y,
      this.end.x - this.start.x,
    );

    while (angleA < angleB) {
      angleA += Math.PI * 2;
    }

    return {
      point: { x: xx, y: yy },
      distance: Math.sqrt(dx * dx + dy * dy),
      distanceAlong: param > 1 ? 1 : param < 0 ? 0 : param,
      alignment: angleA - angleB > Math.PI ? ALIGNMENT.LEFT : ALIGNMENT.RIGHT,
    };
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

  toJSON() {
    return JSON.stringify({
      id: this.id,
      start: this.start,
      end: this.end,
      atStart: this.atStart.map((seg) => seg.id),
      atEnd: this.atEnd.map((seg) => seg.id),
    });
  }
}

export default LinearTrackSegment;
