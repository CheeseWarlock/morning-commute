import CircularTrackSegment from "../CircularTrackSegment";
import LinearTrackSegment from "../LinearTrackSegment";
import Network from "../Network";

const pieces = [
  new CircularTrackSegment({ x: 0, y: 20 }, { x: 20, y: 0 }, { x: 20, y: 20 }),
  new LinearTrackSegment({ x: 20, y: 0 }, { x: 40, y: 0 }),

  new CircularTrackSegment({ x: 40, y: 0 }, { x: 60, y: 20 }, { x: 40, y: 20 }),
  new LinearTrackSegment({ x: 60, y: 20 }, { x: 60, y: 40 }),

  new CircularTrackSegment(
    { x: 60, y: 40 },
    { x: 40, y: 60 },
    { x: 40, y: 40 },
  ),
  new LinearTrackSegment({ x: 40, y: 60 }, { x: 20, y: 60 }),

  new CircularTrackSegment({ x: 20, y: 60 }, { x: 0, y: 40 }, { x: 20, y: 40 }),
  new LinearTrackSegment({ x: 0, y: 40 }, { x: 0, y: 20 }),
];

export default new Network(pieces);
