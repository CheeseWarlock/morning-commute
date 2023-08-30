import Controller, { IController, KEYS } from "./Controller";
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
  selectedTrain?: Train;
  #selectedTrainIndex: number = 0;
  #controller: IController;
  turnStrategies: Map<Train, TRAIN_STRATEGIES> = new Map();

  constructor(network: Network, controller: IController) {
    this.#controller = controller;
    this.network = network;

    network.trains.forEach((train) => {
      this.turnStrategies.set(train, TRAIN_STRATEGIES.RANDOM);
      train.strategy = () => TRAIN_STRATEGIES.RANDOM;
    });

    const c = this.#controller;
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

  initialize() {
    const network = this.network;
    network.trains.push(
      new Train(network.segments[0], 30, {
        slowdown: true,
        waitTime: 500,
        waitTimePerPassenger: 500,
      }),
    );
    network.trains.push(
      new Train(network.segments[1], 30, {
        slowdown: true,
        waitTime: 500,
        waitTimePerPassenger: 500,
      }),
    );
    this.selectedTrain = network.trains[0];
  }

  update(deltaT: number) {
    this.network.update(deltaT);
    this.#detectCollisions();
  }

  #detectCollisions() {
    this.network.trains.forEach((t1) => {
      this.network.trains.forEach((t2) => {
        if (t1 !== t2) {
          const d = Math.sqrt(
            (t1.position.x - t2.position.x) ** 2 +
              (t1.position.y - t2.position.y) ** 2,
          );
          if (d < 10) {
            t1.passengers = [];
            t2.passengers = [];
          }
        }
      });
    });
  }
}

export default Game;
