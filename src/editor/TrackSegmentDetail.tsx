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

  return <div className="flex flex-col m-4">
    <h3 className="text-xl">{segment instanceof CircularTrackSegment ? "Circular" : "Linear"} Segment
      <span className="font-mono"> B2EE491</span>
    </h3>
    {segment.stations.length > 0 &&
    <>
      <h4 className="text-lg">Stations</h4>
      <span>{segment.stations.length}</span>
      </>
    }
    <h4 className="text-lg">From</h4>
    <div className="my-3 flex flex-row">
      <div className="font-mono border border-slate-300 p-2 m-2 w-1/3 flex flex-row">
        <label className="pr-2">X</label>
        <input type="number" className="w-full border-slate-300 background-slate-50" value={segment.start.x} onChange={(ev) => doUpdateProp({ start: { x: Number.parseInt(ev.target.value)}})}></input>
      </div>
      <span className="font-mono border border-slate-300 p-2 m-2 w-1/3 flex flex-row">
        <label className="pr-2">Y</label>
        <input type="number" value={segment.start.y} onChange={(ev) => doUpdateProp({ start: { y: Number.parseInt(ev.target.value)}})}></input>
      </span>
    </div>
    <h4 className="text-lg">To</h4>
    <p className="my-3">
      <span className="font-mono border border-slate-300 p-2 m-2">
        <label className="pr-2">X</label>
        <input type="number" value={segment.end.x} onChange={(ev) => doUpdateProp({ end: { x: Number.parseInt(ev.target.value)}})}></input>
      </span>
      <span className="font-mono border border-slate-300 p-2 m-2">
        <label className="pr-2">Y</label>
        <input type="number" value={segment.end.y} onChange={(ev) => doUpdateProp({ end: { y: Number.parseInt(ev.target.value)}})}></input>
      </span>
    </p>
    
    {segment instanceof CircularTrackSegment && <>
      <h4 className="text-lg">Angle</h4>
      <p className="my-3">
        <span className="font-mono border border-slate-300 p-2 m-2">
          <input type="number" value={segment.theta} step="any" onChange={(ev) => doUpdateProp({ theta:Number.parseInt(ev.target.value)})}></input>
        </span>
        
        <span>CCW</span>
        <input type="checkbox" checked={segment.counterClockWise} onChange={(ev) => doUpdateProp({ counterClockWise: ev.target.checked})}></input>
    </p>
      </>
    }
  </div>
}

export default TrackSegmentDetail;