import TrackEditor, { ScreenPoint } from "./TrackEditor";

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
  draw() {}
}

export default TrackEditorCanvas;
