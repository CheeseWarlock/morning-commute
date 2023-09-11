import TrackEditor from "./TrackEditor";
import { build as buildComplex } from "../engine/networks/TestingNetworks/DisconnectedLinear";
import React, { useRef, useEffect, useState } from "react";
import TrackSegment from "../engine/TrackSegment";
import TrackSegmentDetail from "./TrackSegmentDetail";
import Network from "../engine/Network";

const TrackEditorComponent = (props: any) => {
  const divRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);
  const [selectedSegment, setSelectedSegment] = useState<TrackSegment | null>(null);
  const [network, setNetwork] = useState<Network>(buildComplex().network);

  useEffect(() => {
    const canvas = divRef.current;
    const trackEditor = new TrackEditor({element: canvas!, network: buildComplex().network, onSelect: (seg) => {setSelectedSegment(seg || null)}});
  }, []);

  return <>
    <div ref={divRef} {...props}/>
    {selectedSegment && <TrackSegmentDetail segment={selectedSegment}/>}
  </>;
}

export default TrackEditorComponent;