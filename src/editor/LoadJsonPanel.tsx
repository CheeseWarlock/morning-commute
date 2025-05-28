import React, { useState } from "react";
import Panel from "./components/Panel";

const LoadJsonPanel = ({ onClose, onLoad }: { onClose: () => void, onLoad: (json: string) => void }) => {
  const [value, setValue] = useState("");
  return (
    <Panel title="Load from JSON" onClose={onClose}>
      <textarea
        className="flex-1 resize-none h-full mt-4 font-mono text-xs bg-gray-100 border-2 border-gray-300 rounded-md p-2"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Paste your JSON here..."
      />
      <button
        className="mt-4 px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700"
        onClick={() => onLoad(value)}
      >
        Load
      </button>
    </Panel>
  );
};

export default LoadJsonPanel; 