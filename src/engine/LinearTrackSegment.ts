import Point from "./Point";
import TrackSegment from "./TrackSegment";

class LinearTrackSegment implements TrackSegment {
  length: number;
  start: Point;
  end: Point;
  atStart: TrackSegment[];
  atEnd: TrackSegment[];

  constructor(start: Point, end: Point) {
    this.start = start;
    this.end = end;
    this.length = Math.sqrt((start.x - end.x) ** 2 + (start.y - end.y) ** 2);
    this.atStart = [];
    this.atEnd = [];
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
}

export default LinearTrackSegment;
