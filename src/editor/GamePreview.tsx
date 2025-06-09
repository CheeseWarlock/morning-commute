import React, { useEffect, useRef, useState } from "react";
import Network from "../engine/Network";
import BabylonRenderer from "../renderer/basic/babylon/BabylonRenderer";
import RendererCoordinator from "../renderer/RendererCoordinator";
import Game from "../engine/Game";
import Controller from "../engine/Controller";
import { TrainDetail } from "./TrainDetail";

export default function GamePreview({ network }: { network: Network }) {
  const rendererHolderRef = useRef<HTMLDivElement>(null);
  const [renderer, setRenderer] = useState<RendererCoordinator | null>(null);
  const [selectedTrainIndex, setSelectedTrainIndex] = useState<number>(0);

  useEffect(() => {
    if (rendererHolderRef.current && !renderer) {
      const controller = new Controller();
      const ref = rendererHolderRef.current;
      network.autoConnect();
      const game = new Game(network, controller);
      game.initialize();
      const babylonRenderer = new BabylonRenderer(ref, game);
      const rendererCoordinator = new RendererCoordinator(game, [
        babylonRenderer,
      ]);
      setRenderer(rendererCoordinator);

      // Listen for train selection events
      game.on("trainSelected", ({ index }) => {
        setSelectedTrainIndex(index);
      });
    }
    return () => {
      if (renderer) {
        renderer.stop();
      }
    };
  }, [rendererHolderRef.current]);

  return (
    <div className="flex flex-row">
      <div ref={rendererHolderRef} />
      <TrainDetail
        trainId={String.fromCharCode(65 + selectedTrainIndex)} // Convert 0 to 'A', 1 to 'B', etc.
        currentPassengers={5}
        maxPassengers={6}
        destinations={[
          { stationName: "Station A", passengerCount: 3 },
          { stationName: "Station B", passengerCount: 2 },
        ]}
      />
    </div>
  );
}
