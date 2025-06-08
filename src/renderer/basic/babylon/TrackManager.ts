import * as BABYLON from "@babylonjs/core";
import Game from "../../../engine/Game";
import TrackSegment from "../../../engine/TrackSegment";
import LinearTrackSegment from "../../../engine/LinearTrackSegment";
import CircularTrackSegment from "../../../engine/CircularTrackSegment";

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

export class TrackManager {
  private scene: BABYLON.Scene;
  private game: Game;
  private trackGroundMaterial: BABYLON.StandardMaterial;
  private trackMaterial: BABYLON.StandardMaterial;

  constructor(scene: BABYLON.Scene, game: Game) {
    this.scene = scene;
    this.game = game;

    // Create materials
    this.trackGroundMaterial = new BABYLON.StandardMaterial("");
    this.trackGroundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.46, 0.44);
    this.trackGroundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    this.trackGroundMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);

    this.trackMaterial = new BABYLON.StandardMaterial("");
    this.trackMaterial.diffuseColor = new BABYLON.Color3(0.73, 0.73, 0.73);
    this.trackMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    this.trackMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);

    this.createTrackGeometry();
  }

  private createTrackGeometry() {
    this.game.network.segments.forEach((segment) => {
      this.convertTrackSegmentToGeometry(segment);
    });
  }

  private convertTrackSegmentToGeometry(segment: TrackSegment) {
    const myPath: BABYLON.Vector3[] = [];
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
      this.scene,
    );
    flatExtrustion.convertToFlatShadedMesh();
    flatExtrustion.material = this.trackGroundMaterial;

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
      this.scene,
    );
    lExtru.convertToFlatShadedMesh();
    lExtru.material = this.trackMaterial;

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
      this.scene,
    );
    rExtru.convertToFlatShadedMesh();
    rExtru.material = this.trackMaterial;
  }

  cleanup() {
    this.trackGroundMaterial.dispose();
    this.trackMaterial.dispose();
  }
}
