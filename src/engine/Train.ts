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
  HANDLING_PASSENGERS = "handling-passengers",
}

export type TMovementOptions = {
  slowdown?: boolean;
  waitTime?: number;
  waitTimePerPassenger?: number;
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
  /**
   * How long to wait after a passenger action.
   */
  #waitTimePerPassenger: number = 0;
  #passengerTimeProcessed: number = 0;
  #slowdown: boolean;
  followingCars: TrainFollowingCar[] = [];
  #previousSegments: { segment: TrackSegment; reversing: boolean }[] = [];
  /**
   * The amount of time left to process in the current update cycle.
   */
  #timeLeftToProcess: number = 0;
  /**
   * The segments this Train (and its following cars) occupied during the last update.
   */
  lastUpdateCollisionSegments: Map<TrackSegment, { from: number; to: number }> =
    new Map();
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
    this.#waitTime = movementOptions.waitTime ?? 1000;
    this.#slowdown = movementOptions.slowdown || false;
    this.#waitTimePerPassenger = movementOptions.waitTimePerPassenger || 0;
    this.followingCars.push(new TrainFollowingCar(this.position));
    this.followingCars.push(new TrainFollowingCar(this.position));
    this.followingCars.push(new TrainFollowingCar(this.position));
  }

  get heading() {
    return this.#currentSegment.getAngleAlong(
      this.#currentDistance,
      this.#currentlyReversing,
    );
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

  #moveAlongTrackSegment() {
    /**
     * Turn distance-effort into distance.
     */
    const currentPositionAlong = this.#currentDistance;
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

    const distanceEffortToMove = (this.#speed * this.#timeLeftToProcess) / 1000;
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
        this.#stopTime =
          this.#waitTime - (this.#timeLeftToProcess - millisToStation);
        this.#addToCollisionSegments(
          this.#currentSegment,
          currentPositionAlong,
          stationDistance,
        );

        if (this.#stopTime < 0) {
          // Cleared it in a single update!
          const excess = -this.#stopTime;
          this.#stopTime = 0;
          this.state = TRAIN_STATE.HANDLING_PASSENGERS;
          this.#timeLeftToProcess = excess;
        } else {
          const newPos = this.#currentSegment.getPositionAlong(
            stationDistance,
            this.#currentlyReversing,
          );
          this.#currentDistance = stationDistance;
          this.position.x = newPos.point.x;
          this.position.y = newPos.point.y;
          this.#timeLeftToProcess = 0;
        }
      } else {
        const newPos = this.#currentSegment.getPositionAlong(
          physicalDistance,
          this.#currentlyReversing,
        );
        this.#addToCollisionSegments(
          this.#currentSegment,
          currentPositionAlong,
          physicalDistance,
        );
        this.#currentDistance = physicalDistance;
        this.position.x = newPos.point.x;
        this.position.y = newPos.point.y;
        this.#timeLeftToProcess = 0;
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
      this.#timeLeftToProcess = excess;
      this.#addToCollisionSegments(
        this.#currentSegment,
        currentPositionAlong,
        Math.min(physicalDistance, this.#currentSegment.length),
      );
      if (excess > 0) {
        this.#selectNewTrackSegment(excess);
      }
    }
  }

  #addToCollisionSegments(segment: TrackSegment, from: number, to: number) {
    const current = this.lastUpdateCollisionSegments.get(segment);
    if (current) {
      current.from = Math.min(current.from, from);
      current.to = Math.max(current.to, to);
    } else {
      this.lastUpdateCollisionSegments.set(segment, { from, to });
    }
  }

  #waitAtStation() {
    this.#stopTime -= this.#timeLeftToProcess;
    if (this.#stopTime <= 0) {
      const excessTime = -this.#stopTime;
      this.#stopTime = 0;
      this.state = TRAIN_STATE.HANDLING_PASSENGERS;
      this.#timeLeftToProcess = excessTime;
    } else {
      this.#timeLeftToProcess = 0;
    }
  }

  #handlePassengers() {
    if (this.#isPassengerToHandle()) {
      this.#handleOnePassenger();
      this.state = TRAIN_STATE.STOPPED_AT_STATION;
      this.#stopTime = this.#waitTimePerPassenger;
    } else {
      this.state = TRAIN_STATE.MOVING;
      this.#stopTime = 0;
      this.#upcomingStations = [];
    }
  }

  #isPassengerToHandle() {
    const station = this.#upcomingStations[0];
    const passengerToDropOff = this.passengers.find(
      (p) => p.destination === station,
    );
    const atStation = station.waitingPassengers.length
      ? station.waitingPassengers[0]
      : undefined;
    return (
      passengerToDropOff ||
      (atStation && this.passengers.length < this.capacity)
    );
  }

  #handleOnePassenger() {
    const station = this.#upcomingStations[0];
    const passengerToDropOff = this.passengers.find(
      (p) => p.destination === station,
    );
    if (passengerToDropOff) {
      this.passengers.splice(this.passengers.indexOf(passengerToDropOff), 1);
    } else if (
      station.waitingPassengers.length &&
      this.passengers.length < this.capacity
    ) {
      this.passengers.push(station.waitingPassengers.splice(0, 1)[0]);
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
    this.#timeLeftToProcess = millisToProcess;
  }

  /**
   * Update position and status
   */
  update(deltaT: number) {
    this.lastUpdateCollisionSegments = new Map();
    this.#timeLeftToProcess = deltaT;
    let safetyValve = 100;

    while (this.#timeLeftToProcess > 0 && safetyValve > 0) {
      safetyValve -= 1;
      if (this.state === TRAIN_STATE.STOPPED_AT_STATION) {
        this.#waitAtStation();
      } else if (this.state === TRAIN_STATE.MOVING) {
        this.#moveAlongTrackSegment();
      } else if (this.state === TRAIN_STATE.HANDLING_PASSENGERS) {
        this.#handlePassengers();
      }
    }
    if (safetyValve === 0) {
      console.log(
        "Bad things have happened - this should only appear in very long updates",
      );
    }
    this.position = this.#currentSegment.getPositionAlong(
      this.#currentDistance,
      this.#currentlyReversing,
    ).point;

    this.followingCars.forEach((car, idx) => {
      let remainingDistance =
        this.#currentSegment.length - this.#currentDistance + 5 * (idx + 1);
      let targetSegmentIndex = this.#previousSegments.length - 1;
      let targetSegment = this.#currentSegment;
      let wasReversing = this.#currentlyReversing;

      let attemptedPosition = targetSegment.getPositionAlong(
        remainingDistance,
        !wasReversing,
      );
      remainingDistance = attemptedPosition.excess;

      while (remainingDistance > 0) {
        const target = this.#previousSegments[targetSegmentIndex];
        targetSegmentIndex -= 1;
        if (!target) {
          car.position = { x: 0, y: 0 };
          remainingDistance = 0;
        } else {
          wasReversing = target.reversing;
          targetSegment = target.segment;
          attemptedPosition = targetSegment.getPositionAlong(
            remainingDistance,
            !wasReversing,
          );
          remainingDistance = attemptedPosition.excess;
        }
      }
      car.position = attemptedPosition.point;
    });
  }
}

export default Train;
