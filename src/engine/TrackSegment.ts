import Point from "./Point";

interface TrackSegment {
  length: number;
  start: Point;
  end: Point;
  atStart: TrackSegment[];
  atEnd: TrackSegment[];
  getPositionAlong: (
    distance: number,
    reverse?: boolean,
  ) => { point: Point; excess: number };
}

export default TrackSegment;
