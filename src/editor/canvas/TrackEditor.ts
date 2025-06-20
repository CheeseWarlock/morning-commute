import CircularTrackSegment from "../../engine/CircularTrackSegment";
import LinearTrackSegment from "../../engine/LinearTrackSegment";
import Network from "../../engine/Network";
import Station, { ALIGNMENT } from "../../engine/Station";
import TrackSegment from "../../engine/TrackSegment";
import {
  connectSegments,
  findCenter,
  calculateCircularCenter,
  calculateConstrainedCircleCenter,
} from "../utils";
import { getIntersection, generateName } from "../../utils";
import { UndoableActionManager, UndoableAction } from "./UndoableActionStack";
import TrackEditorCanvas from "./TrackEditorCanvas";

/**
 * The vague concept of a point.
 */
type Point = {
  x: number;
  y: number;
};

declare const __brand: unique symbol;
type Brand<B> = { [__brand]: B };

export type Branded<T, B> = T & Brand<B>;

/**
 * A point in screen coordinates.
 */
export type ScreenPoint = Branded<Point, "ScreenPoint">;
/**
 * A point in 2d game world coordinates.
 */
export type GamePoint = Branded<Point, "GamePoint">;

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
   * Choose the first point for a circular track segment.
   */
  CREATE_CIRCULAR_SEGMENT_START = "CREATE_CIRCULAR_SEGMENT_START",
  /**
   * Choose the second point for a circular track segment.
   */
  CREATE_CIRCULAR_SEGMENT_END = "CREATE_CIRCULAR_SEGMENT_END",
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
  /**
   * Querying a point for all segments
   */
  QUERY_POINT = "QUERY_POINT",
  /**
   * Drag selecting multiple segments
   */
  DRAG_SELECT = "DRAG_SELECT",
  /**
   * Selecting multiple segments
   */
  MULTI_SELECT = "MULTI_SELECT",
  /**
   * Adding a train start position
   */
  SET_START_POSITION = "SET_START_POSITION",
  /**
   * Splitting a track segment into two segments
   */
  SPLIT = "SPLIT",
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
      segmentStart: GamePoint;
      lockedToSegment?: TrackSegment;
      lockedToEnd?: SELECTION_TYPE.START | SELECTION_TYPE.END;
    }
  | {
      state: EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_START;
      counterClockwise: boolean;
      angle: number;
    }
  | {
      state: EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_END;
      segmentStart: GamePoint;
      lockedToSegment?: TrackSegment;
      lockedToEnd?: SELECTION_TYPE.START | SELECTION_TYPE.END;
      counterClockwise: boolean;
      angle: number;
      startAngle?: number;
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
      dragStartPoint: GamePoint;
      originalPoint: GamePoint;
      originalCenter?: GamePoint;
    }
  | {
      state: EDITOR_STATE.MOVE_SEGMENT;
      segment: TrackSegment;
      dragStartPoint: GamePoint;
      originalStart: GamePoint;
      originalEnd: GamePoint;
      originalCenter?: GamePoint;
    }
  | {
      state: EDITOR_STATE.PAN;
      dragStartPoint?: ScreenPoint;
      originalOffset?: ScreenPoint;
    }
  | {
      state: EDITOR_STATE.QUERY_POINT;
    }
  | {
      state: EDITOR_STATE.MULTI_SELECT;
      selectedSegments: TrackSegment[];
    }
  | {
      state: EDITOR_STATE.DRAG_SELECT;
      dragStartPoint?: GamePoint;
    }
  | {
      state: EDITOR_STATE.SET_START_POSITION;
    }
  | {
      state: EDITOR_STATE.SPLIT;
    };

const SELECTION_DISTANCE_PIXELS = 15;
const _dist = (a: GamePoint, b: GamePoint) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

class TrackEditor {
  network: Network;
  /**
   * The offset of the canvas in screen coordinates.
   */
  offset: ScreenPoint;
  /**
   * The size of the canvas in screen coordinates.
   */
  size: ScreenPoint;
  scale: number;
  #onSelect?: (segment?: TrackSegment) => void;
  onScaleChanged?: (scale: number) => void;
  /**
   * The position of the mouse on the canvas itself.
   */
  mousePos?: ScreenPoint;
  hoverSegment?: TrackSegment;
  hoverSelectionType?: SELECTION_TYPE;
  currentStateWithData: EDITOR_STATE_PAYLOADS = {
    state: EDITOR_STATE.SELECT,
  };
  onStateChanged?: (payload: EDITOR_STATE_PAYLOADS) => void;
  onNetworkChanged?: () => void;

  #undoableActionManager = new UndoableActionManager();
  #trackEditorCanvas: TrackEditorCanvas;

  /**
   * The segment that is being created that is not yet added to the network.
   */
  ghostSegments: TrackSegment[] = [];
  /**
   * The station that is being created that is not yet added to the network.
   */
  ghostStation?: Station;

  constructor(options: {
    element: HTMLElement;
    network: Network;
    offset?: ScreenPoint;
    scale?: number;
    size?: ScreenPoint;
    onSelect: (segment?: TrackSegment) => void;
  }) {
    const { element, network, offset, scale, size, onSelect } = options;
    this.offset = offset || ({ x: 0, y: 0 } as ScreenPoint);
    this.scale = scale || 1;
    this.size = size || ({ x: 1200, y: 800 } as ScreenPoint);

    this.#trackEditorCanvas = new TrackEditorCanvas(element, this, this.size);

    this.network = network;
    this.#onSelect = onSelect;

    this.#trackEditorCanvas.canvas.onmousemove = (ev) => {
      this.mousePos = { x: ev.offsetX, y: ev.offsetY } as ScreenPoint;
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
            x: dragVector.x / this.scale,
            y: dragVector.y / this.scale,
          };

          this.offset = {
            x: originalOffset.x + dragVectorGamePosition.x,
            y: originalOffset.y + dragVectorGamePosition.y,
          } as ScreenPoint;

