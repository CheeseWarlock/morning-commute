import CircularTrackSegment from "../engine/CircularTrackSegment";
import LinearTrackSegment from "../engine/LinearTrackSegment";
import Network from "../engine/Network";
import Point from "../engine/Point";
import { ALIGNMENT } from "../engine/Station";
import TrackSegment from "../engine/TrackSegment";

class TrackEditor {
  #canvas: HTMLCanvasElement;
  #network: Network;
  #offset: { x: number; y: number };
  #size: { x: number; y: number };
  #scale: number;
  #context: CanvasRenderingContext2D | null;
  #hoverSegment?: TrackSegment;
  _testingOptions = {
    randomizeFramerate: false,
  };
  mousePos?: { x: number; y: number };
  #selectedSegment: TrackSegment | undefined;
  constructor(
    element: HTMLElement,
    network: Network,
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
    this.#network = network;

    const gameBounds = network.getBounds();

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

    // Ignore scale and offset for now
    this.#scale = 1;
    this.#offset = { x: 0, y: 0 };

    canvas.onmousemove = (ev) => {
      this.mousePos = { x: ev.offsetX, y: ev.offsetY };
      this.updateHoverState();
      this.update();
    };

    canvas.onclick = (ev) => {
      this.#selectedSegment = this.#hoverSegment;
      console.log(this.#selectedSegment);
      this.update();
    };
  }

  transformPosition(p: Point): Point {
    return {
      x: (p.x + this.#offset.x) * this.#scale,
      y: (p.y + this.#offset.y) * this.#scale,
    };
  }

  untransformPosition(p: Point): Point {
    return {
      x: p.x / this.#scale - this.#offset.x,
      y: p.y / this.#scale - this.#offset.y,
    };
  }

  drawTrackSections() {
    if (!this.#context) return;
    this.#context.lineWidth = 2;
    this.#network.segments.forEach((segment) => {
      if (!this.#context) return;
      if (segment === this.#selectedSegment) {
        this.#context.strokeStyle = "rgb(255, 255, 255)";
        this.#context.lineWidth = 4;
      } else if (segment === this.#hoverSegment) {
        this.#context.strokeStyle = "rgb(200, 200, 200)";
        this.#context.lineWidth = 4;
      } else {
        this.#context.strokeStyle = "rgb(200, 200, 200)";
        this.#context.lineWidth = 2;
      }

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

      // Draw a dot at the start and end
      let canvasPosition = this.transformPosition(segment.start);
      this.#context.fillStyle = "rgba(200, 0, 0)";
      this.#context.beginPath();
      this.#context.arc(canvasPosition.x, canvasPosition.y, 5, 0, Math.PI * 2);
      this.#context.closePath();
      this.#context.fill();

      canvasPosition = this.transformPosition(segment.end);
      this.#context.fillStyle = "rgba(200, 0, 0)";
      this.#context.beginPath();
      this.#context.arc(canvasPosition.x, canvasPosition.y, 5, 0, Math.PI * 2);
      this.#context.closePath();
      this.#context.fill();

      // Draw an arrow in the middle
      canvasPosition = this.transformPosition(
        segment.getPositionAlong(segment.length / 2).point,
      );
      const angle = segment.getAngleAlong(segment.length / 2) + Math.PI;
      this.#context.strokeStyle = "rgba(255, 255, 0)";
      this.#context.beginPath();
      this.#context.moveTo(canvasPosition.x, canvasPosition.y);
      this.#context.lineTo(
        canvasPosition.x + Math.cos(angle + Math.PI / 4) * 10,
        canvasPosition.y + Math.sin(angle + Math.PI / 4) * 10,
      );
      this.#context.stroke();
      this.#context.beginPath();
      this.#context.moveTo(canvasPosition.x, canvasPosition.y);
      this.#context.lineTo(
        canvasPosition.x + Math.cos(angle - Math.PI / 4) * 10,
        canvasPosition.y + Math.sin(angle - Math.PI / 4) * 10,
      );
      this.#context.stroke();

      this.#context.closePath();
      this.#context.fill();
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
    });
  }

  updateHoverState() {
    const selectionPoint: Point = {
      x: this.mousePos?.x || 0,
      y: this.mousePos?.y || 0,
    };
    const distToLine = (a: Point, b: Point, p: Point) => {
      const x = p.x;
      const y = p.y;
      const x1 = a.x;
      const x2 = b.x;
      const y1 = a.y;
      const y2 = b.y;

      var A = x - x1;
      var B = y - y1;
      var C = x2 - x1;
      var D = y2 - y1;

      var dot = A * C + B * D;
      var len_sq = C * C + D * D;
      var param = -1;
      if (len_sq != 0)
        //in case of 0 length line
        param = dot / len_sq;

      var xx, yy;

      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }

      var dx = x - xx;
      var dy = y - yy;
      return Math.sqrt(dx * dx + dy * dy);
    };
    let closest = Infinity;
    let closestSegment: TrackSegment | undefined;
    this.#network.segments.forEach((seg) => {
      const distToThis = distToLine(seg.start, seg.end, selectionPoint);
      if (distToThis < closest && distToThis < 100) {
        closestSegment = seg;
        closest = distToThis;
      }
    }, Infinity);
    this.#hoverSegment = closestSegment;
  }

  update() {
    this.#context = this.#canvas.getContext("2d");
    if (!this.#context) return;

    // Render
    this.#context.clearRect(0, 0, this.#size.x, this.#size.y);
    this.drawTrackSections();
    this.drawStations();
  }
}

export default TrackEditor;
