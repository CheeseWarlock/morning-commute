import CircularTrackSegment from "../CircularTrackSegment";

describe("a single CircularTrackSegment", () => {
  const pointA = { x: 0, y: 0 };
  const pointB = { x: 10, y: 0 };
  const pointC = { x: 10, y: 10 };

  it("should calculate the length of a 90 degree angled track", () => {
    const segment = new CircularTrackSegment(pointA, pointC, pointB, true);
    expect(segment.length).toBeCloseTo((10 * Math.PI) / 2, 4);
  });

  it("should calculate the length of a 270 degree angled track", () => {
    const segment = new CircularTrackSegment(pointA, pointC, pointB, false);
    expect(segment.length).toBeCloseTo((3 * (10 * Math.PI)) / 2, 4);
  });
});
