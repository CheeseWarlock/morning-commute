import * as BABYLON from "babylonjs";
import IRenderer from "../IRenderer";
import Game, { TRAIN_STRATEGIES } from "../../../engine/Game";
import TrackSegment from "../../../engine/TrackSegment";
import LinearTrackSegment from "../../../engine/LinearTrackSegment";
import CircularTrackSegment from "../../../engine/CircularTrackSegment";
import { ALIGNMENT } from "../../../engine/Station";
import arrowImage from "../../images/arrow.png";
import numberImage from "../../images/numbers.png";

const PATHS = {
  GROUND: [
    new BABYLON.Vector3(9, -1, 0),
    new BABYLON.Vector3(-9, -1, 0),
    new BABYLON.Vector3(-6, 0, 0),
    new BABYLON.Vector3(6, 0, 0),
  ],
  LEFT_TRACK: [
    new BABYLON.Vector3(2.75, 0, 0),
    new BABYLON.Vector3(4, 0, 0),
    new BABYLON.Vector3(4, 1, 0),
    new BABYLON.Vector3(2.75, 1, 0),
  ],
  RIGHT_TRACK: [
    new BABYLON.Vector3(-2.75, 0, 0),
    new BABYLON.Vector3(-4, 0, 0),
    new BABYLON.Vector3(-4, 1, 0),
    new BABYLON.Vector3(-2.75, 1, 0),
  ],
};

class BabylonRenderer implements IRenderer {
  spheres: BABYLON.Mesh[][] = [];
  game: Game;
  #scene: BABYLON.Scene;
  materials: Map<string, BABYLON.Material> = new Map();
  arrowSpriteManager: BABYLON.SpriteManager;
  numberSpriteManager: BABYLON.SpriteManager;
  turnArrowSprite?: BABYLON.Sprite;
  stationNumberSprites: BABYLON.Sprite[][] = [];
  trainNumberSprites: BABYLON.Sprite[] = [];
  camera: BABYLON.Camera;

  constructor(element: HTMLElement, game: Game) {
    this.game = game;
    console.log("BabylonRenderer constructor", game.network.trains.length);
    const aCanvas = document.createElement("canvas");
    aCanvas.setAttribute("id", "renderCanvas");
    aCanvas.width = 1200;
    aCanvas.height = 800;
    element.appendChild(aCanvas);

    // Get the canvas DOM element
    var canvas = document.getElementById("renderCanvas");
    // Load the 3D engine
    var engine = new BABYLON.Engine(canvas as any, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    // CreateScene function that creates and return the scene
    var scene = new BABYLON.Scene(engine);
    this.#scene = scene;

    // var light = new BABYLON.HemisphericLight(
    //   "light1",
    //   new BABYLON.Vector3(0, 1, 0),
    //   scene,
    // );
    // const light = new BABYLON.DirectionalLight(
    //   "light2",
    //   new BABYLON.Vector3(1, -20, 2),
    //   scene,
    // );
    const light2 = new BABYLON.HemisphericLight(
      "HemiLight",
      new BABYLON.Vector3(0, 1, 0),
      scene,
    );
    const trainMaterial = new BABYLON.StandardMaterial("trainMaterial");
    trainMaterial.diffuseColor = new BABYLON.Color3(1, 0.15, 0.15);
    this.materials.set("train", trainMaterial);
    const trainFollowingMaterial = new BABYLON.StandardMaterial(
      "trainFollowingMaterial",
    );
    trainFollowingMaterial.diffuseColor = new BABYLON.Color3(1, 0.15, 1);
    this.materials.set("trainFollowing", trainFollowingMaterial);
    game.network.trains.forEach((train) => {
      const theseSpheres: BABYLON.Mesh[] = [];
      const sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere2",
        {
          diameter: 4,
        },
        scene,
      );
      sphere.material = trainMaterial;
      theseSpheres.push(sphere);
      train.followingCars.forEach(() => {
        const sphere = BABYLON.MeshBuilder.CreateSphere(
          "sphere2",
          {
            diameter: 4,
          },
          scene,
        );
        sphere.material = trainFollowingMaterial;
        theseSpheres.push(sphere);
        sphere.position.y = 2;
      });

      this.spheres.push(theseSpheres);
      sphere.position.y = 2;
    });

    const whiteMaterial = new BABYLON.StandardMaterial("");
    whiteMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
    whiteMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    // whiteMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    whiteMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
    this.materials.set("white", whiteMaterial);

    const stationMaterial = new BABYLON.StandardMaterial("");

    stationMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.6, 1);
    stationMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    // stationMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    stationMaterial.ambientColor = new BABYLON.Color3(0.77, 0.77, 0.77);
    this.materials.set("station", stationMaterial);

