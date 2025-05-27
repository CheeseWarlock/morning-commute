import React, { useState } from "react";
import Button from "./components/Button";
import TrackEditor from "./TrackEditor";

const ExportPage = (props: { trackEditor: TrackEditor }) => {
  const [networkJSON] = useState(
    `[${props.trackEditor.network.segments.map((seg) => seg.toJSON())}]`,
  );
  const isNetworkComplete =
    props.trackEditor.network.segments.filter(
      (seg) => seg.atEnd.length > 0 && seg.atStart.length > 0,
    ).length === props.trackEditor.network.segments.length;
  return (
    <>
      <div className="m-5">Export</div>
      {isNetworkComplete && (
        <Button value="Run Game" onClick={() => props.trackEditor.finish()} />
      )}
      <textarea className="font-mono border-2 border-gray-300 rounded-md p-2" defaultValue={networkJSON} />
    </>
  );
};

export default ExportPage;
