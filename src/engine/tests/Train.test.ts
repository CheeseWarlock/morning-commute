import { TRAIN_STRATEGIES } from "../Game";
import LinearTrackSegment from "../LinearTrackSegment";
import Passenger from "../Passenger";
import Point from "../Point";
import Station, { ALIGNMENT } from "../Station";
import Train from "../Train";
import SimpleJoin from "../networks/SimpleJoin";
import SimpleStation from "../networks/SimpleStation";
import LotsOfSplits from "../networks/TestingNetworks/LotsOfSplits";

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

  it("can navigate in reverse along track segments", () => {
    const network = SimpleStation;

    const train = new Train(network.segments[0], 10);
    train.update(4000);
    train.update(4000);
    train.update(4000);
    train.update(4000);
    train.update(4000);
    train.update(4000);
    train.update(4000);
    train.update(2000);
  });

  it("can navigate a long distance in a single update", () => {
    const network = SimpleStation;

    const train = new Train(network.segments[0], 10);
    const train2 = new Train(network.segments[0], 10);
    train.update(1500);
    train.update(1500);
    train2.update(3000);
    expect(train.position.x).toBeCloseTo(train2.position.x);
    train.update(1500);
    train.update(1500);
    train2.update(3000);
    expect(train.position.x).toBeCloseTo(train2.position.x);
    train.update(1500);
    train.update(1500);
    train2.update(3000);
    expect(train.position.x).toBeCloseTo(train2.position.x);
    train.update(1500);
    train.update(1500);
    train2.update(3000);
    // expect(train.position.x).toBeCloseTo(train2.position.x);
    train.update(1500);
    train.update(1500);
    train2.update(3000);
    // expect(train.position.x).toBeCloseTo(train2.position.x);
    train.update(1500);
    train.update(1500);
    train2.update(3000);
    // expect(train.position.x).toBeCloseTo(train2.position.x);
    train.update(1500);
    train.update(1500);
    train2.update(3000);
    expect(train.position.x).toBeCloseTo(train2.position.x);
    train.update(1500);
    train.update(1500);
    train2.update(3000);
    expect(train.position.x).toBeCloseTo(train2.position.x);
    train.update(1500);
    train.update(1500);
    train2.update(3000);
    expect(train.position.x).toBeCloseTo(train2.position.x);
  });

  it("waits an appropriate amount of time at a station, including speeding up and slowing down", () => {
    const network = SimpleStation;
    const train = new Train(network.segments[0], 10, { slowdown: true });
    // Station is at 50?
    train.update(1000);
    expect(train.position.x).toBeCloseTo(10);
    train.update(4000);
    expect(train.position.x).toBeLessThan(50);
    train.update(1000);
    expect(train.position.x).toBeCloseTo(50);
    train.update(1000);
    expect(train.position.x).toBeGreaterThan(50);
  });
});

describe("train following cars", () => {
  const network = SimpleJoin;

  it("places train cars behind the lead car", () => {
    const train = new Train(network.segments[0], 10, { slowdown: true });
    train.update(2000);

    const distanceTo = (a: Point, b: Point) =>
      Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

    expect(
      distanceTo(train.position, train.followingCars[0].position),
    ).toBeCloseTo(5);
    expect(
      distanceTo(train.position, train.followingCars[1].position),
    ).toBeCloseTo(10);
  });

  it("can position following cars properly on a different track segment than the lead car", () => {
    const train = new Train(network.segments[1], 10, { slowdown: true });
    const distanceThroughCurve = (Math.PI / 2) * 30;
    // At 10/sec, update for...
    // dist 30? 1000 * 30 / spd

    train.update(distanceThroughCurve * 100 + 100);
    expect(train.position.x).toBeCloseTo(61);
    expect(train.position.y).toBeCloseTo(30);

    // The first train car should be 5 units away, on the curved track
    // The head car is 1 unit along this straight track, so that's 4 along the curve
    const expectedPosition = network.segments[1].getPositionAlong(
      4,
      true,
    ).point;
    expect(train.followingCars[0].position.x).toBeCloseTo(expectedPosition.x);
    expect(train.followingCars[0].position.y).toBeCloseTo(expectedPosition.y);
  });

  it("can position following cars properly even when the train spans 3 segments", () => {
    const segment = new LinearTrackSegment({ x: 0, y: 0 }, { x: 20, y: 0 });
    const segment2 = new LinearTrackSegment({ x: 20, y: 0 }, { x: 30, y: 0 });
    const segment3 = new LinearTrackSegment({ x: 30, y: 0 }, { x: 40, y: 0 });
    const segment4 = new LinearTrackSegment({ x: 40, y: 0 }, { x: 50, y: 0 });
    segment.connect(segment2);
    segment2.connect(segment3);
    segment3.connect(segment4);

    const train = new Train(segment, 10);
    train.update(1000);
    train.update(3100);
    expect(train.position.x).toBeCloseTo(41);
    expect(train.followingCars[0].position.x).toBeCloseTo(36);
    expect(train.followingCars[1].position.x).toBeCloseTo(31);
    expect(train.followingCars[2].position.x).toBeCloseTo(26);
  });
});

describe("passenger pickup and dropoff", () => {
  const network = SimpleStation;
  const badStation = new Station({} as any, 0, ALIGNMENT.LEFT);
  it("drops off passengers whose station match", () => {
    const train = new Train(network.segments[0], 10, { slowdown: true });
    train.passengers.push(new Passenger({} as any, network.stations[0]));
    train.passengers.push(new Passenger({} as any, badStation));
    expect(train.passengers.length).toBe(2);
    train.update(10000);
    expect(train.passengers.length).toBe(1);
  });

  it("picks up passengers", () => {
    const train = new Train(network.segments[0], 10, { slowdown: true });
    network.stations[0].waitingPassengers.push(
      new Passenger(network.stations[0], badStation),
    );
    expect(train.passengers.length).toBe(0);
    train.update(10000);
    expect(train.passengers.length).toBe(1);
  });

  it("does not pick up passengers beyond capacity", () => {
    const train = new Train(network.segments[0], 10, { slowdown: true });
    train.capacity = 1;
    network.stations[0].waitingPassengers.push(
      new Passenger(network.stations[0], badStation),
    );
    network.stations[0].waitingPassengers.push(
      new Passenger(network.stations[0], badStation),
    );
    expect(train.passengers.length).toBe(0);
    train.update(10000);
    expect(train.passengers.length).toBe(1);
  });
});

describe("wait time per-passenger", () => {
  it("waits extra time per passenger processed when specified", () => {
    const network = SimpleStation;

    const train = new Train(network.segments[0], 10, {
      waitTime: 2000,
      waitTimePerPassenger: 1000,
    });
    network.stations[0].waitingPassengers.push(
      new Passenger(network.stations[0], {} as any),
    );

    // Station is at 50
    // Get to station, wait, wait for passenger, move again
    train.update(5000 + 1000 + 2000 + 1000);
    expect(train.passengers.length).toBe(1);
    expect(train.position.x).toBeCloseTo(60);
  });
});

describe("turn strategies", () => {
  const network = LotsOfSplits;

  const train = new Train(network.segments[0], 10);

  it("should stay along the track when strategy is specified", () => {
    train.strategy = () => TRAIN_STRATEGIES.TURN_LEFT;
    train.update(2500);
    expect(train.position.x).toBeCloseTo(25);

    train.strategy = () => TRAIN_STRATEGIES.TURN_RIGHT;
    train.update(1000);
    expect(train.position.x).toBeCloseTo(35);

    train.update(1000);
    expect(train.position.y).toBeGreaterThan(10);
  });
});
