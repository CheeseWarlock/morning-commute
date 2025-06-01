import { FakeController } from "../Controller";
import Game, { TRAIN_STRATEGIES } from "../Game";
import LinearTrackSegment from "../LinearTrackSegment";
import Passenger from "../Passenger";
import Point from "../Point";
import Station, { ALIGNMENT } from "../Station";
import Train from "../Train";
import SimpleJoin from "../networks/SimpleJoin";
import SimpleStation, { build } from "../networks/SimpleStation";
import LotsOfSplits from "../networks/TestingNetworks/LotsOfSplits";
import CircularTrackSegment from "../CircularTrackSegment";
import { build as buildComplex } from "../networks/Complex";
import MadeInEditor from "../networks/MadeInEditor";
import { loadNetworkFromJSON } from "../JSONNetworkLoader";
import { JSONTrackSegment } from "../JSONNetworkLoader";
import GameState from "../GameState";
import Network from "../Network";

describe("train motion", () => {
  const pointA = { x: 0, y: 0 };
  const pointB = { x: 10, y: 0 };
  const pointC = { x: 30, y: 0 };
  const pointD = { x: 400, y: 0 };

  let network: Network;

  beforeEach(() => {
    network = new Network([new LinearTrackSegment(pointA, pointB)], []);
  });

  it("should move along its track at a rate equal to its speed", () => {
    const segment = new LinearTrackSegment(pointA, pointB);
    const gameState = new GameState(network, false);
    const train = new Train(
      { segment, distanceAlong: 0, reversing: false },
      { speed: 1 },
      gameState
    );
    train.update(1000);
    expect(train.position.x).toBeCloseTo(1, 4);
    train.update(1000);
    expect(train.position.x).toBeCloseTo(2, 4);
  });

  it("should preserve full motion across track segment changes", () => {
    const segment = new LinearTrackSegment(pointA, pointB);
    const segment2 = new LinearTrackSegment(pointB, pointC);
    segment.connect(segment2);
    const gameState = new GameState(network, false);
    const train = new Train(
      { segment, distanceAlong: 0, reversing: false },
      { speed: 12 },
      gameState
    );
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
    const gameState = new GameState(network, false);
    const train = new Train(
      { segment, distanceAlong: 0, reversing: false },
      { speed: 12 },
      gameState
    );
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
    network.stations.push(station);

    const gameState = new GameState(network, false);
    const train = new Train(
      { segment, distanceAlong: 0, reversing: false },
      { speed: 12 },
      gameState
    );
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
    const gameState = new GameState(network, false);
    const train = new Train(
      { segment, distanceAlong: 0, reversing: false },
      { speed: 12 },
      gameState
    );
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
    network.stations.push(station);
    const gameState = new GameState(network, false);
    const train = new Train(
      { segment, distanceAlong: 0, reversing: false },
      { speed: 12, waitTime: 0 },
      gameState
    );
    let firstTimeElapsed = 0;
    for (let i = 0; i < 10; i++) {
      train.update(180);
      firstTimeElapsed += 180;
    }
    const firstResult = train.position.x;
    let secondTimeElapsed = 0;
    const secondTrain = new Train(
      { segment, distanceAlong: 0, reversing: false },
      { speed: 12, waitTime: 0 },
      gameState
    );
    for (let i = 0; i < 20; i++) {
      secondTrain.update(90);
      secondTimeElapsed += 90;
    }
    expect(firstTimeElapsed).toBeCloseTo(secondTimeElapsed, 1);
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
      network.stations.push(station);
      const gameState = new GameState(network, false);
      const train = new Train(
        { segment, distanceAlong: 0, reversing: false },
        { speed: 5, waitTime: 6000 },
        gameState
      );
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
    const gameState = new GameState(network, false);
    const train = new Train(
      { segment: network.segments[0], distanceAlong: 0, reversing: false },
      { speed: 10 },
      gameState
    );
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
    const gameState = new GameState(network, false);
    const train = new Train(
      { segment: network.segments[0], distanceAlong: 0, reversing: false },
      { speed: 10 },
      gameState
    );
    const train2 = new Train(
      { segment: network.segments[0], distanceAlong: 0, reversing: false },
      { speed: 10 },
      gameState
    );
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
    expect(train.position.x).toBeCloseTo(train2.position.x);
  });

  it("waits an appropriate amount of time at a station, including speeding up and slowing down", () => {
    const network = SimpleStation;
    const gameState = new GameState(network, false);
    const train = new Train(
      { segment: network.segments[0], distanceAlong: 0, reversing: false },
      { speed: 10, slowdown: true },
      gameState
    );
    // Station is at 50?
    train.update(1000);
    expect(train.position.x).toBeCloseTo(10);
    train.update(4000);
    expect(train.position.x).toBeLessThan(50);
    train.update(1000);
    expect(train.position.x).toBeCloseTo(50);
    train.update(4000);
    expect(train.position.x).toBeGreaterThan(50);
  });
});

