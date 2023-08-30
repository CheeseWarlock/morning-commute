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

describe("should be like normal", () => {
  const network = build().network;
  it("can navigate in reverse along track segments", () => {
    const train = new Train(network.segments[0], 10);
    network.trains.push(train);
    network.update(1000);
    expect(network.trains[0].position.x).toBeCloseTo(10);
  });
});
