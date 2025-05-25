import TrackEditor, { EDITOR_STATE } from "./TrackEditor";
import { build as buildComplex } from "../engine/networks/TestingNetworks/Linear";
import React, { useRef, useEffect, useState } from "react";
import TrackSegment from "../engine/TrackSegment";
import TrackSegmentDetail from "./TrackSegmentDetail";
import Network from "../engine/Network";

import Button from "./components/Button";
import ExportPage from "./ExportPage";

const hm = buildComplex().network

const TrackEditorComponent = (props: any) => {
  const divRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);
  const [selectedSegment, setSelectedSegment] = useState<TrackSegment | null>(null);
  const [network, setNetwork] = useState<Network>(hm);
  const [trackEditor, setTrackEditor] = useState<TrackEditor | undefined>(undefined);
  const [editorState, setEditorState] = useState<EDITOR_STATE>(EDITOR_STATE.SELECT);
  const [saveMenuOpen, setSaveMenuOpen] = useState<boolean>(true);

  useEffect(() => {
    const canvas = divRef.current;
    if (trackEditor) {
      trackEditor.network = network;
      trackEditor.update();
    } else {
      const te = new TrackEditor({element: canvas!, network: network, onSelect: (seg) => {
        setSelectedSegment(seg || null);
      }});
      te.onStateChanged = (payload) => {
        setEditorState(payload.state);
      }
      te.onNetworkChanged = () => {
        setNetwork(te.network);
      }
      te.update();
      setTrackEditor(te);
    }
  }, [network]);

  useEffect(() => {
    if (trackEditor && (editorState === EDITOR_STATE.SELECT || editorState === EDITOR_STATE.CREATE_LINEAR_SEGMENT_START || editorState === EDITOR_STATE.CREATE_CONNECTION_START || editorState === EDITOR_STATE.CREATE_STATION)) {
      trackEditor.setStatePayload({
        state: editorState
      })
    }
  }, [editorState]);

  return <>
    <Button selected={(editorState === EDITOR_STATE.SELECT)} value="Select" onClick={() => setEditorState(EDITOR_STATE.SELECT)} />
    <Button selected={(editorState === EDITOR_STATE.CREATE_STATION)} value="Add Station" onClick={() => setEditorState(EDITOR_STATE.CREATE_STATION)} />
    <Button selected={(editorState === EDITOR_STATE.CREATE_LINEAR_SEGMENT_START || editorState === EDITOR_STATE.CREATE_LINEAR_SEGMENT_END)} value="Add Linear" onClick={() => setEditorState(EDITOR_STATE.CREATE_LINEAR_SEGMENT_START)} />
    <Button selected={(editorState === EDITOR_STATE.CREATE_CONNECTION_START || editorState === EDITOR_STATE.CREATE_CONNECTION_END)} value="Add Connection" onClick={() => setEditorState(EDITOR_STATE.CREATE_CONNECTION_START)} />
    <div ref={divRef} {...props}/>

    {selectedSegment && <TrackSegmentDetail update={(n) => {
      setNetwork(n);
    }} segmentIndex={network.segments.indexOf(selectedSegment)} network={network}/>}
    <Button selected={saveMenuOpen} value="Save/Load" onClick={() => setSaveMenuOpen(!saveMenuOpen)} />
    {saveMenuOpen && trackEditor && <ExportPage trackEditor={trackEditor} />}
  </>;
}

export default TrackEditorComponent;