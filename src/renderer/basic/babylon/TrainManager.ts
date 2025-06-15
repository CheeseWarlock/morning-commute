import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import Game, { TRAIN_STRATEGIES } from "../../../engine/Game";

export class TrainManager {
  private scene: BABYLON.Scene;
  private game: Game;
  private trainMeshes: BABYLON.Mesh[][] = [];
  private turnArrowSprite?: BABYLON.Sprite;
  private arrowSpriteManager: BABYLON.SpriteManager;
  private frontCarTemplate?: BABYLON.Mesh;
  private followingCarTemplate?: BABYLON.Mesh;
  private isReady: boolean = false;
  public loadingPromise: Promise<void>;
  private trainTexts: GUI.TextBlock[] = [];
  private arrowPulseAnimation?: BABYLON.Animation;

  constructor(
    scene: BABYLON.Scene,
    game: Game,
    arrowSpriteManager: BABYLON.SpriteManager,
  ) {
    this.scene = scene;
    this.game = game;
    this.arrowSpriteManager = arrowSpriteManager;

    // Create arrow pulse animation
    this.arrowPulseAnimation = new BABYLON.Animation(
      "arrowPulse",
      "width",
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
    );
    this.arrowPulseAnimation.setKeys([
      { frame: 0, value: 15 },
      { frame: 15, value: 20 },
      { frame: 30, value: 15 },
    ]);

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
    });
  }

  async createTrainTexts(advancedTexture: GUI.AdvancedDynamicTexture) {
    await this.loadingPromise;
    this.game.gameState.trains.forEach((_train, index) => {
      const text = new GUI.TextBlock();
      text.text = `Train ${String.fromCharCode(65 + index)}`;
      text.color = "white";
      text.isVisible = true;
      text.fontSize = 20;
      text.outlineWidth = 1;
      text.outlineColor = "black";
      text.shadowBlur = 5;
      text.shadowColor = "black";
      text.shadowOffsetX = 2;
      text.shadowOffsetY = 2;

      // Get the first car mesh (front car) of this train
      const trainMeshes = this.getTrainMeshes()[index];
      if (trainMeshes && trainMeshes[0]) {
        advancedTexture.addControl(text);
        text.linkWithMesh(trainMeshes[0]);
        text.linkOffsetY = -20; // Position above the train
      }

      this.trainTexts.push(text);
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

      // Update train selection and turn arrow
      if (train === this.game.selectedTrain) {
        if (!this.turnArrowSprite) {
          const arrow = new BABYLON.Sprite("arrow", this.arrowSpriteManager);
          arrow.width = 15;
          arrow.height = 15;
          this.turnArrowSprite = arrow;
          this.scene.beginDirectAnimation(
            arrow,
            [this.arrowPulseAnimation!],
            0,
            30,
            true,
          );
        }

        // Position arrow above the junction
        this.turnArrowSprite.position = new BABYLON.Vector3(
          train.nextJunction.position.x,
          5, // Higher up
          -train.nextJunction.position.y,
        );

        const direction = this.game.turnStrategies.get(this.game.selectedTrain);
        if (direction === TRAIN_STRATEGIES.TURN_LEFT) {
          this.turnArrowSprite.angle = 0.8;
          this.turnArrowSprite.isVisible = true;
          this.turnArrowSprite.color = new BABYLON.Color4(0, 1, 0, 1); // Green
        } else if (direction === TRAIN_STRATEGIES.TURN_RIGHT) {
          this.turnArrowSprite.angle = -0.8;
          this.turnArrowSprite.isVisible = true;
          this.turnArrowSprite.color = new BABYLON.Color4(1, 0, 0, 1); // Red
        } else {
          this.turnArrowSprite.isVisible = false;
        }

        // Adjust arrow angle based on camera and junction
        this.turnArrowSprite.angle -= (
          this.scene.activeCamera as BABYLON.ArcRotateCamera
        ).alpha;
        this.turnArrowSprite.angle -= train.nextJunction.angle;
        this.turnArrowSprite.angle += Math.PI;
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

    // Update text sizes based on selection
    this.game.gameState.trains.forEach((train, index) => {
      const text = this.trainTexts[index];
      if (text) {
        text.isVisible = this.game.selectedTrain === train;
      }
    });
  }

  cleanup() {
    this.trainMeshes.forEach((meshes) => {
      meshes.forEach((mesh) => mesh.dispose());
    });
    this.trainMeshes = [];
    this.turnArrowSprite?.dispose();
    this.frontCarTemplate?.dispose();
    this.followingCarTemplate?.dispose();
  }

  getTrainMeshes(): BABYLON.Mesh[][] {
    return this.trainMeshes;
  }
}
