import Point from "./Point";

interface TrackSegment {
  length: number;
  start: Point;
  end: Point;
  atStart: TrackSegment[];
  atEnd: TrackSegment[];
  getPositionAlong: (
    distance: number,
    number?: boolean,
  ) => { point: Point; excess: number };
}

export default TrackSegment;
