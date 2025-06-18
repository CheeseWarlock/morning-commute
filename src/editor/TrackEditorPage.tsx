import React, { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import TrackEditorContent from "./TrackEditorContent";
import "./style.css";
import TrackEditorTopBar from "./TrackEditorTopBar";
import Network from "../engine/Network";
import {
  JSONTrackSegment,
  loadNetworkFromJSON,
} from "../engine/JSONNetworkLoader";
import MadeInEditor from "../engine/networks/MadeInEditor";
import { isNetworkCoherent } from "../utils";
import GamePreview from "./GamePreview";

const DEFAULT_NETWORK = loadNetworkFromJSON([] as JSONTrackSegment[]);

export enum EDITOR_PAGE_STATE {
  EDITOR = "EDITOR",
  GAME = "GAME",
}

const getNetworkCompleteness = (network: Network) => {
  network.autoConnect();
  const completeSegments = network.segments.filter(
    (seg) => seg.atEnd.length > 0 && seg.atStart.length > 0,
  );
  return (
    network.segments.length === completeSegments.length &&
    isNetworkCoherent(network.segments) &&
    network.stations.length > 1 &&
    network.segments.some((seg) => seg.trainStartPositions.length > 0)
  );
};

export default function TrackEditorPage() {
  const [network, setNetwork] = useState<Network>(DEFAULT_NETWORK);
  const [state, setState] = useState<EDITOR_PAGE_STATE>(
    EDITOR_PAGE_STATE.EDITOR,
  );

  const isNetworkComplete = useMemo(() => {
    return getNetworkCompleteness(network);
  }, [network]);

  return (
    <div>
      <TrackEditorTopBar
        network={network}
        isNetworkComplete={isNetworkComplete}
        setNetwork={setNetwork}
        state={state}
        setState={setState}
      />
      {state === EDITOR_PAGE_STATE.EDITOR && (
        <TrackEditorContent network={network} setNetwork={setNetwork} />
      )}
      {state === EDITOR_PAGE_STATE.GAME && <GamePreview network={network} />}
    </div>
  );
}

const container = document.querySelector<HTMLDivElement>("#root");
const root = createRoot(container!);
root.render(<TrackEditorPage />);
