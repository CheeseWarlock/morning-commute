import { ALIGNMENT } from "../Station";
import NetworkBuilder from "./NetworkBuilder";

const builder = new NetworkBuilder();
builder.moveTo({ x: 0, y: 30 });
builder.lineTo({ x: 60, y: 30 });
builder.moveTo({ x: 30, y: 0 });
builder.curveTo({ x: 60, y: 30 }, { x: 60, y: 0 }, true);
builder.lineTo({ x: 120, y: 30 });
builder.addStationOnLastSegment(40, ALIGNMENT.LEFT);
export default builder.network;
