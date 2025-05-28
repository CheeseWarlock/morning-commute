import TrackEditor, { EDITOR_STATE } from "./TrackEditor";
import React, { useRef, useEffect, useState } from "react";
import TrackSegment from "../engine/TrackSegment";
import TrackSegmentDetail from "./TrackSegmentDetail";
import Network from "../engine/Network";

import Button from "./components/Button";
import { isNetworkCoherent } from "../utils";

const TrackEditorContent = ({ network, trackEditor, setNetwork, setTrackEditor }: { network: Network, trackEditor?: TrackEditor, setNetwork: (network: Network) => void, setTrackEditor: (trackEditor: TrackEditor) => void }) => {
  const trackEditorContainer = useRef<HTMLDivElement | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<TrackSegment | null>(null);
  const [buttonBarState, setButtonBarState] = useState<EDITOR_STATE>(EDITOR_STATE.SELECT);
  const [scale, setScale] = useState<number>(1);
  const [networkComplete, setNetworkComplete] = useState<boolean>(false);

  const updateNetwork = (newNetworkOrUpdater: Network | ((prev: Network) => Network)) => {
    const newNetwork = typeof newNetworkOrUpdater === 'function' 
      ? newNetworkOrUpdater(network)
      : newNetworkOrUpdater;
    
    newNetwork.autoConnect();
    const completeSegments = newNetwork.segments.filter(
      (seg) => seg.atEnd.length > 0 && seg.atStart.length > 0
    );
    setNetworkComplete(completeSegments.length === newNetwork.segments.length && isNetworkCoherent(newNetwork.segments));
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
          setSelectedSegment(seg ?? null);
        },
      });
      te.onStateChanged = (payload) => {
        setButtonBarState(payload.state);
      };
      te.onNetworkChanged = () => {
        updateNetwork(te.network);
      };
      te.onScaleChanged = (newScale) => {
        setScale(newScale);
      };
      te.update();
      setTrackEditor(te);
    }
  }, [network]);

  return (
    <div className="flex flex-col h-full font-mono">
      <div className="flex justify-between items-center gap-4 p-2 bg-slate-50 border-b border-slate-200 shadow-sm">
        {/* Main Actions */}
        <div className="flex gap-2 bg-white rounded shadow px-3 py-2">
          <Button
            selected={buttonBarState === EDITOR_STATE.SELECT || buttonBarState === EDITOR_STATE.PAN}
            value="Select"
            onClick={() => {
              trackEditor?.setcurrentStateWithData({ state: EDITOR_STATE.SELECT });
              setButtonBarState(EDITOR_STATE.SELECT);
            }}
          />
          <Button
            selected={
              buttonBarState === EDITOR_STATE.CREATE_LINEAR_SEGMENT_START ||
              buttonBarState === EDITOR_STATE.CREATE_LINEAR_SEGMENT_END
            }
            value="Add Line"
            onClick={() => {
              trackEditor?.setcurrentStateWithData({ state: EDITOR_STATE.CREATE_LINEAR_SEGMENT_START });
              setButtonBarState(EDITOR_STATE.CREATE_LINEAR_SEGMENT_START);
            }}
          />
          <Button
            selected={
              buttonBarState === EDITOR_STATE.CREATE_CONNECTION_START ||
              buttonBarState === EDITOR_STATE.CREATE_CONNECTION_END
            }
            value="Add Connection"
            onClick={() => {
              trackEditor?.setcurrentStateWithData({ state: EDITOR_STATE.CREATE_CONNECTION_START });
              setButtonBarState(EDITOR_STATE.CREATE_CONNECTION_START);
            }}
          />
          <Button
            selected={buttonBarState === EDITOR_STATE.CREATE_STATION}
            value="Add Station"
            onClick={() => {
              trackEditor?.setcurrentStateWithData({ state: EDITOR_STATE.CREATE_STATION });
              setButtonBarState(EDITOR_STATE.CREATE_STATION);
            }}
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 bg-white rounded shadow px-3 py-2">
          <Button value="−" onClick={() => trackEditor?.adjustScale(-0.25)} />
          <span className="min-w-[3em] text-center">{scale.toFixed(2)}x</span>
          <Button value="+" onClick={() => trackEditor?.adjustScale(0.25)} />
          <Button value="=1" onClick={() => trackEditor?.setScale(1)} />
        </div>
      </div>
      <div className="flex flex-row h-full">
        <div 
          ref={trackEditorContainer} 
          style={{ 
            minHeight: '500px',
            position: 'relative'
          }}
        />
        {(selectedSegment || 
          (trackEditor?.currentStateWithData.state === EDITOR_STATE.MOVE_POINT && 'segment' in trackEditor.currentStateWithData) ||
          (trackEditor?.currentStateWithData.state === EDITOR_STATE.MOVE_SEGMENT && 'segment' in trackEditor.currentStateWithData)) && (
        <div className="overflow-y-auto">
          <TrackSegmentDetail
            update={updateNetwork}
            segmentIndex={network.segments.indexOf(
              selectedSegment || 
              (trackEditor?.currentStateWithData.state === EDITOR_STATE.MOVE_POINT ? trackEditor.currentStateWithData.segment :
               trackEditor?.currentStateWithData.state === EDITOR_STATE.MOVE_SEGMENT ? trackEditor.currentStateWithData.segment :
               selectedSegment)!
            )}
            network={network}
            deleteSegment={(segment) => trackEditor?.deleteSegment(segment)}
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default TrackEditorContent;
