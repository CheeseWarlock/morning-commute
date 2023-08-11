import { easyNavigate } from "../utils";
import TrackSegment from "./TrackSegment";

/**
 * A train, currently single car...
 */
class Train {
  position: { x: number; y: number };
  #currentSegment: any;
  #currentDistance: number;
  #currentlyReversing: boolean;
  #speed: number;
  constructor(segment: TrackSegment) {
    this.position = { x: segment.start.x, y: segment.start.y };
    this.#currentSegment = segment;
    this.#currentDistance = 0;
    this.#currentlyReversing = false;
    this.#speed = Math.random() + 0.5;
  }

  update() {
    // Game logic
    this.#currentDistance += this.#speed;
    const newPos = easyNavigate(
      this.#currentSegment,
      this.#currentDistance,
      this.#currentlyReversing,
      0,
    );

    this.position.x = newPos.point.x;
    this.position.y = newPos.point.y;

    if (newPos.finalSegment !== this.#currentSegment) {
      this.#currentDistance -= this.#currentSegment.length;
      this.#currentSegment = newPos.finalSegment;
      this.#currentlyReversing = newPos.reversing;
    }
  }
}

export default Train;