describe("train constructor options", () => {
  const network = build().network;

  it("uses distance along when passed in", () => {
    const train = new Train(
      {
        segment: network.segments[1],
        distanceAlong: 20,
        reversing: false,
      },
      { speed: 10 },
      new GameState(network, false)
    );

    expect(train.position.x).toBeCloseTo(40);
    train.update(1000);
    expect(train.position.x).toBeCloseTo(50);
  });

  it("uses reverse and distance along when passed in", () => {
    const train = new Train(
      {
        segment: network.segments[1],
        distanceAlong: 20,
        reversing: true,
      },
      { speed: 10 },
      new GameState(network, false)
    );

    expect(train.position.x).toBeCloseTo(80);
    train.update(1000);
    expect(train.position.x).toBeCloseTo(70);
  });
});

describe("train following cars", () => {
  const network = SimpleJoin;

  it("places train cars behind the lead car", () => {
    const train = new Train(
      { segment: network.segments[0], distanceAlong: 0, reversing: false },
      { speed: 10, slowdown: true },
      new GameState(network, false)
    );
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
    const train = new Train(
      { segment: network.segments[1], distanceAlong: 0, reversing: false },
      { speed: 10, slowdown: true },
      new GameState(network, false)
    );
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

    const train = new Train(
      { segment, distanceAlong: 0, reversing: false },
      { speed: 10 },
      new GameState(network, false)
    );
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
    const train = new Train(
      { segment: network.segments[0], distanceAlong: 0, reversing: false },
      { speed: 10, slowdown: true },
      new GameState(network, false)
    );
    train.passengers.push(new Passenger({} as any, network.stations[0]));
    train.passengers.push(new Passenger({} as any, badStation));
    expect(train.passengers.length).toBe(2);
    train.update(10000);
    expect(train.passengers.length).toBe(1);
  });

  it("picks up passengers", () => {
    const gameState = new GameState(network, false);
    const train = new Train(
      { segment: network.segments[0], distanceAlong: 0, reversing: false },
      { speed: 10, slowdown: true },
      gameState
    );
    gameState.waitingPassengers.get(network.stations[0])!.push(
      new Passenger(network.stations[0], badStation),
    );
    expect(train.passengers.length).toBe(0);
    train.update(10000);
    expect(train.passengers.length).toBe(1);
  });

  it("does not pick up passengers beyond capacity", () => {
    const gameState = new GameState(network, false);
    const train = new Train(
      { segment: network.segments[0], distanceAlong: 0, reversing: false },
      { speed: 10, slowdown: true },
      gameState
    );
    train.capacity = 1;
    gameState.waitingPassengers.set(network.stations[0], []);
    gameState.waitingPassengers.get(network.stations[0])!.push(
      new Passenger(network.stations[0], badStation),
    );
    gameState.waitingPassengers.get(network.stations[0])!.push(
      new Passenger(network.stations[0], badStation),
    );
    expect(train.passengers.length).toBe(0);
    train.update(10000);
    expect(train.passengers.length).toBe(1);
  });
});

