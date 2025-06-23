import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import Game from "../../../engine/Game";
import { ALIGNMENT } from "../../../engine/Station";

export class StationManager {
  private scene: BABYLON.Scene;
  private game: Game;
  private stationMeshes: BABYLON.AbstractMesh[] = [];
  private stationTexts: GUI.TextBlock[][] = [];

  constructor(scene: BABYLON.Scene, game: Game) {
    this.scene = scene;
    this.game = game;

    this.createStations();
  }

  private async createStations() {
    try {
      // Load the station model
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        "/models/",
        "station.obj",
        this.scene,
      );

      if (result.meshes.length === 0) {
        console.error("Failed to load station model");
        return;
      }

      this.game.network.stations.forEach((station, index) => {
        // Create a parent mesh for this station instance
        const stationParent = new BABYLON.Mesh(
          `station_${index}_parent`,
          this.scene,
        );

        // Clone all meshes and parent them to the station parent
        result.meshes.forEach((originalMesh, meshIndex) => {
          const clonedMesh = originalMesh.clone(
            `station_${index}_mesh_${meshIndex}`,
            null,
            true,
          );
          if (meshIndex === 1 && clonedMesh) {
            clonedMesh.position.y = 1.1;
          }
          if (clonedMesh) {
            clonedMesh.parent = stationParent;
          }
        });

        // Position the station
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

        // Set position and rotation for the entire model
        stationParent.position.x = targetPosition.x;
        stationParent.position.z = -targetPosition.y;
        stationParent.rotation.y = angleFromForward + Math.PI / 2;

        // Scale the station to appropriate size
        stationParent.scaling = new BABYLON.Vector3(1, 1, 1);

        this.stationMeshes.push(stationParent);
      });

      // Hide the original meshes
      result.meshes.forEach((mesh) => {
        mesh.setEnabled(false);
        mesh.isVisible = false;
      });
    } catch (error) {
      console.error("Error loading station model:", error);
      // Fallback to simple geometry if model loading fails
      this.createFallbackStations();
    }
  }

  private createFallbackStations() {
    // Create a simple fallback station material
    const fallbackMaterial = new BABYLON.StandardMaterial("");
    fallbackMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.6, 1);
    fallbackMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    fallbackMaterial.ambientColor = new BABYLON.Color3(0.77, 0.77, 0.77);

    this.game.network.stations.forEach((station) => {
      // Create simple box as fallback
      const stationMesh = BABYLON.MeshBuilder.CreateBox(
        `fallback_station_${station.name}`,
        { width: 4, height: 3, depth: 4 },
        this.scene,
      );

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

      stationMesh.position.x = targetPosition.x;
      stationMesh.position.z = -targetPosition.y;
      stationMesh.rotation.y = angleFromForward + Math.PI / 2;
      stationMesh.material = fallbackMaterial;

      this.stationMeshes.push(stationMesh);
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
    this.stationMeshes.forEach((mesh) => {
      mesh.dispose();
    });
  }
}
