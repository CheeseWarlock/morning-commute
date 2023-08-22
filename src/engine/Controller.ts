export enum KEYS {
  UP = "w",
  DOWN = "s",
  LEFT = "a",
  RIGHT = "d",
}

/**
 * Controller as in how one controls the game.
 */
class Controller {
  subscribers: Map<KEYS, (() => void)[]> = new Map();
  constructor() {
    Object.values(KEYS).forEach((val) => {
      if (typeof val !== "string") {
        this.subscribers.set(val, []);
      }
    });
    document.body.onkeydown = (ev) => {
      if (ev.key === "w") this.#dispatch(KEYS.UP);
      if (ev.key === "a") this.#dispatch(KEYS.LEFT);
      if (ev.key === "s") this.#dispatch(KEYS.DOWN);
      if (ev.key === "d") this.#dispatch(KEYS.RIGHT);
    };
  }

  #dispatch(key: KEYS) {
    this.subscribers.get(key)?.forEach((f) => f());
  }

  on(key: KEYS, func: () => void) {
    if (!this.subscribers.get(key)) this.subscribers.set(key, []);
    this.subscribers.get(key)?.push(func);
  }
}

export default Controller;
