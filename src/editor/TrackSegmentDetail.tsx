import React, { useState } from "react";
import CircularTrackSegment from "../engine/CircularTrackSegment";
import Network from "../engine/Network";
import TrackSegment from "../engine/TrackSegment";
import TrackEditor from "./canvas/TrackEditor";

const TrackSegmentDetail = (props: {
  network: Network;
  segmentIndex: number;
  update: (newNetwork: Network) => void;
  deleteSegment: (segment: TrackSegment) => void;
  clearSegment: (
    segment: TrackSegment,
    action: "STATIONS" | "TRAIN_START_POSITIONS",
  ) => void;
  trackEditor: TrackEditor;
}) => {
  const [editingStationIndex, setEditingStationIndex] = useState<number | null>(
    null,
  );
  const [editingStationName, setEditingStationName] = useState<string>("");

  const updateStationName = (stationIndex: number, newName: string) => {
    const newNetwork = new Network(props.network.segments);
    const thisSegment = newNetwork.segments[props.segmentIndex];
    props.trackEditor.setStationName(thisSegment, stationIndex, newName);
  };

  const segment = props.network.segments[props.segmentIndex];

  return (
    <div className="flex flex-col m-4 border-2 border-zinc-300 rounded-md p-2 bg-zinc-100 w-[400px]">
      <div className="flex flex-row justify-between items-center">
        <h3 className="text-xl">
          {segment instanceof CircularTrackSegment ? "Circular" : "Linear"}{" "}
          Segment
          <span className="font-mono"> {segment.id.substring(0, 8)}</span>
        </h3>
        <button
          className="px-2 py-1 text-sm text-red-600 hover:text-red-800 bg-red-100 rounded font-bold"
          onClick={() => {
            props.deleteSegment(segment);
          }}
        >
          Delete
        </button>
      </div>
      {segment.stations.length > 0 && (
        <>
          <h4 className="text-lg">Stations</h4>
          <div className="flex flex-col gap-2">
            {segment.stations.map((station, index) => (
              <div
                key={index}
                className="flex flex-col gap-1 border border-zinc-200 rounded p-2"
              >
                <div className="flex flex-row gap-2 items-center">
                  {editingStationIndex === index ? (
                    <input
                      type="text"
                      className="font-mono border border-zinc-300 rounded px-1 bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none flex-1"
                      value={editingStationName}
                      onChange={(e) => {
                        setEditingStationName(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateStationName(index, editingStationName);
                          setEditingStationIndex(null);
                        } else if (e.key === "Escape") {
                          setEditingStationIndex(null);
                        }
                      }}
                    />
                  ) : (
                    <span className="font-mono flex-1">{station.name}</span>
                  )}
                  {editingStationIndex === index ? (
                    <>
                      <button
                        className="px-2 py-1 text-sm text-green-600 hover:text-green-800 bg-green-100 rounded font-bold"
                        onClick={() => {
                          updateStationName(index, editingStationName);
                          setEditingStationIndex(null);
                        }}
                      >
                        Set
                      </button>
                      <button
                        className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 rounded font-bold"
                        onClick={() => {
                          setEditingStationIndex(null);
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800 bg-blue-100 rounded font-bold"
                      onClick={() => {
                        setEditingStationIndex(index);
                        setEditingStationName(station.name);
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="flex flex-row justify-between items-center">
                  <span className="text-sm text-zinc-500">
                    Distance: {station.distanceAlong.toFixed(2)} along
                  </span>
                  <button
                    className="px-2 py-1 text-sm text-red-600 hover:text-red-800 bg-red-100 rounded font-bold"
                    onClick={() => {
                      const newNetwork = new Network(props.network.segments);
                      const thisSegment =
                        newNetwork.segments[props.segmentIndex];
                      thisSegment.stations.splice(index, 1);
                      props.update(newNetwork);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            <button
              className="px-2 py-1 text-sm text-red-600 hover:text-red-800 bg-red-100 rounded font-bold"
              onClick={() => {
                props.clearSegment(segment, "STATIONS");
              }}
            >
              Delete All Stations
            </button>
          </div>
        </>
      )}
      {segment.trainStartPositions.length > 0 && (
        <>
          <h4 className="text-lg">Start Positions</h4>
          <div className="flex flex-row gap-2 items-center">
            <span>{segment.trainStartPositions.length}</span>
            <button
              className="px-2 py-1 text-sm text-red-600 hover:text-red-800 bg-red-100 rounded font-bold"
              onClick={() => {
                props.clearSegment(segment, "TRAIN_START_POSITIONS");
              }}
            >
              Clear All
            </button>
          </div>
        </>
      )}
      <div className="my-3">
        <h4 className="text-lg">From</h4>
        <div className="font-mono flex flex-row gap-2 items-center">
          <span className="mx-2">X: {segment.start.x.toFixed(2)}</span>
          <span className="mx-2">Y: {segment.start.y.toFixed(2)}</span>
        </div>
      </div>

      <div className="my-3">
        <h4 className="text-lg">To</h4>
        <div className="font-mono flex flex-row gap-2 items-center">
          <span className="mx-2">X: {segment.end.x.toFixed(2)}</span>
          <span className="mx-2">Y: {segment.end.y.toFixed(2)}</span>
        </div>
      </div>

      {segment instanceof CircularTrackSegment && (
        <div className="my-3">
          <h4 className="text-lg">Angle</h4>
          <div className="font-mono flex flex-row gap-2 items-center">
            <span className="mx-2">θ: {segment.theta.toFixed(2)}</span>
            <span className="mx-2">
              CCW: {segment.counterClockWise ? "Yes" : "No"}
            </span>
          </div>
        </div>
      )}
      <div className="my-3">
        <h4 className="text-lg">Connections</h4>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center gap-2">
            <span>Start:</span>
            {segment.atStart.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {segment.atStart.map((connectedSegment, index) => (
                  <span
                    key={index}
                    className="font-mono text-xs bg-blue-100 px-1 rounded cursor-pointer"
                    onMouseOver={() =>
                      props.trackEditor.setStrongHighlight([connectedSegment])
                    }
                    onMouseOut={() => props.trackEditor.setStrongHighlight([])}
                    onClick={() =>
                      props.trackEditor.selectSegment(connectedSegment)
                    }
                  >
                    {connectedSegment.id.substring(0, 8)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-row items-center gap-2">
            <span>End:</span>
            {segment.atEnd.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {segment.atEnd.map((connectedSegment, index) => (
                  <span
                    key={index}
                    className="font-mono text-xs bg-green-100 px-1 rounded cursor-pointer"
                    onMouseOver={() =>
                      props.trackEditor.setStrongHighlight([connectedSegment])
                    }
                    onMouseOut={() => props.trackEditor.setStrongHighlight([])}
                    onClick={() =>
                      props.trackEditor.selectSegment(connectedSegment)
                    }
                  >
                    {connectedSegment.id.substring(0, 8)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackSegmentDetail;
