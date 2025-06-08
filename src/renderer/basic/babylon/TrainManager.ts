import * as BABYLON from "@babylonjs/core";
import Game, { TRAIN_STRATEGIES } from "../../../engine/Game";

export class TrainManager {
  private scene: BABYLON.Scene;
  private game: Game;
  private trainMaterial: BABYLON.StandardMaterial;
  private trainFollowingMaterial: BABYLON.StandardMaterial;
  private trainMeshes: BABYLON.Mesh[][] = [];
  private trainNumberSprites: BABYLON.Sprite[] = [];
  private numberSpriteManager: BABYLON.SpriteManager;
  private turnArrowSprite?: BABYLON.Sprite;
  private arrowSpriteManager: BABYLON.SpriteManager;

  constructor(
    scene: BABYLON.Scene,
    game: Game,
    numberSpriteManager: BABYLON.SpriteManager,
    arrowSpriteManager: BABYLON.SpriteManager,
  ) {
    this.scene = scene;
    this.game = game;
    this.numberSpriteManager = numberSpriteManager;
    this.arrowSpriteManager = arrowSpriteManager;

    // Create materials
    this.trainMaterial = new BABYLON.StandardMaterial("trainMaterial");
    this.trainMaterial.diffuseColor = new BABYLON.Color3(1, 0.15, 0.15);
    this.trainFollowingMaterial = new BABYLON.StandardMaterial(
      "trainFollowingMaterial",
    );
    this.trainFollowingMaterial.diffuseColor = new BABYLON.Color3(1, 0.15, 1);

    this.createTrainMeshes();
  }

  private createTrainMeshes() {
    this.game.gameState.trains.forEach((train) => {
      const theseSpheres: BABYLON.Mesh[] = [];
      const sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere2",
        {
          diameter: 4,
        },
        this.scene,
      );
      sphere.material = this.trainMaterial;
      theseSpheres.push(sphere);
      sphere.position.y = 2;
      train.followingCars.forEach(() => {
        const sphere = BABYLON.MeshBuilder.CreateSphere(
          "sphere2",
          {
            diameter: 4,
          },
          this.scene,
        );
        sphere.material = this.trainFollowingMaterial;
        theseSpheres.push(sphere);
        sphere.position.y = 2;
      });

      this.trainMeshes.push(theseSpheres);

      // Create train number sprite
      this.trainNumberSprites.push(
        new BABYLON.Sprite("", this.numberSpriteManager),
      );
    });
  }

  update() {
    this.game.gameState.trains.forEach((train, i) => {
      const theseSpheres = this.trainMeshes[i];
      const thisNumber = this.trainNumberSprites[i];

      // Update number sprite
      thisNumber.position = new BABYLON.Vector3(
        train.position.x,
        10,
        -train.position.y,
      );
      thisNumber.width = 5;
      thisNumber.height = 10;
      thisNumber.cellIndex = (train.passengers.length + 9) % 10;

      // Update train selection and turn arrow
      if (train === this.game.selectedTrain) {
        if (!this.turnArrowSprite) {
          const tree = new BABYLON.Sprite("tree", this.arrowSpriteManager);
          tree.width = 10;
          tree.height = 10;
          this.turnArrowSprite = tree;
        }

        this.turnArrowSprite.position = new BABYLON.Vector3(
          train.nextJunction.position.x,
          2,
          -train.nextJunction.position.y,
        );

        const direction = this.game.turnStrategies.get(this.game.selectedTrain);
        if (direction === TRAIN_STRATEGIES.TURN_LEFT) {
          this.turnArrowSprite.angle = 0.8;
          this.turnArrowSprite.isVisible = true;
        } else if (direction === TRAIN_STRATEGIES.TURN_RIGHT) {
          this.turnArrowSprite.angle = -0.8;
          this.turnArrowSprite.isVisible = true;
        } else {
          this.turnArrowSprite.isVisible = false;
        }

        this.turnArrowSprite.angle -= (
          this.scene.activeCamera as BABYLON.ArcRotateCamera
        ).alpha;
        this.turnArrowSprite.angle -= train.nextJunction.angle;
        this.turnArrowSprite.angle += Math.PI;

        // Highlight selected train
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

      // Update train and car positions
      theseSpheres[0].position.x = train.position.x;
      theseSpheres[0].position.z = -train.position.y;
      train.followingCars.forEach((car, i) => {
        theseSpheres[i + 1].position.x = car.position.x;
        theseSpheres[i + 1].position.z = -car.position.y;
      });
    });
  }

  cleanup() {
    this.trainMeshes.forEach((meshes) => {
      meshes.forEach((mesh) => mesh.dispose());
    });
    this.trainMeshes = [];
    this.trainNumberSprites.forEach((sprite) => sprite.dispose());
    this.trainNumberSprites = [];
    this.turnArrowSprite?.dispose();
    this.trainMaterial.dispose();
    this.trainFollowingMaterial.dispose();
  }
}
