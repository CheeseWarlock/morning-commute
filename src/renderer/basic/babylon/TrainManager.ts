import * as BABYLON from "@babylonjs/core";
import Game, { TRAIN_STRATEGIES } from "../../../engine/Game";

export class TrainManager {
  private scene: BABYLON.Scene;
  private game: Game;
  private trainMeshes: BABYLON.Mesh[][] = [];
  private trainNumberSprites: BABYLON.Sprite[] = [];
  private turnArrowSprite?: BABYLON.Sprite;
  private numberSpriteManager: BABYLON.SpriteManager;
  private arrowSpriteManager: BABYLON.SpriteManager;
  private frontCarTemplate?: BABYLON.Mesh;
  private followingCarTemplate?: BABYLON.Mesh;
  private isReady: boolean = false;
  private loadingPromise: Promise<void>;

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

    // Start loading and store the promise
    this.loadingPromise = this.loadModels();
  }

  private async loadModels() {
    try {
      // Import the OBJ models
      const frontCarResult = await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        "src/renderer/basic/babylon/models/",
        "front_car.obj",
        this.scene,
      );
      const followingCarResult = await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        "src/renderer/basic/babylon/models/",
        "following_car.obj",
        this.scene,
      );

      // Store the templates and hide them
      const frontMesh = frontCarResult.meshes[0];
      const followingMesh = followingCarResult.meshes[0];

      if (
        frontMesh instanceof BABYLON.Mesh &&
        followingMesh instanceof BABYLON.Mesh
      ) {
        this.frontCarTemplate = frontMesh;
        this.followingCarTemplate = followingMesh;
        this.frontCarTemplate.isVisible = false;
        this.followingCarTemplate.isVisible = false;

        // Create the train meshes
        this.createTrainMeshes();
        this.isReady = true;
      } else {
        throw new Error("Imported meshes are not of type Mesh");
      }
    } catch (error) {
      console.error("Failed to load train models:", error);
      // Fallback to simple boxes if models fail to load
      this.createFallbackMeshes();
      this.isReady = true;
    }
  }

  private createTrainMeshes() {
    if (!this.frontCarTemplate || !this.followingCarTemplate) {
      this.createFallbackMeshes();
      return;
    }

    this.game.gameState.trains.forEach((train) => {
      const theseMeshes: BABYLON.Mesh[] = [];

      // Create front car
      const frontCar = this.frontCarTemplate!.clone("frontCar") as BABYLON.Mesh;
      frontCar.scaling = new BABYLON.Vector3(2.5, 2.5, 2.5);
      frontCar.position.y = 1.6;
      frontCar.isVisible = true;
      theseMeshes.push(frontCar);

      // Create following cars
      train.followingCars.forEach(() => {
        const car = this.followingCarTemplate!.clone(
          "followingCar",
        ) as BABYLON.Mesh;
        car.scaling = new BABYLON.Vector3(2.5, 2.5, 2.5);
        car.position.y = 1.6;
        car.isVisible = true;
        theseMeshes.push(car);
      });

      this.trainMeshes.push(theseMeshes);

      // Create train number sprite
      this.trainNumberSprites.push(
        new BABYLON.Sprite("", this.numberSpriteManager),
      );
    });
  }

  private createFallbackMeshes() {
    this.game.gameState.trains.forEach((train) => {
      const theseMeshes: BABYLON.Mesh[] = [];

      // Create front car
      const frontCar = BABYLON.MeshBuilder.CreateBox(
        "frontCar",
        { width: 1, height: 1, depth: 2 },
        this.scene,
      );
      frontCar.position.y = 2;
      theseMeshes.push(frontCar);

      // Create following cars
      train.followingCars.forEach(() => {
        const car = BABYLON.MeshBuilder.CreateBox(
          "followingCar",
          { width: 1, height: 1, depth: 1.6 },
          this.scene,
        );
        car.position.y = 2;
        theseMeshes.push(car);
      });

      this.trainMeshes.push(theseMeshes);

      // Create train number sprite
      this.trainNumberSprites.push(
        new BABYLON.Sprite("", this.numberSpriteManager),
      );
    });
  }

  async update() {
    // Wait for loading to complete if it hasn't already
    if (!this.isReady) {
      await this.loadingPromise;
    }

    // Only proceed with updates if we have meshes
    if (this.trainMeshes.length === 0) {
      return;
    }

    this.game.gameState.trains.forEach((train, i) => {
      const theseMeshes = this.trainMeshes[i];
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
        theseMeshes.forEach((m) => {
          m.renderOutline = true;
          m.outlineWidth = 3;
          m.outlineColor = new BABYLON.Color3(0, 0, 0);
        });
      } else {
        theseMeshes.forEach((m) => {
          m.renderOutline = false;
        });
      }

      // Update train and car positions and rotations
      theseMeshes[0].position.x = train.position.x;
      theseMeshes[0].position.z = -train.position.y;
      theseMeshes[0].rotation.y = train.heading;

      train.followingCars.forEach((car, i) => {
        theseMeshes[i + 1].position.x = car.position.x;
        theseMeshes[i + 1].position.z = -car.position.y;
        theseMeshes[i + 1].rotation.y = car.currentSegment.getAngleAlong(
          car.distanceAlong,
          car.isReversing,
        );
        theseMeshes[i + 1].rotation.y += Math.PI;
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
    this.frontCarTemplate?.dispose();
    this.followingCarTemplate?.dispose();
  }
}
