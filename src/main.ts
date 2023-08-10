import "./style.css";
import typescriptLogo from "./typescript.svg";
import viteLogo from "/vite.svg";
import { setupCounter } from "./counter.ts";
import Map from "./renderer/basic/map.ts";
import LinearTrackSegment from "./engine/LinearTrackSegment.ts";
import CircularTrackSegment from "./engine/CircularTrackSegment.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
    <p id="map-holder"></p>
  </div>
`;
const h1 = new LinearTrackSegment({ x: 40, y: 0 }, { x: 0, y: 0 });
const h2 = new LinearTrackSegment({ x: 0, y: 40 }, { x: 40, y: 40 });
const h3 = new LinearTrackSegment({ x: 40, y: 80 }, { x: 0, y: 80 });
const v1 = new LinearTrackSegment({ x: 0, y: 0 }, { x: 0, y: 40 });
const v2 = new LinearTrackSegment({ x: 40, y: 40 }, { x: 40, y: 0 });
const v3 = new LinearTrackSegment({ x: 0, y: 80 }, { x: 0, y: 40 });
const v4 = new LinearTrackSegment({ x: 40, y: 40 }, { x: 40, y: 80 });
h1.connect(v1);
v1.connect(h2);
h2.connect(v2);
v2.connect(h1);
h2.connect(v4);
v4.connect(h3);
h3.connect(v3);
v3.connect(h2);
const q = new CircularTrackSegment(
  { x: 40, y: 0 },
  { x: 40, y: 80 },
  { x: 40, y: 40 },
  false,
);
const q2 = new CircularTrackSegment(
  { x: 0, y: 0 },
  { x: 40, y: 40 },
  { x: 40, y: 0 },
  true,
);
q2.connect(h1);
q2.connect(v1);
q2.connect(h2);
q2.connect(v2);
q.connect(h1);
q.connect(h3);
q.connect(v2);
q.connect(v4);
const network = [h1, h2, h3, v1, v2, v3, v4, q, q2];
const map = new Map(document.querySelector("#map-holder")!, network);

setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
