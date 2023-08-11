import CircularTrackSegment from "../../engine/CircularTrackSegment";
import LinearTrackSegment from "../../engine/LinearTrackSegment";
import Network from "../../engine/Network";
import Train from "../../engine/Train";

class Map {
  #canvas: HTMLCanvasElement;
  #network: Network;
  #offset: { x: number; y: number };
  #size: { x: number; y: number };
  #scale: number;
  constructor(
    element: HTMLElement,
    network: Network,
    offset = { x: 10, y: 10 },
    scale = 2,
    size = { x: 300, y: 250 },
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
    network.segments.forEach((segment) => {
      network.trains.push(new Train(segment));
    });

    requestAnimationFrame(() => {
      this.update();
    });
  }

  update() {
    const context = this.#canvas.getContext("2d");
    if (!context) return;

    this.#network.update();

    // Render
    context.clearRect(0, 0, this.#size.x, this.#size.y);
    context.strokeStyle = "rgb(200, 200, 200)";
    this.#network.segments.forEach((segment) => {
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
    this.#network.trains.forEach((train) => {
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
