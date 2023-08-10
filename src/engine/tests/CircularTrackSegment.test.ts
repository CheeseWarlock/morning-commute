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

  it("should report the end point when distance exceeds length", () => {
    const segment = new CircularTrackSegment(pointA, pointC, pointB, true);
    const positionAlong = segment.getPositionAlong(100);
    expect(positionAlong.point.x).toBe(10);
    expect(positionAlong.point.y).toBe(10);
    expect(positionAlong.excess).toBe(100 - segment.length);
  });

  it("should report the position along the track when distance is less than length", () => {
    const segment = new CircularTrackSegment(pointA, pointC, pointB, true);
    const positionAlong = segment.getPositionAlong(segment.length / 2);
    const v = Math.cos(Math.PI / 4) * 10;
    expect(positionAlong.point.x).toBeCloseTo(10 - v, 4);
    expect(positionAlong.point.y).toBeCloseTo(v, 4);
    expect(positionAlong.excess).toBe(0);
  });
});
