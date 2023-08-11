import CircularTrackSegment from "../../engine/CircularTrackSegment";
import LinearTrackSegment from "../../engine/LinearTrackSegment";
import TrackSegment from "../../engine/TrackSegment";
import { easyNavigate } from "../../utils";

class Train {
  position: { x: number; y: number };
  #currentSegment: any;
  #currentDistance: number;
  #currentlyReversing: boolean;
  constructor(segment: TrackSegment) {
    this.position = { x: segment.start.x, y: segment.start.y };
    this.#currentSegment = segment;
    this.#currentDistance = 0;
    this.#currentlyReversing = false;
  }

  update() {
    // Game logic
    this.#currentDistance += 1;
    const newPos = easyNavigate(
      this.#currentSegment,
      this.#currentDistance,
      this.#currentlyReversing,
      0,
    );

    this.position.x = newPos.point.x;
    this.position.y = newPos.point.y;

    if (newPos.finalSegment !== this.#currentSegment) {
      this.#currentDistance -= this.#currentSegment.length;
      this.#currentSegment = newPos.finalSegment;
      this.#currentlyReversing = newPos.reversing;
    }
  }
}

class Map {
  #canvas: HTMLCanvasElement;
  #network: TrackSegment[];
  trains: Train[];
  #offset: { x: number; y: number };
  #size: { x: number; y: number };
  #scale: number;
  constructor(
    element: HTMLElement,
    network: TrackSegment[],
    offset = { x: 10, y: 10 },
    scale = 2,
    size = { x: 250, y: 250 },
  ) {
    this.#offset = offset;
    this.#scale = scale;
    this.#size = size;
    const canvas = document.createElement("canvas");
    canvas.width = size.x;
    canvas.height = size.y;
    element.appendChild(canvas);
    this.#canvas = canvas;
    this.#network = network;
    this.trains = [
      new Train(network[0]),
      new Train(network[0]),
      new Train(network[0]),
      new Train(network[0]),
      new Train(network[0]),
      new Train(network[0]),
    ];

    requestAnimationFrame(() => {
      this.update();
    });
  }

  update() {
    const context = this.#canvas.getContext("2d");
    if (!context) return;

    // Render
    context.clearRect(0, 0, this.#size.x, this.#size.y);
    context.strokeStyle = "rgb(200, 200, 200)";
    this.#network.forEach((segment) => {
      if (segment instanceof LinearTrackSegment) {
        context.beginPath();
        context.moveTo(
          (segment.start.x + this.#offset.x) * this.#scale,
          (segment.start.y + this.#offset.y) * this.#scale,
        );
        context.lineTo(
          (segment.end.x + this.#offset.x) * this.#scale,
          (segment.end.y + this.#offset.y) * this.#scale,
        );
        context.stroke();
      } else if (segment instanceof CircularTrackSegment) {
        context.beginPath();
        context.arc(
          (segment.center.x + this.#offset.x) * this.#scale,
          (segment.center.y + this.#offset.y) * this.#scale,
          segment.radius * this.#scale,
          segment.initialAngle,
          segment.finalAngle,
          segment.counterClockWise,
        );
        context.stroke();
      }
    });
    this.trains.forEach((train) => {
      train.update();
      context.fillStyle = "rgba(200, 0, 0, 0.8)";
      context.beginPath();
      context.arc(
        (train.position.x + this.#offset.x) * this.#scale,
        (train.position.y + this.#offset.y) * this.#scale,
        4,
        0,
        Math.PI * 2,
      );
      context.fill();
    });

    requestAnimationFrame(() => {
      this.update();
    });
  }
}

export default Map;