describe("wait time, including per-passenger", () => {
  it("allows zero wait times", () => {
    const network = build().network;
    network.stations = [];
    network.segments.forEach((seg) => {
      seg.stations = [];
    });
    const game = new Game(network, new FakeController());
    const trainA = new Train(
      { segment: game.network.segments[0], distanceAlong: 0, reversing: false },
      {
        speed: 10,
        waitTime: 0,
        waitTimePerPassenger: 0,
      },
      new GameState(network, false)
    );

    game.gameState.trains.push(trainA);

    game.update(1000);
    expect(trainA.position.x).toBeCloseTo(10);

    game.update(5000);

    expect(game.gameState.trains[0].position.x).toBeCloseTo(
      60,
    );
  });

  it("waits extra time per passenger processed when specified", () => {
    const network = SimpleStation;
    const gameState = new GameState(network, false);

    const train = new Train(
      { segment: network.segments[0], distanceAlong: 0, reversing: false },
      {
        waitTime: 2000,
        waitTimePerPassenger: 1000,
        speed: 10,
        slowdown: false,
      },
      gameState
    );
    
    gameState.waitingPassengers.set(
      network.stations[0],
      [new Passenger(network.stations[0], {} as any)],
    );

    // Station is at 50
    // Get to station, wait, wait for passenger, move again
    train.update(5000 + 1000 + 2000 + 1000);
    expect(train.passengers.length).toBe(1);
    expect(train.position.x).toBeCloseTo(60);
  });

  it("waits extra time per passenger processed at any update rate", () => {
    const network = SimpleStation;
    const gameState = new GameState(network, false);
    const train = new Train(
      { segment: network.segments[0], distanceAlong: 0, reversing: false },
      {
        waitTime: 2000,
        waitTimePerPassenger: 1000,
        speed: 10,
      },
      gameState
    );
    gameState.waitingPassengers.set(network.stations[0], []);
    gameState.waitingPassengers.get(network.stations[0])!.push(
      new Passenger(network.stations[0], {} as any),
    );
    // Station is at 50
    // Get to station, wait, wait for passenger, move again
    for (let i = 0; i < 20; i++) {
      train.update(9000 / 20);
    }
    expect(train.passengers.length).toBe(1);
    expect(train.position.x).toBeCloseTo(60);
  });
});

