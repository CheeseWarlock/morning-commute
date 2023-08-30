import { FakeController } from "../Controller";
import Game from "../Game";
import Train from "../Train";
import { build } from "../networks/SimpleStation";

describe("Game update", () => {
  it("updates the network", () => {
    const network = build().network;
    const game = new Game(network, new FakeController());
    game.network.trains.push(new Train(game.network.segments[0], 10));

    game.update(1000);
    expect(game.network.trains[0].position.x).toBeCloseTo(10);
  });
});

it("can detect collisions", () => {
  const network = build().network;
  const game = new Game(network, new FakeController());
  const trainA = new Train(game.network.segments[0], 10, {
    waitTime: 0,
    waitTimePerPassenger: 0,
  });
  const trainB = new Train(game.network.segments[2], 10, {
    waitTime: 0,
    waitTimePerPassenger: 0,
  });

  game.network.trains.push(trainA);
  game.network.trains.push(trainB);

  game.update(2000 + 1000 * Math.PI * 2);

  expect(game.network.trains[0].position.x).toBeCloseTo(20 + 10 * Math.PI * 2);
  expect(game.network.trains[1].position.x).toBeCloseTo(100);

  // Now a collision should happen
  game.update(2500);
  expect(game.network.trains[0].position.x).toBeCloseTo(45 + 10 * Math.PI * 2);
  expect(game.network.trains[1].position.x).toBeCloseTo(75);

  expect(game.collision).toBe(true);
});

describe("should be like normal", () => {
  const network = build().network;
  it("can navigate in reverse along track segments", () => {
    const train = new Train(network.segments[0], 10);
    network.trains.push(train);
    network.update(1000);
    expect(network.trains[0].position.x).toBeCloseTo(10);
  });
});
