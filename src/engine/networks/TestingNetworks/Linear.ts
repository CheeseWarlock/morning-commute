import NetworkBuilder from "../NetworkBuilder";

export const build = () => {
  const builder = new NetworkBuilder();

  builder.moveTo({ x: 400, y: 200 });
  builder.lineTo({ x: 500, y: 300 });

  builder.moveTo({ x: 500, y: 400 });
  builder.lineTo({ x: 400, y: 400 });
  return builder;
};

export default build().network;
