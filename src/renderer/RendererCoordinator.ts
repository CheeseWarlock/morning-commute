import Game from "../engine/Game";
import BabylonRenderer from "./basic/babylon/BabylonRenderer";
import IRenderer from "./basic/IRenderer";

class RendererCoordinator {
  game: Game;
  renderers: IRenderer[];
  #lastTime: number = 0;
  frameRequest: number;

  constructor(game: Game, renderers: IRenderer[] = []) {
    this.game = game;
    this.renderers = renderers;
    this.frameRequest = requestAnimationFrame((cb) => {
      this.#lastTime = cb;
      this.update(0);
    });
  }

  update(deltaT: number) {
    this.game.update(deltaT);
    this.renderers.forEach((renderer) => {
      renderer.update();
    });
    this.frameRequest = requestAnimationFrame((cb) => {
      const deltaT = cb - this.#lastTime;
      this.update(deltaT);
      this.#lastTime = cb;
    });
  }

  stop() {
    this.renderers.forEach((renderer) => {
      if (renderer instanceof BabylonRenderer) {
        renderer.cleanup();
      }
    });
    cancelAnimationFrame(this.frameRequest);
  }
}

export default RendererCoordinator;
