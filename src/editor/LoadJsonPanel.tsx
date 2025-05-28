import React, { useState } from "react";
import { JSONTrackSegment, loadNetworkFromJSON } from "../engine/JSONNetworkLoader";
import Network from "../engine/Network";

const LoadJsonPanel = ({ onClose, onLoad }: { onClose: () => void, onLoad: (network: Network) => void }) => {
  const [value, setValue] = useState("");
  const [loaded, setLoaded] = useState(false);
  const handleLoad = () => {
    try {
      const parsed = JSON.parse(value) as JSONTrackSegment[];
      const network = loadNetworkFromJSON(parsed);
      onLoad(network);
      setLoaded(true);
      setTimeout(() => setLoaded(false), 1200);
    } catch (e) {
      // TODO: error handling
      alert("Invalid JSON");
    }
  };
  return (
    <div className="fixed top-0 right-0 h-full w-[480px] z-50 bg-gray-400 border-l border-gray-700 shadow-xl p-6 flex flex-col" style={{ minWidth: 320 }}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-bold text-white">Load from JSON</span>
        <button
          className="text-gray-600 hover:text-white text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="flex-1 flex flex-col overflow-auto">
        <textarea
          className="flex-1 resize-none h-full mt-4 font-mono text-xs bg-gray-100 border-2 border-gray-300 rounded-md p-2"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Paste your JSON here..."
        />
        <button
          className="mt-4 px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700"
          onClick={handleLoad}
        >
          {loaded ? "Loaded!" : "Load"}
        </button>
      </div>
    </div>
  );
};

export default LoadJsonPanel; 