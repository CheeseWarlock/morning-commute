import Point from "./Point";

/**
 * A segment of track of any shape.
 */
abstract class TrackSegment {
  abstract length: number;
  abstract start: Point;
  abstract end: Point;
  abstract atStart: TrackSegment[];
  abstract atEnd: TrackSegment[];
  abstract getPositionAlong(
    distance: number,
    reverse?: boolean,
  ): { point: Point; excess: number };

  get isWellConnected() {
    return this.atStart?.length > 0 && this.atEnd.length > 0;
  }

  /**
   * Connects this segment to another segment based on position, regardless of angle.
   * @param segment
   */
  connect(segment: TrackSegment, ignoreAngles: boolean = false) {
    let matchingPoints: TrackSegment[];

    if (this.start.x === segment.start.x && this.start.y === segment.start.y) {
      if (!this.atStart.includes(segment)) this.atStart.push(segment);
      if (!segment.atStart.includes(this)) segment.atStart.push(this);
    } else if (
      this.start.x === segment.end.x &&
      this.start.y === segment.end.y
    ) {
      if (!this.atStart.includes(segment)) this.atStart.push(segment);
      if (!segment.atEnd.includes(this)) segment.atEnd.push(this);
    } else if (
      this.end.x === segment.start.x &&
      this.end.y === segment.start.y
    ) {
      if (!this.atEnd.includes(segment)) this.atEnd.push(segment);
      if (!segment.atStart.includes(this)) segment.atStart.push(this);
    } else if (this.end.x === segment.end.x && this.end.y === segment.end.y) {
      if (!this.atEnd.includes(segment)) this.atEnd.push(segment);
      if (!segment.atEnd.includes(this)) segment.atEnd.push(this);
    }
  }
}

export default TrackSegment;
