import Controller, { KEYS } from "./Controller";
import Network from "./Network";
import Train from "./Train";

export enum TRAIN_STRATEGIES {
  TURN_LEFT = "left",
  TURN_RIGHT = "right",
  RANDOM = "random",
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
    // network.trains.push(new Train(network.segments[0], 60, { slowdown: true }));
    this.selectedTrain = network.trains[0];
    network.trains.forEach((train) => {
      this.turnStrategies.set(train, TRAIN_STRATEGIES.RANDOM);
      train.strategy = () => TRAIN_STRATEGIES.RANDOM;
    });

    const c = new Controller();
    c.on(KEYS.UP, () => {
      this.#selectedTrainIndex =
        (this.#selectedTrainIndex + 1) % this.network.trains.length;
      this.selectedTrain = network.trains[this.#selectedTrainIndex];
    });
    c.on(KEYS.DOWN, () => {
      this.#selectedTrainIndex =
        (this.#selectedTrainIndex + 1) % this.network.trains.length;
      this.selectedTrain = network.trains[this.#selectedTrainIndex];
    });
    c.on(KEYS.LEFT, () => {
      this.turnStrategies.set(
        network.trains[this.#selectedTrainIndex],
        TRAIN_STRATEGIES.TURN_LEFT,
      );
      this.network.trains[this.#selectedTrainIndex].strategy = () =>
        TRAIN_STRATEGIES.TURN_LEFT;
    });
    c.on(KEYS.RIGHT, () => {
      this.turnStrategies.set(
        network.trains[this.#selectedTrainIndex],
        TRAIN_STRATEGIES.TURN_RIGHT,
      );
      this.network.trains[this.#selectedTrainIndex].strategy = () =>
        TRAIN_STRATEGIES.TURN_RIGHT;
    });
  }
}

export default Game;
