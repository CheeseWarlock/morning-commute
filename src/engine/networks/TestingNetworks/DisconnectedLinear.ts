import { ALIGNMENT } from "../../Station";
import NetworkBuilder from "../NetworkBuilder";

export const build = () => {
  const builder = new NetworkBuilder();
  builder.moveTo({ x: 0, y: 20 });
  builder.lineTo({ x: 60, y: 20 });
  builder.moveTo({ x: 80, y: 60 });
  builder.lineTo({ x: 110, y: 50 });
  builder.moveTo({ x: 40, y: 80 });
  builder.lineTo({ x: 90, y: 80 });
  return builder;
};

export default build().network;
