import * as BABYLON from "babylonjs";
import IRenderer from "./IRenderer";
import Game from "../../engine/Game";
import TrackSegment from "../../engine/TrackSegment";
import LinearTrackSegment from "../../engine/LinearTrackSegment";
import CircularTrackSegment from "../../engine/CircularTrackSegment";
import { ALIGNMENT } from "../../engine/Station";

class BabylonRenderer implements IRenderer {
  spheres: any[] = [];
  game: Game;
  #scene: BABYLON.Scene;
  materials: Map<string, BABYLON.Material> = new Map();

  constructor(element: HTMLElement, game: Game) {
    this.game = game;
    const aCanvas = document.createElement("canvas");
    aCanvas.setAttribute("id", "renderCanvas");
    aCanvas.width = 800;
    aCanvas.height = 600;
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
    const light = new BABYLON.DirectionalLight(
      "light2",
      new BABYLON.Vector3(1, -20, 2),
      scene,
    );
    const trainMaterial = new BABYLON.StandardMaterial("trainMaterial");
    trainMaterial.diffuseColor = new BABYLON.Color3(1, 0.15, 0.15);
    this.materials.set("train", trainMaterial);
    game.network.trains.forEach(() => {
      const sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere2",
        {
          diameter: 4,
        },
        scene,
      );
      sphere.material = trainMaterial;
      this.spheres.push(sphere);
      sphere.position.y = 2;
    });

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
    groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.3);
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

    engine.runRenderLoop(function () {
      scene.render();
    });
    window.addEventListener("resize", function () {
      engine.resize();
    });
    this.game.network.segments.forEach((segment) => {
      this.#convertTrackSegmentToGeometry(segment);
    });
  }

  #setupScene() {}

  #convertTrackSegmentToGeometry(segment: TrackSegment) {
    const myShape = [
      new BABYLON.Vector3(0, 0, 0),
      new BABYLON.Vector3(2, 0, 0),
      new BABYLON.Vector3(2, 1, 0),
      new BABYLON.Vector3(4, 1, 0),
      new BABYLON.Vector3(4, 0, 0),
      new BABYLON.Vector3(6, 0, 0),
      new BABYLON.Vector3(6, -1, 0),

      new BABYLON.Vector3(-6, -1, 0),

      new BABYLON.Vector3(-6, 0, 0),
      new BABYLON.Vector3(-4, 0, 0),
      new BABYLON.Vector3(-4, 1, 0),
      new BABYLON.Vector3(-2, 1, 0),
      new BABYLON.Vector3(-2, 0, 0),
    ];
    let myPath: BABYLON.Vector3[] = [];
    myShape.push(myShape[0]); //close profile
    if (segment instanceof LinearTrackSegment) {
      myPath = [
        new BABYLON.Vector3(segment.start.x, 0, -segment.start.y),
        new BABYLON.Vector3(segment.end.x, 0, -segment.end.y),
      ];
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
      const segmentCount = Math.floor(segment.length / 3);
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

    const extrusion = BABYLON.MeshBuilder.ExtrudeShape(
      "squareb",
      {
        shape: myShape,
        path: myPath,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
        scale: 0.3,
      },
      this.#scene,
    );
    var myMaterial = new BABYLON.StandardMaterial("");

    extrusion.convertToFlatShadedMesh();
    myMaterial.diffuseColor = new BABYLON.Color3(0.65, 0.65, 0.65);
    myMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    // myMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    myMaterial.ambientColor = new BABYLON.Color3(0.87, 0.87, 0.87);

    extrusion.material = myMaterial;
  }

  update() {
    this.game.network.trains.forEach((train, i) => {
      this.spheres[i].position.x = train.position.x;
      this.spheres[i].position.z = -train.position.y;
    });
  }
}

export default BabylonRenderer;
