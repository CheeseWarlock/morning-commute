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

  it("should have a sensible initial and final angle", () => {
    const segment = new CircularTrackSegment(pointA, pointC, pointB, true);
    expect(segment.initialAngle).toBeCloseTo(0.5 * Math.PI, 4); // PI
    expect(segment.finalAngle).toBeCloseTo(0, 4); // PI / 2
  });

  it("has proper clockwiseness when crossing the 0-angle barrier", () => {
    const start = { x: 20, y: 0 };
    const end = { x: 20, y: 40 };
    const center = { x: 0, y: 20 };
    const clockwiseSegment = new CircularTrackSegment(start, end, center);
    const counterClockWiseSegment = new CircularTrackSegment(
      start,
      end,
      center,
      true,
    );
    expect(counterClockWiseSegment.length).toBeCloseTo(
      clockwiseSegment.length * 3,
    );
    expect(
      clockwiseSegment.getPositionAlong(clockwiseSegment.length / 2, false)
        .point.y,
    ).toBeCloseTo(20, 4);
    expect(
      counterClockWiseSegment.getPositionAlong(
        clockwiseSegment.length / 2,
        false,
      ).point.x,
    ).toBeCloseTo(0, 4);
    expect(
      clockwiseSegment.getPositionAlong(clockwiseSegment.length / 2, true).point
        .y,
    ).toBeCloseTo(20, 4);
    expect(
      counterClockWiseSegment.getPositionAlong(
        clockwiseSegment.length / 2,
        true,
      ).point.x,
    ).toBeCloseTo(0, 4);
  });

  it("should report the end point when distance exceeds length", () => {
    const segment = new CircularTrackSegment(pointA, pointC, pointB, true);
    const positionAlong = segment.getPositionAlong(100);
    expect(positionAlong.point.x).toBe(10);
    expect(positionAlong.point.y).toBe(10);
    expect(positionAlong.excess).toBe(100 - segment.length);
  });

  it("should report the start point when distance is less than 0", () => {
    const segment = new CircularTrackSegment(pointA, pointC, pointB, true);
    const positionAlong = segment.getPositionAlong(segment.length - 100);
    expect(positionAlong.point.x).toBe(0);
    expect(positionAlong.point.y).toBe(0);
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

  it("should calculate reverse position along correctly", () => {
    const segment = new CircularTrackSegment(pointA, pointC, pointB, true);
    const positionAlong = segment.getPositionAlong(segment.length / 2, true);
    const v = Math.cos(Math.PI / 4) * 10;
    expect(positionAlong.point.x).toBeCloseTo(10 - v, 4);
    expect(positionAlong.point.y).toBeCloseTo(v, 4);
    expect(positionAlong.excess).toBe(0);
  });

  it("calculates angle along properly", () => {
    const segment = new CircularTrackSegment(pointA, pointC, pointB, true);

    let angleAlong = segment.getAngleAlong(0);
    expect(angleAlong).toBeCloseTo(Math.PI / 2, 4);

    angleAlong = segment.getAngleAlong(segment.length / 4);
    expect(angleAlong).toBeCloseTo((Math.PI * 3) / 8, 4);

    angleAlong = segment.getAngleAlong((segment.length * 2) / 4);
    expect(angleAlong).toBeCloseTo((Math.PI * 2) / 8, 4);

    angleAlong = segment.getAngleAlong((segment.length * 3) / 4);
    expect(angleAlong).toBeCloseTo((Math.PI * 1) / 8, 4);

    angleAlong = segment.getAngleAlong(segment.length);
    expect(angleAlong).toBeCloseTo(0, 4);

    const anotherSegment = new CircularTrackSegment(pointA, pointC, pointB);

    angleAlong = anotherSegment.getAngleAlong(0);
    expect(angleAlong).toBeCloseTo(-Math.PI / 2, 4);

    angleAlong = anotherSegment.getAngleAlong(anotherSegment.length / 2);
    expect(angleAlong).toBeCloseTo(Math.PI / 4, 4);
  });

  it("calculates reverse angle along properly", () => {
    const segment = new CircularTrackSegment(pointA, pointC, pointB, true);

    // let angleAlong = segment.getAngleAlong(0, true);
    // expect(angleAlong).toBeCloseTo(Math.PI, 4);

    let angleAlong = segment.getAngleAlong(segment.length / 4, true);
    expect(angleAlong).toBeCloseTo(-(Math.PI * 7) / 8, 4);

    angleAlong = segment.getAngleAlong((segment.length * 2) / 4, true);
    expect(angleAlong).toBeCloseTo(-(Math.PI * 6) / 8, 4);

    angleAlong = segment.getAngleAlong((segment.length * 3) / 4, true);
    expect(angleAlong).toBeCloseTo(-(Math.PI * 5) / 8, 4);

    angleAlong = segment.getAngleAlong(segment.length, true);
    expect(angleAlong).toBeCloseTo(-(Math.PI / 2), 4);

    const anotherSegment = new CircularTrackSegment(pointA, pointC, pointB);

    angleAlong = anotherSegment.getAngleAlong(0, true);
    expect(angleAlong).toBeCloseTo(0, 4);

    angleAlong = anotherSegment.getAngleAlong(anotherSegment.length / 2, true);
    expect(angleAlong).toBeCloseTo((Math.PI * -3) / 4, 4);

    angleAlong = anotherSegment.getAngleAlong(anotherSegment.length, true);
    expect(angleAlong).toBeCloseTo((Math.PI * 2) / 4, 4);
  });
});

describe("distanceToPosition", () => {
  const smallerArc = new CircularTrackSegment(
    { x: 10, y: 30 },
    { x: 50, y: 30 },
    { x: 30, y: 30 },
  );
  const largerArc = new CircularTrackSegment(
    { x: 0, y: 30 },
    { x: 60, y: 30 },
    { x: 30, y: 30 },
  );

  it("returns the radius of the circle when the point is the origin of the curve", () => {
    const innerDistance = smallerArc.distanceToPosition({ x: 30, y: 30 });
    const outerDistance = largerArc.distanceToPosition({ x: 30, y: 30 });

    expect(innerDistance).toBeCloseTo(20);
    expect(outerDistance).toBeCloseTo(30);
  });

  it("returns the distance to the src when the closest point is somewhere along the arc", () => {
    const innerDistance = smallerArc.distanceToPosition({ x: 40, y: 20 });
    const outerDistance = largerArc.distanceToPosition({ x: 40, y: 20 });

    expect(innerDistance).toBeCloseTo(20 - Math.sqrt(200));
    expect(outerDistance).toBeCloseTo(30 - Math.sqrt(200));
  });
});
