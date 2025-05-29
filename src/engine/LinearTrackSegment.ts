import { JSONTrackSegment } from "./JSONNetworkLoader";
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

  toJSON(): JSONTrackSegment {
    const stations = this.stations.length > 0 ? this.stations.map((station) => ({ distanceAlong: station.distanceAlong, alignment: station.alignment })) : undefined;
    return {
      id: this.id,
      start: this.start,
      end: this.end,
      atStart: this.atStart.map((seg) => seg.id),
      atEnd: this.atEnd.map((seg) => seg.id),
      stations: stations,
    };
  }

  isWithinRectangle(upperLeft: Point, lowerRight: Point) {
    const lineDelta = {
      x: 1 / (this.end.x - this.start.x),
      y: 1 / (this.end.y - this.start.y),
    };
  
    const isForwardX = lineDelta.x > 0;
    const isForwardY = lineDelta.y > 0;
  
    // Which h side is closest
    const firstX = isForwardX ? upperLeft.x : lowerRight.x;
    const firstY = isForwardY ? upperLeft.y : lowerRight.y;
  
    const secondX = isForwardX ? lowerRight.x : upperLeft.x;
    const secondY = isForwardY ? lowerRight.y : upperLeft.y;
  
    const firstXProportion = (firstX - this.start.x) * lineDelta.x;
    const firstYProportion = (firstY - this.start.y) * lineDelta.y;
  
    const secondXProportion = (secondX - this.start.x) * lineDelta.x;
    const secondYProportion = (secondY - this.start.y) * lineDelta.y;
  
    if (firstXProportion > secondYProportion || firstYProportion > secondXProportion) {
      return false;
    }
  
    const closestFirstProportion = Math.max(firstXProportion, firstYProportion);
  const closestSecondProportion = Math.min(secondXProportion, secondYProportion);

  if(closestFirstProportion > closestSecondProportion) {
    return false;
  }

  if (closestFirstProportion >= 1 || closestSecondProportion <= 0) {
    return false;
  }

  return true;
  }
}

export default LinearTrackSegment;
