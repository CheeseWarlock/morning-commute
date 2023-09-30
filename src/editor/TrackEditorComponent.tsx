import TrackEditor, { EDITOR_STATE } from "./TrackEditor";
import { build as buildComplex } from "../engine/networks/TestingNetworks/Linear";
import React, { useRef, useEffect, useState } from "react";
import TrackSegment from "../engine/TrackSegment";
import TrackSegmentDetail from "./TrackSegmentDetail";
import Network from "../engine/Network";

const hm = buildComplex().network

const TrackEditorComponent = (props: any) => {
  const divRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);
  const [selectedSegment, setSelectedSegment] = useState<TrackSegment | null>(null);
  const [network, setNetwork] = useState<Network>(hm);
  const [trackEditor, setTrackEditor] = useState<TrackEditor | undefined>(undefined);
  const [editorState, setEditorState] = useState<EDITOR_STATE>(EDITOR_STATE.SELECT);

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
    <div ref={divRef} {...props}/>
    <input value={(editorState === EDITOR_STATE.SELECT ? ">" : "") + "Select"} type="button" onClick={() => setEditorState(EDITOR_STATE.SELECT)} />
    <input value={(editorState === EDITOR_STATE.CREATE_STATION ? ">" : "") + "Add Station"} type="button" onClick={() => setEditorState(EDITOR_STATE.CREATE_STATION)} />
    <input value={(editorState === EDITOR_STATE.CREATE_LINEAR_SEGMENT_START || editorState === EDITOR_STATE.CREATE_LINEAR_SEGMENT_END ? ">" : "") + "Add Linear"} type="button" onClick={() => setEditorState(EDITOR_STATE.CREATE_LINEAR_SEGMENT_START)} />
    <input value={(editorState === EDITOR_STATE.CREATE_CONNECTION_START || editorState === EDITOR_STATE.CREATE_CONNECTION_END ? ">" : "") + "Add Connection"} type="button" onClick={() => setEditorState(EDITOR_STATE.CREATE_CONNECTION_START)} />
    <input value={"Finish"} type="button" onClick={() => trackEditor?.finish()} />
    <p>{network.segments.length}</p>
    {selectedSegment && <TrackSegmentDetail update={(n) => {
      setNetwork(n);
    }} segmentIndex={network.segments.indexOf(selectedSegment)} network={network}/>}
  </>;
}

export default TrackEditorComponent;