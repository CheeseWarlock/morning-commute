import CircularTrackSegment from "../CircularTrackSegment";

describe("a single CircularTrackSegment", () => {
  const pointA = { x: 0, y: 0 };
  const pointB = { x: 10, y: 0 };
  const pointC = { x: 10, y: 10 };

  const segment = new CircularTrackSegment(pointA, pointC, pointB, false);

  // 90 degree arc, length should be (angle in radians) * (radius)
  expect(segment.length).toBeCloseTo((10 * Math.PI) / 2, 4);
});
