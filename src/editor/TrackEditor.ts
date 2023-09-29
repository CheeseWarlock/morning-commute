import React from "react";
import CircularTrackSegment from "../engine/CircularTrackSegment";
import LinearTrackSegment from "../engine/LinearTrackSegment";
import Network from "../engine/Network";
import Point from "../engine/Point";
import { ALIGNMENT } from "../engine/Station";
import TrackSegment from "../engine/TrackSegment";
import { connectSegments, findCenter } from "./utils";
import Controller from "../engine/Controller";
import Game from "../engine/Game";
import BabylonRenderer from "../renderer/basic/babylon/BabylonRenderer";
import RendererCoordinator from "../renderer/RendererCoordinator";

/**
 * Which end of the segment is selected, or if it's just the whole thing
 */
export enum SELECTION_TYPE {
  START = "start",
  END = "end",
  SEGMENT = "segment",
}

/**
 * State of the editor.
 */
export enum EDITOR_STATE {
  /**
   * Select and unselect track segments.
   */
  SELECT,
  /**
   * Choose the first point for a linear track segment.
   */
  CREATE_LINEAR_SEGMENT_START,
  /**
   * Choose the second point for a linear track segment.
   */
  CREATE_LINEAR_SEGMENT_END,
  /**
   * Choose the first point for a linear-and-circular connection.
   */
  CREATE_CONNECTION_START,
  /**
   * Choose the second point for a linear-and-circular connection.
   */
  CREATE_CONNECTION_END,
  /**
   * Add a station to an existing track segment.
   */
  CREATE_STATION,
}

type EDITOR_STATE_PAYLOADS =
  | {
      state: EDITOR_STATE.SELECT;
    }
  | {
      state: EDITOR_STATE.CREATE_LINEAR_SEGMENT_START;
    }
  | {
      state: EDITOR_STATE.CREATE_LINEAR_SEGMENT_END;
      segmentStart: Point;
    }
  | {
      state: EDITOR_STATE.CREATE_CONNECTION_START;
    }
  | {
      state: EDITOR_STATE.CREATE_CONNECTION_END;
      connectionSegment: TrackSegment;
      connectedAtEnd: boolean;
    }
  | {
      state: EDITOR_STATE.CREATE_STATION;
    };

const SELECTION_DISTANCE_PIXELS = 15;

