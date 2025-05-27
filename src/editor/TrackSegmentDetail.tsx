import React from "react";
import CircularTrackSegment from "../engine/CircularTrackSegment";
import Network from "../engine/Network";
import { findCenter } from "./utils";
import Point from "../engine/Point";
import LinearTrackSegment from "../engine/LinearTrackSegment";

const TrackSegmentDetail = (props: { network: Network, segmentIndex: number, update: React.Dispatch<React.SetStateAction<Network>> }) => {
  const { update } = props;

  const doUpdateProp = (newProp: { start?: Partial<Point>, end?: Partial<Point>, theta?: number, counterClockWise?: boolean }) => {
    const network = props.network;

    if (network.segments[props.segmentIndex] instanceof CircularTrackSegment) {
      const newNetwork = new Network(network.segments);
      const thisSegment = (newNetwork.segments[props.segmentIndex] as CircularTrackSegment);
      const newPos = findCenter(
        { ...thisSegment.start, ...newProp.start },
        { ...thisSegment.end, ...newProp.end },
        (newProp.theta ?? thisSegment.theta),
        (newProp.counterClockWise ?? thisSegment.counterClockWise)
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
      const thisSegment = (newNetwork.segments[props.segmentIndex] as LinearTrackSegment);
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
  }

  const segment = props.network.segments[props.segmentIndex];
  const hasConnections = segment.atStart.length > 0 || segment.atEnd.length > 0;

  return <div className="flex flex-col m-4 border-2 border-gray-300 rounded-md p-2 bg-gray-100">
    <h3 className="text-xl">{segment instanceof CircularTrackSegment ? "Circular" : "Linear"} Segment
      <span className="font-mono"> {segment.id.substring(0,8)}</span>
    </h3>
    {segment.stations.length > 0 &&
    <>
      <h4 className="text-lg">Stations</h4>
      <span>{segment.stations.length}</span>
      </>
    }
    <div className="my-3">
      <h4 className="text-lg">From</h4>
      <div className="font-mono flex flex-row gap-2">
          <label>X</label>
          <input 
            type="number" 
            className="flex-1 border-slate-300 border rounded" 
            value={segment.start.x} 
            onChange={(ev) => doUpdateProp({ start: { x: Number.parseInt(ev.target.value)}})}
            disabled={hasConnections}
          />
          <label>Y</label>
          <input 
            type="number" 
            className="flex-1 border-slate-300 border rounded" 
            value={segment.start.y} 
            onChange={(ev) => doUpdateProp({ start: { y: Number.parseInt(ev.target.value)}})}
            disabled={hasConnections}
          />
      </div>
    </div>
    
    <div className="my-3">
      <h4 className="text-lg">To</h4>
      <div className="font-mono flex flex-row gap-2">
          <label>X</label>
          <input 
            type="number" 
            className="flex-1 border-slate-300 border rounded" 
            value={segment.end.x} 
            onChange={(ev) => doUpdateProp({ end: { x: Number.parseInt(ev.target.value)}})}
            disabled={hasConnections}
          />
          <label>Y</label>
          <input 
            type="number" 
            className="flex-1 border-slate-300 border rounded" 
            value={segment.end.y} 
            onChange={(ev) => doUpdateProp({ end: { y: Number.parseInt(ev.target.value)}})}
            disabled={hasConnections}
          />
      </div>
    </div>
    
    {segment instanceof CircularTrackSegment && <div className="my-3">
      <h4 className="text-lg">Angle</h4>
      <p className="flex flex-row gap-2">
        <span className="font-mono w-1/3 flex flex-row">
          <input 
            type="number" 
            className="w-full border-slate-300 border rounded" 
            value={segment.theta} 
            step="any" 
            onChange={(ev) => doUpdateProp({ theta:Number.parseInt(ev.target.value)})}
            disabled={hasConnections}
          />
        </span>
        
        <span>CCW</span>
        <input 
          type="checkbox" 
          checked={segment.counterClockWise} 
          onChange={(ev) => doUpdateProp({ counterClockWise: ev.target.checked})}
          disabled={hasConnections}
        />
      </p>
    </div>
    }
    {hasConnections && 
      <div className="my-3 text-sm text-gray-600 italic">
        Connected segments can't be moved
      </div>
    }
    <div className="my-3">
      <h4 className="text-lg">Connections</h4>
      <div className="flex flex-row gap-4">
        <div className="flex flex-row items-center gap-2">
          <span>Start:</span>
          <span className="font-mono">{segment.atStart.length > 0 ? "✓" : "✗"}</span>
        </div>
        <div className="flex flex-row items-center gap-2">
          <span>End:</span>
          <span className="font-mono">{segment.atEnd.length > 0 ? "✓" : "✗"}</span>
        </div>
      </div>
    </div>
  </div>
}

export default TrackSegmentDetail;