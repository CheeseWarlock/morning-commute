import React, { useEffect, useRef, useState } from "react";
import Network from "../engine/Network";
import BabylonRenderer from "../renderer/basic/babylon/BabylonRenderer";
import RendererCoordinator from "../renderer/RendererCoordinator";
import Game from "../engine/Game";
import Controller from "../engine/Controller";

export default function GamePreview({ network }: { network: Network }) {
    const rendererHolderRef = useRef<HTMLDivElement>(null);
    const [renderer, setRenderer] = useState<RendererCoordinator | null>(null);

    useEffect(() => {
        if (rendererHolderRef.current && !renderer) {
            const controller = new Controller();
            const ref = rendererHolderRef.current;
            network.autoConnect();
            const game = new Game(network, controller);
            game.initialize();
            const babylonRenderer = new BabylonRenderer(
                ref,
                game,
            );
            const rendererCoordinator = new RendererCoordinator(game, [babylonRenderer]);
            setRenderer(rendererCoordinator);
        }
    }, [rendererHolderRef.current]);
  
    return (
        <div>
            <div ref={rendererHolderRef} />
        </div>
    );
}

