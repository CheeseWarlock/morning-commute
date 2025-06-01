import React, { useState } from "react";
import Button from "./components/Button";
import LoadJsonPanel from "./LoadJsonPanel";
import ExportPage from "./ExportJsonPanel";
import Network from "../engine/Network";
import InstructionsPanel from "./InstructionsPanel";
import {
  loadNetworkFromJSON,
  JSONTrackSegment,
} from "../engine/JSONNetworkLoader";
import { EDITOR_PAGE_STATE } from "./TrackEditorPage";

export default function TrackEditorTopBar({
  network,
  isNetworkComplete,
  setNetwork,
  state,
  setState,
}: {
  network: Network;
  isNetworkComplete: boolean;
  setNetwork: (network: Network) => void;
  state: EDITOR_PAGE_STATE;
  setState: (state: EDITOR_PAGE_STATE) => void;
}) {
  const [saveMenuOpen, setSaveMenuOpen] = useState<boolean>(false);
  const [loadMenuOpen, setLoadMenuOpen] = useState<boolean>(false);
  const [instructionsMenuOpen, setInstructionsMenuOpen] =
    useState<boolean>(false);
  return (
    <div className="flex items-center p-2 bg-zinc-50 border-b border-zinc-200 shadow-sm">
      <div className="flex-1">
        <Button
          disabled={!isNetworkComplete || state === EDITOR_PAGE_STATE.GAME}
          value="▶ Run Game"
          onClick={() => setState(EDITOR_PAGE_STATE.GAME)}
        />
        <Button
          disabled={state === EDITOR_PAGE_STATE.EDITOR}
          value="✎ Open Editor"
          onClick={() => setState(EDITOR_PAGE_STATE.EDITOR)}
        />
      </div>
      {/* Center Title */}
      <div
        className="flex-none text-2xl font-bold text-center"
        style={{ minWidth: 0 }}
      >
        Untitled Train Game
      </div>
      {/* Right Actions */}
      <div className="flex-1 flex justify-end gap-2">
        <Button
          value="Instructions"
          onClick={() => setInstructionsMenuOpen(true)}
        />
        <Button value="Load from JSON" onClick={() => setLoadMenuOpen(true)} />
        <Button
          selected={saveMenuOpen}
          value="View JSON"
          onClick={() => setSaveMenuOpen(true)}
        />
      </div>
      {instructionsMenuOpen && (
        <InstructionsPanel onClose={() => setInstructionsMenuOpen(false)} />
      )}
      {saveMenuOpen && (
        <ExportPage network={network} onClose={() => setSaveMenuOpen(false)} />
      )}
      {loadMenuOpen && (
        <LoadJsonPanel
          onClose={() => setLoadMenuOpen(false)}
          onLoad={(json) => {
            try {
              const parsed = JSON.parse(json) as JSONTrackSegment[];
              const loadedNetwork = loadNetworkFromJSON(parsed);
              setNetwork(loadedNetwork);
            } catch (e) {
              console.error("Invalid JSON", e);
            }
          }}
        />
      )}
    </div>
  );
}
