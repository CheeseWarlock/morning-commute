import React from "react";
import TrackSegment from "../engine/TrackSegment";
import CircularTrackSegment from "../engine/CircularTrackSegment";
import Network from "../engine/Network";
import { findCenter } from "./utils";

const TrackSegmentDetail = (props: { network: Network, segmentIndex: number, update: React.Dispatch<React.SetStateAction<Network>> }) => {
  const { update } = props;
  const doUpdateSX : React.ChangeEventHandler<HTMLInputElement> = (ev) => {
    const val = ev.target.value;
    const network = props.network;
    const aaaaa = new Network(network.segments);
    aaaaa.segments[props.segmentIndex].start.x = Number.parseInt(val);
    update(aaaaa);
  }

  const doUpdateSY : React.ChangeEventHandler<HTMLInputElement> = (ev) => {
    const val = ev.target.value;
    const network = props.network;
    const aaaaa = new Network(network.segments);
    aaaaa.segments[props.segmentIndex].start.y = Number.parseInt(val);
    update(aaaaa);
  }

  const doUpdateEX : React.ChangeEventHandler<HTMLInputElement> = (ev) => {
    const val = ev.target.value;
    const network = props.network;
    const aaaaa = new Network(network.segments);
    aaaaa.segments[props.segmentIndex].end.x = Number.parseInt(val);
    update(aaaaa);
  }

  const doUpdateEY : React.ChangeEventHandler<HTMLInputElement> = (ev) => {
    const val = ev.target.value;
    const network = props.network;
    const aaaaa = new Network(network.segments);
    aaaaa.segments[props.segmentIndex].end.y = Number.parseInt(val);
    update(aaaaa);
  }

  const doUpdateTheta : React.ChangeEventHandler<HTMLInputElement> = (ev) => {
    const val = ev.target.value;
    const network = props.network;
    const aaaaa = new Network(network.segments);
    const thisSegment = (aaaaa.segments[props.segmentIndex] as CircularTrackSegment);
    const newPos = findCenter(thisSegment.start,thisSegment.end,Number.parseFloat(val),thisSegment.counterClockWise);
    thisSegment.center.x = newPos.x;
    thisSegment.center.y = newPos.y;
    update(aaaaa);
  }

  const doUpdateCCW : React.ChangeEventHandler<HTMLInputElement> = (ev) => {
    const boolVal = ev.target.checked;
    const network = props.network;
    const aaaaa = new Network(network.segments);
    const thisSegment = (aaaaa.segments[props.segmentIndex] as CircularTrackSegment);
    const newPos = findCenter(thisSegment.start,thisSegment.end,thisSegment.theta,boolVal);
    thisSegment.center.x = newPos.x;
    thisSegment.center.y = newPos.y;
    
    thisSegment.counterClockWise = boolVal;
    update(aaaaa);
  }

  const segment = props.network.segments[props.segmentIndex];

  return <div className="segment-info">
    <h3>{segment instanceof CircularTrackSegment ? "Circular" : "Linear"}</h3>
    <h4>From</h4>
    <p>
      <span>X</span>
      <input type="number" value={segment.start.x} onChange={doUpdateSX}></input>
      <span>Y</span>
      <input type="number" value={segment.start.y} onChange={doUpdateSY}></input>
    </p>
    <h4>To</h4>
    <p>
      <span>X</span>
      <input type="number" value={segment.end.x} onChange={doUpdateEX}></input>
      <span>Y</span>
      <input type="number" value={segment.end.y} onChange={doUpdateEY}></input>
    </p>
    {segment instanceof CircularTrackSegment && <>
      <h4>Angle</h4>
      <p>
      <input type="number" value={segment.theta} step="any" onChange={doUpdateTheta}></input>
      <span>CCW</span>
      <input type="checkbox" checked={segment.counterClockWise} onChange={doUpdateCCW}></input>
    </p>
      </>
    }
  </div>
}

export default TrackSegmentDetail;