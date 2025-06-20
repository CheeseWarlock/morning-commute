import CircularTrackSegment from "../../engine/CircularTrackSegment";
import LinearTrackSegment from "../../engine/LinearTrackSegment";
import { ALIGNMENT } from "../../engine/Station";
import TrackSegment from "../../engine/TrackSegment";
import TrackEditor, {
  EDITOR_STATE,
  GamePoint,
  ScreenPoint,
  SELECTION_TYPE,
} from "./TrackEditor";

class TrackEditorCanvas {
  canvas: HTMLCanvasElement;
  #trackEditor: TrackEditor;
  #size: ScreenPoint;

  constructor(
    targetElement: HTMLElement,
    trackEditor: TrackEditor,
    size: ScreenPoint,
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = size.x;
    canvas.height = size.y;
    canvas.style.background = "black";
    targetElement.appendChild(canvas);
    this.canvas = canvas;
    this.#trackEditor = trackEditor;
    this.#size = size;
  }

  /**
   * Draw the current state to the canvas.
   */
  draw() {
    const context = this.canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, this.#size.x, this.#size.y);

    this.#drawGridLines(100);
    this.#trackEditor.determineGhosts();
    this.drawTrackSections();
    this.drawStations();
    if (
      this.#trackEditor.currentStateWithData.state === EDITOR_STATE.DRAG_SELECT
    ) {
      this.#drawDragSelection();
    }
  }