class TrackEditor {
  #canvas: HTMLCanvasElement;
  network: Network;
  #offset: { x: number; y: number };
  #size: { x: number; y: number };
  #scale: number;
  #context: CanvasRenderingContext2D | null;
  #onSelect?: (segment?: TrackSegment) => void;
  _testingOptions = {
    randomizeFramerate: false,
  };
  mousePos?: { x: number; y: number };
  #hoverSegment?: TrackSegment;
  #selectedSegment: TrackSegment | undefined;
  #selectionType?: SELECTION_TYPE;
  #hoverSelectionType?: SELECTION_TYPE;
  #dragging: boolean = false;
  statePayload: EDITOR_STATE_PAYLOADS = {
    state: EDITOR_STATE.SELECT,
  };
  onStateChanged?: (payload: EDITOR_STATE_PAYLOADS) => void;
  onNetworkChanged?: () => void;
  constructor(options: {
    element: HTMLElement;
    network: Network;
    offset?: Point;
    scale?: number;
    size?: Point;
    onSelect: (segment?: TrackSegment) => void;
  }) {
    const { element, network, offset, scale, size, onSelect } = options;
    this.#offset = offset || { x: 0, y: 0 };
    this.#scale = scale || 1;
    this.#size = size || { x: 800, y: 600 };
    const canvas = document.createElement("canvas");
    canvas.width = this.#size.x;
    canvas.height = this.#size.y;
    canvas.style.background = "black";
    element.appendChild(canvas);
    this.#canvas = canvas;
    this.#context = canvas.getContext("2d");
    this.network = network;
    this.#onSelect = onSelect;

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

    document.body.onkeydown = (ev) => {
      if (
        this.#selectedSegment &&
        (ev.key === "Backspace" || ev.key === "Delete")
      ) {
        this.#onSelect?.();
        this.network.segments.splice(
          this.network.segments.indexOf(this.#selectedSegment),
          1,
        );
        this.network.segments.forEach((segment) => {
          if (
            this.#selectedSegment &&
            segment.atStart.indexOf(this.#selectedSegment) > -1
          ) {
            segment.atStart.splice(
              segment.atStart.indexOf(this.#selectedSegment),
              1,
            );
          }
          if (
            this.#selectedSegment &&
            segment.atEnd.indexOf(this.#selectedSegment) > -1
          ) {
            segment.atEnd.splice(
              segment.atEnd.indexOf(this.#selectedSegment),
              1,
            );
          }
        });
        this.#selectedSegment = undefined;
        this.network = new Network(this.network.segments);
        this.onNetworkChanged?.();
        this.update();
      }
    };

    canvas.onmousemove = (ev) => {
      if (this.#dragging) {
        if (
          this.#selectedSegment &&
          this.#selectionType === SELECTION_TYPE.START
        ) {
          if (this.#selectedSegment instanceof CircularTrackSegment) {
            const newCenter = findCenter(
              { x: ev.offsetX, y: ev.offsetY },
              this.#selectedSegment.end,
              this.#selectedSegment.theta,
              this.#selectedSegment.counterClockWise,
            );
            this.#selectedSegment.start.x = ev.offsetX;
            this.#selectedSegment.start.y = ev.offsetY;
            this.#selectedSegment.center.x = newCenter.x;
            this.#selectedSegment.center.y = newCenter.y;
          } else {
            this.#selectedSegment.start.x = ev.offsetX;
            this.#selectedSegment.start.y = ev.offsetY;
          }
          this.mousePos = { x: ev.offsetX, y: ev.offsetY };
          this.network = new Network(this.network.segments);
          this.onNetworkChanged?.();
          this.update();
        } else if (
          this.#selectedSegment &&
          this.#selectionType === SELECTION_TYPE.END
        ) {
          if (this.#selectedSegment instanceof CircularTrackSegment) {
            const newCenter = findCenter(
              this.#selectedSegment.start,
              { x: ev.offsetX, y: ev.offsetY },
              this.#selectedSegment.theta,
              this.#selectedSegment.counterClockWise,
            );
            this.#selectedSegment.end.x = ev.offsetX;
            this.#selectedSegment.end.y = ev.offsetY;
            this.#selectedSegment.center.x = newCenter.x;
            this.#selectedSegment.center.y = newCenter.y;
          } else {
            this.#selectedSegment.end.x = ev.offsetX;
            this.#selectedSegment.end.y = ev.offsetY;
          }
          this.mousePos = { x: ev.offsetX, y: ev.offsetY };
          this.network = new Network(this.network.segments);
          this.onNetworkChanged?.();
          this.update();
        }
      } else {
        this.mousePos = { x: ev.offsetX, y: ev.offsetY };
        this.updateHoverState();
        this.update();
      }
    };

    canvas.onmousedown = (ev) => {
      switch (this.statePayload.state) {
        case EDITOR_STATE.CREATE_LINEAR_SEGMENT_START:
          this.setStatePayload({
            state: EDITOR_STATE.CREATE_LINEAR_SEGMENT_END,
            segmentStart: {
              x: this.mousePos!.x,
              y: this.mousePos!.y,
            },
          });
          break;

        case EDITOR_STATE.CREATE_LINEAR_SEGMENT_END:
          const newSegment = new LinearTrackSegment(
            this.statePayload.segmentStart,
            {
              x: this.mousePos!.x,
              y: this.mousePos!.y,
            },
          );
          this.network.segments.push(newSegment);
          this.network = new Network(this.network.segments);
          this.onNetworkChanged?.();
          this.update();
          this.setStatePayload({
            state: EDITOR_STATE.SELECT,
          });
          break;

        case EDITOR_STATE.CREATE_CONNECTION_START:
          if (
            this.#hoverSegment &&
            (this.#hoverSelectionType === SELECTION_TYPE.START ||
              this.#hoverSelectionType === SELECTION_TYPE.END)
          ) {
            this.setStatePayload({
              state: EDITOR_STATE.CREATE_CONNECTION_END,
              connectionSegment: this.#hoverSegment,
              connectedAtEnd: this.#hoverSelectionType === SELECTION_TYPE.END,
            });
          }
          break;

        case EDITOR_STATE.CREATE_CONNECTION_END:
          if (
            this.#hoverSegment &&
            (this.#hoverSelectionType === SELECTION_TYPE.START ||
              this.#hoverSelectionType === SELECTION_TYPE.END)
          ) {
            const newSegments = connectSegments(
              this.statePayload.connectionSegment,
              this.statePayload.connectedAtEnd,
              this.#hoverSegment,
              this.#hoverSelectionType === SELECTION_TYPE.END,
            );

            newSegments[0].connect(this.statePayload.connectionSegment);
            newSegments[0].connect(this.#hoverSegment);
            if (newSegments[1]) {
              newSegments[0].connect(newSegments[1]);
              newSegments[1].connect(this.#hoverSegment);
              newSegments[1].connect(this.statePayload.connectionSegment);
            }
            this.network.segments.push(...newSegments);
            this.network = new Network(this.network.segments);
            this.onNetworkChanged?.();

            this.update();

            this.setStatePayload({
              state: EDITOR_STATE.SELECT,
            });
          } else if (this.#hoverSegment) {
            this.#selectedSegment = this.#hoverSegment;
          }
          break;

        case EDITOR_STATE.SELECT:
          this.#selectedSegment = this.#hoverSegment;
          this.#selectionType = this.#hoverSelectionType;
          this.#onSelect?.(this.#selectedSegment);
          this.update();
          this.#dragging = true;
          break;
      }
      return;
    };

    canvas.onmouseup = (ev) => {
      this.#dragging = false;
    };

    network.segments.push(
      ...connectSegments(network.segments[0], true, network.segments[1], false),
    );
    this.network = new Network(this.network.segments);
    this.onNetworkChanged?.();
  }

  setNetwork(network: Network) {
    this.#hoverSegment = undefined;
    if (this.#selectedSegment) {
      const selection = this.network.segments.indexOf(this.#selectedSegment);
      this.network = network;
      this.#selectedSegment = network.segments[selection];
    } else {
      this.network = network;
    }
  }

  setStatePayload(payload: EDITOR_STATE_PAYLOADS) {
    this.statePayload = payload;
    this.onStateChanged?.(payload);
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
    const fakeSegmentsList = [...this.network.segments];
    if (
      this.statePayload.state === EDITOR_STATE.CREATE_LINEAR_SEGMENT_END &&
      this.mousePos
    ) {
      fakeSegmentsList.push(
        new LinearTrackSegment(this.statePayload.segmentStart, this.mousePos!),
      );
    }
    if (
      this.statePayload.state === EDITOR_STATE.CREATE_CONNECTION_END &&
      this.#hoverSegment &&
      (this.#hoverSelectionType === SELECTION_TYPE.START ||
        this.#hoverSelectionType === SELECTION_TYPE.END)
    ) {
      // Draw the theoretical segment
      const connection = connectSegments(
        this.statePayload.connectionSegment,
        this.statePayload.connectedAtEnd,
        this.#hoverSegment,
        this.#hoverSelectionType === SELECTION_TYPE.END,
      );
      fakeSegmentsList.push(...connection);
    }

    fakeSegmentsList.forEach((segment) => {
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

      if (
        (this.#hoverSelectionType === SELECTION_TYPE.START &&
          segment === this.#hoverSegment) ||
        (this.#selectionType === SELECTION_TYPE.START &&
          segment === this.#selectedSegment)
      ) {
        this.#context.strokeStyle = "rgba(255,255,255)";
        this.#context.lineWidth = 2;
        this.#context.beginPath();
        this.#context.arc(
          canvasPosition.x,
          canvasPosition.y,
          8,
          0,
          Math.PI * 2,
        );
        this.#context.closePath();
        this.#context.stroke();
      }

      canvasPosition = this.transformPosition(segment.end);
      this.#context.fillStyle = "rgba(200, 0, 0)";
      this.#context.beginPath();
      this.#context.arc(canvasPosition.x, canvasPosition.y, 5, 0, Math.PI * 2);
      this.#context.closePath();
      this.#context.fill();

      if (
        (this.#hoverSelectionType === SELECTION_TYPE.END &&
          segment === this.#hoverSegment) ||
        (this.#selectionType === SELECTION_TYPE.END &&
          segment === this.#selectedSegment)
      ) {
        this.#context.strokeStyle = "rgba(255,255,255)";
        this.#context.lineWidth = 2;
        this.#context.beginPath();
        this.#context.arc(
          canvasPosition.x,
          canvasPosition.y,
          8,
          0,
          Math.PI * 2,
        );
        this.#context.closePath();
        this.#context.stroke();
      }

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
    this.network.stations.forEach((station) => {
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
    const _dist = (a: Point, b: Point) =>
      Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    let closest = Infinity;
    let closestSegment: TrackSegment | undefined;
    let closestType: SELECTION_TYPE | undefined;
    this.network.segments.forEach((seg) => {
      const distanceToLine = seg.distanceToPosition(selectionPoint).distance;
      if (distanceToLine > SELECTION_DISTANCE_PIXELS) return;
      if (
        distanceToLine < closest &&
        distanceToLine < SELECTION_DISTANCE_PIXELS &&
        (!closestType || closestType === SELECTION_TYPE.SEGMENT)
      ) {
        closestSegment = seg;
        closest = distanceToLine;
        closestType = SELECTION_TYPE.SEGMENT;
      }

      const distanceToStart = _dist(seg.start, selectionPoint);
      const distanceToEnd = _dist(seg.end, selectionPoint);

      if (
        (!closestType ||
          closestType === SELECTION_TYPE.SEGMENT ||
          seg === this.#selectedSegment) &&
        distanceToStart < SELECTION_DISTANCE_PIXELS
      ) {
        closestSegment = seg;
        if (seg === this.#selectedSegment) {
          closest = -1;
        } else {
          closest = distanceToLine;
        }

        closestType = SELECTION_TYPE.START;
      }
      if (
        (!closestType ||
          closestType === SELECTION_TYPE.SEGMENT ||
          seg === this.#selectedSegment) &&
        distanceToEnd < SELECTION_DISTANCE_PIXELS
      ) {
        closestSegment = seg;
        if (seg === this.#selectedSegment) {
          closest = -1;
        } else {
          closest = distanceToLine;
        }
        closestType = SELECTION_TYPE.END;
      }
    });
    this.#hoverSegment = closestSegment;
    this.#hoverSelectionType = closestType;
  }

  update() {
    this.#context = this.#canvas.getContext("2d");
    if (!this.#context) return;

    // Render
    this.#context.clearRect(0, 0, this.#size.x, this.#size.y);
    this.drawTrackSections();
    this.drawStations();
  }

  finish() {
    document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <p id="map-holder"></p><p id="map-holder-2"></p><p id="renderCanvasHolder"></p>
  </div>
`;
    const controller = new Controller();
    this.network.autoConnect();
    const game = new Game(this.network, controller);
    game.initialize();
    const map3 = new BabylonRenderer(
      document.querySelector("#renderCanvasHolder")!,
      game,
    );
    const coordinator = new RendererCoordinator(game, [map3]);
  }
}

export default TrackEditor;
