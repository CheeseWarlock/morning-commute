import React from "react";
import TrackSegment from "../engine/TrackSegment";
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

  return <div className="segment-info">
    <h3>{segment instanceof CircularTrackSegment ? "Circular" : "Linear"}</h3>
    <h4>From</h4>
    <p>
      <span>X</span>
      <input type="number" value={segment.start.x} onChange={(ev) => doUpdateProp({ start: { x: Number.parseInt(ev.target.value)}})}></input>
      <span>Y</span>
      <input type="number" value={segment.start.y} onChange={(ev) => doUpdateProp({ start: { y: Number.parseInt(ev.target.value)}})}></input>
    </p>
    <h4>To</h4>
    <p>
      <span>X</span>
      <input type="number" value={segment.end.x} onChange={(ev) => doUpdateProp({ end: { x: Number.parseInt(ev.target.value)}})}></input>
      <span>Y</span>
      <input type="number" value={segment.end.y} onChange={(ev) => doUpdateProp({ end: { y: Number.parseInt(ev.target.value)}})}></input>
    </p>
    {segment instanceof CircularTrackSegment && <>
      <h4>Angle</h4>
      <p>
      <input type="number" value={segment.theta} step="any" onChange={(ev) => doUpdateProp({ theta:Number.parseInt(ev.target.value)})}></input>
      <span>CCW</span>
      <input type="checkbox" checked={segment.counterClockWise} onChange={(ev) => doUpdateProp({ counterClockWise: ev.target.checked})}></input>
    </p>
      </>
    }
  </div>
}

export default TrackSegmentDetail;