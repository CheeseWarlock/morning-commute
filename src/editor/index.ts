import TrackEditor from "./TrackEditor";
import { build as buildComplex } from "../engine/networks/Complex";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div id="editor-holder">
  </div>
`;

const network = buildComplex().network;

const editor = new TrackEditor(
  document.querySelector("#editor-holder")!,
  network,
);

editor.update();
