import CircularTrackSegment from "../../engine/CircularTrackSegment";
import Game from "../../engine/Game";
import LinearTrackSegment from "../../engine/LinearTrackSegment";
import Network from "../../engine/Network";
import Point from "../../engine/Point";
import { ALIGNMENT } from "../../engine/Station";
import Train from "../../engine/Train";
import TrainFollowingCar from "../../engine/TrainFollowingCar";
import IRenderer from "./IRenderer";

/**
 * Draws the game to an HTMLCanvasElement.
 */
class CanvasRenderer implements IRenderer {
  #canvas: HTMLCanvasElement;
  #network: Network;
  #offset: { x: number; y: number };
  #size: { x: number; y: number };
  #scale: number;
  #context: CanvasRenderingContext2D | null;
  _testingOptions = {
    randomizeFramerate: false,
  };
  #game: Game;
  constructor(
    element: HTMLElement,
    game: Game,
    offset = { x: 0, y: 0 },
    scale = 2,
    size = { x: 800, y: 600 },
  ) {
    this.#offset = offset;
    this.#scale = scale;
    this.#size = size;
    const canvas = document.createElement("canvas");
    canvas.width = size.x;
    canvas.height = size.y;
    canvas.style.background = "black";
    element.appendChild(canvas);
    this.#canvas = canvas;
    this.#context = canvas.getContext("2d");
    this.#network = game.network;
    this.#game = game;

    const gameBounds = game.network.getBounds();

    const padding = 100;
    // The max fittable scale along X
    const scaleX =
      (this.#size.x - padding) / (gameBounds.max.x - gameBounds.min.x);
    // The max fittable scale along Y
    const scaleY =
      (this.#size.y - padding) / (gameBounds.max.y - gameBounds.min.y);

    if (scaleX < scaleY) {
      this.#scale = scaleX;
      const excessY =
        (this.#size.y -
          padding -
          (gameBounds.max.y - gameBounds.min.y) * this.#scale) /
        2;
      this.#offset = {
        x: -gameBounds.min.x + padding / (this.#scale * 2),
        y:
          -gameBounds.min.y +
          excessY / this.#scale +
          padding / (this.#scale * 2),
      };
    } else {
      this.#scale = scaleY;
      const excessX =
        (this.#size.x -
          padding -
          (gameBounds.max.x - gameBounds.min.x) * this.#scale) /
        2;

      this.#offset = {
        x:
          -gameBounds.min.x +
          excessX / this.#scale +
          padding / (this.#scale * 2),
        y: -gameBounds.min.y + padding / (this.#scale * 2),
      };
    }
  }

  transformPosition(p: Point): Point {
    return {
      x: (p.x + this.#offset.x) * this.#scale,
      y: (p.y + this.#offset.y) * this.#scale,
    };
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
    this.#game.gameState.trains.forEach((train: Train) => {
      if (!this.#context) return;
      const canvasPosition = this.transformPosition(train.position);
      this.#context.fillStyle = "rgba(200, 0, 0)";
      this.#context.beginPath();
      this.#context.arc(canvasPosition.x, canvasPosition.y, 5, 0, Math.PI * 2);
      this.#context.closePath();
      this.#context.fill();

      train.followingCars.forEach((car: TrainFollowingCar) => {
        if (!this.#context) return;
        const canvasPosition = this.transformPosition(car.position);
        this.#context.fillStyle = "rgba(200, 0, 200)";
        this.#context.beginPath();
        this.#context.arc(
          canvasPosition.x,
          canvasPosition.y,
          5,
          0,
          Math.PI * 2,
        );
        this.#context.closePath();
        this.#context.fill();
      });

      if (train === this.#game.selectedTrain) {
        // Now draw passenger counts
        this.#context.textAlign = "center";
        this.#context.fillStyle = "rgb(255,255,255)";
        this.#context.font = "12pt sans-serif";
        this.#context.fillText(
          train.passengers.length + "" + this.#game.turnStrategies.get(train),
          canvasPosition.x,
          canvasPosition.y - 10,
        );
      } else {
        // Now draw passenger counts
        this.#context.textAlign = "center";
        this.#context.fillStyle = "rgb(255,255,255)";
        this.#context.font = "12pt sans-serif";
        this.#context.fillText(
          train.passengers.length + "",
          canvasPosition.x,
          canvasPosition.y - 10,
        );
      }
    });
  }

  drawStations() {
    this.#network.stations.forEach((station) => {
      if (!this.#context) return;
      this.#context.fillStyle = "rgb(40, 100, 255)";
      const SIZE = 10;

      const targetPosition = station.trackSegment.getPositionAlong(
        station.distanceAlong,
      ).point;
      let angleFromForward = station.trackSegment.getAngleAlong(
        station.distanceAlong,
      );
      angleFromForward +=
        station.alignment === ALIGNMENT.LEFT ? -Math.PI / 2 : Math.PI / 2;

      targetPosition.x += Math.cos(angleFromForward) * 5;
      targetPosition.y += Math.sin(angleFromForward) * 5;
      targetPosition.x += this.#offset.x;
      targetPosition.y += this.#offset.y;
      targetPosition.x *= this.#scale;
      targetPosition.y *= this.#scale;

      const targetRotation = -station.trackSegment.getAngleAlong(
        station.distanceAlong,
      );
      this.#context.beginPath();
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

      // Now draw passenger counts
      this.#context.textAlign = "center";
      this.#context.fillStyle = "rgb(255,255,255)";
      this.#context.font = "12pt sans-serif";
      this.#context.fillText(
        "",
        //station.waitingPassengers.length + "",
        targetPosition.x,
        targetPosition.y - 10,
      );
    });
  }

  update() {
    this.#context = this.#canvas.getContext("2d");
    if (!this.#context) return;

    // Render
    this.#context.clearRect(0, 0, this.#size.x, this.#size.y);
    this.drawTrackSections();
    this.drawTrains();
    this.drawStations();
  }
}

export default CanvasRenderer;
