import { distanceEffort, easyNavigate } from "../utils";
import GameObject from "./GameObject";
import Passenger from "./Passenger";
import Station from "./Station";
import TrackSegment from "./TrackSegment";

export enum TRAIN_STATE {
  MOVING = "moving",
  STOPPED_AT_STATION = "stopped-at-station",
}

export type TMovementOptions = {
  slowdown?: boolean;
  waitTime?: number;
};

/**
 * A train, currently single car...
 */
class Train implements GameObject {
  position: { x: number; y: number };
  #currentSegment: TrackSegment;
  #currentDistance: number = 0;
  #currentlyReversing: boolean;
  /**
   * Speed in units per second.
   */
  #speed: number;
  state: TRAIN_STATE = TRAIN_STATE.MOVING;
  #stopTime: number = 0;
  #upcomingStations: Station[] = [];
  capacity: number = 8;
  passengers: Passenger[] = [];
  /**
   * How long this train should wait at a station.
   */
  #waitTime: number;
  #slowdown: boolean;
  constructor(
    segment: TrackSegment,
    speed?: number,
    movementOptions: TMovementOptions = {},
  ) {
    this.position = { x: segment.start.x, y: segment.start.y };
    this.#currentSegment = segment;
    this.#currentDistance = 0;
    this.#currentlyReversing = false;
    this.#speed = speed || Math.random() + 0.5;
    this.#waitTime = movementOptions.waitTime || 1000;
    this.#slowdown = movementOptions.slowdown || false;
  }

  /**
   * Select a path when encountering a split
   */
  decidePath() {
    // Random
  }

  processPassengers() {
    // TODO: don't rely on this as the source of truth
    const station = this.#upcomingStations[0];

    // Dropoff
    this.passengers = this.passengers.filter((p) => p.destination !== station);

    // Pickup
    while (
      station.waitingPassengers.length &&
      this.passengers.length < this.capacity
    ) {
      this.passengers.push(station.waitingPassengers.splice(0, 1)[0]);
    }
  }

  #moveAlongTrackSegment(deltaT: number) {
    const distanceEffortFunction = (dE: number) => {
      if (this.#currentSegment.stations.length) {
        return distanceEffort(
          dE,
          this.#currentSegment.stations[0].distanceAlong,
        );
      } else {
        return dE;
      }
    };
    const distanceToMove = (this.#speed * deltaT) / 1000;
    this.#currentDistance += distanceToMove;
    const tempDistance = distanceEffortFunction(this.#currentDistance);
    console.log(
      tempDistance,
      this.#currentDistance,
      this.#currentSegment.length,
    );
    if (this.#upcomingStations.length) {
      const newPos = this.#currentSegment.getPositionAlong(
        tempDistance,
        this.#currentlyReversing,
      );
      this.position.x = newPos.point.x;
      this.position.y = newPos.point.y;
      return;
      // There's a station around here
      const station = this.#currentSegment.stations[0];
      const stationDistance = this.#currentlyReversing
        ? this.#currentSegment.length - station.distanceAlong
        : station.distanceAlong;
      if (
        this.#currentDistance >= stationDistance &&
        this.state === TRAIN_STATE.MOVING
      ) {
        const distanceToStation =
          stationDistance - (this.#currentDistance - distanceToMove);
        const millisToStation = (1000 * distanceToStation) / this.#speed;
        this.#currentDistance = stationDistance;
        this.state = TRAIN_STATE.STOPPED_AT_STATION;
        this.#stopTime = this.#waitTime - (deltaT - millisToStation);
        this.processPassengers();
      }
    } else {
      const excess = this.#currentSegment.getPositionAlong(
        this.#currentDistance,
        this.#currentlyReversing,
      ).excess;
      if (excess > 0) {
        this.#selectNewTrackSegment(excess);
      } else {
        const newPos = this.#currentSegment.getPositionAlong(
          tempDistance,
          this.#currentlyReversing,
        );
        this.position.x = newPos.point.x;
        this.position.y = newPos.point.y;
      }
    }
  }

  #waitAtStation(deltaT: number) {
    this.#stopTime -= deltaT;
    if (this.#stopTime <= 0) {
      const excessTime = -this.#stopTime;
      this.#stopTime = 0;
      this.state = TRAIN_STATE.MOVING;
      this.#upcomingStations = [];
      this.update(excessTime);
    }
  }

  #selectNewTrackSegment(excess: number) {
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
    const millisToProcess = (1000 * excess) / this.#speed;
    this.#currentDistance = 0;
    this.#currentSegment = selectedTrack;
    this.#upcomingStations = selectedTrack.stations.slice();
    this.#currentlyReversing = newPos.reversing;
    this.update(millisToProcess);
  }

  /**
   * Update position and status
   */
  update(deltaT: number) {
    if (this.state === TRAIN_STATE.STOPPED_AT_STATION) {
      this.#waitAtStation(deltaT);
    } else if (this.state === TRAIN_STATE.MOVING) {
      this.#moveAlongTrackSegment(deltaT);
    }
  }
}

export default Train;
