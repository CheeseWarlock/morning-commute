import LinearTrackSegment from "../LinearTrackSegment";
import Station, { ALIGNMENT } from "../Station";
import Train from "../Train";

describe("train motion", () => {
  const pointA = { x: 0, y: 0 };
  const pointB = { x: 10, y: 0 };
  const pointC = { x: 30, y: 0 };
  const pointD = { x: 90, y: 0 };
  it("should move along its track at a rate equal to its speed", () => {
    const segment = new LinearTrackSegment(pointA, pointB);
    const train = new Train(segment, 1);
    train.update();
    expect(train.position.x).toBeCloseTo(1, 4);
    train.update();
    expect(train.position.x).toBeCloseTo(2, 4);
  });

  it("should preserve full motion across track segment changes", () => {
    const segment = new LinearTrackSegment(pointA, pointB);
    const segment2 = new LinearTrackSegment(pointB, pointC);
    segment.connect(segment2);
    const train = new Train(segment, 12);
    train.update();
    expect(train.position.x).toBeCloseTo(12, 4);
    train.update();
    expect(train.position.x).toBeCloseTo(24, 4);
  });

  it("should stop at a station", () => {
    const segment = new LinearTrackSegment(pointA, pointB);
    const segment2 = new LinearTrackSegment(pointB, pointC);
    segment.connect(segment2);
    const station = new Station(segment2, 8, ALIGNMENT.LEFT);
    segment2.stations.push(station);
    const train = new Train(segment, 12);
    train.update();
    expect(train.position.x).toBeCloseTo(12, 4);
    train.update();
    expect(train.position.x).toBeCloseTo(18, 4);
  });

  it("resumes movement after stopping at a station", () => {
    const segment = new LinearTrackSegment(pointA, pointB);
    const segment2 = new LinearTrackSegment(pointB, pointC);
    const segment3 = new LinearTrackSegment(pointC, pointD);
    segment.connect(segment2);
    segment2.connect(segment3);
    const station = new Station(segment2, 8, ALIGNMENT.LEFT);
    segment2.stations.push(station);
    const train = new Train(segment, 12);
    train.update();
    expect(train.position.x).toBeCloseTo(12, 4);
    train.update();
    expect(train.position.x).toBeCloseTo(18, 4);
    for (let i = 0; i <= 10; i++) {
      train.update();
    }
    expect(train.position.x).toBeGreaterThan(18);
  });
});