describe("turn strategies", () => {
  const network = LotsOfSplits;

  const train = new Train(
    { segment: network.segments[0], distanceAlong: 0, reversing: false },
    {
      speed: 10,
    },
    new GameState(network, false)
  );

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

describe("collision segments", () => {
  it("reports correct collision segments", () => {
    const network = build().network;
    const game = new Game(network, new FakeController());

    const trainA = new Train(
      { segment: network.segments[0], distanceAlong: 0, reversing: false },
      {
        waitTime: 0,
        waitTimePerPassenger: 0,
        speed: 10,
        followingCarCount: 0,
      },
      new GameState(network, false)
    );

    game.gameState.trains.push(trainA);

    game.update(1000);

    expect(
      trainA.lastUpdateCollisionSegments.get(network.segments[0])?.from,
    ).toBe(0);
    expect(
      trainA.lastUpdateCollisionSegments.get(network.segments[0])?.to,
    ).toBe(10);

    game.update(2000);

    expect(
      trainA.lastUpdateCollisionSegments.get(network.segments[0])?.from,
    ).toBe(10);
    expect(
      trainA.lastUpdateCollisionSegments.get(network.segments[0])?.to,
    ).toBe(20);
    expect(
      trainA.lastUpdateCollisionSegments.get(network.segments[1]),
    ).toBeDefined();
    expect(
      trainA.lastUpdateCollisionSegments.get(network.segments[1])?.from,
    ).toBe(0);
    expect(
      trainA.lastUpdateCollisionSegments.get(network.segments[1])?.to,
    ).toBe(10);
  });

  it("reports correct collision segments in reverse", () => {
    const network = build().network;
    const game = new Game(network, new FakeController());
    const trainA = new Train(
      { segment: network.segments[1], distanceAlong: 0, reversing: true },
      {
        waitTime: 0,
        waitTimePerPassenger: 0,
        speed: 10,
        followingCarCount: 0,
      },
      new GameState(network, false)
    );

    game.gameState.trains.push(trainA);

    game.update(5000);

    expect(trainA.position.x).toBeCloseTo(50);

    expect(
      trainA.lastUpdateCollisionSegments.get(network.segments[1])?.from,
    ).toBe(30);
    expect(
      trainA.lastUpdateCollisionSegments.get(network.segments[1])?.to,
    ).toBe(80);
  });

  it("reports collision segments of following cars", () => {
    const segment = new LinearTrackSegment({ x: 0, y: 0 }, { x: 50, y: 0 });
    const network = new Network([segment], []);
    const train = new Train(
      { segment, distanceAlong: 0, reversing: false },
      {},
      new GameState(network, false)
    );
    train.update(3000);
    expect(train.position.x).toBeCloseTo(30);
    expect(train.lastUpdateCollisionSegments.get(segment)!.from).toBeCloseTo(0);
    expect(train.lastUpdateCollisionSegments.get(segment)!.to).toBeCloseTo(30);
    train.update(1000);
    expect(train.position.x).toBeCloseTo(40);
    expect(train.lastUpdateCollisionSegments.get(segment)!.from).toBeCloseTo(15);
    expect(train.lastUpdateCollisionSegments.get(segment)!.to).toBeCloseTo(40);
  });

  it("reports collision segments of following cars across segments", () => {
    const segment = new LinearTrackSegment({ x: 0, y: 0 }, { x: 50, y: 0 });
    const segment2 = new LinearTrackSegment({ x: 50, y: 0 }, { x: 100, y: 0 });
    segment.connect(segment2);
    const network = new Network([segment, segment2], []);
    const train = new Train(
      { segment, distanceAlong: 0, reversing: false },
      {},
      new GameState(network, false)
    );
    train.update(3000);
    train.update(2500);
    expect(train.position.x).toBeCloseTo(55);
    expect(train.lastUpdateCollisionSegments.get(segment)!).toEqual({
      from: 15,
      to: 50,
    });
    expect(train.lastUpdateCollisionSegments.get(segment2)!).toEqual({
      from: 0,
      to: 5,
    });
    train.update(500);
    expect(train.position.x).toBeCloseTo(60);
    expect(train.lastUpdateCollisionSegments.get(segment)!).toEqual({
      from: 40,
      to: 50,
    });
    expect(train.lastUpdateCollisionSegments.get(segment2)!).toEqual({
      from: 0,
      to: 10,
    });
  });

  it("reports collision segments of following cars across segments in reverse", () => {
    const segment = new LinearTrackSegment({ x: 0, y: 0 }, { x: 50, y: 0 });
    const segment2 = new LinearTrackSegment({ x: 50, y: 0 }, { x: 100, y: 0 });
    segment.connect(segment2);
    const network = new Network([segment, segment2], []);
    const train = new Train(
      { segment: segment2, distanceAlong: 0, reversing: true },
      {},
      new GameState(network, false)
    );
    train.update(3000);
    train.update(2500);
    expect(train.position.x).toBeCloseTo(45);
    expect(train.lastUpdateCollisionSegments.get(segment)!).toEqual({
      from: 45,
      to: 50,
    });
    expect(train.lastUpdateCollisionSegments.get(segment2)!).toEqual({
      from: 0,
      to: 35,
    });
    train.update(500);
    expect(train.position.x).toBeCloseTo(40);
    expect(train.lastUpdateCollisionSegments.get(segment)!).toEqual({
      from: 40,
      to: 50,
    });
    expect(train.lastUpdateCollisionSegments.get(segment2)!).toEqual({
      from: 0,
      to: 10,
    });
  });
});

describe("nextJunction", () => {
  it("finds the next junction", () => {
    const network = build().network;
    const game = new Game(network, new FakeController());
    const trainA = new Train(
      { segment: network.segments[1], distanceAlong: 0, reversing: false },
      {
        waitTime: 0,
        waitTimePerPassenger: 0,
        speed: 10,
      },
      new GameState(network, false)
    );
    game.gameState.trains.push(trainA);

    expect(trainA.nextJunction.segments.length).toBe(2);
    expect(
      trainA.nextJunction.segments.indexOf(network.segments[6]),
    ).toBeGreaterThan(-1);
    expect(
      trainA.nextJunction.segments.indexOf(network.segments[2]),
    ).toBeGreaterThan(-1);
    expect(trainA.nextJunction.position).toEqual({ x: 100, y: 10 });
  });

  it("finds the next junction across many segments", () => {
    const segment = new LinearTrackSegment({ x: 0, y: 0 }, { x: 10, y: 0 });
    const segment2 = new LinearTrackSegment({ x: 10, y: 0 }, { x: 20, y: 0 });
    const segment3 = new LinearTrackSegment({ x: 20, y: 0 }, { x: 30, y: 0 });
    const segment4 = new LinearTrackSegment({ x: 30, y: 0 }, { x: 40, y: 0 });
    const segment5 = new LinearTrackSegment({ x: 40, y: 0 }, { x: 50, y: 0 });
    const segment6 = new CircularTrackSegment(
      { x: 40, y: 0 },
      { x: 50, y: 10 },
      { x: 40, y: 10 },
    );
    segment.connect(segment2);
    segment2.connect(segment3);
    segment3.connect(segment4);
    segment4.connect(segment5);
    segment4.connect(segment6);
    const network = new Network([segment, segment2, segment3, segment4, segment5, segment6], []);
    const train = new Train(
      { segment, distanceAlong: 0, reversing: false },
      {},
      new GameState(network, false)
    );
    expect(train.nextJunction.position).toEqual({ x: 40, y: 0 });
  });

  it("finds the next junction when reversing", () => {
    const segment = new LinearTrackSegment({ x: 40, y: 20 }, { x: 0, y: 20 });
    const segment2 = new CircularTrackSegment(
      { x: 60, y: 0 },
      { x: 40, y: 20 },
      { x: 40, y: 0 },
    );
    const segment3 = new LinearTrackSegment({ x: 60, y: 20 }, { x: 40, y: 20 });
    segment2.connect(segment);
    segment3.connect(segment);
    const network = new Network([segment, segment2, segment3], []);
    const train = new Train(
      { segment, distanceAlong: 0, reversing: true },
      {},
      new GameState(network, false)
    );
    expect(train.nextJunction.segments.length).toBe(2);
    expect(train.nextJunction.position).toEqual({ x: 40, y: 20 });
  });

  it("skips a potential junction when it's going the wrong way", () => {
    const segment0 = new LinearTrackSegment({ x: -20, y: 20 }, { x: 0, y: 20 });
    const segment = new LinearTrackSegment({ x: 0, y: 20 }, { x: 20, y: 20 });
    const segment2 = new CircularTrackSegment(
      { x: 0, y: 0 },
      { x: 20, y: 20 },
      { x: 20, y: 0 },
      true,
    );
    const segment3 = new LinearTrackSegment({ x: 20, y: 20 }, { x: 40, y: 20 });
    const segment4 = new CircularTrackSegment(
      { x: 40, y: 20 },
      { x: 60, y: 0 },
      { x: 40, y: 0 },
      true,
    );
    const segment5 = new LinearTrackSegment({ x: 40, y: 20 }, { x: 60, y: 20 });
    segment0.connect(segment);
    segment.connect(segment3);
    segment2.connect(segment3);
    segment3.connect(segment4);
    segment3.connect(segment5);
    const network = new Network([segment0, segment, segment2, segment3, segment4, segment5], []);
    const train = new Train({
      segment: segment0,
      distanceAlong: 0,
      reversing: false,
    }, {}, new GameState(network, false));
    expect(train.nextJunction.segments.indexOf(segment2)).toBe(-1);
    expect(train.nextJunction.segments.indexOf(segment4)).toBeGreaterThan(-1);
    expect(train.nextJunction.position).toEqual({ x: 40, y: 20 });
  });

  it("skips a potential junction when directions differ", () => {
    const network = buildComplex().network;
    const train = new Train(
      { segment: network.segments[13], distanceAlong: 0, reversing: false },
      { speed: 10 },
      new GameState(network, false)
    );
    expect(train.nextJunction.position).toEqual({ x: 60, y: 20 });
  });
});

describe("the odd case from the editor", () => {
  it("doesn't allow a train to reverse along a segment that it just came from", () => {
    const network = loadNetworkFromJSON(MadeInEditor as JSONTrackSegment[]);
    const game = new Game(network, new FakeController());
    const targetSegment = network.segments.find((s) => s.id.startsWith("ee3adb0a"))!;
    const nextSegment = network.segments.find((s) => s.id.startsWith("72d9fb63"))!;
    const tinySegment = network.segments.find((s) => s.id.startsWith("a7571cbc"))!;
    const continuingSegment = network.segments.find((s) => s.id.startsWith("e5da3343"))!;
    const train = new Train(
      { segment: targetSegment, distanceAlong: 0, reversing: false },
      { slowdown: true,
        waitTime: 500,
        waitTimePerPassenger: 500,
        speed: 100,
        followingCarCount: 4, },
      new GameState(network, false)
    );
    game.gameState.trains.push(train);
    const initialDist = targetSegment.getPositionAlong(0);
    expect(train.position.x).toBeCloseTo(initialDist.point.x, 4);
    expect(train.position.y).toBeCloseTo(initialDist.point.y, 4);
    expect(train.currentSegment.id).toBe(targetSegment.id);

    game.update(1000);
    const dist = targetSegment.getPositionAlong(100);
    
    expect(initialDist.point.x).not.toBeCloseTo(dist.point.x, 4);
    expect(initialDist.point.y).not.toBeCloseTo(dist.point.y, 4);
    expect(train.position.x).toBeCloseTo(dist.point.x, 4);
    expect(train.position.y).toBeCloseTo(dist.point.y, 4);
    expect(train.currentSegment.id).toBe(targetSegment.id);

    game.update(1000);
    let nextDist = nextSegment.getPositionAlong(200 - targetSegment.length, true);

    expect(train.currentSegment.id).toBe(nextSegment.id);
    expect(train.position.x).toBeCloseTo(nextDist.point.x, 4);
    expect(train.position.y).toBeCloseTo(nextDist.point.y, 4);

    game.update(1000);
    nextDist = nextSegment.getPositionAlong(300 - targetSegment.length, true);
    expect(train.currentSegment.id).toBe(nextSegment.id);
    expect(train.position.x).toBeCloseTo(nextDist.point.x, 4);
    expect(train.position.y).toBeCloseTo(nextDist.point.y, 4);

    game.update(1000);
    expect(targetSegment.length + nextSegment.length + tinySegment.length).toBeLessThan(400);
    nextDist = continuingSegment.getPositionAlong(400 - targetSegment.length - nextSegment.length - tinySegment.length);

    // If reversed after a757...
    const otherDistanceBack = 400 - targetSegment.length - nextSegment.length - tinySegment.length;
    const otherBadPosition = nextSegment.getPositionAlong(otherDistanceBack);
    expect(otherBadPosition.point.x).not.toBeCloseTo(train.position.x, 4);
    expect(otherBadPosition.point.y).not.toBeCloseTo(train.position.y, 4);


    expect(train.currentSegment.id).toBe(continuingSegment.id);
    expect(train.position.x).toBeCloseTo(nextDist.point.x, 4);
    expect(train.position.y).toBeCloseTo(nextDist.point.y, 4);
  });
});

