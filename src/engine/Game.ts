import { IController, KEYS } from "./Controller";
import Network from "./Network";
import Train from "./Train";
import GameState from "./GameState";
import { EventDispatcher } from "../utils/EventDispatcher";

export enum TRAIN_STRATEGIES {
  TURN_LEFT = "left",
  TURN_RIGHT = "right",
  RANDOM = "random",
}

interface GameEvents {
  trainSelected: { train: Train; index: number };
}

/**
 * The top-level object representing the game logic.
 */
class Game extends EventDispatcher<GameEvents> {
  network: Network;
  gameState: GameState;
  selectedTrain?: Train;
  #selectedTrainIndex: number = 0;
  #controller: IController;
  turnStrategies: Map<Train, TRAIN_STRATEGIES> = new Map();
  collision: boolean = false;

  constructor(network: Network, controller: IController) {
    super();
    this.#controller = controller;
    this.network = network;
    this.gameState = new GameState(network);

    this.gameState.trains.forEach((train) => {
      this.turnStrategies.set(train, TRAIN_STRATEGIES.RANDOM);
      train.strategy = () => TRAIN_STRATEGIES.RANDOM;
    });

    const c = this.#controller;
    c.on(KEYS.UP, () => {
      this.#selectedTrainIndex =
        (this.#selectedTrainIndex + 1) % this.gameState.trains.length;
      this.selectedTrain = this.gameState.trains[this.#selectedTrainIndex];
      this.publish("trainSelected", {
        train: this.selectedTrain,
        index: this.#selectedTrainIndex,
      });
    });
    c.on(KEYS.DOWN, () => {
      this.#selectedTrainIndex =
        (this.#selectedTrainIndex + 1) % this.gameState.trains.length;
      this.selectedTrain = this.gameState.trains[this.#selectedTrainIndex];
      this.publish("trainSelected", {
        train: this.selectedTrain,
        index: this.#selectedTrainIndex,
      });
    });
    c.on(KEYS.LEFT, () => {
      this.turnStrategies.set(
        this.gameState.trains[this.#selectedTrainIndex],
        TRAIN_STRATEGIES.TURN_LEFT,
      );
      this.gameState.trains[this.#selectedTrainIndex].strategy = () =>
        TRAIN_STRATEGIES.TURN_LEFT;
    });
    c.on(KEYS.RIGHT, () => {
      this.turnStrategies.set(
        this.gameState.trains[this.#selectedTrainIndex],
        TRAIN_STRATEGIES.TURN_RIGHT,
      );
      this.gameState.trains[this.#selectedTrainIndex].strategy = () =>
        TRAIN_STRATEGIES.TURN_RIGHT;
    });
  }

  initialize() {
    this.gameState.initializeTrains();
    this.selectedTrain = this.gameState.trains[0];
    this.publish("trainSelected", { train: this.selectedTrain, index: 0 });
  }

  update(deltaT: number) {
    this.gameState.update(deltaT);
    this.collision = this.gameState.detectCollisions();
  }
}

export default Game;
