import TrackEditor, { EDITOR_STATE } from "./TrackEditor";
import React, { useRef, useEffect, useState } from "react";
import TrackSegment from "../engine/TrackSegment";
import TrackSegmentDetail from "./TrackSegmentDetail";
import Network from "../engine/Network";

import Button from "./components/Button";


const TrackEditorContent = ({ network, setNetwork }: {
  network: Network,
  setNetwork: (network: Network) => void
}) => {
  const trackEditorContainer = useRef<HTMLDivElement | null>(null);
  const trackEditorRef = useRef<TrackEditor | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<TrackSegment | null>(null);
  const [buttonBarState, setButtonBarState] = useState<EDITOR_STATE>(EDITOR_STATE.SELECT);
  const [scale, setScale] = useState<number>(1);

  const updateNetwork = (newNetwork: Network) => {
    newNetwork.autoConnect();
    setNetwork(newNetwork);
  };

  useEffect(() => {
    const container = trackEditorContainer.current;
    if (!container) return;

    const te = new TrackEditor({
      element: container,
      network,
      onSelect: (seg) => setSelectedSegment(seg ?? null),
    });
    te.onStateChanged = (payload) => setButtonBarState(payload.state);
    te.onNetworkChanged = () => updateNetwork(te.network);
    te.onScaleChanged = (newScale) => setScale(newScale);
    te.update();
    trackEditorRef.current = te;

    return () => {
      container.innerHTML = "";
      trackEditorRef.current = null;
    };
  }, []);

  // Update network on changes
  useEffect(() => {
    if (trackEditorRef.current) {
      trackEditorRef.current.network = network;
      trackEditorRef.current.update();
    }
  }, [network]);

  return (
    <div className="flex flex-col h-full font-mono">
      <div className="flex flex-row h-full">
        <div>
        <div 
          ref={trackEditorContainer} 
        />
        <div className="flex flex-row justify-between items-center gap-4 p-2 bg-zinc-50 border-b border-zinc-200 shadow-sm">
        {/* Main Actions */}
        <div className="flex gap-2 bg-white rounded shadow px-3 py-2">
          <Button
            selected={buttonBarState === EDITOR_STATE.SELECT || buttonBarState === EDITOR_STATE.PAN}
            value="Select"
            onClick={() => {
              trackEditorRef.current?.setcurrentStateWithData({ state: EDITOR_STATE.SELECT });
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
              trackEditorRef.current?.setcurrentStateWithData({ state: EDITOR_STATE.CREATE_LINEAR_SEGMENT_START });
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
              trackEditorRef.current?.setcurrentStateWithData({ state: EDITOR_STATE.CREATE_CONNECTION_START });
              setButtonBarState(EDITOR_STATE.CREATE_CONNECTION_START);
            }}
          />
          <Button
            selected={buttonBarState === EDITOR_STATE.CREATE_STATION}
            value="Add Station"
            onClick={() => {
              trackEditorRef.current?.setcurrentStateWithData({ state: EDITOR_STATE.CREATE_STATION });
              setButtonBarState(EDITOR_STATE.CREATE_STATION);
            }}
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 bg-white rounded shadow px-3 py-2">
          <Button value="−" onClick={() => trackEditorRef.current?.adjustScale(-0.25, false)} />
          <span className="min-w-[3em] text-center">{scale.toFixed(2)}x</span>
          <Button value="+" onClick={() => trackEditorRef.current?.adjustScale(0.25, false)} />
          <Button value="=1" onClick={() => trackEditorRef.current?.setScale(1)} />
        </div>
      </div>
        </div>
        {(selectedSegment || 
          (trackEditorRef.current?.currentStateWithData.state === EDITOR_STATE.MOVE_POINT && 'segment' in trackEditorRef.current.currentStateWithData) ||
          (trackEditorRef.current?.currentStateWithData.state === EDITOR_STATE.MOVE_SEGMENT && 'segment' in trackEditorRef.current.currentStateWithData)) && (
        <div className="overflow-y-auto">
          <TrackSegmentDetail
            update={updateNetwork}
            segmentIndex={network.segments.indexOf(
              selectedSegment || 
              (trackEditorRef.current?.currentStateWithData.state === EDITOR_STATE.MOVE_POINT ? trackEditorRef.current.currentStateWithData.segment :
               trackEditorRef.current?.currentStateWithData.state === EDITOR_STATE.MOVE_SEGMENT ? trackEditorRef.current.currentStateWithData.segment :
               selectedSegment)!
            )}
            network={network}
            deleteSegment={(segment) => trackEditorRef.current?.deleteSegment(segment)}
          />
        </div>
      )}
      </div>
      
    </div>
  );
};

export default TrackEditorContent;
