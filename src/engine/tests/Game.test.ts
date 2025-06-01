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
        game.gameState
      ),
    );

    game.update(1000);
    expect(game.gameState.trains[0].position.x).toBeCloseTo(10);
  });
});

describe("should be like normal", () => {
  const network = build().network;
  it("can navigate in reverse along track segments", () => {
    const gameState = new GameState(network);
    const train = new Train(
      { segment: network.segments[0], distanceAlong: 0, reversing: false },
      { speed: 10 },
      gameState
    );
    gameState.trains.push(train);
    gameState.update(1000);
    expect(gameState.trains[0].position.x).toBeCloseTo(10);
  });
});
