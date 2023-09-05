import NetworkBuilder from "../NetworkBuilder";

export const build = () => {
  const builder = new NetworkBuilder();

  builder.moveTo({ x: 140, y: 20 });
  builder.lineTo({ x: 100, y: 60 });
  builder.lineTo({ x: 60, y: 60 });

  return builder;
};

export default build().network;
