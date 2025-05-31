import {
  distanceEffortToDistance,
  easyNavigate,
  getNextJunction,
} from "../utils";
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

/**
 * Defines a Train's position on the game board.
 */
export type TTrainPosition = {
  segment: TrackSegment;
  distanceAlong: number;
  reversing: boolean;
};

/**
 * Train configuration options.
 */
export type TTrainConfigurationOptions = {
  speed: number;
  slowdown: boolean;
  waitTime: number;
  waitTimePerPassenger: number;
  followingCarCount: number;
};

/**
 * A Train.
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
  /**
   * Whether this train has stopped at a station this segment.
   */
  #hasStoppedAtStationThisSegment: boolean = false;
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
    initialPosition: TTrainPosition,
    movementOptions: Partial<TTrainConfigurationOptions> = {},
  ) {
    const DEFAULT_MOVEMENT_OPTIONS: TTrainConfigurationOptions = {
      speed: 10,
      slowdown: false,
      waitTime: 1000,
      waitTimePerPassenger: 0,
      followingCarCount: 3,
    };
    const movementOptionsWithDefaults: TTrainConfigurationOptions =
      Object.assign({}, DEFAULT_MOVEMENT_OPTIONS, movementOptions);
    const { segment, reversing, distanceAlong } = initialPosition;

    this.#currentSegment = segment;
    this.#currentDistance = distanceAlong;
    this.#currentDistanceEffort = distanceAlong;
    this.#currentlyReversing = reversing;
    this.position = segment.getPositionAlong(distanceAlong, reversing).point;
    this.#speed = movementOptionsWithDefaults.speed;
    this.#waitTime = movementOptionsWithDefaults.waitTime;
    this.#slowdown = movementOptionsWithDefaults.slowdown;
    this.#waitTimePerPassenger =
      movementOptionsWithDefaults.waitTimePerPassenger;
    let _followingCarCount: number = 3;

    if (movementOptions?.followingCarCount != null) {
      _followingCarCount = movementOptions?.followingCarCount;
    }
    while (_followingCarCount > 0) {
      this.followingCars.push(new TrainFollowingCar(this.position));
      _followingCarCount -= 1;
    }
  }

  get heading() {
    return this.#currentSegment.getAngleAlong(
      this.#currentDistance,
      this.#currentlyReversing,
    );
  }

  get currentSegment() {
    return this.#currentSegment;
  }

  /**
   * Move the train along the track segment.
   * @returns The distance the train moved.
   */
  #moveAlongTrackSegment() {
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

    // The distance we WANT to move
    const distanceEffortToMove = (this.#speed * this.#timeLeftToProcess) / 1000;
    // this.#currentDistanceEffort += distanceEffortToMove;

    // The physical distance we WANT to move
    // If there's no stations, this will be equal to distanceEffortToMove
    const physicalDistanceAfterThisUpdate = distanceEffortFunction(this.#currentDistanceEffort + distanceEffortToMove);
    // TODO: Distance effort function is over the total segment length, not the amount we're moving this update



    if (this.#currentSegment.stations.length) {
      // There's a station around here
      const station = this.#currentSegment.stations[0];
      const stationDistance = this.#currentlyReversing
        ? this.#currentSegment.length - station.distanceAlong
        : station.distanceAlong;
      const stationDistanceEffort = stationDistance + (this.#slowdown ? 8 : 0);

      const isArrivingAtStation =
        this.#currentDistanceEffort + distanceEffortToMove >= stationDistanceEffort &&
        !this.#hasStoppedAtStationThisSegment;

      if (isArrivingAtStation) {
        this.#addToCollisionSegments(
          this.#currentSegment,
          this.#currentDistance,
          stationDistance,
          this.#currentlyReversing,
        );
        // Move to station point and go to stopped state
        const distanceEffortToStation =
          stationDistanceEffort -
          (this.#currentDistanceEffort - distanceEffortToMove);
        const millisToStation = (1000 * distanceEffortToStation) / this.#speed;
        const distanceMoved = stationDistance - this.#currentDistance;
        this.#timeLeftToProcess -= millisToStation;
        this.#currentDistanceEffort = stationDistanceEffort;
        this.#currentDistance = stationDistance;
        this.#stopTime =
          this.#waitTime - (this.#timeLeftToProcess - millisToStation);
        this.state = TRAIN_STATE.STOPPED_AT_STATION;
        this.#hasStoppedAtStationThisSegment = true;
        
        return distanceMoved;
      }
    }
    
    if (physicalDistanceAfterThisUpdate > this.#currentSegment.length) {
      // Move to end of segment and go to next segment
      this.#addToCollisionSegments(
        this.#currentSegment,
        this.#currentDistance,
        Math.min(physicalDistanceAfterThisUpdate, this.#currentSegment.length),
        this.#currentlyReversing,
      );
      const excessDistance = physicalDistanceAfterThisUpdate - this.#currentSegment.length;
      this.#timeLeftToProcess = excessDistance * 1000 / this.#speed;
      this.#selectNewTrackSegment();
      return distanceEffortToMove - excessDistance;
    } else {
      // Move along the segment
      this.#addToCollisionSegments(
        this.#currentSegment,
        this.#currentDistance,
        Math.min(physicalDistanceAfterThisUpdate, this.#currentSegment.length),
        this.#currentlyReversing,
      );
      const distanceMoved = physicalDistanceAfterThisUpdate - this.#currentDistance;
      this.#currentDistance = physicalDistanceAfterThisUpdate;
      this.#currentDistanceEffort += distanceEffortToMove;
      this.#timeLeftToProcess = 0;
      return distanceMoved;
    }
  }

  #addToCollisionSegments(
    segment: TrackSegment,
    from: number,
    to: number,
    reversing: boolean,
  ) {
    // If we're reversing, to and from are inverted
    const realFrom = reversing ? this.#currentSegment.length - to : from;
    const realTo = reversing ? this.#currentSegment.length - from : to;
    const current = this.lastUpdateCollisionSegments.get(segment);
    if (current) {
      current.from = Math.min(current.from, realFrom);
      current.to = Math.max(current.to, realTo);
    } else {
      this.lastUpdateCollisionSegments.set(segment, {
        from: realFrom,
        to: realTo,
      });
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

  #selectNewTrackSegment() {
    this.#previousSegments.push({ segment: this.#currentSegment, reversing: this.#currentlyReversing });
    const currentSegment = this.#currentSegment;
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

    this.#currentDistanceEffort = 0;
    this.#currentDistance = 0;
    this.#currentSegment = selectedTrack;
    this.#upcomingStations = selectedTrack.stations.slice();
    this.#hasStoppedAtStationThisSegment = false;
    
    this.#currentlyReversing = selectedTrack.atEnd.includes(currentSegment);
  }

  get nextJunction() {
    return getNextJunction(this.#currentSegment, this.#currentlyReversing);
  }

  /**
   * Update position and status
   */
  update(deltaT: number) {
    this.lastUpdateCollisionSegments = new Map();
    this.#timeLeftToProcess = deltaT;

    const distanceBack = this.followingCars.length * 5;
    this.#addToCollisionSegments(
      this.#currentSegment,
      Math.max(0, this.#currentDistance - distanceBack),
      this.#currentDistance,
      this.#currentlyReversing,
    );

    let remainingDistance = distanceBack;

    let targetSegmentIndex = this.#previousSegments.length - 1;
    let targetSegment = this.#currentSegment;
    let wasReversing = this.#currentlyReversing;

    let attemptedPosition = targetSegment.getPositionAlong(
      this.#currentDistance - remainingDistance,
      !wasReversing,
    );
    remainingDistance = attemptedPosition.excess;

    while (remainingDistance > 0) {
      const target = this.#previousSegments[targetSegmentIndex];
      targetSegmentIndex -= 1;
      if (!target) {
        remainingDistance = 0;
      } else {
        wasReversing = target.reversing;
        targetSegment = target.segment;
        attemptedPosition = targetSegment.getPositionAlong(
          remainingDistance,
          !wasReversing,
        );
        this.#addToCollisionSegments(
          targetSegment,
          targetSegment.length - remainingDistance,
          targetSegment.length,
          wasReversing,
        );

        remainingDistance = attemptedPosition.excess;
      }
    }

    /**
     * Max number of actions per update.
     */
    let safetyValve = 100;

    // const expectedDistanceToMove = (this.#speed * deltaT) / 1000;
    // let distanceMovedSoFar = 0;

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

    // if (Math.abs(expectedDistanceToMove - distanceMovedSoFar) > 0.001) {
    //   console.log("Did we move as expected?", expectedDistanceToMove, distanceMovedSoFar);
    // }

    if (safetyValve === 0) {
      console.log(
        "Bad things have happened - this should only appear in very long updates",
      );
    }
    this.position = this.#currentSegment.getPositionAlong(
      this.#currentDistance,
      this.#currentlyReversing,
    ).point;

    // Update following cars
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
