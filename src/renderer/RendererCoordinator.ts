import Game from "../engine/Game";
import IRenderer from "./basic/IRenderer";

class RendererCoordinator {
  game: Game;
  renderers: IRenderer[];
  #lastTime: number = 0;

  constructor(game: Game, renderers: IRenderer[] = []) {
    this.game = game;
    this.renderers = renderers;
    requestAnimationFrame((cb) => {
      // this.#lastTime = cb;
      this.update(0);
    });
  }

  update(deltaT: number) {
    this.game.update(deltaT);
    this.renderers.forEach((renderer) => {
      renderer.update();
    });
    requestAnimationFrame((cb) => {
      const deltaT = cb - this.#lastTime;
      this.update(deltaT);
      this.#lastTime = cb;
    });
  }
}

export default RendererCoordinator;
