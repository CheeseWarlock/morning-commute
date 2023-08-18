import Network from "./Network";
import Train from "./Train";

/**
 * The top-level object representing the game logic.
 */
class Game {
  network: Network;

  constructor(network: Network) {
    this.network = network;
    network.trains.push(new Train(network.segments[0], 90));
    network.trains.push(new Train(network.segments[0], 100));
    network.trains.push(new Train(network.segments[0], 110));
    network.trains.push(new Train(network.segments[0], 120));
    network.trains.push(new Train(network.segments[0], 130));
    network.trains.push(new Train(network.segments[0], 140));
    network.trains.push(new Train(network.segments[0], 150));
    network.trains.push(new Train(network.segments[0], 160));
    network.trains.push(new Train(network.segments[0], 170));
    network.trains.push(new Train(network.segments[0], 180));
  }
}

export default Game;
