import Network from "./Network";
import Train from "./Train";
import Station from "./Station";
import Passenger from "./Passenger";
import { EventDispatcher } from "../utils/EventDispatcher";

interface GameStateEvents {
  waitingPassengersUpdated: { station: Station; passengers: Passenger[] };
  trainPassengersUpdated: { train: Train; passengers: Passenger[] };
}

class GameState extends EventDispatcher<GameStateEvents> {
  network: Network;
  trains: Train[] = [];
  waitingPassengers: Map<Station, Passenger[]> = new Map();
  autoGeneratePassengers: boolean = true;

  constructor(network: Network, autoGeneratePassengers: boolean = true) {
    super();
    this.network = network;
    this.autoGeneratePassengers = autoGeneratePassengers;
    this.network.stations.forEach((station) => {
      this.waitingPassengers.set(station, []);
    });
  }

  /**
   * Get the next waiting passenger from a station, if any.
   * @returns The next passenger, or undefined if there are no waiting passengers
   */
  getNextWaitingPassenger(station: Station): Passenger | undefined {
    const waitingPassengers = this.waitingPassengers.get(station);
    if (!waitingPassengers || waitingPassengers.length === 0) {
      return undefined;
    }
    return waitingPassengers[0];
  }

  /**
   * Remove a passenger from the waiting list at a station.
   * @returns The removed passenger, or undefined if there are no waiting passengers
   */
  removeWaitingPassenger(station: Station): Passenger | undefined {
    const waitingPassengers = this.waitingPassengers.get(station);
    if (!waitingPassengers || waitingPassengers.length === 0) {
      return undefined;
    }
    const passenger = waitingPassengers.splice(0, 1)[0];
    this.publish("waitingPassengersUpdated", {
      station,
      passengers: [...waitingPassengers],
    });
    return passenger;
  }

  /**
   * Add a passenger to the waiting list at a station.
   */
  addWaitingPassenger(station: Station, passenger: Passenger) {
    const waitingPassengers = this.waitingPassengers.get(station);
    if (!waitingPassengers) {
      this.waitingPassengers.set(station, [passenger]);
      this.publish("waitingPassengersUpdated", {
        station,
        passengers: [passenger],
      });
    } else {
      waitingPassengers.push(passenger);
      this.publish("waitingPassengersUpdated", {
        station,
        passengers: [...waitingPassengers],
      });
    }
  }

  /**
   * Handle a passenger being dropped off at their destination station.
   * Currently just removes them from the game, but could be extended to track statistics.
   */
  dropOffPassengerAtStation(station: Station, passenger: Passenger) {
    // For now, we just let the passenger disappear
    // In the future, we could track statistics or trigger events here
  }

  /**
   * Update the passengers on a train and dispatch an event.
   */
  updateTrainPassengers(train: Train, passengers: Passenger[]) {
    train.passengers = passengers;
    this.publish("trainPassengersUpdated", { train, passengers });
  }

  initializeTrains() {
    this.network.segments.forEach((seg) => {
      seg.trainStartPositions.forEach((startPosition) => {
        this.trains.push(
          new Train(
            {
              segment: seg,
              distanceAlong: startPosition.distanceAlong,
              reversing: startPosition.reverse,
            },
            {
              slowdown: true,
              waitTime: 2000,
              waitTimePerPassenger: 500,
              speed: 100,
              followingCarCount: 4,
            },
            this,
          ),
        );
      });
    });
  }

  update(deltaT: number) {
    if (this.autoGeneratePassengers) {
      this.generatePassengers();
    }
    this.trains.forEach((t) => t.update(deltaT));
  }

  detectCollisions(): boolean {
    let collision = false;
    this.trains.forEach((t1) => {
      this.trains.forEach((t2) => {
        if (t1 !== t2) {
          const d = Math.sqrt(
            (t1.position.x - t2.position.x) ** 2 +
              (t1.position.y - t2.position.y) ** 2,
          );
          if (d < 10) {
            t1.passengers = [];
            t2.passengers = [];
            collision = true;
          }
        }
      });
    });
    return collision;
  }

  generatePassengers() {
    this.network.stations.forEach((station) => {
      if (Math.random() > 0.995) {
        const destinations = this.network.stations.filter((s) => s !== station);
        const destination =
          destinations[Math.floor(Math.random() * destinations.length)];
        const passenger = new Passenger(station, destination);
        console.log(
          "Someone wants to go from",
          station.name,
          "to",
          destination.name,
        );
        this.waitingPassengers.get(station)?.push(passenger);
      }
    });
  }
}

export default GameState;
