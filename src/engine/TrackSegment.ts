import { areAnglesEqual } from "../utils";
import Point from "./Point";

/**
 * A segment of track of any shape.
 */
abstract class TrackSegment {
  abstract length: number;
  abstract start: Point;
  abstract end: Point;
  /**
   * The segments connecting to the start of this one.
   */
  abstract atStart: TrackSegment[];
  /**
   * The segments connecting to the end of this one.
   */
  abstract atEnd: TrackSegment[];
  /**
   * The direction of travel of the start of this track segment.
   */
  abstract initialAngle: number;
  /**
   * The direction of travel at the end of this track segment.
   */
  abstract finalAngle: number;
  abstract getPositionAlong(
    distance: number,
    reverse?: boolean,
  ): { point: Point; excess: number };

  abstract getAngleAlong(distance: number, reverse?: boolean): number;

  get isWellConnected() {
    return this.atStart?.length > 0 && this.atEnd.length > 0;
  }

  /**
   * Connects this segment to another segment based on position, regardless of angle.
   * @param segment
   */
  connect(segment: TrackSegment, ignoreAngles: boolean = false) {
    const groups = [
      {
        points: [this.start, segment.start],
        arrays: [this.atStart, segment.atStart],
        angles: areAnglesEqual(
          this.initialAngle,
          segment.initialAngle + Math.PI,
        ),
      },
      {
        points: [this.end, segment.start],
        arrays: [this.atEnd, segment.atStart],
        angles: areAnglesEqual(this.finalAngle, segment.initialAngle),
      },
      {
        points: [this.start, segment.end],
        arrays: [this.atStart, segment.atEnd],
        angles: areAnglesEqual(this.initialAngle, segment.finalAngle),
      },
      {
        points: [this.end, segment.end],
        arrays: [this.atEnd, segment.atEnd],
        angles: areAnglesEqual(this.finalAngle, segment.finalAngle + Math.PI),
      },
    ];
    const matchingPoints = groups.find(
      (group) =>
        group.points[0].x === group.points[1].x &&
        group.points[0].y === group.points[1].y,
    );

    if (!matchingPoints) return;

    if (ignoreAngles || matchingPoints.angles) {
      if (!matchingPoints.arrays[0].includes(segment))
        matchingPoints.arrays[0].push(segment);
      if (!matchingPoints.arrays[1].includes(this))
        matchingPoints.arrays[1].push(this);
    }
  }
}

export default TrackSegment;
