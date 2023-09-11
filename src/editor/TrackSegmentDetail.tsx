import React from "react";
import TrackSegment from "../engine/TrackSegment";
import CircularTrackSegment from "../engine/CircularTrackSegment";

const TrackSegmentDetail = (props: { segment: TrackSegment}) => {
  return <div className="segment-info" >
    <h3>{props.segment instanceof CircularTrackSegment ? "Circular" : "Linear"}</h3>
    <h4>From</h4>
    <p>
      <span>From</span>
      <input type="number" value={props.segment.start.x}></input>
      <span>To</span>
      <input type="number" value={props.segment.start.y}></input>
    </p>
    <h4>To</h4>
    <p>
      <span>From</span>
      <input type="number" value={props.segment.end.x}></input>
      <span>To</span>
      <input type="number" value={props.segment.end.y}></input>
    </p>
    {props.segment instanceof CircularTrackSegment && <>
      <h4>Around</h4>
      <p>
      <span>From</span>
      <input type="number" value={props.segment.center.x}></input>
      <span>To</span>
      <input type="number" value={props.segment.center.y}></input>
    </p>
      </>
    }
  </div>
}

export default TrackSegmentDetail;