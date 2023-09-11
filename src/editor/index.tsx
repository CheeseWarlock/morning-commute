import TrackEditor from "./TrackEditor";
import { build as buildComplex } from "../engine/networks/TestingNetworks/DisconnectedLinear";
import React from 'react';
import { createRoot } from 'react-dom/client';

const container = createRoot(document.querySelector<HTMLDivElement>("#root")!);
container.render(<h1>aerfwse</h1>);

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
