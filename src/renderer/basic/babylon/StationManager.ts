import * as BABYLON from "@babylonjs/core";
import Game from "../../../engine/Game";
import { ALIGNMENT } from "../../../engine/Station";

export class StationManager {
  private scene: BABYLON.Scene;
  private game: Game;
  private stationMaterial: BABYLON.StandardMaterial;
  private stationNumberSprites: BABYLON.Sprite[][] = [];
  private numberSpriteManager: BABYLON.SpriteManager;
  private camera: BABYLON.Camera;

  constructor(
    scene: BABYLON.Scene,
    game: Game,
    numberSpriteManager: BABYLON.SpriteManager,
    camera: BABYLON.Camera,
  ) {
    this.scene = scene;
    this.game = game;
    this.numberSpriteManager = numberSpriteManager;
    this.camera = camera;

    // Create station material
    this.stationMaterial = new BABYLON.StandardMaterial("");
    this.stationMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.6, 1);
    this.stationMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    this.stationMaterial.ambientColor = new BABYLON.Color3(0.77, 0.77, 0.77);

    this.createStations();
  }

  private createStations() {
    this.game.network.stations.forEach((station) => {
      // Create station building
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
        this.scene,
      );
      extrusion.position.x = targetPosition.x;
      extrusion.position.z = -targetPosition.y;
      extrusion.rotation.y = angleFromForward + Math.PI / 2;
      extrusion.convertToFlatShadedMesh();
      extrusion.material = this.stationMaterial;

      // Create station number sprites
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
  }

  update() {
    this.game.network.stations.forEach((station, i) => {
      const waitingPassengers =
        this.game.gameState.waitingPassengers.get(station)!;
      this.stationNumberSprites[i][0].cellIndex =
        (waitingPassengers.length + 9) % 10;
      this.stationNumberSprites[i][1].cellIndex =
        (Math.floor(waitingPassengers.length / 10) + 9) % 10;

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
  }

  cleanup() {
    this.stationMaterial.dispose();
  }
}
