import CircularTrackSegment from "../engine/CircularTrackSegment";
import LinearTrackSegment from "../engine/LinearTrackSegment";
import Network from "../engine/Network";
import Point from "../engine/Point";
import Station, { ALIGNMENT } from "../engine/Station";
import TrackSegment from "../engine/TrackSegment";
import { connectSegments, findCenter } from "./utils";
import Controller from "../engine/Controller";
import Game from "../engine/Game";
import BabylonRenderer from "../renderer/basic/babylon/BabylonRenderer";
import RendererCoordinator from "../renderer/RendererCoordinator";
import { getIntersection } from "../utils";

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
  SELECT = "SELECT",
  /**
   * Choose the first point for a linear track segment.
   */
  CREATE_LINEAR_SEGMENT_START = "CREATE_LINEAR_SEGMENT_START",
  /**
   * Choose the second point for a linear track segment.
   */
  CREATE_LINEAR_SEGMENT_END = "CREATE_LINEAR_SEGMENT_END",
  /**
   * Choose the first point for a linear-and-circular connection.
   */
  CREATE_CONNECTION_START = "CREATE_CONNECTION_START",
  /**
   * Choose the second point for a linear-and-circular connection.
   */
  CREATE_CONNECTION_END = "CREATE_CONNECTION_END",
  /**
   * Add a station to an existing track segment.
   */
  CREATE_STATION = "CREATE_STATION",
  /**
   * Moving a point on a track segment
   */
  MOVE_POINT = "MOVE_POINT",
  /**
   * Moving an entire track segment
   */
  MOVE_SEGMENT = "MOVE_SEGMENT",
  /**
   * Panning the view
   */
  PAN = "PAN",
}

type EDITOR_STATE_PAYLOADS =
  | {
      state: EDITOR_STATE.SELECT;
      selectedSegment?: TrackSegment;
      selectionType?: SELECTION_TYPE;
    }
  | {
      state: EDITOR_STATE.CREATE_LINEAR_SEGMENT_START;
    }
  | {
      state: EDITOR_STATE.CREATE_LINEAR_SEGMENT_END;
      segmentStart: Point;
      lockedToSegment?: TrackSegment;
      lockedToEnd?: SELECTION_TYPE.START | SELECTION_TYPE.END;
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
    }
  | {
      state: EDITOR_STATE.MOVE_POINT;
      segment: TrackSegment;
      pointType: SELECTION_TYPE.START | SELECTION_TYPE.END;
    }
  | {
      state: EDITOR_STATE.MOVE_SEGMENT;
      segment: TrackSegment;
      dragStartPoint: Point;
      originalStart: Point;
      originalEnd: Point;
      originalCenter?: Point;
    }
  | {
      state: EDITOR_STATE.PAN;
      dragStartPoint?: Point;
      originalOffset?: Point;
    };

const SELECTION_DISTANCE_PIXELS = 15;
const _dist = (a: Point, b: Point) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

