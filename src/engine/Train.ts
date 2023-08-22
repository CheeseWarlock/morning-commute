import { distanceEffortToDistance, easyNavigate } from "../utils";
import CircularTrackSegment from "./CircularTrackSegment";
import { TRAIN_STRATEGIES } from "./Game";
import GameObject from "./GameObject";
import Passenger from "./Passenger";
import Station from "./Station";
import TrackSegment from "./TrackSegment";
import TrainFollowingCar from "./TrainFollowingCar";

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
  #currentDistanceEffort: number = 0;
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
  followingCars: TrainFollowingCar[] = [];
  #previousSegments: { segment: TrackSegment; reversing: boolean }[] = [];
  strategy: () => TRAIN_STRATEGIES = () => TRAIN_STRATEGIES.TURN_LEFT;
  constructor(
    segment: TrackSegment,
    speed?: number,
    movementOptions: TMovementOptions = {},
  ) {
    this.position = { x: segment.start.x, y: segment.start.y };
    this.#currentSegment = segment;
    this.#currentDistanceEffort = 0;
    this.#currentlyReversing = false;
    this.#speed = speed || Math.random() + 0.5;
    this.#waitTime = movementOptions.waitTime || 1000;
    this.#slowdown = movementOptions.slowdown || false;
    this.followingCars.push(new TrainFollowingCar(this.position));
    this.followingCars.push(new TrainFollowingCar(this.position));
    this.followingCars.push(new TrainFollowingCar(this.position));
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
    /**
     * Turn distance-effort into distance.
     */
    const distanceEffortFunction = (dE: number) => {
      const slowDownAmount = this.#slowdown ? 16 : 0;
      if (!this.#slowdown) {
        return dE;
      }
      if (this.#currentSegment.stations.length) {
        const stationDist = this.#currentlyReversing
          ? this.#currentSegment.length -
            this.#currentSegment.stations[0].distanceAlong
          : this.#currentSegment.stations[0].distanceAlong;
        return distanceEffortToDistance(dE, stationDist, slowDownAmount);
      } else {
        return dE;
      }
    };

    const distanceEffortToMove = (this.#speed * deltaT) / 1000;
    this.#currentDistanceEffort += distanceEffortToMove;

    let physicalDistance = distanceEffortFunction(this.#currentDistanceEffort);

    if (this.#upcomingStations.length) {
      // There's a station around here
      const station = this.#currentSegment.stations[0];
      const stationDistance = this.#currentlyReversing
        ? this.#currentSegment.length - station.distanceAlong
        : station.distanceAlong;
      const stationDistanceEffort = stationDistance + (this.#slowdown ? 8 : 0);

      const isArrivingAtStation =
        this.#currentDistanceEffort >= stationDistanceEffort &&
        this.state === TRAIN_STATE.MOVING;

      if (isArrivingAtStation) {
        const distanceEffortToStation =
          stationDistanceEffort -
          (this.#currentDistanceEffort - distanceEffortToMove);
        const millisToStation = (1000 * distanceEffortToStation) / this.#speed;
        this.#currentDistanceEffort = stationDistanceEffort;
        this.state = TRAIN_STATE.STOPPED_AT_STATION;
        this.#stopTime = this.#waitTime - (deltaT - millisToStation);
        this.processPassengers();
        if (this.#stopTime < 0) {
          this.state = TRAIN_STATE.MOVING;
          // Cleared it in a single update!
          const excess = -this.#stopTime;
          this.#stopTime = 0;
          this.state = TRAIN_STATE.MOVING;
          this.#upcomingStations = [];
          this.update(excess);
        } else {
          const newPos = this.#currentSegment.getPositionAlong(
            stationDistance,
            this.#currentlyReversing,
          );
          this.#currentDistance = stationDistance;
          this.position.x = newPos.point.x;
          this.position.y = newPos.point.y;
        }
      } else {
        const newPos = this.#currentSegment.getPositionAlong(
          physicalDistance,
          this.#currentlyReversing,
        );
        this.#currentDistance = physicalDistance;
        this.position.x = newPos.point.x;
        this.position.y = newPos.point.y;
      }
    } else {
      const newPos = this.#currentSegment.getPositionAlong(
        physicalDistance,
        this.#currentlyReversing,
      );
      this.#currentDistance = physicalDistance;
      this.position.x = newPos.point.x;
      this.position.y = newPos.point.y;
      const excess = newPos.excess;
      if (excess > 0) {
        this.#selectNewTrackSegment(excess);
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
    const currentConnectionPoint = this.#currentlyReversing
      ? this.#currentSegment.start
      : this.#currentSegment.end;
    const candidates = this.#currentlyReversing
      ? this.#currentSegment.atStart
      : this.#currentSegment.atEnd;

    let selectedTrack =
      candidates[Math.floor(Math.random() * candidates.length)];

    if (candidates.length > 1) {
      const strategy = this.strategy();
      const candidatesByTurnDirection = candidates
        .map((t) => {
          const connectsAtStart =
            t.start.x === currentConnectionPoint.x &&
            t.start.y === currentConnectionPoint.y;

          if (t instanceof CircularTrackSegment) {
            const isLeftward = t.counterClockWise === connectsAtStart;
            return {
              segment: t as TrackSegment,
              order: (isLeftward ? -1 : 1) * (1 / t.radius),
            };
          }

          return {
            segment: t,
            order: 0,
          };
        })
        .sort((a, b) => a.order - b.order);

      if (strategy === TRAIN_STRATEGIES.TURN_LEFT) {
        selectedTrack = candidatesByTurnDirection[0].segment;
      } else if (strategy === TRAIN_STRATEGIES.TURN_RIGHT) {
        selectedTrack =
          candidatesByTurnDirection[candidatesByTurnDirection.length - 1]
            .segment;
      } else {
        // stay random
      }
    }

    const newPos = easyNavigate(
      this.#currentSegment,
      this.#currentDistanceEffort,
      this.#currentlyReversing,
      0,
      selectedTrack,
    );
    const millisToProcess = (1000 * excess) / this.#speed;
    this.#currentDistanceEffort = 0;
    this.#previousSegments.push({
      segment: this.#currentSegment,
      reversing: this.#currentlyReversing,
    });
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
    this.followingCars.forEach((car, idx) => {
      const remainingDistance = 5 * (idx + 1);

      if (this.#currentDistance - remainingDistance > 0) {
        // All good, we're on the right segment
        car.position = this.#currentSegment.getPositionAlong(
          this.#currentDistance - remainingDistance,
          this.#currentlyReversing,
        ).point;
      } else {
        const target =
          this.#previousSegments[this.#previousSegments.length - 1];
        if (!target) {
          car.position = { x: 0, y: 0 };
        } else {
          const wasReversing = target.reversing;
          const targetSegment = target.segment;
          const pos = targetSegment.getPositionAlong(
            remainingDistance - this.#currentDistance,
            !wasReversing,
          );
          car.position = pos.point;
        }
      }
    });
  }
}

export default Train;
