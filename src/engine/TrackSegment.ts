import { areAnglesEqual } from "../utils";
import { JSONTrackSegment } from "./JSONNetworkLoader";
import Point from "./Point";
import Station, { ALIGNMENT } from "./Station";
import { v4 as uuidv4 } from "uuid";

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

  /**
   * Convert this segment to JSON-like object for export.
   */
  abstract toJSON(): JSONTrackSegment;
  stations: Station[] = [];
  /**
   * The UUID of this track segment.
   */
  id: string;
  /**
   * Gets the point along the segment at a given distance.
   */
  abstract getPositionAlong(
    distance: number,
    reverse?: boolean,
  ): { point: Point; excess: number };
  /**
   * Gets the distance from a point to the nearest point on the segment.
   */
  abstract distanceToPosition(point: Point): {
    point: Point;
    distance: number;
    distanceAlong: number;
    alignment: ALIGNMENT;
  };
  trainStartPositions: { distanceAlong: number; reverse: boolean }[] = [];

  constructor() {
    this.id = uuidv4();
  }

  abstract getAngleAlong(distance: number, reverse?: boolean): number;

  /**
   * Checks if any part of this segment is within a rectangle.
   * @param from The upper left corner of the rectangle.
   * @param to The lower right corner of the rectangle.
   */
  abstract isWithinRectangle(from: Point, to: Point): boolean;

  get isWellConnected() {
    return this.atStart?.length > 0 && this.atEnd.length > 0;
  }

  /**
   * Connects this segment to another segment based on position, regardless of angle.
   * @param segment The segment to connect to.
   * @param ignoreAngles Whether to ignore the angles of the segments.
   * @param mutual Whether to connect the other segment back
   */
  connect(segment: TrackSegment, ignoreAngles: boolean = false, mutual: boolean = true) {
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
    const matchingPoints = groups.filter(
      (group) =>
        Math.abs(group.points[0].x - group.points[1].x) < 0.0001 &&
        Math.abs(group.points[0].y - group.points[1].y) < 0.0001,
    );

    if (!matchingPoints.length) return;

    matchingPoints.forEach((group) => {
      if (ignoreAngles || group.angles) {
        if (!group.arrays[0].includes(segment)) group.arrays[0].push(segment);
        if (mutual && !group.arrays[1].includes(this)) group.arrays[1].push(this);
      }
    });
  }

  disconnect(segment: TrackSegment, mutual: boolean = true) {
    this.atStart = this.atStart.filter((s) => s !== segment);
    this.atEnd = this.atEnd.filter((s) => s !== segment);
    if (mutual) {
      segment.atStart = segment.atStart.filter((s) => s !== this);
      segment.atEnd = segment.atEnd.filter((s) => s !== this);
    }
  }

  disconnectAll(mutual: boolean = true) {
    if (mutual) {
      this.atStart.forEach((s) => s.disconnect(this, false));
      this.atEnd.forEach((s) => s.disconnect(this, false));
    }
    this.atStart = [];
    this.atEnd = [];
  }
}

export default TrackSegment;