class TrackEditor {
  #canvas: HTMLCanvasElement;
  network: Network;
  #offset: { x: number; y: number };
  #size: { x: number; y: number };
  #scale: number;
  #context: CanvasRenderingContext2D | null;
  #onSelect?: (segment?: TrackSegment) => void;
  onScaleChanged?: (scale: number) => void;
  /**
   * The position of the mouse on the canvas itself.
   */
  mousePos?: { x: number; y: number };
  #hoverSegment?: TrackSegment;
  #hoverSelectionType?: SELECTION_TYPE;
  currentStateWithData: EDITOR_STATE_PAYLOADS = {
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
    this.#size = size || { x: 1200, y: 800 };
    const canvas = document.createElement("canvas");
    canvas.width = this.#size.x;
    canvas.height = this.#size.y;
    canvas.style.background = "black";
    element.appendChild(canvas);
    this.#canvas = canvas;
    this.#context = canvas.getContext("2d");
    this.network = network;
    this.#onSelect = onSelect;

    document.body.onkeydown = (ev) => {
      if (
        this.currentStateWithData.state === EDITOR_STATE.SELECT &&
        this.currentStateWithData.selectedSegment &&
        (ev.key === "Backspace" || ev.key === "Delete")
      ) {
        this.deleteSegment(this.currentStateWithData.selectedSegment);
      }
    };

    canvas.onmousemove = (ev) => {
      this.mousePos = { x: ev.offsetX, y: ev.offsetY };
      const gamePosition = this.untransformPosition(this.mousePos);

      if (this.currentStateWithData.state === EDITOR_STATE.SELECT) {
        this.updateHoverState();
        this.update();
        return;
      }

      switch (this.currentStateWithData.state) {
        case EDITOR_STATE.PAN: {
          const { dragStartPoint, originalOffset } = this.currentStateWithData;
          if (!dragStartPoint || !originalOffset) return;
          
          const dragVector = {
            x: this.mousePos!.x - dragStartPoint.x,
            y: this.mousePos!.y - dragStartPoint.y,
          };
          
          // Convert screen drag vector to game coordinates by just dividing by scale
          const dragVectorGamePosition = {
            x: dragVector.x / this.#scale,
            y: dragVector.y / this.#scale,
          };
          
          this.#offset = {
            x: originalOffset.x + dragVectorGamePosition.x,
            y: originalOffset.y + dragVectorGamePosition.y,
          };
          
          this.update();
          break;
        }

        case EDITOR_STATE.MOVE_POINT: {
          const { segment, pointType } = this.currentStateWithData;
          const canMoveStart = segment.atStart.length === 0;
          const canMoveEnd = segment.atEnd.length === 0;

          if (pointType === SELECTION_TYPE.START && !canMoveStart) return;
          if (pointType === SELECTION_TYPE.END && !canMoveEnd) return;

          const selectedPoint = pointType === SELECTION_TYPE.START ? segment.start : segment.end;

          if (segment instanceof LinearTrackSegment) {
            if (canMoveStart && canMoveEnd) {
              selectedPoint.x = gamePosition.x;
              selectedPoint.y = gamePosition.y;
            } else {
              const line1 = { x1: segment.start.x, y1: segment.start.y, x2: segment.end.x, y2: segment.end.y };
              const angle = Math.atan2(line1.y2 - line1.y1, line1.x2 - line1.x1);
              const perpendicularAngle = angle + Math.PI / 2;
              const line2 = { x1: gamePosition.x, y1: gamePosition.y, x2: gamePosition.x + Math.cos(perpendicularAngle), y2: gamePosition.y + Math.sin(perpendicularAngle) };
              const intersection = getIntersection(line1, line2);
              if (intersection) {
                selectedPoint.x = intersection.x;
                selectedPoint.y = intersection.y;
              }
            }
          } else if (segment instanceof CircularTrackSegment) {
            if (canMoveStart && canMoveEnd) {
              let newCenter;
              if (pointType === SELECTION_TYPE.START) {
                newCenter = findCenter(
                  gamePosition,
                  segment.end,
                  segment.theta,
                  segment.counterClockWise,
                );
              } else {
                newCenter = findCenter(
                  segment.start,
                  gamePosition,
                  segment.theta,
                  segment.counterClockWise,
                );
              }
              selectedPoint.x = gamePosition.x;
              selectedPoint.y = gamePosition.y;
              segment.center.x = newCenter.x;
              segment.center.y = newCenter.y;
            }
          }
          this.dispatchUpdate();
          break;
        }

        case EDITOR_STATE.MOVE_SEGMENT: {
          const { segment, dragStartPoint, originalStart, originalEnd, originalCenter } = this.currentStateWithData;
          const gamePosition = this.untransformPosition(this.mousePos);
          const dragVector = {
            x: gamePosition.x - dragStartPoint.x,
            y: gamePosition.y - dragStartPoint.y,
          };
          
          segment.start.x = originalStart.x + dragVector.x;
          segment.start.y = originalStart.y + dragVector.y;
          segment.end.x = originalEnd.x + dragVector.x;
          segment.end.y = originalEnd.y + dragVector.y;
          
          if (segment instanceof CircularTrackSegment && originalCenter) {
            segment.center.x = originalCenter.x + dragVector.x;
            segment.center.y = originalCenter.y + dragVector.y;
          }
          
          this.dispatchUpdate();
          break;
        }

        default:
          this.updateHoverState();
          this.update();
          break;
      }
    };

