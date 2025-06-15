import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import Game from "../../../engine/Game";
import { ALIGNMENT } from "../../../engine/Station";

export class StationManager {
  private scene: BABYLON.Scene;
  private game: Game;
  private stationMaterial: BABYLON.StandardMaterial;
  private stationTexts: GUI.TextBlock[][] = [];

  constructor(scene: BABYLON.Scene, game: Game) {
    this.scene = scene;
    this.game = game;

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
    });
  }

  createStationTexts(advancedTexture: GUI.AdvancedDynamicTexture) {
    this.game.network.stations.forEach((station, index) => {
      // Create container for station text
      const container = new GUI.Container();
      container.name = `station_${index}`;
      container.height = "60px";
      container.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

      // Station name text
      const nameText = new GUI.TextBlock();
      nameText.name = "nameText";
      nameText.text = station.name;
      nameText.color = "white";
      nameText.fontSize = 16;
      nameText.outlineWidth = 1;
      nameText.outlineColor = "black";
      nameText.shadowBlur = 5;
      nameText.shadowColor = "black";
      nameText.shadowOffsetX = 2;
      nameText.shadowOffsetY = 2;
      nameText.height = "24px";
      nameText.top = -10;
      container.addControl(nameText);

      // Waiting passengers text
      const waitingText = new GUI.TextBlock();
      waitingText.name = "waitingText";
      const waitingPassengers =
        this.game.gameState.waitingPassengers.get(station) || [];
      waitingText.text = `${waitingPassengers.length} waiting`;
      waitingText.color = "white";
      waitingText.fontSize = 12;
      waitingText.outlineWidth = 1;
      waitingText.outlineColor = "black";
      waitingText.shadowBlur = 5;
      waitingText.shadowColor = "black";
      waitingText.shadowOffsetX = 2;
      waitingText.shadowOffsetY = 2;
      waitingText.height = "20px";
      waitingText.top = 10;
      container.addControl(waitingText);

      // Create a mesh to link the text to
      const stationMesh = BABYLON.MeshBuilder.CreateBox(
        "stationTextAnchor",
        { width: 0.1, height: 0.1, depth: 0.1 },
        this.scene,
      );
      stationMesh.position = new BABYLON.Vector3(
        station.position.x,
        5, // Height above station
        -station.position.y,
      );
      stationMesh.isVisible = false; // Hide the anchor mesh

      if (advancedTexture) {
        advancedTexture.addControl(container);
        container.linkWithMesh(stationMesh);
        container.linkOffsetY = -20; // Position above the station
      }
      this.stationTexts.push([nameText, waitingText]);
    });
  }

  update() {
    this.game.network.stations.forEach((station, index) => {
      const waitingText = this.stationTexts[index][1];
      if (waitingText) {
        const waitingPassengers =
          this.game.gameState.waitingPassengers.get(station) || [];
        waitingText.text = `${waitingPassengers.length} waiting`;
      }
    });
  }

  cleanup() {
    this.stationMaterial.dispose();
  }
}
