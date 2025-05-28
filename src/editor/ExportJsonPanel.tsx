import React from "react";
import Network from "../engine/Network";
import Panel from "./components/Panel";

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
    <Panel title="Network JSON" onClose={props.onClose}>
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
    </Panel>
  );
};

export default ExportJsonPanel;
