import Network from "./Network";
import Train from "./Train";

/**
 * The top-level object representing the game logic.
 */
class Game {
  network: Network;

  constructor(network: Network) {
    this.network = network;
    network.trains.push(new Train(network.segments[0], 40));
  }
}

export default Game;