          this.update();
          break;
        }

        case EDITOR_STATE.MOVE_POINT: {
          const { segment, pointType } = this.currentStateWithData;
          const canMoveStart = segment.atStart.length === 0;
          const canMoveEnd = segment.atEnd.length === 0;

          if (pointType === SELECTION_TYPE.START && !canMoveStart) return;
          if (pointType === SELECTION_TYPE.END && !canMoveEnd) return;

          const selectedPoint =
            pointType === SELECTION_TYPE.START ? segment.start : segment.end;

          if (segment instanceof LinearTrackSegment) {
            if (canMoveStart && canMoveEnd) {
              selectedPoint.x = gamePosition.x;
              selectedPoint.y = gamePosition.y;
            } else {
              const line1 = {
                x1: segment.start.x,
                y1: segment.start.y,
                x2: segment.end.x,
                y2: segment.end.y,
              };
              const angle = Math.atan2(
                line1.y2 - line1.y1,
                line1.x2 - line1.x1,
              );
              const perpendicularAngle = angle + Math.PI / 2;
              const line2 = {
                x1: gamePosition.x,
                y1: gamePosition.y,
                x2: gamePosition.x + Math.cos(perpendicularAngle),
                y2: gamePosition.y + Math.sin(perpendicularAngle),
              };
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
          const {
            segment,
            dragStartPoint,
            originalStart,
            originalEnd,
            originalCenter,
          } = this.currentStateWithData;
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

    this.#trackEditorCanvas.canvas.onmousedown = () => {
      if (!this.mousePos) return;
      const gamePosition = this.untransformPosition(this.mousePos);

      switch (this.currentStateWithData.state) {
        case EDITOR_STATE.SELECT: {
          if (this.hoverSegment) {
            this.#onSelect?.(this.hoverSegment);
            this.update();

            if (this.hoverSelectionType === SELECTION_TYPE.SEGMENT) {
              // Only allow moving segments with no connections
              const canMoveSegment =
                this.hoverSegment.atStart.length === 0 &&
                this.hoverSegment.atEnd.length === 0;
              if (canMoveSegment) {
                const gamePosition = this.untransformPosition(this.mousePos);
                this.setcurrentStateWithData({
                  state: EDITOR_STATE.MOVE_SEGMENT,
                  segment: this.hoverSegment,
                  dragStartPoint: gamePosition,
                  originalStart: { ...this.hoverSegment.start } as GamePoint,
                  originalEnd: { ...this.hoverSegment.end } as GamePoint,
                  originalCenter:
                    this.hoverSegment instanceof CircularTrackSegment
                      ? ({ ...this.hoverSegment.center } as GamePoint)
                      : undefined,
                });
              } else {
                // Just select it if we can't move it
                this.setcurrentStateWithData({
                  state: EDITOR_STATE.SELECT,
                  selectedSegment: this.hoverSegment,
                  selectionType: this.hoverSelectionType,
                });
              }
            } else if (
              this.hoverSelectionType === SELECTION_TYPE.START ||
              this.hoverSelectionType === SELECTION_TYPE.END
            ) {
              const selectedPoint =
                this.hoverSelectionType === SELECTION_TYPE.START
                  ? this.hoverSegment!.start
                  : this.hoverSegment!.end;

              this.setcurrentStateWithData({
                state: EDITOR_STATE.MOVE_POINT,
                segment: this.hoverSegment,
                pointType: this.hoverSelectionType,
                dragStartPoint: gamePosition,
                originalPoint: { ...selectedPoint } as GamePoint,
                originalCenter:
                  this.hoverSegment instanceof CircularTrackSegment
                    ? ({ ...this.hoverSegment.center } as GamePoint)
                    : undefined,
              });
            } else {
              this.setcurrentStateWithData({
                state: EDITOR_STATE.SELECT,
                selectedSegment: this.hoverSegment,
                selectionType: this.hoverSelectionType,
              });
            }
          } else {
            // Clicked on nothing - start panning
            this.setcurrentStateWithData({
              state: EDITOR_STATE.PAN,
              dragStartPoint: this.mousePos,
              originalOffset: { ...this.offset },
            });
            this.#trackEditorCanvas.canvas.style.cursor = "grabbing";
          }
          break;
        }
        case EDITOR_STATE.CREATE_LINEAR_SEGMENT_START: {
          const isLockedToSegment =
            this.hoverSegment &&
            this.hoverSelectionType !== SELECTION_TYPE.SEGMENT;
          this.setcurrentStateWithData({
            state: EDITOR_STATE.CREATE_LINEAR_SEGMENT_END,
            lockedToSegment: isLockedToSegment ? this.hoverSegment : undefined,
            lockedToEnd: isLockedToSegment
              ? this.hoverSelectionType === SELECTION_TYPE.END
                ? SELECTION_TYPE.END
                : SELECTION_TYPE.START
              : undefined,
            segmentStart: {
              x: isLockedToSegment
                ? this.hoverSelectionType === SELECTION_TYPE.START
                  ? this.hoverSegment!.start.x
                  : this.hoverSegment!.end.x
                : gamePosition.x,
              y: isLockedToSegment
                ? this.hoverSelectionType === SELECTION_TYPE.START
                  ? this.hoverSegment!.start.y
                  : this.hoverSegment!.end.y
                : gamePosition.y,
            } as GamePoint,
          });
          break;
        }

        case EDITOR_STATE.CREATE_LINEAR_SEGMENT_END: {
          let gamePosition;
          if (
            this.hoverSelectionType === SELECTION_TYPE.START ||
            this.hoverSelectionType === SELECTION_TYPE.END
          ) {
            // Let's try and lock tu ah
            const lockPoint =
              this.hoverSelectionType === SELECTION_TYPE.START
                ? this.hoverSegment!.start
                : this.hoverSegment!.end;
            gamePosition = lockPoint as GamePoint;
          } else {
            // just use the current mouse position
            gamePosition = this.untransformPosition(this.mousePos!);
          }
          const { endPosition } =
            this.#calculateLinearSegmentParams(gamePosition);
          const newSegment = new LinearTrackSegment(
            this.currentStateWithData.segmentStart,
            endPosition,
          );

          const segmentsToConnectTo = [
            this.currentStateWithData.lockedToSegment,
            this.hoverSegment,
          ].filter(Boolean) as TrackSegment[];

          // Create undoable action for creating a linear segment
          const undoableAction: UndoableAction = {
            name: "Create Linear Segment",
            doAction: () => {
              // Connect the segment if we started from a segment
              segmentsToConnectTo.forEach((segment) => {
                newSegment.connect(segment);
              });

              this.network.segments.push(newSegment);
              this.dispatchUpdate();
            },
            undoAction: () => {
              newSegment.disconnectAll(true);
              // Remove the segment from the network
              const segmentIndex = this.network.segments.indexOf(newSegment);
              if (segmentIndex > -1) {
                this.network.segments.splice(segmentIndex, 1);
              }
              this.dispatchUpdate();
            },
          };

          // Push the action to the stack and execute it
          this.#undoableActionManager.pushAndDoAction(undoableAction);

          this.setcurrentStateWithData({
            state: EDITOR_STATE.SELECT,
          });
          break;
        }

        case EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_START: {
          if (
            this.hoverSegment &&
            (this.hoverSelectionType === SELECTION_TYPE.START ||
              this.hoverSelectionType === SELECTION_TYPE.END)
          ) {
            // If hovering over a segment endpoint, use that point and angle
            const segmentPoint =
              this.hoverSegment[
                this.hoverSelectionType === SELECTION_TYPE.END ? "end" : "start"
              ];

            // Calculate the angle at the segment endpoint
            let segmentAngle;
            if (this.hoverSegment instanceof CircularTrackSegment) {
              // For circular segments, use the final angle if it's the end, initial angle if it's the start
              segmentAngle =
                this.hoverSelectionType === SELECTION_TYPE.END
                  ? this.hoverSegment.finalAngle
                  : this.hoverSegment.initialAngle;
            } else {
              // For linear segments, use the angle of the segment
              segmentAngle = Math.atan2(
                this.hoverSegment.end.y - this.hoverSegment.start.y,
                this.hoverSegment.end.x - this.hoverSegment.start.x,
              );
            }

            this.setcurrentStateWithData({
              state: EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_END,
              segmentStart: segmentPoint as GamePoint,
              lockedToSegment: this.hoverSegment,
              lockedToEnd: this.hoverSelectionType,
              counterClockwise: this.currentStateWithData.counterClockwise,
              angle: this.currentStateWithData.angle,
              startAngle: segmentAngle,
            });
          } else {
            // Otherwise use the current mouse position
            const gamePosition = this.untransformPosition(this.mousePos!);
            this.setcurrentStateWithData({
              state: EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_END,
              segmentStart: gamePosition,
              counterClockwise: this.currentStateWithData.counterClockwise,
              angle: this.currentStateWithData.angle,
            });
          }
          break;
        }

        case EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_END: {
          let gamePosition;
          let snappingEnd = false;
          let newSegment: TrackSegment;
          let segmentsToConnectTo: TrackSegment[] = [];
          if (
            this.hoverSelectionType === SELECTION_TYPE.START ||
            this.hoverSelectionType === SELECTION_TYPE.END
          ) {
            // Let's try and lock tu ah
            const lockPoint =
              this.hoverSelectionType === SELECTION_TYPE.START
                ? this.hoverSegment!.start
                : this.hoverSegment!.end;
            snappingEnd = true;
            gamePosition = lockPoint as GamePoint;
          } else {
            // just use the current mouse position
            gamePosition = this.untransformPosition(this.mousePos!);
          }
          if (this.currentStateWithData.lockedToSegment) {
            // Use the current mouse position

            const { center, endPosition, counterClockwise } =
              this.#calculateCircularSegmentParams(gamePosition);

            // Create a new circular segment
            newSegment = new CircularTrackSegment(
              this.currentStateWithData.segmentStart,
              endPosition,
              center,
              counterClockwise,
            );

            // Connect the segment if we started from a segment
            segmentsToConnectTo.push(this.currentStateWithData.lockedToSegment);
            if (snappingEnd) segmentsToConnectTo.push(this.hoverSegment!);
          } else {
            const center = calculateCircularCenter(
              this.currentStateWithData.segmentStart,
              gamePosition,
              this.currentStateWithData.angle,
              this.currentStateWithData.counterClockwise,
            );

            // Create a new circular segment
            newSegment = new CircularTrackSegment(
              this.currentStateWithData.segmentStart,
              gamePosition,
              center,
              this.currentStateWithData.counterClockwise,
            );

            // Connect the segment if we started from a segment
            if (this.currentStateWithData.lockedToSegment) {
              segmentsToConnectTo.push(
                this.currentStateWithData.lockedToSegment,
              );
            }
            if (snappingEnd) segmentsToConnectTo.push(this.hoverSegment!);
          }

          this.#undoableActionManager.pushAndDoAction({
            name: "Create Circular Segment",
            doAction: () => {
              this.network.segments.push(newSegment);
              segmentsToConnectTo.forEach((segment) => {
                newSegment.connect(segment);
              });
              this.dispatchUpdate();
            },
            undoAction: () => {
              const index = this.network.segments.indexOf(newSegment);
              if (index !== -1) {
                newSegment.disconnectAll(true);
                this.network.segments.splice(index, 1);
                this.dispatchUpdate();
              }
            },
          });

          this.setcurrentStateWithData({
            state: EDITOR_STATE.SELECT,
          });

          break;
        }

        case EDITOR_STATE.CREATE_CONNECTION_START: {
          if (
            this.hoverSegment &&
            (this.hoverSelectionType === SELECTION_TYPE.START ||
              this.hoverSelectionType === SELECTION_TYPE.END)
          ) {
            this.setcurrentStateWithData({
              state: EDITOR_STATE.CREATE_CONNECTION_END,
              connectionSegment: this.hoverSegment,
              connectedAtEnd: this.hoverSelectionType === SELECTION_TYPE.END,
            });
          }
          break;
        }

        case EDITOR_STATE.CREATE_CONNECTION_END: {
          if (
            this.hoverSegment &&
            (this.hoverSelectionType === SELECTION_TYPE.START ||
              this.hoverSelectionType === SELECTION_TYPE.END)
          ) {
            const newSegments = connectSegments(
              this.currentStateWithData.connectionSegment,
              this.currentStateWithData.connectedAtEnd,
              this.hoverSegment,
              this.hoverSelectionType === SELECTION_TYPE.END,
            );

            const connectionSegment =
              this.currentStateWithData.connectionSegment;
            const hoverSegment = this.hoverSegment;

            // Create undoable action for creating connection segments
            const undoableAction: UndoableAction = {
              name: "Create Connection",
              doAction: () => {
                newSegments[0].connect(connectionSegment);
                newSegments[0].connect(hoverSegment);
                if (newSegments[1]) {
                  newSegments[0].connect(newSegments[1]);
                  newSegments[1].connect(hoverSegment);
                  newSegments[1].connect(connectionSegment);
                }
                this.network.segments.push(...newSegments);
                this.dispatchUpdate();
              },
              undoAction: () => {
                // Remove all the new segments from the network
                newSegments.forEach((segment) => {
                  segment.disconnectAll(true);
                  const index = this.network.segments.indexOf(segment);
                  if (index > -1) {
                    this.network.segments.splice(index, 1);
                  }
                });
                this.dispatchUpdate();
              },
            };

            // Push the action to the stack and execute it
            this.#undoableActionManager.pushAndDoAction(undoableAction);

            this.setcurrentStateWithData({
              state: EDITOR_STATE.SELECT,
            });
          } else if (this.hoverSegment) {
            this.setcurrentStateWithData({
              state: EDITOR_STATE.SELECT,
              selectedSegment: this.hoverSegment,
              selectionType: this.hoverSelectionType,
            });
          }
          break;
        }

        case EDITOR_STATE.CREATE_STATION: {
          if (!this.hoverSegment) break;
          if (!this.mousePos) break;
          const stationGamePosition = this.untransformPosition(this.mousePos);
          const closestPoint = this.hoverSegment.distanceToPosition({
            x: stationGamePosition.x,
            y: stationGamePosition.y,
          });

          // Generate a stable name for the station
          const stationName = generateName(2);
          const distanceAlong =
            closestPoint.distanceAlong * this.hoverSegment.length;
          const alignment = closestPoint.alignment;
          const segment = this.hoverSegment;

          // Create undoable action for creating a station
          const undoableAction: UndoableAction = {
            name: "Create Station",
            doAction: () => {
              const newStation = new Station(
                segment,
                distanceAlong,
                alignment,
                stationName,
              );
              segment.stations.push(newStation);
              this.dispatchUpdate();
            },
            undoAction: () => {
              // Find and remove the station with the matching properties
              const stationIndex = segment.stations.findIndex(
                (station) =>
                  station.distanceAlong === distanceAlong &&
                  station.alignment === alignment &&
                  station.name === stationName,
              );
              if (stationIndex > -1) {
                segment.stations.splice(stationIndex, 1);
              }
              this.dispatchUpdate();
            },
          };

          // Push the action to the stack and execute it
          this.#undoableActionManager.pushAndDoAction(undoableAction);
          break;
        }

        case EDITOR_STATE.SET_START_POSITION: {
          if (!this.hoverSegment) break;
          if (!this.mousePos) break;
          const startPosition = this.untransformPosition(this.mousePos);
          const closestPoint = this.hoverSegment.distanceToPosition({
            x: startPosition.x,
            y: startPosition.y,
          });

          // Store the train start position properties
          const distanceAlong =
            closestPoint.distanceAlong * this.hoverSegment.length;
          const reverse = closestPoint.alignment === ALIGNMENT.LEFT;
          const segment = this.hoverSegment;

          // Create undoable action for creating a train start position
          const undoableAction: UndoableAction = {
            name: "Add Train Start Position",
            doAction: () => {
              segment.trainStartPositions.push({
                distanceAlong,
                reverse,
              });
              this.dispatchUpdate();
            },
            undoAction: () => {
              // Find and remove the train start position with the matching properties
              const positionIndex = segment.trainStartPositions.findIndex(
                (position) =>
                  position.distanceAlong === distanceAlong &&
                  position.reverse === reverse,
              );
              if (positionIndex > -1) {
                segment.trainStartPositions.splice(positionIndex, 1);
              }
              this.dispatchUpdate();
            },
          };

          // Push the action to the stack and execute it
          this.#undoableActionManager.pushAndDoAction(undoableAction);
          break;
        }

        case EDITOR_STATE.DRAG_SELECT: {
          const startPoint = this.mousePos;
          if (!startPoint) return;
          this.setcurrentStateWithData({
            state: EDITOR_STATE.DRAG_SELECT,
            dragStartPoint: this.untransformPosition(startPoint),
          });
          break;
        }

        case EDITOR_STATE.QUERY_POINT: {
          const point = this.mousePos;
          if (!point) return;

          const gameSelectionDistance = SELECTION_DISTANCE_PIXELS / this.scale;
          const segments = this.network.segments.filter((segment) => {
            const distanceToLine =
              segment.distanceToPosition(gamePosition).distance;
            return distanceToLine <= gameSelectionDistance;
          });
          this.setcurrentStateWithData({
            state: EDITOR_STATE.MULTI_SELECT,
            selectedSegments: segments,
          });
          break;
        }

        case EDITOR_STATE.MULTI_SELECT: {
          this.setcurrentStateWithData({
            state: EDITOR_STATE.PAN,
            dragStartPoint: this.mousePos,
            originalOffset: { ...this.offset },
          });
          break;
        }

        case EDITOR_STATE.SPLIT: {
          if (!this.hoverSegment) break;
          if (!this.mousePos) break;

          const splitResult = this.#replaceSegmentWithNewSegments();

          if (!splitResult) break;

          const [firstSegment, secondSegment] = splitResult;
          const originalSegment = this.hoverSegment;

          const currentConnections = this.hoverSegment.atStart.concat(
            this.hoverSegment.atEnd,
          );

          const undoableAction: UndoableAction = {
            name: "Split Segment",
            doAction: () => {
              originalSegment.disconnectAll(true);
              this.network.segments.splice(
                this.network.segments.indexOf(originalSegment),
                1,
              );

              this.network.segments.push(firstSegment);
              this.network.segments.push(secondSegment);
              currentConnections.forEach((connection) => {
                connection.connect(firstSegment);
                connection.connect(secondSegment);
              });
              firstSegment.connect(secondSegment);

              // Distribute stations to the new segments
              originalSegment.stations.forEach((station) => {
                if (station.distanceAlong <= firstSegment.length) {
                  if (!firstSegment.stations.includes(station)) {
                    firstSegment.stations.push(station);
                  }
                  station.trackSegment = firstSegment;
                } else {
                  if (!secondSegment.stations.includes(station)) {
                    secondSegment.stations.push(station);
                  }
                  station.distanceAlong =
                    station.distanceAlong - firstSegment.length;
                  station.trackSegment = secondSegment;
                }
              });

              this.dispatchUpdate();
            },
            undoAction: () => {
              firstSegment.disconnectAll(true);
              secondSegment.disconnectAll(true);
              this.network.segments.splice(
                this.network.segments.indexOf(firstSegment),
                1,
              );
              this.network.segments.splice(
                this.network.segments.indexOf(secondSegment),
                1,
              );
              this.network.segments.push(originalSegment);
              currentConnections.forEach((connection) => {
                connection.connect(originalSegment);
              });

              // Consolidate stations on the original segment
              firstSegment.stations.forEach((station) => {
                station.trackSegment = originalSegment;
                if (!originalSegment.stations.includes(station)) {
                  originalSegment.stations.push(station);
                }
              });
              secondSegment.stations.forEach((station) => {
                station.distanceAlong =
                  station.distanceAlong + firstSegment.length;
                station.trackSegment = originalSegment;
                if (!originalSegment.stations.includes(station)) {
                  originalSegment.stations.push(station);
                }
              });

              this.dispatchUpdate();
            },
          };

          this.#undoableActionManager.pushAndDoAction(undoableAction);
          this.setcurrentStateWithData({
            state: EDITOR_STATE.SELECT,
          });
          break;
        }
      }
      return;
    };

    this.#trackEditorCanvas.canvas.onmouseup = () => {
      if (
        this.currentStateWithData.state === EDITOR_STATE.MOVE_POINT ||
        this.currentStateWithData.state === EDITOR_STATE.MOVE_SEGMENT
      ) {
        if (this.currentStateWithData.state === EDITOR_STATE.MOVE_SEGMENT) {
          // Create undoable action for moving segment
          const { segment, originalStart, originalEnd, originalCenter } =
            this.currentStateWithData;

          // Capture the final position after the move
          const finalStart = { ...segment.start } as GamePoint;
          const finalEnd = { ...segment.end } as GamePoint;
          const finalCenter =
            segment instanceof CircularTrackSegment
              ? ({ ...segment.center } as GamePoint)
              : undefined;

          const undoableAction: UndoableAction = {
            name: "Move Segment",
            doAction: () => {
              // Set to final position (already done during drag)
              segment.start.x = finalStart.x;
              segment.start.y = finalStart.y;
              segment.end.x = finalEnd.x;
              segment.end.y = finalEnd.y;
              if (segment instanceof CircularTrackSegment && finalCenter) {
                segment.center.x = finalCenter.x;
                segment.center.y = finalCenter.y;
              }
              this.dispatchUpdate();
            },
            undoAction: () => {
              // Restore to original position
              segment.start.x = originalStart.x;
              segment.start.y = originalStart.y;
              segment.end.x = originalEnd.x;
              segment.end.y = originalEnd.y;
              if (segment instanceof CircularTrackSegment && originalCenter) {
                segment.center.x = originalCenter.x;
                segment.center.y = originalCenter.y;
              }
              this.dispatchUpdate();
            },
          };

          this.#undoableActionManager.pushAndDoAction(undoableAction);
        } else if (
          this.currentStateWithData.state === EDITOR_STATE.MOVE_POINT
        ) {
          // Create undoable action for moving point
          const { segment, pointType, originalPoint, originalCenter } =
            this.currentStateWithData;

          const selectedPoint =
            pointType === SELECTION_TYPE.START ? segment.start : segment.end;
          const finalPosition = { ...selectedPoint } as GamePoint;

          // For circular segments, also capture the center position
          const finalCenter =
            segment instanceof CircularTrackSegment
              ? ({ ...segment.center } as GamePoint)
              : undefined;

          const undoableAction: UndoableAction = {
            name: `Move ${
              pointType === SELECTION_TYPE.START ? "Start" : "End"
            } Point`,
            doAction: () => {
              // Set to final position (already done during drag)
              selectedPoint.x = finalPosition.x;
              selectedPoint.y = finalPosition.y;
              if (segment instanceof CircularTrackSegment && finalCenter) {
                segment.center.x = finalCenter.x;
                segment.center.y = finalCenter.y;
              }
              this.dispatchUpdate();
            },
            undoAction: () => {
              // Restore to original position
              selectedPoint.x = originalPoint.x;
              selectedPoint.y = originalPoint.y;
              if (segment instanceof CircularTrackSegment && originalCenter) {
                segment.center.x = originalCenter.x;
                segment.center.y = originalCenter.y;
              }
              this.dispatchUpdate();
            },
          };

          this.#undoableActionManager.pushAndDoAction(undoableAction);
        }

        this.setcurrentStateWithData({
          state: EDITOR_STATE.SELECT,
          selectedSegment: this.currentStateWithData.segment,
          selectionType:
            this.currentStateWithData.state === EDITOR_STATE.MOVE_POINT
              ? this.currentStateWithData.pointType
              : SELECTION_TYPE.SEGMENT,
        });
      } else if (this.currentStateWithData.state === EDITOR_STATE.PAN) {
        this.setcurrentStateWithData({
          state: EDITOR_STATE.SELECT,
        });
        this.#trackEditorCanvas.canvas.style.cursor = "default";
      } else if (this.currentStateWithData.state === EDITOR_STATE.DRAG_SELECT) {
        if (!this.currentStateWithData.dragStartPoint || !this.mousePos) return;
        this.setcurrentStateWithData({
          state: EDITOR_STATE.MULTI_SELECT,
          selectedSegments: this.getSegmentsInRectangle(
            this.currentStateWithData.dragStartPoint,
            this.untransformPosition(this.mousePos),
          ),
        });
        this.#trackEditorCanvas.canvas.style.cursor = "default";
      }
    };

    this.#trackEditorCanvas.canvas.onwheel = (ev) => {
      // Prevent the default scroll behavior
      ev.preventDefault();

      // Adjust scale based on wheel delta
      // Negative delta means scroll up/zoom in, positive means scroll down/zoom out
      this.adjustScale(-ev.deltaY * 0.001 * this.scale, true);
    };

    this.dispatchUpdate();
  }

  clearSegment(
    segment: TrackSegment,
    action: "STATIONS" | "TRAIN_START_POSITIONS",
  ) {
    const selectedSegment = segment;

    const originalStations = [...selectedSegment.stations];
    const originalTrainStartPositions = [
      ...selectedSegment.trainStartPositions,
    ];

    const undoableAction: UndoableAction = {
      name:
        action === "STATIONS"
          ? "Clear Stations"
          : "Clear Train Start Positions",
      doAction: () => {
        this.#onSelect?.();
        this.setcurrentStateWithData({
          state: EDITOR_STATE.SELECT,
        });
        if (action === "STATIONS") {
          selectedSegment.stations = [];
        } else {
          selectedSegment.trainStartPositions = [];
        }
        this.dispatchUpdate();
      },
      undoAction: () => {
        // Restore the cleared arrays
        if (action === "STATIONS") {
          selectedSegment.stations = [...originalStations];
        } else {
          selectedSegment.trainStartPositions = [
            ...originalTrainStartPositions,
          ];
        }
        this.dispatchUpdate();
      },
    };

    this.#undoableActionManager.pushAndDoAction(undoableAction);
  }

  deleteSegment(segment: TrackSegment) {
    const selectedSegment = segment;
    const segmentIndex = this.network.segments.indexOf(selectedSegment);

    // Store all segments that were connected to this one (deduplicate)
    const connectedSegments = [
      ...new Set([...selectedSegment.atStart, ...selectedSegment.atEnd]),
    ];

    // Create the undoable action
    const undoableAction: UndoableAction = {
      name: "Delete Segment",
      doAction: () => {
        this.#onSelect?.();
        selectedSegment.disconnectAll(true);
        this.network.segments.splice(segmentIndex, 1);
        this.setcurrentStateWithData({
          state: EDITOR_STATE.SELECT,
        });
        this.dispatchUpdate();
      },
      undoAction: () => {
        // Restore the segment to the network
        this.network.segments.splice(segmentIndex, 0, selectedSegment);

        // Restore all connections using the connect method
        connectedSegments.forEach((connectedSegment) => {
          selectedSegment.connect(connectedSegment);
        });

        this.dispatchUpdate();
      },
    };

    // Push the action to the stack and execute it
    this.#undoableActionManager.pushAndDoAction(undoableAction);
  }

  /**
   * After this editor makes a change, make sure everything is updated.
   */
  dispatchUpdate() {
    this.network = new Network(this.network.segments);
    this.network.autoConnect();
    this.onNetworkChanged?.();
    this.update();
  }

  /**
   * A description of the action that can be currently undone.
   * If there is no action that can be undone, returns null.
   */
  get undoStatement() {
    return this.#undoableActionManager.undoStatement;
  }

  /**
   * Undo the last action.
   */
  undo() {
    this.#undoableActionManager.undo();
  }

  /**
   * A description of the action that can be currently redone.
   * If there is no action that can be redone, returns null.
   */
  get redoStatement() {
    return this.#undoableActionManager.redoStatement;
  }

  /**
   * Redo the last undone action.
   */
  redo() {
    this.#undoableActionManager.redo();
  }

  /**
   * Automatically scale and offset the canvas to fit the network.
   */
  autoScaleAndOffset() {
    const gameBounds = this.network.getBounds();

    if (this.network.segments.length === 0) {
      return;
    }

    const padding = 100;
    // The max fittable scale along X
    const scaleX =
      (this.size.x - padding) / (gameBounds.max.x - gameBounds.min.x);
    // The max fittable scale along Y
    const scaleY =
      (this.size.y - padding) / (gameBounds.max.y - gameBounds.min.y);

    if (scaleX < scaleY) {
      this.scale = scaleX;
      const excessY =
        (this.size.y -
          padding -
          (gameBounds.max.y - gameBounds.min.y) * this.scale) /
        2;
      this.offset = {
        x: -gameBounds.min.x + padding / (this.scale * 2),
        y:
          -gameBounds.min.y + excessY / this.scale + padding / (this.scale * 2),
      } as ScreenPoint;
    } else {
      this.scale = scaleY;
      const excessX =
        (this.size.x -
          padding -
          (gameBounds.max.x - gameBounds.min.x) * this.scale) /
        2;

      this.offset = {
        x:
          -gameBounds.min.x + excessX / this.scale + padding / (this.scale * 2),
        y: -gameBounds.min.y + padding / (this.scale * 2),
      } as ScreenPoint;
    }
    this.onScaleChanged?.(this.scale);
    this.update();
  }

  setNetwork(network: Network) {
    this.hoverSegment = undefined;
    if (
      this.currentStateWithData.state === EDITOR_STATE.SELECT &&
      this.currentStateWithData.selectedSegment
    ) {
      const selection = this.network.segments.indexOf(
        this.currentStateWithData.selectedSegment,
      );
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
    const currentSelection =
      this.currentStateWithData.state === EDITOR_STATE.SELECT
        ? this.currentStateWithData.selectedSegment
        : undefined;
    const newSelection =
      payload.state === EDITOR_STATE.SELECT
        ? payload.selectedSegment
        : undefined;

    this.currentStateWithData = payload;
    if (payload.state === EDITOR_STATE.PAN) {
      this.#trackEditorCanvas.canvas.style.cursor = "grab";
    } else {
      this.#trackEditorCanvas.canvas.style.cursor = "default";
    }

    if (currentSelection !== newSelection) {
      this.#onSelect?.(newSelection);
    }
    this.update();

    this.onStateChanged?.(payload);
  }

  setScale(scale: number) {
    this.adjustScale(scale - this.scale, false);
  }

  adjustScale(delta: number, useMouseCenter: boolean) {
    const oldScale = this.scale;
    this.scale = Math.max(0.25, this.scale + delta);

    // If we have a mouse position within the canvas, use that as the zoom center
    let zoomCenter;
    if (
      this.mousePos &&
      this.mousePos.x >= 0 &&
      this.mousePos.x <= this.size.x &&
      this.mousePos.y >= 0 &&
      this.mousePos.y <= this.size.y &&
      useMouseCenter
    ) {
      // Convert mouse position to game coordinates
      zoomCenter = this.untransformPosition(this.mousePos);
    } else {
      // Use view center if mouse is outside canvas
      zoomCenter = this.untransformPosition({
        x: this.size.x / 2,
        y: this.size.y / 2,
      } as ScreenPoint);
    }

    // Calculate how much the point moves due to scale change
    const scaleFactor = this.scale / oldScale;
    const dx = (zoomCenter.x + this.offset.x) * (1 - scaleFactor);
    const dy = (zoomCenter.y + this.offset.y) * (1 - scaleFactor);

    // Adjust offset to keep the zoom center point fixed
    this.offset = {
      x: this.offset.x + dx,
      y: this.offset.y + dy,
    } as ScreenPoint;

    this.onScaleChanged?.(this.scale);
    this.update();
  }

  /**
   * Transform a point from the game world to the canvas.
   */
  transformPosition(p: GamePoint): ScreenPoint {
    return {
      x: (p.x + this.offset.x) * this.scale,
      y: (p.y + this.offset.y) * this.scale,
    } as ScreenPoint;
  }

  /**
   * Transform a point from the canvas to the game world.
   */
  untransformPosition(p: ScreenPoint): GamePoint {
    const result = {
      x: p.x / this.scale - this.offset.x,
      y: p.y / this.scale - this.offset.y,
    } as GamePoint;
    return result;
  }

  /**
   * For the current mouse position, find the closest segment and which part of it is closest.
   */
  updateHoverState() {
    if (!this.mousePos) return;

    const gameSelectionDistance = SELECTION_DISTANCE_PIXELS / this.scale;
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

      const distanceToStart = _dist(seg.start as GamePoint, gamePosition);
      const distanceToEnd = _dist(seg.end as GamePoint, gamePosition);

      if (
        (!closestType ||
          closestType === SELECTION_TYPE.SEGMENT ||
          (this.currentStateWithData.state === EDITOR_STATE.SELECT &&
            seg === this.currentStateWithData.selectedSegment) ||
          seg === this.hoverSegment) &&
        distanceToStart < gameSelectionDistance
      ) {
        closestSegment = seg;
        if (
          (this.currentStateWithData.state === EDITOR_STATE.SELECT &&
            seg === this.currentStateWithData.selectedSegment) ||
          seg === this.hoverSegment
        ) {
          closest = -1;
        } else {
          closest = distanceToLine;
        }

        closestType = SELECTION_TYPE.START;
      }
      if (
        (!closestType ||
          closestType === SELECTION_TYPE.SEGMENT ||
          (this.currentStateWithData.state === EDITOR_STATE.SELECT &&
            seg === this.currentStateWithData.selectedSegment) ||
          seg === this.hoverSegment) &&
        distanceToEnd < gameSelectionDistance
      ) {
        closestSegment = seg;
        if (
          (this.currentStateWithData.state === EDITOR_STATE.SELECT &&
            seg === this.currentStateWithData.selectedSegment) ||
          seg === this.hoverSegment
        ) {
          closest = -1;
        } else {
          closest = distanceToLine;
        }
        closestType = SELECTION_TYPE.END;
      }
    });
    this.hoverSegment = closestSegment;
    this.hoverSelectionType = closestType;
  }

  /**
   * Redraw the editor canvas.
   */
  update() {
    this.#trackEditorCanvas.draw();
  }

  /**
   * Determine the ghost station and segments that should be drawn on the canvas.
   */
  determineGhosts() {
    if (
      this.currentStateWithData.state ===
        EDITOR_STATE.CREATE_LINEAR_SEGMENT_END &&
      this.mousePos
    ) {
      const gamePosition = this.untransformPosition(this.mousePos);
      const { endPosition } = this.#calculateLinearSegmentParams(gamePosition);
      const previewSegment = new LinearTrackSegment(
        this.currentStateWithData.segmentStart,
        endPosition,
      );

      this.ghostSegments = [previewSegment];
    } else if (
      this.currentStateWithData.state === EDITOR_STATE.CREATE_CONNECTION_END &&
      this.hoverSegment &&
      (this.hoverSelectionType === SELECTION_TYPE.START ||
        this.hoverSelectionType === SELECTION_TYPE.END)
    ) {
      // Draw the theoretical segment
      const connection = connectSegments(
        this.currentStateWithData.connectionSegment,
        this.currentStateWithData.connectedAtEnd,
        this.hoverSegment,
        this.hoverSelectionType === SELECTION_TYPE.END,
      );
      this.ghostSegments = connection;
    } else if (
      this.currentStateWithData.state ===
      EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_END
    ) {
      const { center, endPosition, counterClockwise } =
        this.#calculateCircularSegmentParams(
          this.untransformPosition(this.mousePos!),
        );
      this.ghostSegments = [
        new CircularTrackSegment(
          this.currentStateWithData.segmentStart,
          endPosition,
          center,
          counterClockwise,
        ),
      ];
    } else {
      this.ghostSegments = [];
    }

    if (
      this.currentStateWithData.state === EDITOR_STATE.CREATE_STATION &&
      this.mousePos &&
      this.hoverSegment
    ) {
      const gamePosition = this.untransformPosition(this.mousePos);
      const closestPoint = this.hoverSegment?.distanceToPosition({
        x: gamePosition.x,
        y: gamePosition.y,
      });
      this.ghostStation = new Station(
        this.hoverSegment,
        closestPoint.distanceAlong * this.hoverSegment.length,
        closestPoint.alignment,
      );
    } else {
      this.ghostStation = undefined;
    }
  }

  getSegmentsInRectangle(from: GamePoint, to: GamePoint) {
    const upperLeft = {
      x: Math.min(from.x, to.x),
      y: Math.min(from.y, to.y),
    };
    const lowerRight = {
      x: Math.max(from.x, to.x),
      y: Math.max(from.y, to.y),
    };
    return this.network.segments.filter((seg) => {
      return seg.isWithinRectangle(upperLeft, lowerRight);
    });
  }

  /**
   * Calculate circular segment parameters for preview or creation
   */
  #calculateCircularSegmentParams(endPoint: GamePoint): {
    center: GamePoint;
    endPosition: GamePoint;
    counterClockwise: boolean;
  } {
    if (
      this.currentStateWithData.state !==
      EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_END
    ) {
      throw new Error("Not in CREATE_CIRCULAR_SEGMENT_END state");
    }

    if (this.currentStateWithData.lockedToSegment) {
      // We have a start angle constraint, use the constrained circle calculation
      const outwardAngle =
        this.currentStateWithData.lockedToEnd === SELECTION_TYPE.START
          ? (this.currentStateWithData.startAngle || 0) + Math.PI
          : this.currentStateWithData.startAngle || 0;

      // Determine if cursor is left or right of start point in direction of angle
      const angleVector = {
        x: Math.cos(outwardAngle),
        y: Math.sin(outwardAngle),
      };
      const toEndPoint = {
        x: endPoint.x - this.currentStateWithData.segmentStart.x,
        y: endPoint.y - this.currentStateWithData.segmentStart.y,
      };
      const crossProduct =
        angleVector.x * toEndPoint.y - angleVector.y * toEndPoint.x;
      const counterClockwise = crossProduct < 0;

      const center = calculateConstrainedCircleCenter(
        this.currentStateWithData.segmentStart,
        outwardAngle,
        endPoint,
      );

      // Calculate the end position based on the start point, center, and angle
      const startToCenter = {
        x: center.x - this.currentStateWithData.segmentStart.x,
        y: center.y - this.currentStateWithData.segmentStart.y,
      };
      const radius = Math.sqrt(startToCenter.x ** 2 + startToCenter.y ** 2);
      const startAngle = Math.atan2(startToCenter.y, startToCenter.x);
      const endAngle =
        startAngle +
        (counterClockwise ? -1 : 1) * this.currentStateWithData.angle;

      const endPosition = {
        x: center.x - radius * Math.cos(endAngle),
        y: center.y - radius * Math.sin(endAngle),
      } as GamePoint;

      return { center: center as GamePoint, endPosition, counterClockwise };
    } else {
      // No start angle constraint, use the regular calculation
      const center = calculateCircularCenter(
        this.currentStateWithData.segmentStart,
        endPoint,
        this.currentStateWithData.angle,
        this.currentStateWithData.counterClockwise,
      );

      return {
        center: center as GamePoint,
        endPosition: endPoint,
        counterClockwise: this.currentStateWithData.counterClockwise,
      };
    }
  }

  /**
   * Calculate linear segment parameters for preview or creation
   */
  #calculateLinearSegmentParams(endPoint: GamePoint): {
    endPosition: GamePoint;
  } {
    if (
      this.currentStateWithData.state !== EDITOR_STATE.CREATE_LINEAR_SEGMENT_END
    ) {
      throw new Error("Not in CREATE_LINEAR_SEGMENT_END state");
    }

    // If we're locked to a segment, constrain the angle
    if (
      this.currentStateWithData.lockedToSegment &&
      this.currentStateWithData.lockedToEnd
    ) {
      const lockedSegment = this.currentStateWithData.lockedToSegment;
      const angle =
        this.currentStateWithData.lockedToEnd === SELECTION_TYPE.START
          ? lockedSegment.initialAngle + Math.PI
          : lockedSegment.finalAngle;

      // Calculate the distance from the start point to the mouse
      const dx = endPoint.x - this.currentStateWithData.segmentStart.x;
      const dy = endPoint.y - this.currentStateWithData.segmentStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Set the end point using the locked angle and calculated distance
      const endPosition = {
        x:
          this.currentStateWithData.segmentStart.x + Math.cos(angle) * distance,
        y:
          this.currentStateWithData.segmentStart.y + Math.sin(angle) * distance,
      } as GamePoint;

      return { endPosition };
    } else {
      // No angle constraint, use the mouse position directly
      return { endPosition: endPoint };
    }
  }

  /**
   * Determine the new segments that result from splitting the hovered segment.
   * Uses editor state to determine which segment to split, and where.
   * @returns The two new segments.
   */
  #replaceSegmentWithNewSegments(): [TrackSegment, TrackSegment] | null {
    if (!this.hoverSegment) return null;
    if (!this.mousePos) return null;

    const gamePosition = this.untransformPosition(this.mousePos);
    const closestPoint = this.hoverSegment.distanceToPosition({
      x: gamePosition.x,
      y: gamePosition.y,
    });
    const splitDistanceAlong =
      closestPoint.distanceAlong * this.hoverSegment.length;

    let firstSegment: TrackSegment | null = null;
    let secondSegment: TrackSegment | null = null;

    // Handle linear segments
    if (this.hoverSegment instanceof LinearTrackSegment) {
      const splitPoint = closestPoint.point;

      // Create the first segment: from original start to split point
      firstSegment = new LinearTrackSegment(
        { ...this.hoverSegment.start },
        { ...splitPoint },
      );

      // Create the second segment: from split point to original end
      secondSegment = new LinearTrackSegment(
        { ...splitPoint },
        { ...this.hoverSegment.end },
      );
    } else if (this.hoverSegment instanceof CircularTrackSegment) {
      const splitPoint =
        this.hoverSegment.getPositionAlong(splitDistanceAlong).point;

      // Create the first segment: from original start to split point
      firstSegment = new CircularTrackSegment(
        { ...this.hoverSegment.start },
        { ...splitPoint },
        { ...this.hoverSegment.center },
        this.hoverSegment.counterClockWise,
      );

      // Create the second segment: from split point to original end
      secondSegment = new CircularTrackSegment(
        { ...splitPoint },
        { ...this.hoverSegment.end },
        { ...this.hoverSegment.center },
        this.hoverSegment.counterClockWise,
      );
    }

    if (!firstSegment || !secondSegment) {
      return null;
    }

    // Add train start positions to the new segments
    // Doing this here because they're simple objects (for now)
    this.hoverSegment.trainStartPositions.forEach((startPosition) => {
      if (startPosition.distanceAlong <= splitDistanceAlong) {
        firstSegment.trainStartPositions.push({
          ...startPosition,
        });
      } else {
        secondSegment.trainStartPositions.push({
          ...startPosition,
          distanceAlong: startPosition.distanceAlong - splitDistanceAlong,
        });
      }
    });

    return [firstSegment, secondSegment];
  }
}

export default TrackEditor;
