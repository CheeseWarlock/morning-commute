import { IController, KEYS } from "./Controller";
import Network from "./Network";
import TrackSegment from "./TrackSegment";
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
  collision: boolean = false;

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
      new Train(
        { segment: network.segments[0], distanceAlong: 0, reversing: false },
        {
          slowdown: true,
          waitTime: 500,
          waitTimePerPassenger: 500,
          speed: 30,
          followingCarCount: 4,
        },
      ),
    );
    network.trains.push(
      new Train(
        { segment: network.segments[1], distanceAlong: 0, reversing: false },
        {
          slowdown: true,
          waitTime: 500,
          waitTimePerPassenger: 500,
          speed: 30,
          followingCarCount: 4,
        },
      ),
    );
    this.selectedTrain = network.trains[0];
  }

  update(deltaT: number) {
    this.network.update(deltaT);
    this.#detectCollisions();
  }

  #detectCollisions() {
    this.collision = false;
    this.network.trains.forEach((t1) => {
      this.network.trains.forEach((t2) => {
        if (t1 !== t2) {
          const p1 = t1.lastUpdateCollisionSegments;
          const p2 = t2.lastUpdateCollisionSegments;
          const allSegments: Set<TrackSegment> = new Set();

          Array.from(p1.keys()).forEach((segment) => {
            allSegments.add(segment);
          });
          Array.from(p2.keys()).forEach((segment) => {
            allSegments.add(segment);
          });

          allSegments.forEach((segment) => {
            const s1 = p1.get(segment);
            const s2 = p2.get(segment);

            if (s1 && s2) {
              if (s1.from < s2.to && s2.from < s1.to) {
                // Collision!
                this.collision = true;
                t1.passengers = [];
                t2.passengers = [];
              }
            }
          });
        }
      });
    });
  }
}

export default Game;
