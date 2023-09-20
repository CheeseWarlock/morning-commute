import NetworkBuilder from "../NetworkBuilder";

export const build = () => {
  const builder = new NetworkBuilder();
  builder.moveTo({ x: 100, y: 200 });
  builder.lineTo({ x: 100, y: 300 });

  builder.moveTo({ x: 200, y: 100 });
  builder.lineTo({ x: 250, y: 100 });

  builder.moveTo({ x: 400, y: 200 });
  builder.lineTo({ x: 500, y: 300 });

  builder.moveTo({ x: 500, y: 400 });
  builder.lineTo({ x: 400, y: 400 });

  builder.moveTo({ x: 500, y: 200 });
  builder.curveTo({ x: 600, y: 100 }, { x: 600, y: 200 });

  builder.moveTo({ x: 600, y: 300 });
  builder.lineTo({ x: 700, y: 200 });
  return builder;
};

export default build().network;
