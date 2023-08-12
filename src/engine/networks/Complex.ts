import NetworkBuilder from "./NetworkBuilder";

const builder = new NetworkBuilder();
builder.moveTo({ x: 0, y: 20 });

builder.curveTo({ x: 20, y: 0 }, { x: 20, y: 20 });
builder.lineTo({ x: 40, y: 0 });
builder.curveTo({ x: 60, y: 20 }, { x: 40, y: 20 });
builder.lineTo({ x: 60, y: 40 });
builder.curveTo({ x: 40, y: 60 }, { x: 40, y: 40 });
builder.lineTo({ x: 20, y: 60 });
builder.curveTo({ x: 0, y: 40 }, { x: 20, y: 40 });
builder.lineTo({ x: 0, y: 20 });

builder.moveTo({ x: 60, y: 20 });

builder.curveTo({ x: 80, y: 0 }, { x: 80, y: 20 });
builder.lineTo({ x: 100, y: 0 });
builder.curveTo({ x: 120, y: 20 }, { x: 100, y: 20 });
builder.lineTo({ x: 120, y: 40 });
builder.curveTo({ x: 100, y: 60 }, { x: 100, y: 40 });
builder.lineTo({ x: 80, y: 60 });
builder.curveTo({ x: 60, y: 40 }, { x: 80, y: 40 });

builder.moveTo({ x: 0, y: 40 });
builder.curveTo({ x: 120, y: 40 }, { x: 60, y: 40 }, true);

builder.moveTo({ x: 40, y: 0 });
builder.lineTo({ x: 80, y: 0 });

builder.moveTo({ x: 120, y: 20 });
const endAngle = Math.PI * (7 / 4);
builder.curveTo(
  {
    x: 140 + Math.cos(endAngle) * 20,
    y: 20 + Math.sin(endAngle) * 20,
  },
  { x: 140, y: 20 },
);
builder.lineTo({
  x: 180 + Math.cos(endAngle) * 20,
  y: 60 + Math.sin(endAngle) * 20,
});
builder.curveTo(
  {
    x: 180,
    y: 80,
  },
  {
    x: 180,
    y: 60,
  },
);
builder.curveTo(
  {
    x: 170,
    y: 70,
  },
  {
    x: 180,
    y: 70,
  },
);
builder.curveTo(
  {
    x: 150,
    y: 70,
  },
  {
    x: 160,
    y: 70,
  },
  true,
);
builder.curveTo(
  {
    x: 140,
    y: 60,
  },
  { x: 140, y: 70 },
);
builder.curveTo(
  {
    x: 150,
    y: 50,
  },
  {
    x: 140,
    y: 50,
  },
  true,
);
builder.lineTo({
  x: 150,
  y: 40,
});
builder.curveTo(
  {
    x: 120,
    y: 40,
  },
  {
    x: 135,
    y: 40,
  },
  true,
);

export default builder.network;
