import CircularTrackSegment from "../CircularTrackSegment";
import LinearTrackSegment from "../LinearTrackSegment";
import Network from "../Network";
import Point from "../Point";

class NetworkBuilder {
  #lastPosition: Point;
  #network: Network;

  constructor() {
    this.#network = new Network();
    this.#lastPosition = { x: 0, y: 0 };
  }

  moveTo(point: Point) {
    this.#lastPosition = point;
  }

  lineTo(point: Point) {
    this.#network.segments.push(
      new LinearTrackSegment(this.#lastPosition, point),
    );
    this.#lastPosition = point;
  }

  curveTo(
    destination: Point,
    around: Point,
    counterClockWise: boolean = false,
  ) {
    this.#network.segments.push(
      new CircularTrackSegment(
        this.#lastPosition,
        destination,
        around,
        counterClockWise,
      ),
    );
    this.#lastPosition = destination;
  }

  get network() {
    this.#network.autoConnect();
    return this.#network;
  }
}

export default NetworkBuilder;
