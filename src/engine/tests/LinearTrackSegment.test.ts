import LinearTrackSegment from "../LinearTrackSegment";

describe("a single LinearTrackSegment", () => {
  const pointA = { x: 0, y: 0 };
  const pointB = { x: 10, y: 0 };
  const pointC = { x: 10, y: 10 };

  it("should construct a track segment", () => {
    new LinearTrackSegment(pointA, pointB);
  });

  it("should calculate distance along a track segment for a y=0 line", () => {
    const segment = new LinearTrackSegment(pointA, pointB);
    const positionAlong = segment.getPositionAlong(1);
    expect(positionAlong.point.x).toBe(1);
    expect(positionAlong.point.y).toBe(0);
  });

  it("should calculate distance along a track segment for a diagonal line", () => {
    const segment = new LinearTrackSegment(pointA, pointC);
    const positionAlong = segment.getPositionAlong(Math.sqrt(2));
    expect(positionAlong.point.x).toBeCloseTo(1, 4);
    expect(positionAlong.point.y).toBeCloseTo(1, 4);
  });

  it("should allow travel in reverse", () => {
    const segment = new LinearTrackSegment(pointA, pointC);
    const positionAlong = segment.getPositionAlong(Math.sqrt(2), true);
    expect(positionAlong.point.x).toBeCloseTo(9, 4);
    expect(positionAlong.point.y).toBeCloseTo(9, 4);
  });
});

describe("a series of LinearTrackSegments", () => {
  const pointA = { x: 0, y: 0 };
  const pointB = { x: 10, y: 0 };
  const pointC = { x: 10, y: 10 };
  const pointD = { x: 0, y: 10 };

  it("should determine excess distance when applicable", () => {
    const segmentA = new LinearTrackSegment(pointA, pointB);
    const segmentB = new LinearTrackSegment(pointB, pointC);

    segmentA.atEnd.push(segmentB);
    segmentB.atStart.push(segmentA);

    const positionAlong = segmentA.getPositionAlong(15);
    expect(positionAlong.point.x).toBeCloseTo(10, 4);
    expect(positionAlong.point.y).toBeCloseTo(0, 4);
    expect(positionAlong.excess).toBeCloseTo(5, 4);
  });

  it("should connect segments correctly", () => {
    const segmentA = new LinearTrackSegment(pointA, pointB);
    const segmentB = new LinearTrackSegment(pointB, pointC);
    const segmentC = new LinearTrackSegment(pointC, pointD);

    segmentA.connect(segmentB, true);
    segmentB.connect(segmentC, true);

    const positionAlong = segmentA.getPositionAlong(15);
    expect(positionAlong.point.x).toBeCloseTo(10, 4);
    expect(positionAlong.point.y).toBeCloseTo(0, 4);
    expect(positionAlong.excess).toBeCloseTo(5, 4);
  });
});

describe("connection logic", () => {
  const pointA = { x: 0, y: 0 };
  const pointB = { x: 10, y: 0 };
  const pointC = { x: 10, y: 10 };
  const pointD = { x: 0, y: 10 };
  it("does not connect segments when angles don't line up", () => {
    const segmentA = new LinearTrackSegment(pointA, pointB);
    const segmentB = new LinearTrackSegment(pointB, pointC);
    const segmentC = new LinearTrackSegment(pointC, pointD);

    segmentA.connect(segmentB);
    segmentB.connect(segmentC);

    const positionAlong = segmentA.getPositionAlong(15);
    expect(positionAlong.point.x).toBeCloseTo(10, 4);
    expect(positionAlong.point.y).toBeCloseTo(0, 4);
    expect(positionAlong.excess).toBeCloseTo(5, 4);
  });
});
