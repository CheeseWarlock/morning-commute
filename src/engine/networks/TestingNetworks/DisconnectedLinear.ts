import NetworkBuilder from "../NetworkBuilder";

export const build = () => {
  const builder = new NetworkBuilder();
  builder.moveTo({ x: 0, y: 20 });
  builder.lineTo({ x: 60, y: 20 });
  builder.moveTo({ x: 80, y: 60 });
  builder.lineTo({ x: 110, y: 50 });
  builder.moveTo({ x: 40, y: 80 });
  builder.lineTo({ x: 90, y: 80 });
  builder.moveTo({ x: 200, y: 100 });
  builder.curveTo({ x: 300, y: 100 }, { x: 250, y: 100 });
  builder.moveTo({ x: 150, y: 100 });
  builder.curveTo({ x: 350, y: 100 }, { x: 250, y: 100 });

  builder.moveTo({ x: 450, y: 0 });
  builder.curveTo({ x: 550, y: 0 }, { x: 500, y: 0 }, true);
  builder.moveTo({ x: 400, y: 0 });
  builder.curveTo({ x: 600, y: 0 }, { x: 500, y: 0 }, true);

  builder.moveTo({ x: 100, y: 200 });
  builder.lineTo({ x: 150, y: 200 });

  builder.moveTo({ x: 125, y: 300 });
  builder.lineTo({ x: 175, y: 300 });
  return builder;
};

export default build().network;
