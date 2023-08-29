import { FakeController } from "../Controller";
import Game from "../Game";
import Train from "../Train";
import SimpleStation from "../networks/SimpleStation";

describe("awserjhiaweg asehkjrgawejgjhkar", () => {
  const game = new Game(SimpleStation, new FakeController());
  it("seryer sertyerysresres rsry serysery sertye", () => {
    game.network.trains.push(new Train(game.network.segments[0], 10));
    game.network.trains.push(new Train(game.network.segments[2], 10));

    game.update(1000);
    expect(game.network.trains[0].position.x).toBeCloseTo(30);
  });
});
