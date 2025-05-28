import React from "react";
import Network from "../engine/Network";

const ExportJsonPanel = (props: { network: Network; onClose: () => void }) => {
  const networkJSON = JSON.stringify(props.network.segments.map((seg) => seg.toJSON()), null, 2);
  const [copied, setCopied] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const handleCopy = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };
  return (
    <div className="fixed top-0 right-0 h-full w-[480px] z-50 bg-gray-400 border-l border-gray-700 shadow-xl p-6 flex flex-col" style={{ minWidth: 320 }}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-bold text-white">Network JSON</span>
        <button
          className="text-gray-600 hover:text-white text-2xl font-bold"
          onClick={props.onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="flex-1 flex flex-col overflow-auto">
        <textarea
          ref={textareaRef}
          readOnly
          className="flex-1 resize-none h-full mt-4 font-mono text-xs bg-gray-100 border-2 border-gray-300 rounded-md p-2"
          value={networkJSON}
        />
        <button
          className="mt-4 px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700"
          onClick={handleCopy}
        >
          {copied ? "Copied!" : "Copy to clipboard"}
        </button>
      </div>
    </div>
  );
};

export default ExportJsonPanel;
