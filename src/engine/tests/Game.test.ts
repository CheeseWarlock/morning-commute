import { FakeController } from "../Controller";
import Game from "../Game";
import GameState from "../GameState";
import Train from "../Train";
import { build } from "../networks/SimpleStation";

describe("Game update", () => {
  it("updates the network", () => {
    const network = build().network;
    const game = new Game(network, new FakeController());

    game.gameState.trains.push(
      new Train(
        { segment: network.segments[0], distanceAlong: 0, reversing: false },
        { speed: 10 },
      ),
    );

    game.update(1000);
    expect(game.gameState.trains[0].position.x).toBeCloseTo(10);
  });
});

it.skip("can detect collisions", () => {
  const network = build().network;
  const game = new Game(network, new FakeController());
  const trainA = new Train(
    { segment: game.network.segments[0], distanceAlong: 0, reversing: false },
    {
      waitTime: 0,
      waitTimePerPassenger: 0,
      speed: 10,
    },
  );
  const trainB = new Train(
    { segment: game.network.segments[2], distanceAlong: 0, reversing: false },
    {
      waitTime: 0,
      waitTimePerPassenger: 0,
      speed: 10,
    },
  );

  game.gameState.trains.push(trainA);
  game.gameState.trains.push(trainB);

  game.update(2000 + 1000 * Math.PI * 2);

  expect(game.gameState.trains[0].position.x).toBeCloseTo(20 + 10 * Math.PI * 2);
  expect(game.gameState.trains[1].position.x).toBeCloseTo(100);

  // Now a collision should happen
  game.update(2500);
  expect(game.gameState.trains[0].position.x).toBeCloseTo(45 + 10 * Math.PI * 2);
  expect(game.gameState.trains[1].position.x).toBeCloseTo(75);

  expect(game.collision).toBe(true);
});

describe("should be like normal", () => {
  const network = build().network;
  it("can navigate in reverse along track segments", () => {
    const train = new Train(
      { segment: network.segments[0], distanceAlong: 0, reversing: false },
      { speed: 10 },
    );
    const gameState = new GameState(network);
    gameState.trains.push(train);
    gameState.update(1000);
    expect(gameState.trains[0].position.x).toBeCloseTo(10);
  });
});
