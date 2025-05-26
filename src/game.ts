import "./style.css";
import CanvasRenderer from "./renderer/basic/CanvasRenderer.ts";
import network from "./engine/networks/Complex.ts";
import Game from "./engine/Game.ts";
import RendererCoordinator from "./renderer/RendererCoordinator.ts";
import BabylonRenderer from "./renderer/basic/babylon/BabylonRenderer.ts";
import Controller from "./engine/Controller.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <p id="map-holder"></p><p id="map-holder-2"></p><p id="renderCanvasHolder"></p>
  </div>
`;
network.autoConnect();
const controller = new Controller();
const game = new Game(network, controller);
game.initialize();
const map = new CanvasRenderer(
  document.querySelector("#map-holder")!,
  game,
  { x: 0, y: 0 },
  1,
  { x: 400, y: 300 },
);
const map2 = new CanvasRenderer(
  document.querySelector("#map-holder-2")!,
  game,
  { x: 0, y: 0 },
  2,
  { x: 600, y: 300 },
);
const map3 = new BabylonRenderer(
  document.querySelector("#renderCanvasHolder")!,
  game,
);
const coordinator = new RendererCoordinator(game, [map, map2, map3]);
