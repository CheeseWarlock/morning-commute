import React, { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import TrackEditorContent from "./TrackEditorContent";
import "./style.css";
import TrackEditorTopBar from "./TrackEditorTopBar";
import Network from "../engine/Network";
import { JSONTrackSegment, loadNetworkFromJSON } from "../engine/JSONNetworkLoader";
import MadeInEditor from "../engine/networks/MadeInEditor";
import { isNetworkCoherent } from "../utils";
import TrackEditor from "./TrackEditor";

const DEFAULT_NETWORK = loadNetworkFromJSON(MadeInEditor as JSONTrackSegment[]);

const getNetworkCompleteness = (network: Network) => {
    network.autoConnect();
    const completeSegments = network.segments.filter(
      (seg) => seg.atEnd.length > 0 && seg.atStart.length > 0
    );
    return network.segments.length === completeSegments.length && isNetworkCoherent(network.segments);
}

export default function TrackEditorPage() {
    const [network, setNetwork] = useState<Network>(DEFAULT_NETWORK);
    const isNetworkComplete = useMemo(() => {
        return getNetworkCompleteness(network);
    }, [network]);
    const [trackEditor, setTrackEditor] = useState<TrackEditor | undefined>(undefined);
    
    return (
        <div>
            <TrackEditorTopBar network={network} isNetworkComplete={isNetworkComplete} trackEditor={trackEditor} setNetwork={setNetwork} />
            <TrackEditorContent network={network} trackEditor={trackEditor} setNetwork={setNetwork} setTrackEditor={setTrackEditor} />
        </div>
    )
}

const container = document.querySelector<HTMLDivElement>("#root");
const root = createRoot(container!);
root.render(<TrackEditorPage />);
