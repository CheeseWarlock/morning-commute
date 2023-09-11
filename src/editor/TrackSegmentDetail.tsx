import React from "react";
import TrackSegment from "../engine/TrackSegment";
import CircularTrackSegment from "../engine/CircularTrackSegment";
import Network from "../engine/Network";

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

  const doUpdateCX : React.ChangeEventHandler<HTMLInputElement> = (ev) => {
    const val = ev.target.value;
    const network = props.network;
    const aaaaa = new Network(network.segments);
    (aaaaa.segments[props.segmentIndex] as CircularTrackSegment).center.x = Number.parseInt(val);
    update(aaaaa);
  }

  const doUpdateCY : React.ChangeEventHandler<HTMLInputElement> = (ev) => {
    const val = ev.target.value;
    const network = props.network;
    const aaaaa = new Network(network.segments);
    (aaaaa.segments[props.segmentIndex] as CircularTrackSegment).center.y = Number.parseInt(val);
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
      <h4>Around</h4>
      <p>
      <span>X</span>
      <input type="number" value={segment.center.x} onChange={doUpdateCX}></input>
      <span>Y</span>
      <input type="number" value={segment.center.y} onChange={doUpdateCY}></input>
    </p>
      </>
    }
  </div>
}

export default TrackSegmentDetail;