import React, { useState } from "react";
import CircularTrackSegment from "../engine/CircularTrackSegment";
import Network from "../engine/Network";
import { findCenter } from "./utils";
import Point from "../engine/Point";
import LinearTrackSegment from "../engine/LinearTrackSegment";
import TrackSegment from "../engine/TrackSegment";

const TrackSegmentDetail = (props: {
  network: Network;
  segmentIndex: number;
  update: (newNetwork: Network) => void;
  deleteSegment: (segment: TrackSegment) => void;
  clearSegment: (
    segment: TrackSegment,
    action: "STATIONS" | "TRAIN_START_POSITIONS",
  ) => void;
}) => {
  const { update } = props;
  const [editingStationIndex, setEditingStationIndex] = useState<number | null>(
    null,
  );
  const [editingStationName, setEditingStationName] = useState<string>("");

  const doUpdateProp = (newProp: {
    start?: Partial<Point>;
    end?: Partial<Point>;
    theta?: number;
    counterClockWise?: boolean;
  }) => {
    const network = props.network;

    if (network.segments[props.segmentIndex] instanceof CircularTrackSegment) {
      const newNetwork = new Network(network.segments);
      const thisSegment = newNetwork.segments[
        props.segmentIndex
      ] as CircularTrackSegment;
      const newPos = findCenter(
        { ...thisSegment.start, ...newProp.start },
        { ...thisSegment.end, ...newProp.end },
        newProp.theta ?? thisSegment.theta,
        newProp.counterClockWise ?? thisSegment.counterClockWise,
      );
      if (newProp.start?.x != null) {
        thisSegment.start.x = newProp.start.x;
      }
      if (newProp.start?.y != null) {
        thisSegment.start.y = newProp.start.y;
      }
      if (newProp.end?.x != null) {
        thisSegment.end.x = newProp.end.x;
      }
      if (newProp.end?.y != null) {
        thisSegment.end.y = newProp.end.y;
      }
      if (newProp.counterClockWise != null) {
        thisSegment.counterClockWise = newProp.counterClockWise;
      }
      thisSegment.center.x = newPos.x;
      thisSegment.center.y = newPos.y;
      update(newNetwork);
    } else {
      const newNetwork = new Network(network.segments);
      const thisSegment = newNetwork.segments[
        props.segmentIndex
      ] as LinearTrackSegment;
      if (newProp.start?.x != null) {
        thisSegment.start.x = newProp.start.x;
      }
      if (newProp.start?.y != null) {
        thisSegment.start.y = newProp.start.y;
      }
      if (newProp.end?.x != null) {
        thisSegment.end.x = newProp.end.x;
      }
      if (newProp.end?.y != null) {
        thisSegment.end.y = newProp.end.y;
      }
      update(newNetwork);
    }
  };

  const updateStationName = (stationIndex: number, newName: string) => {
    const newNetwork = new Network(
      props.network.segments,
      props.network.stations,
    );
    const thisSegment = newNetwork.segments[props.segmentIndex];
    thisSegment.stations[stationIndex].name = newName;
    update(newNetwork);
  };

  const segment = props.network.segments[props.segmentIndex];
  const hasConnections = segment.atStart.length > 0 || segment.atEnd.length > 0;

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
              <div key={index} className="flex flex-row gap-2 items-center">
                <input
                  type="text"
                  className="font-mono border border-zinc-300 rounded px-1 bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none"
                  value={
                    editingStationIndex === index
                      ? editingStationName
                      : station.name
                  }
                  onChange={(e) => {
                    if (editingStationIndex === index) {
                      setEditingStationName(e.target.value);
                    }
                  }}
                  onFocus={() => {
                    setEditingStationIndex(index);
                    setEditingStationName(station.name);
                  }}
                  onBlur={() => {
                    if (editingStationIndex === index) {
                      updateStationName(index, editingStationName);
                      setEditingStationIndex(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (editingStationIndex === index) {
                      if (e.key === "Enter") {
                        updateStationName(index, editingStationName);
                        setEditingStationIndex(null);
                      } else if (e.key === "Escape") {
                        setEditingStationIndex(null);
                      }
                    }
                  }}
                />
                <span className="text-sm text-zinc-500">
                  ({station.distanceAlong.toFixed(2)} along)
                </span>
              </div>
            ))}
            <button
              className="px-2 py-1 text-sm text-red-600 hover:text-red-800 bg-red-100 rounded font-bold"
              onClick={() => {
                props.clearSegment(segment, "STATIONS");
              }}
            >
              Delete All
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
              Delete
            </button>
          </div>
        </>
      )}
      <div className="my-3">
        <h4 className="text-lg">From</h4>
        <div className="font-mono flex flex-row gap-2 items-center">
          <label className="whitespace-nowrap">X</label>
          <input
            type="number"
            className="w-24 border-zinc-300 border rounded"
            value={segment.start.x}
            onChange={(ev) =>
              doUpdateProp({ start: { x: Number.parseInt(ev.target.value) } })
            }
            disabled={hasConnections}
          />
          <label className="whitespace-nowrap">Y</label>
          <input
            type="number"
            className="w-24 border-zinc-300 border rounded"
            value={segment.start.y}
            onChange={(ev) =>
              doUpdateProp({ start: { y: Number.parseInt(ev.target.value) } })
            }
            disabled={hasConnections}
          />
        </div>
      </div>

      <div className="my-3">
        <h4 className="text-lg">To</h4>
        <div className="font-mono flex flex-row gap-2 items-center">
          <label className="whitespace-nowrap">X</label>
          <input
            type="number"
            className="w-24 border-zinc-300 border rounded"
            value={segment.end.x}
            onChange={(ev) =>
              doUpdateProp({ end: { x: Number.parseInt(ev.target.value) } })
            }
            disabled={hasConnections}
          />
          <label className="whitespace-nowrap">Y</label>
          <input
            type="number"
            className="w-24 border-zinc-300 border rounded"
            value={segment.end.y}
            onChange={(ev) =>
              doUpdateProp({ end: { y: Number.parseInt(ev.target.value) } })
            }
            disabled={hasConnections}
          />
        </div>
      </div>

      {segment instanceof CircularTrackSegment && (
        <div className="my-3">
          <h4 className="text-lg">Angle</h4>
          <p className="flex flex-row gap-2 items-center">
            <span className="font-mono flex flex-row items-center">
              <input
                type="number"
                className="w-24 border-zinc-300 border rounded"
                value={segment.theta}
                step="any"
                onChange={(ev) =>
                  doUpdateProp({ theta: Number.parseInt(ev.target.value) })
                }
                disabled={hasConnections}
              />
            </span>

            <span>CCW</span>
            <input
              type="checkbox"
              checked={segment.counterClockWise}
              onChange={(ev) =>
                doUpdateProp({ counterClockWise: ev.target.checked })
              }
              disabled={hasConnections}
            />
          </p>
        </div>
      )}
      {hasConnections && (
        <div className="my-3 text-sm text-zinc-600 italic">
          Connected segments can't be moved
        </div>
      )}
      <div className="my-3">
        <h4 className="text-lg">Connections</h4>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center gap-2">
            <span>Start:</span>
            <span className="font-mono">
              {segment.atStart.length +
                " " +
                (segment.atStart.length > 0 ? "✓" : "✗")}
            </span>
            {segment.atStart.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {segment.atStart.map((connectedSegment, index) => (
                  <span
                    key={index}
                    className="font-mono text-xs bg-blue-100 px-1 rounded"
                  >
                    {connectedSegment.id.substring(0, 8)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-row items-center gap-2">
            <span>End:</span>
            <span className="font-mono">
              {segment.atEnd.length +
                " " +
                (segment.atEnd.length > 0 ? "✓" : "✗")}
            </span>
            {segment.atEnd.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {segment.atEnd.map((connectedSegment, index) => (
                  <span
                    key={index}
                    className="font-mono text-xs bg-green-100 px-1 rounded"
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
