import Controller, { KEYS } from "./Controller";
import Network from "./Network";
import Train from "./Train";

export enum TRAIN_STRATEGIES {
  TURN_LEFT,
  TURN_RIGHT,
}

/**
 * The top-level object representing the game logic.
 */
class Game {
  network: Network;
  selectedTrain: Train;
  #selectedTrainIndex: number = 0;
  turnStrategies: Map<Train, any> = new Map();

  constructor(network: Network) {
    this.network = network;
    network.trains.push(new Train(network.segments[0], 40, { slowdown: true }));
    network.trains.push(new Train(network.segments[0], 60, { slowdown: true }));
    this.selectedTrain = network.trains[0];
    const c = new Controller();
    c.on(KEYS.UP, () => {
      this.#selectedTrainIndex =
        (this.#selectedTrainIndex + 1) % this.network.trains.length;
    });
    c.on(KEYS.DOWN, () => {
      this.#selectedTrainIndex =
        (this.#selectedTrainIndex + 1) % this.network.trains.length;
    });
    c.on(KEYS.LEFT, () => {
      this.turnStrategies.set(
        network.trains[this.#selectedTrainIndex],
        TRAIN_STRATEGIES.TURN_LEFT,
      );
    });
    c.on(KEYS.RIGHT, () => {
      this.turnStrategies.set(
        network.trains[this.#selectedTrainIndex],
        TRAIN_STRATEGIES.TURN_RIGHT,
      );
    });
  }
}

export default Game;
