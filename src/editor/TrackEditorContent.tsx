import TrackEditor, { EDITOR_STATE } from "./TrackEditor";
import React, { useRef, useEffect, useState } from "react";
import TrackSegment from "../engine/TrackSegment";
import TrackSegmentDetail from "./TrackSegmentDetail";
import Network from "../engine/Network";

import Button from "./components/Button";
import MultiSegmentDetail from "./MultiSegmentDetail";

const TrackEditorContent = ({
  network,
  setNetwork,
}: {
  network: Network;
  setNetwork: (network: Network) => void;
}) => {
  const trackEditorContainer = useRef<HTMLDivElement | null>(null);
  const trackEditorRef = useRef<TrackEditor | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<TrackSegment | null>(
    null,
  );
  const [buttonBarState, setButtonBarState] = useState<EDITOR_STATE>(
    EDITOR_STATE.SELECT,
  );
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
          <div ref={trackEditorContainer} />
          <div className="flex flex-col bg-zinc-50 border-b border-zinc-200 shadow-sm gap-2 p-2">
            <div className="flex flex-row justify-between items-center gap-4">
              {/* Selection Actions */}
              <div className="flex gap-2 bg-white rounded shadow px-3 py-2">
                <Button
                  selected={
                    buttonBarState === EDITOR_STATE.SELECT ||
                    buttonBarState === EDITOR_STATE.PAN
                  }
                  value="Select"
                  onClick={() => {
                    trackEditorRef.current?.setcurrentStateWithData({
                      state: EDITOR_STATE.SELECT,
                    });
                    setButtonBarState(EDITOR_STATE.SELECT);
                  }}
                />
                <Button
                  selected={buttonBarState === EDITOR_STATE.QUERY_POINT}
                  value="Query Point"
                  onClick={() => {
                    trackEditorRef.current?.setcurrentStateWithData({
                      state: EDITOR_STATE.QUERY_POINT,
                    });
                    setButtonBarState(EDITOR_STATE.QUERY_POINT);
                  }}
                />
                <Button
                  selected={buttonBarState === EDITOR_STATE.DRAG_SELECT}
                  value="Drag Select"
                  onClick={() => {
                    trackEditorRef.current?.setcurrentStateWithData({
                      state: EDITOR_STATE.DRAG_SELECT,
                    });
                    setButtonBarState(EDITOR_STATE.DRAG_SELECT);
                  }}
                />
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2 bg-white rounded shadow px-3 py-2">
                <Button
                  value="−"
                  onClick={() =>
                    trackEditorRef.current?.adjustScale(-0.25, false)
                  }
                />
                <span className="min-w-[3em] text-center">
                  {scale.toFixed(2)}x
                </span>
                <Button
                  value="+"
                  onClick={() =>
                    trackEditorRef.current?.adjustScale(0.25, false)
                  }
                />
                <Button
                  value="=1"
                  onClick={() => trackEditorRef.current?.setScale(1)}
                />
                <Button
                  value="Fit"
                  onClick={() => trackEditorRef.current?.autoScaleAndOffset()}
                />
              </div>
            </div>
            {/* Construction Actions */}
            <div className="flex flex-row justify-between items-center gap-4">
              <div className="flex gap-2 bg-white rounded shadow px-3 py-2">
                <Button
                  selected={
                    buttonBarState ===
                      EDITOR_STATE.CREATE_LINEAR_SEGMENT_START ||
                    buttonBarState === EDITOR_STATE.CREATE_LINEAR_SEGMENT_END
                  }
                  value="Add Line"
                  onClick={() => {
                    trackEditorRef.current?.setcurrentStateWithData({
                      state: EDITOR_STATE.CREATE_LINEAR_SEGMENT_START,
                    });
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
                    trackEditorRef.current?.setcurrentStateWithData({
                      state: EDITOR_STATE.CREATE_CONNECTION_START,
                    });
                    setButtonBarState(EDITOR_STATE.CREATE_CONNECTION_START);
                  }}
                />
                <Button
                  selected={buttonBarState === EDITOR_STATE.CREATE_STATION}
                  value="Add Station"
                  onClick={() => {
                    trackEditorRef.current?.setcurrentStateWithData({
                      state: EDITOR_STATE.CREATE_STATION,
                    });
                    setButtonBarState(EDITOR_STATE.CREATE_STATION);
                  }}
                />
                <Button
                  selected={buttonBarState === EDITOR_STATE.SET_START_POSITION}
                  value="Add Train Start Position"
                  onClick={() => {
                    trackEditorRef.current?.setcurrentStateWithData({
                      state: EDITOR_STATE.SET_START_POSITION,
                    });
                    setButtonBarState(EDITOR_STATE.SET_START_POSITION);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        {selectedSegment && (
          <div className="overflow-y-auto">
            <TrackSegmentDetail
              update={updateNetwork}
              segmentIndex={network.segments.indexOf(selectedSegment)}
              network={network}
              deleteSegment={(segment) =>
                trackEditorRef.current?.deleteSegment(segment)
              }
              clearSegment={(segment, action) =>
                trackEditorRef.current?.clearSegment(segment, action)
              }
            />
          </div>
        )}
        {trackEditorRef.current?.currentStateWithData.state ===
          EDITOR_STATE.MULTI_SELECT && (
          <div className="h-full overflow-hidden">
            <MultiSegmentDetail
              segments={
                trackEditorRef.current?.currentStateWithData.selectedSegments
              }
              selectSegment={(segment) => {
                trackEditorRef.current?.setcurrentStateWithData({
                  state: EDITOR_STATE.SELECT,
                  selectedSegment: segment,
                });
                setButtonBarState(EDITOR_STATE.SELECT);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackEditorContent;
