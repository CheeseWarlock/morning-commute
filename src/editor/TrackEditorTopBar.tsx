import React, { useState } from "react";
import Button from "./components/Button";
import LoadJsonPanel from "./LoadJsonPanel";
import ExportPage from "./ExportJsonPanel";
import Network from "../engine/Network";
import TrackEditor from "./TrackEditor";

export default function TrackEditorTopBar({ network, isNetworkComplete, trackEditor, setNetwork }: { network: Network, isNetworkComplete: boolean, trackEditor?: TrackEditor, setNetwork: (network: Network) => void }) {
    const [saveMenuOpen, setSaveMenuOpen] = useState<boolean>(false);
    const [loadMenuOpen, setLoadMenuOpen] = useState<boolean>(false);
    return (
      <div className="flex items-center p-2 bg-slate-50 border-b border-slate-200 shadow-sm">
        {/* Left Spacer */}
        <div className="flex-1" />
        {/* Center Title */}
        <div className="flex-none text-2xl font-bold text-center" style={{ minWidth: 0 }}>
          Track Editor
        </div>
        {/* Right Actions */}
        <div className="flex-1 flex justify-end gap-2">
        <Button
            value="Instructions"
            onClick={() => trackEditor?.finish()}
          />
          <Button
            disabled={!isNetworkComplete}
            value="Run Game"
            onClick={() => trackEditor?.finish()}
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
        {saveMenuOpen && trackEditor && (
          <ExportPage network={network} onClose={() => setSaveMenuOpen(false)} />
        )}
        {loadMenuOpen && (
          <LoadJsonPanel 
            onClose={() => setLoadMenuOpen(false)}
            onLoad={(network) => {
              setNetwork(network);
            }}
          />
        )}
      </div>
    );
}