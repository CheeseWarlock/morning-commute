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
  const [trackEditor, setTrackEditor] = useState<TrackEditor | undefined>(undefined);

  useEffect(() => {
    const canvas = divRef.current;
    if (trackEditor) {
      console.log('updatin');
      trackEditor.network = network;
      trackEditor.update();
    } else {
      const te = new TrackEditor({element: canvas!, network: network, onSelect: (seg) => {
        setSelectedSegment(seg || null);
      }});
      te.update();
      setTrackEditor(te);
    }
  }, [network]);

  const fakeNet = new Network([network.segments[0]]);

  return <>
    <div ref={divRef} {...props}/>
    <input value="dsfasdf" type="button" onClick={() => {setNetwork(fakeNet); console.log("Setting")}} />
    <p>{network.segments.length}</p>
    {selectedSegment && <TrackSegmentDetail update={(n) => {
      setNetwork(n);
    }} segmentIndex={network.segments.indexOf(selectedSegment)} network={network}/>}
  </>;
}

export default TrackEditorComponent;