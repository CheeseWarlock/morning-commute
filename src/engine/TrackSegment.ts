import Point from "./Point";

class TrackSegment {
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

  getPositionAlong(distance: number): { point: Point; excess: number } {
    const dx = (this.end.x - this.start.x) / this.length;
    const dy = (this.end.y - this.start.y) / this.length;

    if (distance > this.length) {
      return {
        point: {
          x: this.end.x,
          y: this.end.y,
        },
        excess: distance - this.length,
      };
    }

    return {
      point: {
        x: this.start.x + dx * distance,
        y: this.start.y + dy * distance,
      },
      excess: 0,
    };
  }
}

export default TrackSegment;
