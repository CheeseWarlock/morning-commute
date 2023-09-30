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

  it("connects segments that don't line up when ignoreAngles is true", () => {
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

describe("angleAlong", () => {
  const pointA = { x: 0, y: 0 };
  const pointB = { x: 10, y: 0 };
  const pointC = { x: 10, y: 10 };
  it("returns the appropriate angle regardless of distance", () => {
    const segmentA = new LinearTrackSegment(pointA, pointB);
    const segmentB = new LinearTrackSegment(pointB, pointC);
    const segmentC = new LinearTrackSegment(pointC, pointA);

    let angleAlong = segmentA.getAngleAlong(0);
    expect(angleAlong).toBeCloseTo(0, 4);
    angleAlong = segmentB.getAngleAlong(0.5);
    expect(angleAlong).toBeCloseTo(0.5 * Math.PI, 4);
    angleAlong = segmentC.getAngleAlong(1);
    expect(angleAlong).toBeCloseTo((-3 / 4) * Math.PI, 4);
  });

  it("returns the inverted angle when reversing", () => {
    const segmentA = new LinearTrackSegment(pointA, pointB);
    let angleAlong = segmentA.getAngleAlong(5, true);
    expect(angleAlong).toBeCloseTo(Math.PI, 4);
  });
});

describe("distanceToPosition", () => {
  const pointA = { x: 0, y: 0 };
  const pointB = { x: 20, y: 0 };
  const pointC = { x: 20, y: 20 };
  const segment = new LinearTrackSegment(pointA, pointC);

  it("reports the distance to the middle of the segment when that's the closest", () => {
    const distance = segment.distanceToPosition(pointB);

    expect(distance.distance).toBeCloseTo(Math.sqrt(200));
  });

  it("reports the distance to the start of the line when that's the closest point", () => {
    const pointNearStart = { x: 0, y: -20 };
    const distance = segment.distanceToPosition(pointNearStart);
    expect(distance.distance).toBeCloseTo(20);
  });

  it("reports the distance to the end of the line when that's the closest point", () => {
    const pointNearEnd = { x: 30, y: 20 };
    const distance = segment.distanceToPosition(pointNearEnd);
    expect(distance.distance).toBeCloseTo(10);
  });
});
