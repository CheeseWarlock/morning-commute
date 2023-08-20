import Network from "./Network";
import Train from "./Train";

/**
 * The top-level object representing the game logic.
 */
class Game {
  network: Network;

  constructor(network: Network) {
    this.network = network;
    network.trains.push(new Train(network.segments[0], 40, { slowdown: true }));
    // network.trains.push(new Train(network.segments[0], 60, { slowdown: true }));
  }
}

export default Game;
