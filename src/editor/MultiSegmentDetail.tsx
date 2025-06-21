import React from "react";
import TrackSegment from "../engine/TrackSegment";
import CircularTrackSegment from "../engine/CircularTrackSegment";
import TrackEditor from "./canvas/TrackEditor";

const MultiSegmentDetail = ({
  segments,
  selectSegment,
  trackEditor,
}: {
  segments: TrackSegment[];
  selectSegment: (segment: TrackSegment) => void;
  trackEditor: TrackEditor;
}) => {
  return (
    <div className="flex flex-col m-4 border-2 border-zinc-300 rounded-md p-2 bg-zinc-100 w-[400px] max-h-[calc(100vh-2rem)]">
      <div className="flex flex-row justify-between items-center">
        <h3 className="text-xl">
          {segments.length} Segment{segments.length === 1 ? "" : "s"}
        </h3>
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        {segments.map((segment) => {
          return (
            <div
              key={segment.id}
              className="border rounded-lg border-zinc-300 bg-zinc-200 flex flex-col m-2 p-2 cursor-pointer hover:bg-zinc-300"
              onClick={() => {
                selectSegment(segment);
              }}
              onMouseOver={() => {
                trackEditor.setStrongHighlight([segment]);
              }}
              onMouseOut={() => {
                trackEditor.setStrongHighlight([]);
              }}
            >
              <div>
                {segment instanceof CircularTrackSegment
                  ? "Circular"
                  : "Linear"}{" "}
                {segment.id.substring(0, 8)}
              </div>
              <div className="text-sm text-zinc-500">
                {segment.atStart.length && segment.atEnd.length
                  ? "Well Connected"
                  : segment.atStart.length
                  ? "Connected at Start"
                  : segment.atEnd.length
                  ? "Connected at End"
                  : "Not Connected"}
              </div>
              <div className="text-sm text-zinc-500">
                Length: {segment.length.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiSegmentDetail;