    game.network.stations.forEach((station) => {
      const rect = [
        new BABYLON.Vector3(-2, -1, 0),
        new BABYLON.Vector3(2, -1, 0),
        new BABYLON.Vector3(2, 1, 0),

        new BABYLON.Vector3(0, 2, 0),
        new BABYLON.Vector3(-2, 1, 0),
      ];
      rect.push(rect[0]);
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

      const path = [
        new BABYLON.Vector3(-4, 0, 0),
        new BABYLON.Vector3(4, 0, 0),
      ];

      const extrusion = BABYLON.MeshBuilder.ExtrudeShape(
        "squareb",
        {
          shape: rect,
          path: path,
          sideOrientation: BABYLON.Mesh.DOUBLESIDE,
          scale: 0.7,
          cap: BABYLON.Mesh.CAP_ALL,
        },
        this.#scene,
      );
      extrusion.position.x = targetPosition.x;
      extrusion.position.z = -targetPosition.y;
      extrusion.rotation.y = angleFromForward + Math.PI / 2;
      extrusion.convertToFlatShadedMesh();

      extrusion.material = stationMaterial;
    });

    const gameBounds = game.network.getBounds();

    const padding = 50;
    var ground = BABYLON.Mesh.CreateGround(
      "ground1",
      gameBounds.max.x - gameBounds.min.x + padding,
      gameBounds.max.y - gameBounds.min.y + padding,
      2,
      scene,
      false,
    );
    const groundMaterial = new BABYLON.StandardMaterial("");
    groundMaterial.diffuseColor = new BABYLON.Color3(0.41, 0.65, 0.29);
    groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    groundMaterial.ambientColor = new BABYLON.Color3(0.77, 0.77, 0.77);
    ground.material = groundMaterial;
    ground.position.x = (gameBounds.max.x + gameBounds.min.x) / 2;
    ground.position.y = -1;
    ground.position.z = -(gameBounds.max.y + gameBounds.min.y) / 2;

    const camera = new BABYLON.ArcRotateCamera(
      "Camera",
      (3 * Math.PI) / 2,
      1,
      200,
      new BABYLON.Vector3(
        (gameBounds.max.x + gameBounds.min.x) / 2,
        0,
        -(gameBounds.max.y + gameBounds.min.y) / 2,
      ),
    );
    camera.attachControl(canvas, false);
    // camera.target = new BABYLON.Vector3(
    //   (gameBounds.max.x + gameBounds.min.x) / 2,
    //   0,
    //   -(gameBounds.max.y + gameBounds.min.y) / 2,
    // );
    // camera.position = ;
    // camera.upVector = new BABYLON.Vector3(0, -1, 0);
    this.camera = camera;

    engine.runRenderLoop(function () {
      scene.render();
    });
    window.addEventListener("resize", function () {
      engine.resize();
    });

