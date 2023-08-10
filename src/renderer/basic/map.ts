import TrackSegment from "../../engine/TrackSegment";
import { easyNavigate } from "../../utils";

class Map {
  #canvas: HTMLCanvasElement;
  #network: TrackSegment[];
  #trainPosition: { x: number; y: number };
  #currentSegment: TrackSegment;
  #currentDistance: number;
  #currentlyReversing: boolean;
  constructor(element: HTMLElement, network: TrackSegment[]) {
    const canvas = document.createElement("canvas");
    element.appendChild(canvas);
    this.#canvas = canvas;
    this.#network = network;
    this.#trainPosition = { x: 0, y: 0 };
    this.#currentSegment = network[0];
    this.#currentDistance = 0;
    this.#currentlyReversing = false;

    requestAnimationFrame(() => {
      this.update();
    });
  }

  update() {
    const context = this.#canvas.getContext("2d");
    if (!context) return;

    // Game logic
    this.#currentDistance += 1.6;
    const newPos = easyNavigate(
      this.#currentSegment,
      this.#currentDistance,
      this.#currentlyReversing,
      0,
    );

    this.#trainPosition.x = newPos.point.x;
    this.#trainPosition.y = newPos.point.y;

    if (newPos.finalSegment !== this.#currentSegment) {
      this.#currentDistance -= this.#currentSegment.length;
      this.#currentSegment = newPos.finalSegment;
      this.#currentlyReversing = newPos.reversing;
    }

    // Render
    context.clearRect(0, 0, 250, 150);
    context.strokeStyle = "rgb(200, 200, 200)";
    this.#network.forEach((segment) => {
      context.beginPath();
      context.moveTo(segment.start.x, segment.start.y);
      context.lineTo(segment.end.x, segment.end.y);
      context.stroke();
    });
    context.fillStyle = "rgba(200, 0, 0, 0.8)";
    context.beginPath();
    context.arc(
      this.#trainPosition.x,
      this.#trainPosition.y,
      4,
      0,
      Math.PI * 2,
    );
    context.fill();
    requestAnimationFrame(() => {
      this.update();
    });
  }
}

export default Map;
