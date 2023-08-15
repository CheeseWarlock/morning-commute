import { ALIGNMENT } from "../Station";
import NetworkBuilder from "../networks/NetworkBuilder";

describe("network builder", () => {
  it("connects segments", () => {
    const builder = new NetworkBuilder();
    builder.moveTo({ x: 0, y: 0 });
    builder.lineTo({ x: 10, y: 10 });
    builder.lineTo({ x: 20, y: 20 });
    expect(builder.network.segments[0].atEnd[0]).toBe(
      builder.network.segments[1],
    );
  });

  it("connects curved segments", () => {
    const builder = new NetworkBuilder();
    builder.moveTo({ x: 0, y: 0 });
    builder.curveTo({ x: 10, y: 10 }, { x: 0, y: 10 });
    builder.lineTo({ x: 10, y: 20 });
    expect(builder.network.segments[0].atEnd[0]).toBe(
      builder.network.segments[1],
    );
  });

  it("does not connect segments with non-matching angles", () => {
    const builder = new NetworkBuilder();
    builder.moveTo({ x: 0, y: 0 });
    builder.curveTo({ x: 10, y: 10 }, { x: 0, y: 10 }, true);
    builder.lineTo({ x: 20, y: 20 });
    expect(builder.network.segments[0].atEnd).toHaveLength(0);
  });

  it("adds a station on the correct segment", () => {
    const builder = new NetworkBuilder();
    builder.moveTo({ x: 0, y: 0 });
    builder.curveTo({ x: 10, y: 10 }, { x: 0, y: 10 });
    builder.lineTo({ x: 10, y: 20 });
    builder.addStationOnLastSegment(12, ALIGNMENT.RIGHT);
    expect(builder.network.segments[1].stations.length).toBe(1);
  });
});
