import React, { useEffect, useRef, useState } from "react";
import Network from "../engine/Network";
import BabylonRenderer from "../renderer/basic/babylon/BabylonRenderer";
import RendererCoordinator from "../renderer/RendererCoordinator";
import Game from "../engine/Game";
import Controller from "../engine/Controller";
import { TrainDetail } from "./TrainDetail";
import Train from "../engine/Train";
import Station from "../engine/Station";

interface TrainPassengerInfo {
  currentPassengers: number;
  maxPassengers: number;
  destinations: {
    stationName: string;
    passengerCount: number;
  }[];
}

export default function GamePreview({ network }: { network: Network }) {
  const rendererHolderRef = useRef<HTMLDivElement>(null);
  const [renderer, setRenderer] = useState<RendererCoordinator | null>(null);
  const [selectedTrainIndex, setSelectedTrainIndex] = useState<number>(0);
  const [trainPassengerInfo, setTrainPassengerInfo] =
    useState<TrainPassengerInfo>({
      currentPassengers: 0,
      maxPassengers: 8,
      destinations: [],
    });

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
      game.on("trainSelected", ({ train }) => {
        setSelectedTrainIndex(game.gameState.trains.indexOf(train));
        updateTrainPassengerInfo(train);
      });

      // Listen for passenger updates
      game.gameState.on("trainPassengersUpdated", ({ train, passengers }) => {
        if (train === game.selectedTrain) {
          updateTrainPassengerInfo(train);
        }
      });

      // Initialize with first train's info
      updateTrainPassengerInfo(game.selectedTrain!);
    }
    return () => {
      if (renderer) {
        renderer.stop();
      }
    };
  }, [rendererHolderRef.current]);

  const updateTrainPassengerInfo = (train: Train) => {
    // Group passengers by destination
    const destinationMap = new Map<Station, number>();
    train.passengers.forEach((passenger) => {
      const count = destinationMap.get(passenger.destination) || 0;
      destinationMap.set(passenger.destination, count + 1);
    });

    // Convert to array format for TrainDetail
    const destinations = Array.from(destinationMap.entries()).map(
      ([station, count], index) => ({
        stationName: station.name,
        passengerCount: count,
      }),
    );

    setTrainPassengerInfo({
      currentPassengers: train.passengers.length,
      maxPassengers: train.capacity,
      destinations,
    });
  };

  return (
    <div className="flex flex-row">
      <div ref={rendererHolderRef} />
      <TrainDetail
        trainId={String.fromCharCode(65 + selectedTrainIndex)} // Convert 0 to 'A', 1 to 'B', etc.
        currentPassengers={trainPassengerInfo.currentPassengers}
        maxPassengers={trainPassengerInfo.maxPassengers}
        destinations={trainPassengerInfo.destinations}
      />
    </div>
  );
}
