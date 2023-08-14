import { easyNavigate } from "../utils";
import Station from "./Station";
import TrackSegment from "./TrackSegment";

export enum TRAIN_STATE {
  MOVING = "moving",
  STOPPED_AT_STATION = "stopped-at-station",
}

/**
 * A train, currently single car...
 */
class Train {
  position: { x: number; y: number };
  #currentSegment: TrackSegment;
  #currentDistance: number;
  #currentlyReversing: boolean;
  #speed: number;
  state: TRAIN_STATE = TRAIN_STATE.MOVING;
  #stopTime: number = 0;
  #upcomingStations: Station[] = [];
  constructor(segment: TrackSegment, speed?: number) {
    this.position = { x: segment.start.x, y: segment.start.y };
    this.#currentSegment = segment;
    this.#currentDistance = 0;
    this.#currentlyReversing = false;
    this.#speed = speed || Math.random() + 0.5;
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
    if (this.state === TRAIN_STATE.STOPPED_AT_STATION) {
      this.#stopTime -= 100;
      if (this.#stopTime <= 0) {
        this.#stopTime = 0;
        this.state = TRAIN_STATE.MOVING;
        this.#upcomingStations = [];
      }
    } else if (this.state === TRAIN_STATE.MOVING) {
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
        this.#upcomingStations = selectedTrack.stations.slice();
        this.#currentlyReversing = newPos.reversing;
        this.position.x = newPos.point.x;
        this.position.y = newPos.point.y;
      } else {
        if (this.#upcomingStations.length) {
          // There's a station around here
          const station = this.#currentSegment.stations[0];
          const stationDistance = this.#currentlyReversing
            ? this.#currentSegment.length - station.distanceAlong
            : station.distanceAlong;
          if (
            this.#currentDistance >= stationDistance &&
            this.state === TRAIN_STATE.MOVING
          ) {
            this.#currentDistance = stationDistance;
            this.state = TRAIN_STATE.STOPPED_AT_STATION;
            this.#stopTime = 1000;
          }
        }
        const newPos = this.#currentSegment.getPositionAlong(
          this.#currentDistance,
          this.#currentlyReversing,
        );
        this.position.x = newPos.point.x;
        this.position.y = newPos.point.y;
      }
    }
  }
}

export default Train;
