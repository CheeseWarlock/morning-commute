import Network from "./Network";
import Train from "./Train";
import Station from "./Station";
import Passenger from "./Passenger";
import TrackSegment from "./TrackSegment";

class GameState {
  network: Network;
  trains: Train[] = [];
  waitingPassengers: Map<Station, Passenger[]> = new Map();
  autoGeneratePassengers: boolean = true;

  constructor(network: Network, autoGeneratePassengers: boolean = true) {
    this.network = network;
    this.autoGeneratePassengers = autoGeneratePassengers;
    this.network.stations.forEach(station => {
      this.waitingPassengers.set(station, []);
    });
  }

  initializeTrains() {
    const properSegments = this.network.segments.filter(
      (s) => s.id.startsWith("ee3adb0a"),
    );
    this.trains.push(
      new Train(
        { segment: properSegments[0], distanceAlong: 0, reversing: false },
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
        this.waitingPassengers.get(station)?.push(passenger);
      }
    });
  }
}

export default GameState; 