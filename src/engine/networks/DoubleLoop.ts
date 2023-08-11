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

  new CircularTrackSegment({ x: 60, y: 20 }, { x: 80, y: 0 }, { x: 80, y: 20 }),
  new LinearTrackSegment({ x: 80, y: 0 }, { x: 100, y: 0 }),

  new CircularTrackSegment(
    { x: 100, y: 0 },
    { x: 120, y: 20 },
    { x: 100, y: 20 },
  ),
  new LinearTrackSegment({ x: 120, y: 20 }, { x: 120, y: 40 }),

  new CircularTrackSegment(
    { x: 120, y: 40 },
    { x: 100, y: 60 },
    { x: 100, y: 40 },
  ),
  new LinearTrackSegment({ x: 100, y: 60 }, { x: 80, y: 60 }),

  new CircularTrackSegment(
    { x: 80, y: 60 },
    { x: 60, y: 40 },
    { x: 80, y: 40 },
  ),
];

export default new Network(pieces);
