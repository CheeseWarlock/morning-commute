import Station, { ALIGNMENT } from "../Station";
import NetworkBuilder from "./NetworkBuilder";

const builder = new NetworkBuilder();
builder.moveTo({ x: 10, y: 10 });
builder.lineTo({ x: 40, y: 10 });
builder.lineTo({ x: 300, y: 10 });
builder.addStationOnLastSegment(40, ALIGNMENT.RIGHT);
export default builder.network;
