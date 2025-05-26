import React from "react";
import { createRoot } from "react-dom/client";
import TrackEditorComponent from "./TrackEditorComponent";
import "./style.css";

const container = document.querySelector<HTMLDivElement>("#root");
const root = createRoot(container!);
root.render(<TrackEditorComponent />);
