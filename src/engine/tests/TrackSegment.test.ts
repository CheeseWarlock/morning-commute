import TrackSegment from "../TrackSegment";

describe("a single TrackSegment", () => {
  const pointA = { x: 0, y: 0 };
  const pointB = { x: 10, y: 0 };
  const pointC = { x: 10, y: 10 };

  it("should construct a track segment", () => {
    new TrackSegment(pointA, pointB);
  });

  it("should calculate distance along a track segment for a y=0 line", () => {
    const segment = new TrackSegment(pointA, pointB);
    const positionAlong = segment.getPositionAlong(1);
    expect(positionAlong.point.x).toBe(1);
    expect(positionAlong.point.y).toBe(0);
  });

  it("should calculate distance along a track segment for a diagonal line", () => {
    const segment = new TrackSegment(pointA, pointC);
    const positionAlong = segment.getPositionAlong(Math.sqrt(2));
    expect(positionAlong.point.x).toBeCloseTo(1, 4);
    expect(positionAlong.point.y).toBeCloseTo(1, 4);
  });
});

describe("a series of TrackSegments", () => {
  const pointA = { x: 0, y: 0 };
  const pointB = { x: 10, y: 0 };
  const pointC = { x: 10, y: 10 };

  it("should determine excess distance when applicable", () => {
    const segmentA = new TrackSegment(pointA, pointB);
    const segmentB = new TrackSegment(pointB, pointC);

    segmentA.atEnd.push(segmentB);
    segmentB.atStart.push(segmentA);

    const positionAlong = segmentA.getPositionAlong(15);
    expect(positionAlong.point.x).toBeCloseTo(10, 4);
    expect(positionAlong.point.y).toBeCloseTo(0, 4);
    expect(positionAlong.excess).toBeCloseTo(5, 4);
  });
});
