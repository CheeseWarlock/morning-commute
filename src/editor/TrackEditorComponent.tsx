import TrackEditor, { EDITOR_STATE } from "./TrackEditor";
import { build as buildComplex } from "../engine/networks/TestingNetworks/Linear";
import React, { useRef, useEffect, useState } from "react";
import TrackSegment from "../engine/TrackSegment";
import TrackSegmentDetail from "./TrackSegmentDetail";
import Network from "../engine/Network";

import Button from "./components/Button";
import ExportPage from "./ExportPage";

const hm = buildComplex().network;
hm.autoConnect();

const TrackEditorComponent = (props: any) => {
  const trackEditorContainer = useRef<HTMLDivElement | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<TrackSegment | null>(null);
  const [network, setNetwork] = useState<Network>(hm);
  const [trackEditor, setTrackEditor] = useState<TrackEditor | undefined>(undefined);
  const [editorState, setEditorState] = useState<EDITOR_STATE>(EDITOR_STATE.SELECT);
  const [saveMenuOpen, setSaveMenuOpen] = useState<boolean>(true);
  const [isNetworkComplete, setIsNetworkComplete] = useState<boolean>(false);

  const updateNetwork = (newNetworkOrUpdater: Network | ((prev: Network) => Network)) => {
    const newNetwork = typeof newNetworkOrUpdater === 'function' 
      ? newNetworkOrUpdater(network)
      : newNetworkOrUpdater;
    
    newNetwork.autoConnect();
    const completeSegments = newNetwork.segments.filter(
      (seg) => seg.atEnd.length > 0 && seg.atStart.length > 0
    );
    setIsNetworkComplete(completeSegments.length === newNetwork.segments.length);
    setNetwork(newNetwork);
  };

  useEffect(() => {
    const canvasContainer = trackEditorContainer.current;
    if (trackEditor) {
      trackEditor.network = network;
      network.autoConnect();
      trackEditor.update();
    } else {
      network.autoConnect();
      const te = new TrackEditor({
        element: canvasContainer!,
        network: network,
        onSelect: (seg) => {
          setSelectedSegment(seg || null);
        },
      });
      te.onStateChanged = (payload) => {
        setEditorState(payload.state);
      };
      te.onNetworkChanged = () => {
        updateNetwork(te.network);
      };
      te.update();
      setTrackEditor(te);
    }
  }, [network]);

  useEffect(() => {
    if (
      trackEditor &&
      (editorState === EDITOR_STATE.SELECT ||
        editorState === EDITOR_STATE.CREATE_LINEAR_SEGMENT_START ||
        editorState === EDITOR_STATE.CREATE_CONNECTION_START ||
        editorState === EDITOR_STATE.CREATE_STATION)
    ) {
      trackEditor.setcurrentStateWithData({
        state: editorState,
      });
    }
  }, [editorState]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 p-2">
        <Button
          selected={editorState === EDITOR_STATE.SELECT}
          value="Select"
          onClick={() => setEditorState(EDITOR_STATE.SELECT)}
        />
        <Button
          selected={editorState === EDITOR_STATE.CREATE_STATION}
          value="Add Station"
          onClick={() => setEditorState(EDITOR_STATE.CREATE_STATION)}
        />
        <Button
          selected={
            editorState === EDITOR_STATE.CREATE_LINEAR_SEGMENT_START ||
            editorState === EDITOR_STATE.CREATE_LINEAR_SEGMENT_END
          }
          value="Add Linear"
          onClick={() => setEditorState(EDITOR_STATE.CREATE_LINEAR_SEGMENT_START)}
        />
        <Button
          selected={
            editorState === EDITOR_STATE.CREATE_CONNECTION_START ||
            editorState === EDITOR_STATE.CREATE_CONNECTION_END
          }
          value="Add Connection"
          onClick={() => setEditorState(EDITOR_STATE.CREATE_CONNECTION_START)}
        />
        {isNetworkComplete && (
          <Button
            value="Finish Game"
            onClick={() => trackEditor?.finish()}
          />
        )}
        <Button
          selected={saveMenuOpen}
          value="Save/Load"
          onClick={() => setSaveMenuOpen(!saveMenuOpen)}
        />
      </div>
      <div className="flex flex-row h-full">
        <div 
          ref={trackEditorContainer} 
          style={{ 
            minHeight: '500px',
            position: 'relative'
          }} 
          {...props} 
        />
        {selectedSegment && (
        <div className="overflow-y-auto">
          <TrackSegmentDetail
            update={updateNetwork}
            segmentIndex={network.segments.indexOf(selectedSegment)}
            network={network}
          />
        </div>
      )}
      </div>
      {saveMenuOpen && trackEditor && <ExportPage trackEditor={trackEditor} />}
    </div>
  );
};

export default TrackEditorComponent;
