import NetworkBuilder from "../NetworkBuilder";

const builder = new NetworkBuilder();
builder.moveTo({ x: 0, y: 10 });

builder.lineTo({ x: 20, y: 10 });
builder.curveTo({ x: 30, y: 20 }, { x: 20, y: 20 });
builder.back();

builder.lineTo({ x: 30, y: 10 });
builder.curveTo({ x: 40, y: 0 }, { x: 30, y: 0 }, true);
builder.back();

builder.lineTo({ x: 40, y: 10 });
builder.lineTo({ x: 50, y: 10 });
builder.back();

builder.curveTo({ x: 50, y: 20 }, { x: 40, y: 20 });
builder.curveTo({ x: 40, y: 30 }, { x: 40, y: 20 });
builder.back();

builder.lineTo({ x: 50, y: 30 });
builder.lineTo({ x: 50, y: 40 });
builder.back();

builder.curveTo({ x: 60, y: 40 }, { x: 60, y: 30 }, true);

export default builder.network;
