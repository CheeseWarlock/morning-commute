import * as BABYLON from "@babylonjs/core";
import Game from "../../../engine/Game";

export class GroundManager {
  private scene: BABYLON.Scene;
  private game: Game;
  private groundMaterial: BABYLON.StandardMaterial;
  private ground: BABYLON.Mesh;

  constructor(scene: BABYLON.Scene, game: Game, padding: number) {
    this.scene = scene;
    this.game = game;

    // Create ground material
    this.groundMaterial = new BABYLON.StandardMaterial("");
    this.groundMaterial.diffuseColor = new BABYLON.Color3(0.41, 0.65, 0.29);
    this.groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    this.groundMaterial.ambientColor = new BABYLON.Color3(0.77, 0.77, 0.77);

    // Initialize ground
    const gameBounds = this.game.network.getBounds();

    this.ground = BABYLON.Mesh.CreateGround(
      "ground1",
      gameBounds.max.x - gameBounds.min.x + padding,
      gameBounds.max.y - gameBounds.min.y + padding,
      2,
      this.scene,
      false,
    );

    this.ground.material = this.groundMaterial;
    this.ground.position.x = (gameBounds.max.x + gameBounds.min.x) / 2;
    this.ground.position.y = -1;
    this.ground.position.z = -(gameBounds.max.y + gameBounds.min.y) / 2;
  }

  cleanup() {
    this.groundMaterial.dispose();
    this.ground.dispose();
  }
}
