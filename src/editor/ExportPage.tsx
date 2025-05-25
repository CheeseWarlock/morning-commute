import React, { useState } from "react";
import Button from "./components/Button";
import TrackEditor from "./TrackEditor";

const ExportPage = (props: { trackEditor: TrackEditor }) => {
  const [networkJSON] = useState(`[${props.trackEditor.network.segments.map(seg => seg.toJSON())}]`);
  const canFinish = props.trackEditor.network.segments.filter(seg => seg.atEnd.length > 0 && seg.atStart.length > 0).length === props.trackEditor.network.segments.length;
  console.log(canFinish);
  return <>
  <div className="m-5">Export</div>
    {canFinish && <Button value="Run Game" onClick={() => props.trackEditor.finish()}/>}
    <textarea defaultValue={networkJSON} />
  </>
}

export default ExportPage;