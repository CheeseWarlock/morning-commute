import React, { useState } from "react";
import Button from "./components/Button";
import LoadJsonPanel from "./LoadJsonPanel";
import ExportPage from "./ExportJsonPanel";
import Network from "../engine/Network";
import TrackEditor from "./TrackEditor";
import InstructionsPanel from "./InstructionsPanel";
import { loadNetworkFromJSON, JSONTrackSegment } from "../engine/JSONNetworkLoader";

export default function TrackEditorTopBar({ network, isNetworkComplete, trackEditor, setNetwork }: { network: Network, isNetworkComplete: boolean, trackEditor?: TrackEditor, setNetwork: (network: Network) => void }) {
    const [saveMenuOpen, setSaveMenuOpen] = useState<boolean>(false);
    const [loadMenuOpen, setLoadMenuOpen] = useState<boolean>(false);
    const [instructionsMenuOpen, setInstructionsMenuOpen] = useState<boolean>(false);
    return (
      <div className="flex items-center p-2 bg-zinc-50 border-b border-zinc-200 shadow-sm">
        <div className="flex-1">
        <Button
            disabled={!isNetworkComplete}
            value="▶ Run Game"
            onClick={() => trackEditor?.finish()}
          />
        </div>
        {/* Center Title */}
        <div className="flex-none text-2xl font-bold text-center" style={{ minWidth: 0 }}>
          Track Editor
        </div>
        {/* Right Actions */}
        <div className="flex-1 flex justify-end gap-2">
        <Button
            value="Instructions"
            onClick={() => setInstructionsMenuOpen(true)}
          />
          <Button
            value="Load from JSON"
            onClick={() => setLoadMenuOpen(true)}
          />
          <Button
            selected={saveMenuOpen}
            value="View JSON"
            onClick={() => setSaveMenuOpen(true)}
          />
        </div>
        {instructionsMenuOpen && (
          <InstructionsPanel onClose={() => setInstructionsMenuOpen(false)} />
        )}
        {saveMenuOpen && trackEditor && (
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
                alert("Invalid JSON");
              }
            }}
          />
        )}
      </div>
    );
}