  /**
   * Draw the track sections, including the segment that is being created.
   */
  drawTrackSections() {
    const context = this.canvas.getContext("2d");
    if (!context) return;
    context.lineWidth = 2;

    const segments = [
      ...this.#trackEditor.network.segments,
      ...this.#trackEditor.ghostSegments,
    ];

    segments.forEach((segment) => {
      const context = this.canvas.getContext("2d");
      if (!context) return;
      if (
        (this.#trackEditor.currentStateWithData.state === EDITOR_STATE.SELECT &&
          segment === this.#trackEditor.currentStateWithData.selectedSegment) ||
        (this.#trackEditor.currentStateWithData.state ===
          EDITOR_STATE.MULTI_SELECT &&
          this.#trackEditor.currentStateWithData.selectedSegments.includes(
            segment,
          ))
      ) {
        context.strokeStyle = "rgb(255, 255, 255)";
        context.lineWidth = 4;
      } else if (segment === this.#trackEditor.hoverSegment) {
        context.strokeStyle = "rgb(200, 200, 200)";
        context.lineWidth = 4;
      } else {
        context.strokeStyle = "rgb(200, 200, 200)";
        context.lineWidth = 2;
      }

      if (segment instanceof LinearTrackSegment) {
        context.beginPath();
        context.moveTo(
          (segment.start.x + this.#trackEditor.offset.x) *
            this.#trackEditor.scale,
          (segment.start.y + this.#trackEditor.offset.y) *
            this.#trackEditor.scale,
        );
        context.lineTo(
          (segment.end.x + this.#trackEditor.offset.x) *
            this.#trackEditor.scale,
          (segment.end.y + this.#trackEditor.offset.y) *
            this.#trackEditor.scale,
        );
        context.stroke();
      } else if (segment instanceof CircularTrackSegment) {
        context.beginPath();
        context.arc(
          (segment.center.x + this.#trackEditor.offset.x) *
            this.#trackEditor.scale,
          (segment.center.y + this.#trackEditor.offset.y) *
            this.#trackEditor.scale,
          segment.radius * this.#trackEditor.scale,
          segment.initialAngle +
            (segment.counterClockWise ? Math.PI / 2 : -Math.PI / 2),
          segment.finalAngle +
            (segment.counterClockWise ? Math.PI / 2 : -Math.PI / 2),
          segment.counterClockWise,
        );
        context.stroke();
      }

      // Draw endpoint dots
      this.#drawEndpointDot(segment.start as GamePoint);
      this.#drawEndpointDot(segment.end as GamePoint);

      // Draw endpoint highlight rings if needed
      if (
        (this.#trackEditor.hoverSelectionType === SELECTION_TYPE.START &&
          segment === this.#trackEditor.hoverSegment) ||
        (this.#trackEditor.currentStateWithData.state === EDITOR_STATE.SELECT &&
          this.#trackEditor.currentStateWithData.selectionType ===
            SELECTION_TYPE.START &&
          segment === this.#trackEditor.currentStateWithData.selectedSegment)
      ) {
        this.#drawEndpointHighlight(segment.start as GamePoint);
      }
      if (
        (this.#trackEditor.hoverSelectionType === SELECTION_TYPE.END &&
          segment === this.#trackEditor.hoverSegment) ||
        (this.#trackEditor.currentStateWithData.state === EDITOR_STATE.SELECT &&
          this.#trackEditor.currentStateWithData.selectionType ===
            SELECTION_TYPE.END &&
          segment === this.#trackEditor.currentStateWithData.selectedSegment)
      ) {
        this.#drawEndpointHighlight(segment.end as GamePoint);
      }

      // Draw arrow in the middle
      if (
        this.#trackEditor.currentStateWithData.state === EDITOR_STATE.SELECT &&
        this.#trackEditor.currentStateWithData.selectedSegment === segment
      ) {
        this.#drawArrowInMiddle(segment);
      }

      // Draw a red X near either end if not connected
      if (segment.atStart.length === 0) {
        const d = 0.1 * segment.length;
        const a = segment.getAngleAlong(d);
        this.#drawRedX(segment, d, a);
      }
      if (segment.atEnd.length === 0) {
        const d = segment.length - 0.1 * segment.length;
        const a = segment.getAngleAlong(d);
        this.#drawRedX(segment, d, a);
      }

      // Draw a green triangle if this is a train start point
      segment.trainStartPositions.forEach((position) => {
        this.#drawStartArrow(segment, position.distanceAlong, position.reverse);
      });

      if (
        this.#trackEditor.currentStateWithData.state ===
          EDITOR_STATE.SET_START_POSITION &&
        this.#trackEditor.hoverSegment &&
        this.#trackEditor.mousePos
      ) {
        const stationGamePosition = this.#trackEditor.untransformPosition(
          this.#trackEditor.mousePos,
        );
        const closestPoint = this.#trackEditor.hoverSegment.distanceToPosition({
          x: stationGamePosition.x,
          y: stationGamePosition.y,
        });
        this.#drawStartArrow(
          this.#trackEditor.hoverSegment,
          closestPoint.distanceAlong * this.#trackEditor.hoverSegment.length,
          closestPoint.alignment === ALIGNMENT.LEFT,
        );
      }

      context.closePath();
      context.fill();
    });

    if (
      this.#trackEditor.currentStateWithData.state === EDITOR_STATE.QUERY_POINT
    ) {
      context.strokeStyle = "rgb(200, 200, 200)";
      context.lineWidth = 2;
      context.beginPath();
      context.arc(
        this.#trackEditor.mousePos!.x,
        this.#trackEditor.mousePos!.y,
        15,
        0,
        Math.PI * 2,
      );
      context.stroke();
    }
  }

  drawStations() {
    const stations = [...this.#trackEditor.network.stations];
    if (this.#trackEditor.ghostStation)
      stations.push(this.#trackEditor.ghostStation);
    stations.forEach((station) => {
      const context = this.canvas.getContext("2d");
      if (!context) return;
      context.fillStyle = "rgb(222, 200, 0)";
      const SIZE = 10;

      const targetPosition = station.trackSegment.getPositionAlong(
        station.distanceAlong,
      ).point;
      let angleFromForward = station.trackSegment.getAngleAlong(
        station.distanceAlong,
      );
      angleFromForward +=
        station.alignment === ALIGNMENT.LEFT ? -Math.PI / 2 : Math.PI / 2;

      targetPosition.x +=
        (Math.cos(angleFromForward) * 8) / this.#trackEditor.scale;
      targetPosition.y +=
        (Math.sin(angleFromForward) * 8) / this.#trackEditor.scale;
      targetPosition.x += this.#trackEditor.offset.x;
      targetPosition.y += this.#trackEditor.offset.y;
      targetPosition.x *= this.#trackEditor.scale;
      targetPosition.y *= this.#trackEditor.scale;

      const targetRotation = -station.trackSegment.getAngleAlong(
        station.distanceAlong,
      );
      context.beginPath();
      context.moveTo(
        targetPosition.x +
          (-SIZE * Math.cos(targetRotation) -
            (SIZE / 2) * Math.sin(targetRotation)),
        targetPosition.y +
          (-(SIZE / 2) * Math.cos(targetRotation) +
            SIZE * Math.sin(targetRotation)),
      );
      context.lineTo(
        targetPosition.x +
          (SIZE * Math.cos(targetRotation) -
            (SIZE / 2) * Math.sin(targetRotation)),
        targetPosition.y +
          (-(SIZE / 2) * Math.cos(targetRotation) -
            SIZE * Math.sin(targetRotation)),
      );
      context.lineTo(
        targetPosition.x +
          (SIZE * Math.cos(targetRotation) +
            (SIZE / 2) * Math.sin(targetRotation)),
        targetPosition.y +
          ((SIZE / 2) * Math.cos(targetRotation) -
            SIZE * Math.sin(targetRotation)),
      );
      context.lineTo(
        targetPosition.x +
          (-SIZE * Math.cos(targetRotation) +
            (SIZE / 2) * Math.sin(targetRotation)),
        targetPosition.y +
          ((SIZE / 2) * Math.cos(targetRotation) +
            SIZE * Math.sin(targetRotation)),
      );

      context.closePath();
      context.fill();
    });
  }

  // --- Drawing helpers ---
  #drawEndpointDot(point: GamePoint) {
    const context = this.canvas.getContext("2d");
    if (!context) return;
    const canvasPosition = this.#trackEditor.transformPosition(point);
    context.fillStyle = "rgb(100, 100, 255)";
    context.beginPath();
    context.arc(canvasPosition.x, canvasPosition.y, 5, 0, Math.PI * 2);
    context.closePath();
    context.fill();
  }

  #drawEndpointHighlight(point: GamePoint) {
    const context = this.canvas.getContext("2d");
    if (!context) return;
    const canvasPosition = this.#trackEditor.transformPosition(point);
    context.strokeStyle = "rgba(255,255,255)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(canvasPosition.x, canvasPosition.y, 8, 0, Math.PI * 2);
    context.closePath();
    context.stroke();
  }

  #drawArrowInMiddle(segment: TrackSegment) {
    const context = this.canvas.getContext("2d");
    if (!context) return;
    const mid = segment.length / 2;
    const canvasPosition = this.#trackEditor.transformPosition(
      segment.getPositionAlong(mid).point as GamePoint,
    );
    const angle = segment.getAngleAlong(mid) + Math.PI;
    context.strokeStyle = "rgb(222, 200, 0)";
    context.beginPath();
    context.moveTo(canvasPosition.x, canvasPosition.y);
    context.lineTo(
      canvasPosition.x + Math.cos(angle + Math.PI / 4) * 10,
      canvasPosition.y + Math.sin(angle + Math.PI / 4) * 10,
    );
    context.stroke();
    context.beginPath();
    context.moveTo(canvasPosition.x, canvasPosition.y);
    context.lineTo(
      canvasPosition.x + Math.cos(angle - Math.PI / 4) * 10,
      canvasPosition.y + Math.sin(angle - Math.PI / 4) * 10,
    );
    context.stroke();
  }

  #drawRedX(segment: TrackSegment, distanceAlong: number, angle: number) {
    const context = this.canvas.getContext("2d");
    if (!context) return;
    const pos = segment.getPositionAlong(distanceAlong).point;
    const canvasPos = this.#trackEditor.transformPosition(pos as GamePoint);
    const size = 10;
    context.save();
    context.translate(canvasPos.x, canvasPos.y);
    context.rotate(angle);
    context.strokeStyle = "#e11d48"; // Tailwind red-600
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-size / 2, -size / 2);
    context.lineTo(size / 2, size / 2);
    context.moveTo(size / 2, -size / 2);
    context.lineTo(-size / 2, size / 2);
    context.stroke();
    context.restore();
  }

  #drawGridLines(interval: number) {
    const context = this.canvas.getContext("2d");
    if (!context) return;

    const scaledInterval = interval * this.#trackEditor.scale;
    context.strokeStyle = "rgba(255, 255, 255, 0.2)";
    context.lineWidth = 1;
    context.beginPath();
    for (
      let x =
        ((this.#trackEditor.offset.x * this.#trackEditor.scale) %
          scaledInterval) -
        scaledInterval;
      x < this.#size.x;
      x += scaledInterval
    ) {
      context.moveTo(x, 0);
      context.lineTo(x, this.#size.y);
    }
    for (
      let y =
        ((this.#trackEditor.offset.y * this.#trackEditor.scale) %
          scaledInterval) -
        scaledInterval;
      y < this.#size.y;
      y += scaledInterval
    ) {
      context.moveTo(0, y);
      context.lineTo(this.#size.x, y);
    }
    context.stroke();
  }

  #drawDragSelection() {
    const context = this.canvas.getContext("2d");
    if (!context) return;
    if (
      this.#trackEditor.currentStateWithData.state !== EDITOR_STATE.DRAG_SELECT
    )
      return;
    if (!context || !this.#trackEditor.currentStateWithData.dragStartPoint)
      return;
    const startPoint = this.#trackEditor.currentStateWithData.dragStartPoint;
    if (!startPoint) return;
    const endPoint = this.#trackEditor.mousePos;
    if (!endPoint) return;

    const startPointScreen = this.#trackEditor.transformPosition(startPoint);
    context.strokeStyle = "rgba(255, 255, 255, 0.5)";
    context.lineWidth = 2;
    context.setLineDash([10, 5]);
    context.beginPath();
    context.rect(
      startPointScreen.x,
      startPointScreen.y,
      endPoint.x - startPointScreen.x,
      endPoint.y - startPointScreen.y,
    );
    context.stroke();
    context.setLineDash([]);
  }

  #drawStartArrow(
    segment: TrackSegment,
    distanceAlong: number,
    reverse: boolean,
  ) {
    const context = this.canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "rgb(50,240,30)";
    const SIZE = 12;
    // Get the point and angle on the segment
    const pos = segment.getPositionAlong(distanceAlong).point;
    const angle =
      segment.getAngleAlong(distanceAlong) + (reverse ? Math.PI : 0);
    const canvasPos = this.#trackEditor.transformPosition(pos as GamePoint);
    context.save();
    context.translate(canvasPos.x, canvasPos.y);
    context.rotate(angle);
    context.beginPath();
    // Draw an equilateral triangle pointing right (along +X), then rotate
    context.moveTo(SIZE, 0);
    context.lineTo(-SIZE * 0.6, SIZE * 0.6);
    context.lineTo(-SIZE * 0.6, -SIZE * 0.6);
    context.closePath();
    context.fill();
    context.restore();
  }
}

export default TrackEditorCanvas;