    const trackGroundMaterial = new BABYLON.StandardMaterial("");
    trackGroundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.46, 0.44);
    trackGroundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    trackGroundMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
    this.materials.set("trackGround", trackGroundMaterial);

    const trackMaterial = new BABYLON.StandardMaterial("");
    trackMaterial.diffuseColor = new BABYLON.Color3(0.73, 0.73, 0.73);
    trackMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    trackMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
    this.materials.set("track", trackMaterial);

    this.game.network.segments.forEach((segment) => {
      this.#convertTrackSegmentToGeometry(segment);
    });

    this.arrowSpriteManager = new BABYLON.SpriteManager(
      "treesManager",
      arrowImage,
      2000,
      { width: 64, height: 64 },
      scene,
    );
    this.arrowSpriteManager.renderingGroupId = 1;
    this.numberSpriteManager = new BABYLON.SpriteManager(
      "arrowManager",
      numberImage,
      10,
      { width: 32, height: 64 },
      scene,
    );
    this.numberSpriteManager.renderingGroupId = 1;
    this.game.network.stations.forEach((station, i) => {
      const sprites: BABYLON.Sprite[] = [];
      const a = new BABYLON.Sprite("", this.numberSpriteManager);
      const b = new BABYLON.Sprite("", this.numberSpriteManager);
      sprites.push(a);
      sprites.push(b);
      this.stationNumberSprites.push(sprites);
      a.position = new BABYLON.Vector3(
        station.position.x,
        2,
        -station.position.y,
      );
      a.height = 10;
      a.width = 5;
      b.position = new BABYLON.Vector3(
        station.position.x - 4,
        2,
        -station.position.y,
      );
      b.height = 10;
      b.width = 5;
    });

    this.game.network.trains.forEach((train) => {
      this.trainNumberSprites.push(
        new BABYLON.Sprite("", this.numberSpriteManager),
      );
    });
  }

  #setupScene() {}

  #convertTrackSegmentToGeometry(segment: TrackSegment) {
    let myPath: BABYLON.Vector3[] = [];
    if (segment instanceof LinearTrackSegment) {
      const segmentCount = Math.max(Math.floor(segment.length / 3), 3);
      for (let i = 0; i <= segmentCount; i++) {
        const p = segment.getPositionAlong((segment.length * i) / segmentCount);
        myPath.push(new BABYLON.Vector3(p.point.x, 0, -p.point.y));
      }
    } else if (segment instanceof CircularTrackSegment) {
      const start = segment.getPositionAlong(0);
      const startAngle = segment.initialAngle;
      myPath.push(
        new BABYLON.Vector3(
          start.point.x - 0.01 * Math.cos(startAngle),
          0,
          -start.point.y + 0.01 * Math.sin(startAngle),
        ),
      );
      const segmentCount = Math.max(Math.floor(segment.length / 3), 2);
      for (let i = 0; i <= segmentCount; i++) {
        const p = segment.getPositionAlong((segment.length * i) / segmentCount);
        myPath.push(new BABYLON.Vector3(p.point.x, 0, -p.point.y));
      }
      const end = segment.getPositionAlong(segment.length);
      const endAngle = segment.finalAngle;
      myPath.push(
        new BABYLON.Vector3(
          end.point.x + 0.01 * Math.cos(endAngle),
          0,
          -end.point.y - 0.01 * Math.sin(endAngle),
        ),
      );
    }

    const flatExtrustion = BABYLON.MeshBuilder.ExtrudeShape(
      "squareb",
      {
        shape: PATHS.GROUND,
        path: myPath.map((p, idx) => {
          if (idx < 2 || idx > myPath.length - 4) {
            return p;
          }
          return new BABYLON.Vector3(
            p.x + Math.random() - 0.5,
            0,
            p.z + Math.random() - 0.5,
          );
        }),
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
        scale: 0.3,
        closePath: false,
        closeShape: true,
      },
      this.#scene,
    );
    flatExtrustion.convertToFlatShadedMesh();
    flatExtrustion.material = this.materials.get("trackGround")!;

    const lExtru = BABYLON.MeshBuilder.ExtrudeShape(
      "squareb",
      {
        shape: PATHS.LEFT_TRACK,
        path: myPath,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
        scale: 0.3,
        closePath: false,
        closeShape: true,
      },
      this.#scene,
    );
    lExtru.convertToFlatShadedMesh();
    lExtru.material = this.materials.get("track")!;

    const rExtru = BABYLON.MeshBuilder.ExtrudeShape(
      "squareb",
      {
        shape: PATHS.RIGHT_TRACK,
        path: myPath,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
        scale: 0.3,
        closePath: false,
        closeShape: true,
      },
      this.#scene,
    );
    rExtru.convertToFlatShadedMesh();
    rExtru.material = this.materials.get("track")!;
  }

  update() {
    this.game.network.stations.forEach((station, i) => {
      this.stationNumberSprites[i][0].cellIndex =
        (station.waitingPassengers.length + 9) % 10;
      this.stationNumberSprites[i][1].cellIndex =
        (Math.floor(station.waitingPassengers.length / 10) + 9) % 10;

      this.stationNumberSprites[i][0].position = new BABYLON.Vector3(
        station.position.x,
        2,
        -station.position.y,
      );
      const aa = (this.camera as BABYLON.ArcRotateCamera).alpha;
      this.stationNumberSprites[i][1].position = new BABYLON.Vector3(
        station.position.x + Math.sin(aa) * 5,
        2,
        -station.position.y - Math.cos(aa) * 5,
      );
    });
    this.game.network.trains.forEach((train, i) => {
      const theseSpheres = this.spheres[i];
      const thisNumber = this.trainNumberSprites[i];
      thisNumber.position = new BABYLON.Vector3(
        train.position.x,
        10,
        -train.position.y,
      );
      thisNumber.width = 5;
      thisNumber.height = 10;
      thisNumber.cellIndex = (train.passengers.length + 9) % 10;
      if (train === this.game.selectedTrain) {
        if (!this.turnArrowSprite) {
          const tree = new BABYLON.Sprite("tree", this.arrowSpriteManager);

          tree.width = 10;
          tree.height = 10;
          this.turnArrowSprite = tree;
        }
        this.turnArrowSprite!.position = new BABYLON.Vector3(
          train.nextJunction.position.x,
          2,
          -train.nextJunction.position.y,
        );
        const direction = this.game.turnStrategies.get(this.game.selectedTrain);
        if (direction === TRAIN_STRATEGIES.TURN_LEFT) {
          this.turnArrowSprite!.angle = 0.8;
          this.turnArrowSprite!.isVisible = true;
        } else if (direction === TRAIN_STRATEGIES.TURN_RIGHT) {
          this.turnArrowSprite!.angle = -0.8;
          this.turnArrowSprite!.isVisible = true;
        } else {
          this.turnArrowSprite!.isVisible = false;
        }
        this.turnArrowSprite!.angle -= (
          this.camera as BABYLON.ArcRotateCamera
        ).alpha;
        this.turnArrowSprite!.angle -= train.nextJunction.angle;
        this.turnArrowSprite!.angle += Math.PI;

        theseSpheres.forEach((s) => {
          s.renderOutline = true;
          s.outlineWidth = 1;
          s.outlineColor = new BABYLON.Color3(1, 1, 1);
        });
      } else {
        theseSpheres.forEach((s) => {
          s.renderOutline = false;
        });
      }
      theseSpheres[0].position.x = train.position.x;
      theseSpheres[0].position.z = -train.position.y;
      train.followingCars.forEach((car, i) => {
        theseSpheres[i + 1].position.x = car.position.x;
        theseSpheres[i + 1].position.z = -car.position.y;
      });
    });
  }
}

export default BabylonRenderer;
