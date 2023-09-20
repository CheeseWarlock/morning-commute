import NetworkBuilder from "../NetworkBuilder";

export const build = () => {
  const builder = new NetworkBuilder();
  builder.moveTo({ x: Math.random() * 400, y: Math.random() * 400 });
  builder.lineTo({ x: Math.random() * 400, y: Math.random() * 400 });

  builder.moveTo({ x: Math.random() * 400, y: Math.random() * 400 });
  builder.lineTo({ x: Math.random() * 400, y: Math.random() * 400 });

  return builder;
};

export default build().network;
