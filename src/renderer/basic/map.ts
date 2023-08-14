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
  #context: CanvasRenderingContext2D | null;
  constructor(
    element: HTMLElement,
    network: Network,
    offset = { x: 10, y: 10 },
    scale = 2,
    size = { x: 800, y: 600 },
  ) {
    this.#offset = offset;
    this.#scale = scale;
    this.#size = size;
    const canvas = document.createElement("canvas");
    canvas.width = size.x;
    canvas.height = size.y;
    element.appendChild(canvas);
    this.#canvas = canvas;
    this.#context = canvas.getContext("2d");
    this.#network = network;
    network.trains.push(new Train(network.segments[0]));

    requestAnimationFrame(() => {
      this.update();
    });
  }

  drawTrackSections() {
    if (!this.#context) return;
    this.#context.strokeStyle = "rgb(200, 200, 200)";
    this.#context.lineWidth = 2;
    this.#network.segments.forEach((segment) => {
      if (!this.#context) return;
      if (segment instanceof LinearTrackSegment) {
        this.#context.beginPath();
        this.#context.moveTo(
          (segment.start.x + this.#offset.x) * this.#scale,
          (segment.start.y + this.#offset.y) * this.#scale,
        );
        this.#context.lineTo(
          (segment.end.x + this.#offset.x) * this.#scale,
          (segment.end.y + this.#offset.y) * this.#scale,
        );
        this.#context.stroke();
      } else if (segment instanceof CircularTrackSegment) {
        this.#context.beginPath();
        this.#context.arc(
          (segment.center.x + this.#offset.x) * this.#scale,
          (segment.center.y + this.#offset.y) * this.#scale,
          segment.radius * this.#scale,
          segment.initialAngle +
            (segment.counterClockWise ? Math.PI / 2 : -Math.PI / 2),
          segment.finalAngle +
            (segment.counterClockWise ? Math.PI / 2 : -Math.PI / 2),
          segment.counterClockWise,
        );
        this.#context.stroke();
      }
    });
  }

  drawTrains() {
    this.#network.trains.forEach((train) => {
      if (!this.#context) return;
      this.#context.fillStyle = "rgba(200, 0, 0)";
      this.#context.beginPath();
      this.#context.arc(
        (train.position.x + this.#offset.x) * this.#scale,
        (train.position.y + this.#offset.y) * this.#scale,
        5,
        0,
        Math.PI * 2,
      );
      this.#context.closePath();
      this.#context.fill();
    });
  }

  drawStations() {
    this.#network.stations.forEach((station) => {
      if (!this.#context) return;
      this.#context.fillStyle = "rgb(0, 0, 200)";
      const SIZE = 10;

      // Ugh a rotated rectangle isn't trivial
      const targetPosition = { x: 100, y: 100 };
      const targetRotation = 0.5;

      this.#context.moveTo(
        targetPosition.x +
          (-SIZE * Math.cos(targetRotation) -
            (SIZE / 2) * Math.sin(targetRotation)),
        targetPosition.y +
          (-(SIZE / 2) * Math.cos(targetRotation) +
            SIZE * Math.sin(targetRotation)),
      );
      this.#context.lineTo(
        targetPosition.x +
          (SIZE * Math.cos(targetRotation) -
            (SIZE / 2) * Math.sin(targetRotation)),
        targetPosition.y +
          (-(SIZE / 2) * Math.cos(targetRotation) -
            SIZE * Math.sin(targetRotation)),
      );
      this.#context.lineTo(
        targetPosition.x +
          (SIZE * Math.cos(targetRotation) +
            (SIZE / 2) * Math.sin(targetRotation)),
        targetPosition.y +
          ((SIZE / 2) * Math.cos(targetRotation) -
            SIZE * Math.sin(targetRotation)),
      );
      this.#context.lineTo(
        targetPosition.x +
          (-SIZE * Math.cos(targetRotation) +
            (SIZE / 2) * Math.sin(targetRotation)),
        targetPosition.y +
          ((SIZE / 2) * Math.cos(targetRotation) +
            SIZE * Math.sin(targetRotation)),
      );

      this.#context.closePath();
      this.#context.fill();
    });
  }

  update() {
    this.#network.update();
    this.#context = this.#canvas.getContext("2d");
    if (!this.#context) return;

    // Render
    this.#context.clearRect(0, 0, this.#size.x, this.#size.y);
    this.drawTrackSections();
    this.drawTrains();
    this.drawStations();

    requestAnimationFrame(() => {
      this.update();
    });
  }
}

export default Map;
