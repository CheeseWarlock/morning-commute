import CircularTrackSegment from "../CircularTrackSegment";
import LinearTrackSegment from "../LinearTrackSegment";
import Network from "../Network";
import Point from "../Point";
import Station, { ALIGNMENT } from "../Station";
import TrackSegment from "../TrackSegment";

class NetworkBuilder {
  #lastPosition: Point;
  #lastSegment?: TrackSegment;
  #network: Network;

  constructor() {
    this.#network = new Network();
    this.#lastPosition = { x: 0, y: 0 };
  }

  moveTo(point: Point) {
    this.#lastPosition = point;
  }

  lineTo(point: Point) {
    const segment = new LinearTrackSegment(this.#lastPosition, point);
    this.#network.segments.push(segment);
    this.#lastPosition = point;
    this.#lastSegment = segment;
  }

  curveTo(
    destination: Point,
    around: Point,
    counterClockWise: boolean = false,
  ) {
    const segment = new CircularTrackSegment(
      this.#lastPosition,
      destination,
      around,
      counterClockWise,
    );
    this.#network.segments.push(segment);
    this.#lastPosition = destination;
    this.#lastSegment = segment;
  }

  addStationOnLastSegment(distanceAlong: number, alignment: ALIGNMENT) {
    if (!this.#lastSegment) return;
    const station = new Station(this.#lastSegment, distanceAlong, alignment);
    this.network.stations.push(station);
    this.#lastSegment.stations.push(station);
  }

  get network() {
    this.#network.autoConnect();
    return this.#network;
  }
}

export default NetworkBuilder;