    canvas.onmousedown = () => {
      if (!this.mousePos) return;
      const gamePosition = this.untransformPosition(this.mousePos);
      
      switch (this.currentStateWithData.state) {
        case EDITOR_STATE.SELECT:
          if (this.#hoverSegment) {
            this.#onSelect?.(this.#hoverSegment);
            this.update();

            if (this.#hoverSelectionType === SELECTION_TYPE.SEGMENT) {
              // Only allow moving segments with no connections
              const canMoveSegment = this.#hoverSegment.atStart.length === 0 && this.#hoverSegment.atEnd.length === 0;
              if (canMoveSegment) {
                const gamePosition = this.untransformPosition(this.mousePos);
                this.setcurrentStateWithData({
                  state: EDITOR_STATE.MOVE_SEGMENT,
                  segment: this.#hoverSegment,
                  dragStartPoint: gamePosition,
                  originalStart: {...this.#hoverSegment.start},
                  originalEnd: {...this.#hoverSegment.end},
                  originalCenter: this.#hoverSegment instanceof CircularTrackSegment ? {...this.#hoverSegment.center} : undefined,
                });
              } else {
                // Just select it if we can't move it
                this.setcurrentStateWithData({
                  state: EDITOR_STATE.SELECT,
                  selectedSegment: this.#hoverSegment,
                  selectionType: this.#hoverSelectionType,
                });
              }
            } else if (this.#hoverSelectionType === SELECTION_TYPE.START || this.#hoverSelectionType === SELECTION_TYPE.END) {
              this.setcurrentStateWithData({
                state: EDITOR_STATE.MOVE_POINT,
                segment: this.#hoverSegment,
                pointType: this.#hoverSelectionType,
              });
            } else {
              this.setcurrentStateWithData({
                state: EDITOR_STATE.SELECT,
                selectedSegment: this.#hoverSegment,
                selectionType: this.#hoverSelectionType,
              });
            }
          } else {
            // Clicked on nothing - start panning
            this.setcurrentStateWithData({
              state: EDITOR_STATE.PAN,
              dragStartPoint: this.mousePos,
              originalOffset: { ...this.#offset },
            });
            this.#canvas.style.cursor = "grabbing";
          }
          break;

        case EDITOR_STATE.CREATE_LINEAR_SEGMENT_START:
          const isLockedToSegment = this.#hoverSegment && this.#hoverSelectionType !== SELECTION_TYPE.SEGMENT;
          this.setcurrentStateWithData({
            state: EDITOR_STATE.CREATE_LINEAR_SEGMENT_END,
            lockedToSegment: isLockedToSegment ? this.#hoverSegment : undefined,
            lockedToEnd: isLockedToSegment ? this.#hoverSelectionType === SELECTION_TYPE.END ? SELECTION_TYPE.END : SELECTION_TYPE.START : undefined,
            segmentStart: {
              x: isLockedToSegment ? this.#hoverSelectionType === SELECTION_TYPE.START ? this.#hoverSegment!.start.x : this.#hoverSegment!.end.x : gamePosition.x,
              y: isLockedToSegment ? this.#hoverSelectionType === SELECTION_TYPE.START ? this.#hoverSegment!.start.y : this.#hoverSegment!.end.y : gamePosition.y,
            },
          });
          break;

        case EDITOR_STATE.CREATE_LINEAR_SEGMENT_END:
          const previewSegment = new LinearTrackSegment(this.currentStateWithData.segmentStart, gamePosition);

          // If we're locked to a segment, constrain the angle
          if (this.currentStateWithData.lockedToSegment && this.currentStateWithData.lockedToEnd) {
            const lockedSegment = this.currentStateWithData.lockedToSegment;
            const angle = this.currentStateWithData.lockedToEnd === SELECTION_TYPE.START ? 
              lockedSegment.initialAngle + Math.PI : 
              lockedSegment.finalAngle;
            
            // Calculate the distance from the start point to the mouse
            const dx = gamePosition.x - this.currentStateWithData.segmentStart.x;
            const dy = gamePosition.y - this.currentStateWithData.segmentStart.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Set the end point using the locked angle and calculated distance
            previewSegment.end.x = this.currentStateWithData.segmentStart.x + Math.cos(angle) * distance;
            previewSegment.end.y = this.currentStateWithData.segmentStart.y + Math.sin(angle) * distance;
          }

          this.network.segments.push(previewSegment);
          this.dispatchUpdate();
          this.setcurrentStateWithData({
            state: EDITOR_STATE.SELECT,
          });
          break;

        case EDITOR_STATE.CREATE_CONNECTION_START:
          if (
            this.#hoverSegment &&
            (this.#hoverSelectionType === SELECTION_TYPE.START ||
              this.#hoverSelectionType === SELECTION_TYPE.END)
          ) {
            this.setcurrentStateWithData({
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
              this.currentStateWithData.connectionSegment,
              this.currentStateWithData.connectedAtEnd,
              this.#hoverSegment,
              this.#hoverSelectionType === SELECTION_TYPE.END,
            );

            newSegments[0].connect(this.currentStateWithData.connectionSegment);
            newSegments[0].connect(this.#hoverSegment);
            if (newSegments[1]) {
              newSegments[0].connect(newSegments[1]);
              newSegments[1].connect(this.#hoverSegment);
              newSegments[1].connect(this.currentStateWithData.connectionSegment);
            }
            this.network.segments.push(...newSegments);
            this.dispatchUpdate();

            this.setcurrentStateWithData({
              state: EDITOR_STATE.SELECT,
            });
          } else if (this.#hoverSegment) {
            this.setcurrentStateWithData({
              state: EDITOR_STATE.SELECT,
              selectedSegment: this.#hoverSegment,
              selectionType: this.#hoverSelectionType,
            });
          }
          break;

        case EDITOR_STATE.CREATE_STATION:
          if (!this.#hoverSegment) break;
          if (!this.mousePos) break;
          const stationGamePosition = this.untransformPosition(this.mousePos);
          const closestPoint = this.#hoverSegment.distanceToPosition({
            x: stationGamePosition.x,
            y: stationGamePosition.y,
          });
          const newStation = new Station(
            this.#hoverSegment,
            closestPoint.distanceAlong * this.#hoverSegment.length,
            closestPoint.alignment,
          );
          this.network.stations.push(newStation);
          this.#hoverSegment.stations.push(newStation);
          this.dispatchUpdate();
          break;
      }
      return;
    };

    canvas.onmouseup = () => {
      if (this.currentStateWithData.state === EDITOR_STATE.MOVE_POINT || 
          this.currentStateWithData.state === EDITOR_STATE.MOVE_SEGMENT) {
        this.setcurrentStateWithData({
          state: EDITOR_STATE.SELECT,
          selectedSegment: this.currentStateWithData.segment,
          selectionType: this.currentStateWithData.state === EDITOR_STATE.MOVE_POINT ? 
            this.currentStateWithData.pointType : 
            SELECTION_TYPE.SEGMENT,
        });
      } else if (this.currentStateWithData.state === EDITOR_STATE.PAN) {
        this.setcurrentStateWithData({
          state: EDITOR_STATE.SELECT,
        });
        this.#canvas.style.cursor = "default";
      }
    };

    canvas.onwheel = (ev) => {
      // Prevent the default scroll behavior
      ev.preventDefault();
      
      // Adjust scale based on wheel delta
      // Negative delta means scroll up/zoom in, positive means scroll down/zoom out
      this.adjustScale(-ev.deltaY * 0.001);
    };

    this.dispatchUpdate();
  }

  deleteSegment(segment: TrackSegment) {
    const selectedSegment = segment;
        this.#onSelect?.();
        selectedSegment.stations.forEach((station) => {
          this.network.stations.splice(this.network.stations.indexOf(station));
        });
        this.network.segments.splice(
          this.network.segments.indexOf(selectedSegment),
          1,
        );
        this.network.segments.forEach((segment) => {
          if (
            segment.atStart.indexOf(selectedSegment) > -1
          ) {
            segment.atStart.splice(
              segment.atStart.indexOf(selectedSegment),
              1,
            );
          }
          if (
            segment.atEnd.indexOf(selectedSegment) > -1
          ) {
            segment.atEnd.splice(
              segment.atEnd.indexOf(selectedSegment),
              1,
            );
          }
        });
        this.setcurrentStateWithData({
          state: EDITOR_STATE.SELECT,
        });
        this.dispatchUpdate();
  }

  /**
   * After this editor makes a change, make sure everything is updated.
   */
  dispatchUpdate() {
    this.network = new Network(
      this.network.segments,
      this.network.stations,
    );
    this.network.autoConnect();
    this.onNetworkChanged?.();
    this.update();
  }

  /**
   * Automatically scale and offset the canvas to fit the network.
   */
  autoScaleAndOffset() {
    const gameBounds = this.network.getBounds();

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

  setNetwork(network: Network) {
    this.#hoverSegment = undefined;
    if (this.currentStateWithData.state === EDITOR_STATE.SELECT && this.currentStateWithData.selectedSegment) {
      const selection = this.network.segments.indexOf(this.currentStateWithData.selectedSegment);
      this.network = network;
      this.setcurrentStateWithData({
        state: EDITOR_STATE.SELECT,
        selectedSegment: network.segments[selection],
        selectionType: this.currentStateWithData.selectionType,
      });
    } else {
      this.network = network;
    }
  }

  setcurrentStateWithData(payload: EDITOR_STATE_PAYLOADS) {
    console.log("setting state", payload);
    const wasSelect = this.currentStateWithData.state === EDITOR_STATE.SELECT;
    const isSelect = payload.state === EDITOR_STATE.SELECT;
    
    this.currentStateWithData = payload;
    if (payload.state === EDITOR_STATE.PAN) {
      this.#canvas.style.cursor = "grab";
    } else {
      this.#canvas.style.cursor = "default";
    }
    
    // Call onSelect when entering or exiting SELECT state
    if (wasSelect !== isSelect || (isSelect && 
        'selectedSegment' in payload && 
        'selectedSegment' in this.currentStateWithData && 
        payload.selectedSegment !== this.currentStateWithData.selectedSegment)) {
      this.#onSelect?.(isSelect && 'selectedSegment' in payload ? payload.selectedSegment : undefined);
    }
    this.update();
    
    this.onStateChanged?.(payload);
  }

  setScale(scale: number) {
    this.adjustScale(scale - this.#scale);
  }

  adjustScale(delta: number) {
    const oldScale = this.#scale;
    this.#scale = Math.max(0.25, this.#scale + delta);
    
    // If we have a mouse position within the canvas, use that as the zoom center
    let zoomCenter;
    if (this.mousePos && 
        this.mousePos.x >= 0 && this.mousePos.x <= this.#size.x &&
        this.mousePos.y >= 0 && this.mousePos.y <= this.#size.y) {
      // Convert mouse position to game coordinates
      zoomCenter = this.untransformPosition(this.mousePos);
    } else {
      // Use view center if mouse is outside canvas
      zoomCenter = {
        x: (this.#size.x / 2 / oldScale) - this.#offset.x,
        y: (this.#size.y / 2 / oldScale) - this.#offset.y,
      };
    }
    
    // Calculate how much the point moves due to scale change
    const scaleFactor = this.#scale / oldScale;
    const dx = (zoomCenter.x + this.#offset.x) * (1 - scaleFactor);
    const dy = (zoomCenter.y + this.#offset.y) * (1 - scaleFactor);
    
    // Adjust offset to keep the zoom center point fixed
    this.#offset = {
      x: this.#offset.x + dx,
      y: this.#offset.y + dy,
    };
    
    this.onScaleChanged?.(this.#scale);
    this.update();
  }

  /**
   * Transform a point from the game world to the canvas.
   */
  transformPosition(p: Point): Point {
    return {
      x: (p.x + this.#offset.x) * this.#scale,
      y: (p.y + this.#offset.y) * this.#scale,
    };
  }

  /**
   * Transform a point from the canvas to the game world.
   */
  untransformPosition(p: Point): Point {
    const result = {
      x: p.x / this.#scale - this.#offset.x,
      y: p.y / this.#scale - this.#offset.y,
    };
    return result;
  }

  /**
   * Draw the track sections, including the segment that is being created.
   */
  drawTrackSections() {
    if (!this.#context) return;
    this.#context.lineWidth = 2;
    const fakeSegmentsList = [...this.network.segments];
    if (
      this.currentStateWithData.state === EDITOR_STATE.CREATE_LINEAR_SEGMENT_END &&
      this.mousePos
    ) {
      const gamePosition = this.untransformPosition(this.mousePos);
      const previewSegment = new LinearTrackSegment(this.currentStateWithData.segmentStart, gamePosition);

      // If we're locked to a segment, constrain the angle
      if (this.currentStateWithData.lockedToSegment && this.currentStateWithData.lockedToEnd) {
        const lockedSegment = this.currentStateWithData.lockedToSegment;
        const angle = this.currentStateWithData.lockedToEnd === SELECTION_TYPE.START ? 
          lockedSegment.initialAngle + Math.PI : 
          lockedSegment.finalAngle;
        
        // Calculate the distance from the start point to the mouse
        const dx = gamePosition.x - this.currentStateWithData.segmentStart.x;
        const dy = gamePosition.y - this.currentStateWithData.segmentStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Set the end point using the locked angle and calculated distance
        previewSegment.end.x = this.currentStateWithData.segmentStart.x + Math.cos(angle) * distance;
        previewSegment.end.y = this.currentStateWithData.segmentStart.y + Math.sin(angle) * distance;
      }

      fakeSegmentsList.push(previewSegment);
    }
    if (
      this.currentStateWithData.state === EDITOR_STATE.CREATE_CONNECTION_END &&
      this.#hoverSegment &&
      (this.#hoverSelectionType === SELECTION_TYPE.START ||
        this.#hoverSelectionType === SELECTION_TYPE.END)
    ) {
      // Draw the theoretical segment
      const connection = connectSegments(
        this.currentStateWithData.connectionSegment,
        this.currentStateWithData.connectedAtEnd,
        this.#hoverSegment,
        this.#hoverSelectionType === SELECTION_TYPE.END,
      );
      fakeSegmentsList.push(...connection);
    }

    fakeSegmentsList.forEach((segment) => {
      if (!this.#context) return;
      if (this.currentStateWithData.state === EDITOR_STATE.SELECT && 
          segment === this.currentStateWithData.selectedSegment) {
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

      // Draw endpoint dots
      this.#drawEndpointDot(segment.start);
      this.#drawEndpointDot(segment.end);

      // Draw endpoint highlight rings if needed
      if (
        (this.#hoverSelectionType === SELECTION_TYPE.START && segment === this.#hoverSegment) ||
        (this.currentStateWithData.state === EDITOR_STATE.SELECT &&
          this.currentStateWithData.selectionType === SELECTION_TYPE.START &&
          segment === this.currentStateWithData.selectedSegment)
      ) {
        this.#drawEndpointHighlight(segment.start);
      }
      if (
        (this.#hoverSelectionType === SELECTION_TYPE.END && segment === this.#hoverSegment) ||
        (this.currentStateWithData.state === EDITOR_STATE.SELECT &&
          this.currentStateWithData.selectionType === SELECTION_TYPE.END &&
          segment === this.currentStateWithData.selectedSegment)
      ) {
        this.#drawEndpointHighlight(segment.end);
      }

      // Draw arrow in the middle
      this.#drawArrowInMiddle(segment);

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

      this.#context.closePath();
      this.#context.fill();
    });
  }

  drawStations() {
    const fakeStationsList = [...this.network.stations];
    if (
      this.currentStateWithData.state === EDITOR_STATE.CREATE_STATION &&
      this.mousePos &&
      this.#hoverSegment
    ) {
      const gamePosition = this.untransformPosition(this.mousePos);
      const closestPoint = this.#hoverSegment?.distanceToPosition({
        x: gamePosition.x,
        y: gamePosition.y,
      });
      fakeStationsList.push(
        new Station(
          this.#hoverSegment,
          closestPoint.distanceAlong * this.#hoverSegment.length,
          closestPoint.alignment,
        ),
      );
    }
    fakeStationsList.forEach((station) => {
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

      targetPosition.x += Math.cos(angleFromForward) * 8 / this.#scale;
      targetPosition.y += Math.sin(angleFromForward) * 8 / this.#scale;
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

  /**
   * For the current mouse position, find the closest segment and which part of it is closest.
   */
  updateHoverState() {
    if (!this.mousePos) return;

    const gameSelectionDistance = SELECTION_DISTANCE_PIXELS / this.#scale;
    const gamePosition = this.untransformPosition(this.mousePos);
    let closest = Infinity;
    let closestSegment: TrackSegment | undefined;
    let closestType: SELECTION_TYPE | undefined;
    this.network.segments.forEach((seg) => {
      const distanceToLine = seg.distanceToPosition(gamePosition).distance;
      if (distanceToLine > gameSelectionDistance) return;
      if (
        distanceToLine < closest &&
        distanceToLine < gameSelectionDistance &&
        (!closestType || closestType === SELECTION_TYPE.SEGMENT)
      ) {
        closestSegment = seg;
        closest = distanceToLine;
        closestType = SELECTION_TYPE.SEGMENT;
      }

      const distanceToStart = _dist(seg.start, gamePosition);
      const distanceToEnd = _dist(seg.end, gamePosition);

      if (
        (!closestType ||
          closestType === SELECTION_TYPE.SEGMENT ||
          ((this.currentStateWithData.state === EDITOR_STATE.SELECT && seg === this.currentStateWithData.selectedSegment) || seg === this.#hoverSegment)) &&
        distanceToStart < gameSelectionDistance
      ) {
        closestSegment = seg;
        if ((this.currentStateWithData.state === EDITOR_STATE.SELECT && seg === this.currentStateWithData.selectedSegment) || seg === this.#hoverSegment) {
          closest = -1;
        } else {
          closest = distanceToLine;
        }

        closestType = SELECTION_TYPE.START;
      }
      if (
        (!closestType ||
          closestType === SELECTION_TYPE.SEGMENT ||
          ((this.currentStateWithData.state === EDITOR_STATE.SELECT && seg === this.currentStateWithData.selectedSegment) || seg === this.#hoverSegment)) &&
        distanceToEnd < gameSelectionDistance
      ) {
        closestSegment = seg;
        if ((this.currentStateWithData.state === EDITOR_STATE.SELECT && seg === this.currentStateWithData.selectedSegment) || seg === this.#hoverSegment) {
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

  /**
   * Redraw the editor canvas.
   */
  update() {
    this.#context = this.#canvas.getContext("2d");
    if (!this.#context) return;

    // Render
    this.#context.clearRect(0, 0, this.#size.x, this.#size.y);
    this.#drawGridLines(100);
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

  // --- Drawing helpers ---
  #drawEndpointDot(point: Point) {
    if (!this.#context) return;
    const canvasPosition = this.transformPosition(point);
    this.#context.fillStyle = "rgb(100, 100, 255)";
    this.#context.beginPath();
    this.#context.arc(canvasPosition.x, canvasPosition.y, 5, 0, Math.PI * 2);
    this.#context.closePath();
    this.#context.fill();
  }

  #drawEndpointHighlight(point: Point) {
    if (!this.#context) return;
    const canvasPosition = this.transformPosition(point);
    this.#context.strokeStyle = "rgba(255,255,255)";
    this.#context.lineWidth = 2;
    this.#context.beginPath();
    this.#context.arc(canvasPosition.x, canvasPosition.y, 8, 0, Math.PI * 2);
    this.#context.closePath();
    this.#context.stroke();
  }

  #drawArrowInMiddle(segment: TrackSegment) {
    if (!this.#context) return;
    const mid = segment.length / 2;
    const canvasPosition = this.transformPosition(segment.getPositionAlong(mid).point);
    const angle = segment.getAngleAlong(mid) + Math.PI;
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
  }

  #drawRedX(segment: TrackSegment, distanceAlong: number, angle: number) {
    if (!this.#context) return;
    const pos = segment.getPositionAlong(distanceAlong).point;
    const canvasPos = this.transformPosition(pos);
    const size = 10;
    this.#context.save();
    this.#context.translate(canvasPos.x, canvasPos.y);
    this.#context.rotate(angle);
    this.#context.strokeStyle = "#e11d48"; // Tailwind red-600
    this.#context.lineWidth = 3;
    this.#context.beginPath();
    this.#context.moveTo(-size / 2, -size / 2);
    this.#context.lineTo(size / 2, size / 2);
    this.#context.moveTo(size / 2, -size / 2);
    this.#context.lineTo(-size / 2, size / 2);
    this.#context.stroke();
    this.#context.restore();
  }

  #drawGridLines(interval: number) {
    if (!this.#context) return;
    
    const scaledInterval = interval * this.#scale;
    this.#context.strokeStyle = "rgba(255, 255, 255, 0.2)";
    this.#context.lineWidth = 1;
    this.#context.beginPath();
    for (let x = ((this.#offset.x * this.#scale) % scaledInterval) - scaledInterval; x < this.#size.x; x += scaledInterval) {
      this.#context.moveTo(x, 0);
      this.#context.lineTo(x, this.#size.y);
    }
    for (let y = ((this.#offset.y * this.#scale) % scaledInterval) - scaledInterval; y < this.#size.y; y += scaledInterval) {
      this.#context.moveTo(0, y);
      this.#context.lineTo(this.#size.x, y);
    }
    this.#context.stroke();
  }
}

export default TrackEditor;
