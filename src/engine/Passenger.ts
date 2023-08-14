import Station from "./Station";

class Passenger {
  /**
   * Where this Passenger came from.
   */
  origin: Station;
  /**
   * The Station this Passenger needs to be delivered to.
   */
  destination: Station;
  /**
   * The amount of time this passenger is willing to wait.
   */
  patience: number = Infinity;

  constructor(origin: Station, destination: Station) {
    this.origin = origin;
    this.destination = destination;
  }
}

export default Passenger;
