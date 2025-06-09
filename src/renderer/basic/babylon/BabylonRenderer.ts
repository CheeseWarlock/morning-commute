import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import IRenderer from "../IRenderer";
import Game from "../../../engine/Game";
import arrowImage from "../../images/arrow.png";
import { DecorationManager } from "./DecorationManager";
import { TrainManager } from "./TrainManager";
import { TrackManager } from "./TrackManager";
import { StationManager } from "./StationManager";
import { GroundManager } from "./GroundManager";

import "@babylonjs/loaders";

class BabylonRenderer implements IRenderer {
  game: Game;
  materials: Map<string, BABYLON.Material> = new Map();
  private arrowSpriteManager: BABYLON.SpriteManager;
  camera: BABYLON.Camera;
  engine?: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private decorationManager: DecorationManager;
  private trainManager: TrainManager;
  private trackManager: TrackManager;
  private stationManager: StationManager;
  private groundManager: GroundManager;
  private padding: number = 50;
  private advancedTexture?: GUI.AdvancedDynamicTexture;

  constructor(element: HTMLElement, game: Game) {
    this.game = game;
    console.log("BabylonRenderer constructor", game.gameState.trains.length);
    const aCanvas = document.createElement("canvas");
    aCanvas.setAttribute("id", "renderCanvas");
    aCanvas.width = 1200;
    aCanvas.height = 800;
    element.appendChild(aCanvas);

    // Get the canvas DOM element
    const canvas = document.getElementById("renderCanvas")!;
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("Canvas is not an HTMLCanvasElement");
    }
    // Load the 3D engine
    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    this.engine = engine;
    this.scene = new BABYLON.Scene(engine);

    // Create fullscreen UI
    this.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    new BABYLON.HemisphericLight(
      "HemiLight",
      new BABYLON.Vector3(0, 1, 0),
      this.scene,
    );

    this.arrowSpriteManager = new BABYLON.SpriteManager(
      "treesManager",
      arrowImage,
      2000,
      { width: 64, height: 64 },
      this.scene,
    );
    this.arrowSpriteManager.renderingGroupId = 1;

    const USE_UNIVERSAL_CAMERA = false;
    if (USE_UNIVERSAL_CAMERA) {
      const gameBounds = game.network.getBounds();
      const center = new BABYLON.Vector3(
        (gameBounds.max.x + gameBounds.min.x) / 2,
        0,
        -(gameBounds.max.y + gameBounds.min.y) / 2,
      );

      const camera = new BABYLON.UniversalCamera(
        "Camera",
        new BABYLON.Vector3(center.x, center.y + 100, center.z),
      );
      camera.attachControl(canvas, false);
      camera.setTarget(center);
      this.camera = camera;
    } else {
      const gameBounds = game.network.getBounds();
      const camera = new BABYLON.ArcRotateCamera(
        "Camera",
        (3 * Math.PI) / 2,
        0.5,
        700,
        new BABYLON.Vector3(
          (gameBounds.max.x + gameBounds.min.x) / 2,
          0,
          -(gameBounds.max.y + gameBounds.min.y) / 2,
        ),
      );
      camera.attachControl(canvas, false);
      this.camera = camera;
    }

    // Initialize managers
    this.groundManager = new GroundManager(this.scene, game, this.padding);
    this.trackManager = new TrackManager(this.scene, game);
    this.stationManager = new StationManager(this.scene, game, this.camera);
    this.decorationManager = new DecorationManager(
      this.scene,
      game,
      this.padding,
    );
    this.trainManager = new TrainManager(
      this.scene,
      game,
      this.arrowSpriteManager,
    );

    this.stationManager.createStationTexts(this.advancedTexture);
    this.trainManager.createTrainTexts(this.advancedTexture);

    engine.runRenderLoop(() => {
      this.scene.render();
    });
    window.addEventListener("resize", () => {
      engine.resize();
    });
  }

  update() {
    this.trainManager.update();
    this.stationManager.update();
  }

  cleanup() {
    if (!this.engine) return;
    this.decorationManager.cleanup();
    this.trainManager.cleanup();
    this.trackManager.cleanup();
    this.stationManager.cleanup();
    this.groundManager.cleanup();
    this.advancedTexture?.dispose();
    this.engine.dispose();
    delete this.engine;
  }
}
export default BabylonRenderer;
