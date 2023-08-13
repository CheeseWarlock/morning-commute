import { easyNavigate } from "../utils";
import TrackSegment from "./TrackSegment";

/**
 * A train, currently single car...
 */
class Train {
  position: { x: number; y: number };
  #currentSegment: TrackSegment;
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

  /**
   * Select a path when encountering a split
   */
  decidePath() {
    // Random
  }

  /**
   * Update position and status
   */
  update() {
    this.#currentDistance += this.#speed;

    if (
      this.#currentSegment.getPositionAlong(
        this.#currentDistance,
        this.#currentlyReversing,
      ).excess > 0
    ) {
      // We are arriving at a decision point
      const candidates = this.#currentlyReversing
        ? this.#currentSegment.atStart
        : this.#currentSegment.atEnd;
      const selectedTrack =
        candidates[Math.floor(Math.random() * candidates.length)];
      const newPos = easyNavigate(
        this.#currentSegment,
        this.#currentDistance,
        this.#currentlyReversing,
        0,
        selectedTrack,
      );
      this.#currentDistance -= this.#currentSegment.length;
      this.#currentSegment = selectedTrack;
      this.#currentlyReversing = newPos.reversing;
      this.position.x = newPos.point.x;
      this.position.y = newPos.point.y;
    } else {
      const newPos = this.#currentSegment.getPositionAlong(
        this.#currentDistance,
        this.#currentlyReversing,
      );
      this.position.x = newPos.point.x;
      this.position.y = newPos.point.y;
    }
  }
}

export default Train;
