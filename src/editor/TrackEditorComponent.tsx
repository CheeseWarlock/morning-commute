import TrackEditor, { EDITOR_STATE } from "./TrackEditor";
import { build as buildComplex } from "../engine/networks/TestingNetworks/Linear";
import React, { useRef, useEffect, useState } from "react";
import TrackSegment from "../engine/TrackSegment";
import TrackSegmentDetail from "./TrackSegmentDetail";
import Network from "../engine/Network";

import Button from "./components/Button";
import ExportPage from "./ExportPage";
import { isNetworkCoherent } from "../utils";

const hm = buildComplex().network;
hm.autoConnect();

const TrackEditorComponent = (props: any) => {
  const trackEditorContainer = useRef<HTMLDivElement | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<TrackSegment | null>(null);
  const [network, setNetwork] = useState<Network>(hm);
  const [trackEditor, setTrackEditor] = useState<TrackEditor | undefined>(undefined);
  const [buttonBarState, setButtonBarState] = useState<EDITOR_STATE>(EDITOR_STATE.SELECT);
  const [saveMenuOpen, setSaveMenuOpen] = useState<boolean>(false);
  const [isNetworkComplete, setIsNetworkComplete] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);

  const updateNetwork = (newNetworkOrUpdater: Network | ((prev: Network) => Network)) => {
    const newNetwork = typeof newNetworkOrUpdater === 'function' 
      ? newNetworkOrUpdater(network)
      : newNetworkOrUpdater;
    
    newNetwork.autoConnect();
    const completeSegments = newNetwork.segments.filter(
      (seg) => seg.atEnd.length > 0 && seg.atStart.length > 0
    );
    setIsNetworkComplete(completeSegments.length === newNetwork.segments.length && isNetworkCoherent(newNetwork.segments));
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

  console.log("Network", network);

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
            value="Add Linear"
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

        {/* Meta Actions */}
        <div className="flex gap-2">

            <Button
              disabled={!isNetworkComplete}
              value="Run Game"
              onClick={() => trackEditor?.finish()}
              className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
            />
          <Button
            selected={saveMenuOpen}
            value="View JSON"
            onClick={() => setSaveMenuOpen(!saveMenuOpen)}
            className="bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
          />
        </div>
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
      {saveMenuOpen && trackEditor && (
        <ExportPage trackEditor={trackEditor} network={network} onClose={() => setSaveMenuOpen(false)} />
      )}
    </div>
  );
};

export default TrackEditorComponent;
