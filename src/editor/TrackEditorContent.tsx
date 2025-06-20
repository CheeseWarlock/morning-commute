import TrackEditor, { EDITOR_STATE } from "./canvas/TrackEditor";
import React, { useRef, useEffect, useState } from "react";
import TrackSegment from "../engine/TrackSegment";
import TrackSegmentDetail from "./TrackSegmentDetail";
import Network from "../engine/Network";
import CircularSegmentCreationPanel from "./CircularSegmentCreationPanel";

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
  const [isCircularCounterClockwise, setIsCircularCounterClockwise] =
    useState<boolean>(false);
  const [circularAngle, setCircularAngle] = useState<number>(Math.PI / 2); // 90 degrees default

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

      // Deselect segment if it no longer exists in the network
      if (
        selectedSegment &&
        !network.segments.find((seg) => seg.id === selectedSegment.id)
      ) {
        setSelectedSegment(null);
      }
    }
  }, [network, selectedSegment]);

  return (
    <div className="flex flex-col h-full font-mono">
      <div className="flex flex-row h-full">
        <div>
          <div ref={trackEditorContainer} />
          <div className="flex flex-col bg-zinc-200 border-b border-zinc-300 shadow-sm gap-2 p-2">
            <div className="flex flex-row justify-between items-center gap-4">
              {/* Selection Actions */}
              <div className="flex gap-2 bg-white rounded shadow px-3 py-2 items-center">
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
                <Button
                  selected={buttonBarState === EDITOR_STATE.SPLIT}
                  value="Split"
                  onClick={() => {
                    trackEditorRef.current?.setcurrentStateWithData({
                      state: EDITOR_STATE.SPLIT,
                    });
                    setButtonBarState(EDITOR_STATE.SPLIT);
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
            {/* Undo/Redo Actions */}
            <div className="flex flex-row justify-between items-center gap-4">
              <div className="flex gap-2 bg-white rounded shadow px-3 py-2 items-center">
                <span className="text-lg font-bold text-zinc-500">
                  History:
                </span>
                {trackEditorRef.current?.undoStatement && (
                  <Button
                    value={`Undo: ${trackEditorRef.current.undoStatement}`}
                    onClick={() => trackEditorRef.current?.undo()}
                  />
                )}
                {trackEditorRef.current?.redoStatement && (
                  <Button
                    value={`Redo: ${trackEditorRef.current.redoStatement}`}
                    onClick={() => trackEditorRef.current?.redo()}
                  />
                )}
              </div>
            </div>
            {/* Construction Actions */}
            <div className="flex flex-row justify-between items-center gap-4">
              <div className="flex gap-2 bg-white rounded shadow px-3 py-2 items-center">
                <span className="text-lg font-bold text-zinc-500">Add:</span>
                <Button
                  selected={
                    buttonBarState ===
                      EDITOR_STATE.CREATE_LINEAR_SEGMENT_START ||
                    buttonBarState === EDITOR_STATE.CREATE_LINEAR_SEGMENT_END
                  }
                  value="Line Segment"
                  onClick={() => {
                    trackEditorRef.current?.setcurrentStateWithData({
                      state: EDITOR_STATE.CREATE_LINEAR_SEGMENT_START,
                    });
                    setButtonBarState(EDITOR_STATE.CREATE_LINEAR_SEGMENT_START);
                  }}
                />
                <Button
                  selected={
                    buttonBarState ===
                      EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_START ||
                    buttonBarState === EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_END
                  }
                  value="Circular Segment"
                  onClick={() => {
                    trackEditorRef.current?.setcurrentStateWithData({
                      state: EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_START,
                      counterClockwise: isCircularCounterClockwise,
                      angle: circularAngle,
                    });
                    setButtonBarState(
                      EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_START,
                    );
                  }}
                />
                <Button
                  selected={
                    buttonBarState === EDITOR_STATE.CREATE_CONNECTION_START ||
                    buttonBarState === EDITOR_STATE.CREATE_CONNECTION_END
                  }
                  value="Connecting Curve"
                  onClick={() => {
                    trackEditorRef.current?.setcurrentStateWithData({
                      state: EDITOR_STATE.CREATE_CONNECTION_START,
                    });
                    setButtonBarState(EDITOR_STATE.CREATE_CONNECTION_START);
                  }}
                />
                <Button
                  selected={buttonBarState === EDITOR_STATE.CREATE_STATION}
                  value="Station"
                  onClick={() => {
                    trackEditorRef.current?.setcurrentStateWithData({
                      state: EDITOR_STATE.CREATE_STATION,
                    });
                    setButtonBarState(EDITOR_STATE.CREATE_STATION);
                  }}
                />
                <Button
                  selected={buttonBarState === EDITOR_STATE.SET_START_POSITION}
                  value="Train Start"
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
        {selectedSegment && network.segments.includes(selectedSegment) && (
          <div className="overflow-y-auto">
            <TrackSegmentDetail
              update={updateNetwork}
              segmentIndex={network.segments.indexOf(
                network.segments.find((seg) => seg.id === selectedSegment.id)!,
              )}
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
        {(buttonBarState === EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_START ||
          buttonBarState === EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_END) && (
          <div className="overflow-y-auto">
            <CircularSegmentCreationPanel
              isCounterClockwise={isCircularCounterClockwise}
              onDirectionChange={(counterClockwise) => {
                setIsCircularCounterClockwise(counterClockwise);
                // Update the current state with the new direction
                if (
                  trackEditorRef.current?.currentStateWithData.state ===
                  EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_START
                ) {
                  trackEditorRef.current.setcurrentStateWithData({
                    state: EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_START,
                    counterClockwise,
                    angle: circularAngle,
                  });
                } else if (
                  trackEditorRef.current?.currentStateWithData.state ===
                  EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_END
                ) {
                  trackEditorRef.current.setcurrentStateWithData({
                    state: EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_END,
                    segmentStart:
                      trackEditorRef.current.currentStateWithData.segmentStart,
                    lockedToSegment:
                      trackEditorRef.current.currentStateWithData
                        .lockedToSegment,
                    lockedToEnd:
                      trackEditorRef.current.currentStateWithData.lockedToEnd,
                    counterClockwise,
                    angle: circularAngle,
                    startAngle:
                      trackEditorRef.current.currentStateWithData.startAngle,
                  });
                }
              }}
              angle={circularAngle}
              onAngleChange={(angle) => {
                setCircularAngle(angle);
                // Update the current state with the new angle
                if (
                  trackEditorRef.current?.currentStateWithData.state ===
                  EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_START
                ) {
                  trackEditorRef.current.setcurrentStateWithData({
                    state: EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_START,
                    counterClockwise: isCircularCounterClockwise,
                    angle,
                  });
                } else if (
                  trackEditorRef.current?.currentStateWithData.state ===
                  EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_END
                ) {
                  trackEditorRef.current.setcurrentStateWithData({
                    state: EDITOR_STATE.CREATE_CIRCULAR_SEGMENT_END,
                    segmentStart:
                      trackEditorRef.current.currentStateWithData.segmentStart,
                    lockedToSegment:
                      trackEditorRef.current.currentStateWithData
                        .lockedToSegment,
                    lockedToEnd:
                      trackEditorRef.current.currentStateWithData.lockedToEnd,
                    counterClockwise: isCircularCounterClockwise,
                    angle,
                    startAngle:
                      trackEditorRef.current.currentStateWithData.startAngle,
                  });
                }
              }}
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
