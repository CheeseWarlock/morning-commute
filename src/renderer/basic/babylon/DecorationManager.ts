import * as BABYLON from "@babylonjs/core";
import { createNoise2D } from "simplex-noise";
import Game from "../../../engine/Game";

export class DecorationManager {
  private scene: BABYLON.Scene;
  private game: Game;
  private treeMesh?: BABYLON.Mesh;
  private treeInstances: BABYLON.InstancedMesh[] = [];

  constructor(scene: BABYLON.Scene, game: Game) {
    this.scene = scene;
    this.game = game;
    this.loadTreeMesh();
  }

  private loadTreeMesh() {
    // Create texture with nearest-neighbor sampling
    const treeTexture = new BABYLON.Texture(
      "src/renderer/basic/babylon/models/tree.png",
      this.scene,
      false,
      true,
      BABYLON.Texture.NEAREST_LINEAR,
    );

    BABYLON.SceneLoader.ImportMesh(
      null,
      "src/renderer/basic/babylon/models/",
      "tree.obj",
      this.scene,
      (meshes) => {
        const treeMesh = meshes[0];
        if (!(treeMesh instanceof BABYLON.Mesh)) {
          console.error("Loaded tree is not a mesh");
          return;
        }

        // Apply the texture to the material
        if (treeMesh.material) {
          const material = treeMesh.material as BABYLON.StandardMaterial;
          material.diffuseTexture = treeTexture;
        }

        // Hide the original mesh
        treeMesh.setEnabled(false);
        this.treeMesh = treeMesh;
        this.placeTrees();
      },
    );
  }

  private placeTrees() {
    if (!this.treeMesh) return;

    const TREES_TO_PLACE = 1000;
    const MAX_ATTEMPTS = 2000;
    const MIN_DISTANCE = 4;
    let treesRemaining = TREES_TO_PLACE;
    let attempts = 0;

    // Create noise sampler
    const noise2D = createNoise2D();
    const NOISE_SCALE = 0.01; // Adjust this to change the size of noise features

    const gameBounds = this.game.network.getBounds();

    // Now place instances
    while (treesRemaining > 0 && attempts < MAX_ATTEMPTS) {
      attempts++;

      // Generate random position within bounds
      const x =
        gameBounds.min.x +
        Math.random() * (gameBounds.max.x - gameBounds.min.x);
      const y =
        gameBounds.min.y +
        Math.random() * (gameBounds.max.y - gameBounds.min.y);

      // Use simplex noise to determine if we should place a tree here
      const noiseValue = noise2D(x * NOISE_SCALE, y * NOISE_SCALE);
      if (noiseValue < 0.5) continue; // Skip if noise value is too low

      // Check distance to all track segments
      let tooClose = false;
      for (const segment of this.game.network.segments) {
        const result = segment.distanceToPosition({ x, y });
        if (result.distance < MIN_DISTANCE) {
          tooClose = true;
          break;
        }
      }

      // Place tree if not too close to any track
      if (!tooClose) {
        const instance = this.treeMesh.createInstance("treeInstance");
        instance.position = new BABYLON.Vector3(x, 0, -y);

        // Random rotation around Y axis
        instance.rotation.y = Math.random() * Math.PI * 2;

        // Random scale variation between 0.8 and 1.7
        const scaleVariation = 0.8 + Math.random() * 0.9;
        const yScaleVariation = 0.8 + Math.random() * 0.9;
        instance.scaling = new BABYLON.Vector3(
          10 * scaleVariation,
          10 * yScaleVariation,
          10 * scaleVariation,
        );

        this.treeInstances.push(instance);
        treesRemaining--;
      }
    }
  }

  cleanup() {
    this.treeInstances.forEach((instance) => instance.dispose());
    this.treeInstances = [];
    this.treeMesh?.dispose();
  }
}
