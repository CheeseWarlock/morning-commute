import LinearTrackSegment from "../LinearTrackSegment";
import Station, { ALIGNMENT } from "../Station";
import Train from "../Train";

describe("train motion", () => {
  const pointA = { x: 0, y: 0 };
  const pointB = { x: 10, y: 0 };
  const pointC = { x: 30, y: 0 };
  const pointD = { x: 400, y: 0 };
  it("should move along its track at a rate equal to its speed", () => {
    const segment = new LinearTrackSegment(pointA, pointB);
    const train = new Train(segment, 1);
    train.update(1000);
    expect(train.position.x).toBeCloseTo(1, 4);
    train.update(1000);
    expect(train.position.x).toBeCloseTo(2, 4);
  });

  it("should preserve full motion across track segment changes", () => {
    const segment = new LinearTrackSegment(pointA, pointB);
    const segment2 = new LinearTrackSegment(pointB, pointC);
    segment.connect(segment2);
    const train = new Train(segment, 12);
    train.update(1000);
    expect(train.position.x).toBeCloseTo(12, 4);
    train.update(1000);
    expect(train.position.x).toBeCloseTo(24, 4);
  });

  it("should stop at a station", () => {
    const segment = new LinearTrackSegment(pointA, pointB);
    const segment2 = new LinearTrackSegment(pointB, pointC);
    segment.connect(segment2);
    const station = new Station(segment2, 8, ALIGNMENT.LEFT);
    segment2.stations.push(station);
    const train = new Train(segment, 12);
    train.update(1000);
    expect(train.position.x).toBeCloseTo(12, 4);
    train.update(1000);
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
    train.update(1000);
    expect(train.position.x).toBeCloseTo(12, 4);
    train.update(1000);
    expect(train.position.x).toBeCloseTo(18, 4);
    for (let i = 0; i <= 10; i++) {
      train.update(1000);
    }
    expect(train.position.x).toBeGreaterThan(18);
  });

  it("updates by an appropriate amount based on time", () => {
    const segment = new LinearTrackSegment(pointA, pointB);
    const segment2 = new LinearTrackSegment(pointB, pointC);
    segment.connect(segment2);
    const station = new Station(segment2, 8, ALIGNMENT.LEFT);
    segment2.stations.push(station);
    const train = new Train(segment, 12);
    train.update(500);
    expect(train.position.x).toBeCloseTo(6, 4);
  });

  it("waits at a station for an appropriate amount of time regardless of frame rate", () => {
    // Run the same amount of game time twice and compare
    const segment = new LinearTrackSegment(pointA, pointB);
    const segment2 = new LinearTrackSegment(pointB, pointC);
    const segment3 = new LinearTrackSegment(pointC, pointD);
    segment.connect(segment2);
    segment2.connect(segment3);
    const station = new Station(segment2, 8, ALIGNMENT.LEFT);
    segment2.stations.push(station);
    const train = new Train(segment, 12);
    for (let i = 0; i < 20; i++) {
      train.update(180);
    }
    const firstResult = train.position.x;

    const secondTrain = new Train(segment, 12);
    for (let i = 0; i < 40; i++) {
      secondTrain.update(90);
    }
    expect(secondTrain.position.x).toBeCloseTo(firstResult, 4);
  });

  it("can stop at a station for part of an update cycle, at any update rate", () => {
    const testTimings = [3000, 1500, 1000, 500];
    const repeat = (f: () => void, n: number) => {
      for (let i = 0; i < n; i++) {
        f();
      }
    };
    testTimings.forEach((timing) => {
      const segment = new LinearTrackSegment({ x: 0, y: 0 }, { x: 20, y: 0 });
      const segment2 = new LinearTrackSegment({ x: 20, y: 0 }, { x: 70, y: 0 });
      const segment3 = new LinearTrackSegment(pointC, pointD);
      segment.connect(segment2);
      segment2.connect(segment3);
      const station = new Station(segment2, 20, ALIGNMENT.LEFT);
      segment2.stations.push(station);
      const train = new Train(segment, 5, { waitTime: 6000 });
      repeat(() => train.update(timing), 3000 / timing);
      expect(train.position.x).toBeCloseTo(15, 4);
      repeat(() => train.update(timing), 3000 / timing);
      expect(train.position.x).toBeCloseTo(30, 4);
      repeat(() => train.update(timing), 3000 / timing);
      expect(train.position.x).toBeCloseTo(40, 4);
      repeat(() => train.update(timing), 3000 / timing);
      expect(train.position.x).toBeCloseTo(40, 4);
      repeat(() => train.update(timing), 3000 / timing);
      expect(train.position.x).toBeCloseTo(45, 4);
    });
  });

  it("waits an appropriate amount of time at a station, including speeding up and slowing down", () => {
    const segment = new LinearTrackSegment(pointA, pointB);
    const segment2 = new LinearTrackSegment(pointB, pointC);
    const segment3 = new LinearTrackSegment(pointC, pointD);
    segment.connect(segment2);
    segment2.connect(segment3);
    const station = new Station(segment2, 8, ALIGNMENT.LEFT);
    segment2.stations.push(station);
    const train = new Train(segment, 10, { slowdown: true, waitTime: 0 });
  });
});
