import CircularTrackSegment from "../CircularTrackSegment";
import LinearTrackSegment from "../LinearTrackSegment";
import Network from "../Network";

const h1 = new LinearTrackSegment({ x: 40, y: 0 }, { x: 0, y: 0 });
const h2 = new LinearTrackSegment({ x: 0, y: 40 }, { x: 40, y: 40 });
const h3 = new LinearTrackSegment({ x: 40, y: 80 }, { x: 0, y: 80 });
const v1 = new LinearTrackSegment({ x: 0, y: 0 }, { x: 0, y: 40 });
const v2 = new LinearTrackSegment({ x: 40, y: 40 }, { x: 40, y: 0 });
const v3 = new LinearTrackSegment({ x: 0, y: 80 }, { x: 0, y: 40 });
const v4 = new LinearTrackSegment({ x: 40, y: 40 }, { x: 40, y: 80 });
h1.connect(v1);
v1.connect(h2);
h2.connect(v2);
v2.connect(h1);
h2.connect(v4);
v4.connect(h3);
h3.connect(v3);
v3.connect(h2);
const q = new CircularTrackSegment(
  { x: 40, y: 0 },
  { x: 40, y: 80 },
  { x: 40, y: 40 },
  false,
);
const q2 = new CircularTrackSegment(
  { x: 0, y: 0 },
  { x: 40, y: 40 },
  { x: 40, y: 0 },
  true,
);
q2.connect(h1);
q2.connect(v1);
q2.connect(h2);
q2.connect(v2);
q.connect(h1);
q.connect(h3);
q.connect(v2);
q.connect(v4);
const network = new Network([h1, h2, h3, v1, v2, v3, v4, q, q2]);

export default network;
