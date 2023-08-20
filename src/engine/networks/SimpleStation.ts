import { ALIGNMENT } from "../Station";
import NetworkBuilder from "./NetworkBuilder";

const builder = new NetworkBuilder();
builder.moveTo({ x: 0, y: 10 });
builder.lineTo({ x: 20, y: 10 });
builder.lineTo({ x: 100, y: 10 });
builder.addStationOnLastSegment(30, ALIGNMENT.RIGHT);
builder.lineTo({ x: 120, y: 10 });
builder.curveTo({ x: 130, y: 20 }, { x: 120, y: 20 });
builder.curveTo({ x: 120, y: 30 }, { x: 120, y: 20 });
builder.curveTo({ x: 110, y: 20 }, { x: 120, y: 20 });

builder.curveTo({ x: 100, y: 10 }, { x: 100, y: 20 }, true);

export default builder.network;
