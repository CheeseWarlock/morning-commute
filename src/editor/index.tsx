import React from 'react';
import { createRoot } from 'react-dom/client';
import TrackEditorComponent from "./TrackEditorComponent";
import './style.css';

const container = createRoot(document.querySelector<HTMLDivElement>("#root")!);
container.render(<><TrackEditorComponent /></>
);