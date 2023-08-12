import { easyNavigate, isNetworkCoherent } from "../../utils";
import CircularTrackSegment from "../CircularTrackSegment";
import LinearTrackSegment from "../LinearTrackSegment";

// Set up some networks
// Make a figure 8 network
const h1 = new LinearTrackSegment({ x: 10, y: 0 }, { x: 0, y: 0 });
const h2 = new LinearTrackSegment({ x: 0, y: 10 }, { x: 10, y: 10 });
const h3 = new LinearTrackSegment({ x: 10, y: 20 }, { x: 0, y: 20 });
const v1 = new LinearTrackSegment({ x: 0, y: 0 }, { x: 0, y: 10 });
const v2 = new LinearTrackSegment({ x: 10, y: 10 }, { x: 10, y: 0 });
const v3 = new LinearTrackSegment({ x: 0, y: 20 }, { x: 0, y: 10 });
const v4 = new LinearTrackSegment({ x: 10, y: 10 }, { x: 10, y: 20 });
h1.connect(v1, true);
v1.connect(h2, true);
h2.connect(v2, true);
v2.connect(h1, true);
h2.connect(v4, true);
v4.connect(h3, true);
h3.connect(v3, true);
v3.connect(h2, true);

const pointA = { x: 0, y: 0 };
const pointB = { x: 10, y: 10 };
const circleCentre = { x: 10, y: 0 };
const circularSegment = new CircularTrackSegment(pointA, pointB, circleCentre);
const linearSegment = new LinearTrackSegment(pointB, pointA);
circularSegment.connect(linearSegment, true);
linearSegment.connect(circularSegment, true);

describe("easy navigation", () => {
  it("should navigate across multiple track segments", () => {
    const navResult = easyNavigate(
      circularSegment,
      0,
      false,
      circularSegment.length + linearSegment.length / 2,
    );
    expect(navResult.point.x).toBeCloseTo(5, 4);
    expect(navResult.point.y).toBeCloseTo(5, 4);
  });

  it("should account for starting distance along a segment", () => {
    const navResult = easyNavigate(
      circularSegment,
      Math.sqrt(2),
      false,
      circularSegment.length + linearSegment.length / 2,
    );
    expect(navResult.point.x).toBeCloseTo(4, 4);
    expect(navResult.point.y).toBeCloseTo(4, 4);
  });

  it("handles reverse travel", () => {
    const navResult = easyNavigate(
      circularSegment,
      Math.sqrt(2),
      true,
      circularSegment.length + linearSegment.length / 2,
    );
    expect(navResult.point.x).toBeCloseTo(6, 4);
    expect(navResult.point.y).toBeCloseTo(6, 4);
  });

  it("handles a transition from non-reverse to reverse", () => {
    const firstSegment = new LinearTrackSegment(
      { x: 0, y: 0 },
      { x: 0, y: 10 },
    );
    const secondSegment = new LinearTrackSegment(
      { x: 0, y: 20 },
      { x: 0, y: 10 },
    );
    firstSegment.connect(secondSegment, true);
    const navResult = easyNavigate(firstSegment, 0, false, 12);
    expect(navResult.point.y).toBeCloseTo(12, 4);
  });

  it("handles a transition from reverse to non-reverse", () => {
    const segment = new LinearTrackSegment({ x: 40, y: 40 }, { x: 40, y: 80 });
    const segment2 = new LinearTrackSegment({ x: 0, y: 40 }, { x: 40, y: 40 });
    segment.connect(segment2, true);

    const navResult = easyNavigate(segment, 46, true, 0);
    expect(navResult.point.x).toBe(34);
  });
});

describe("network coherence", () => {
  it("identifies a basic network as coherent", () => {
    expect(isNetworkCoherent([linearSegment, circularSegment])).toBe(true);
  });

  it("identifies a single segment as incoherent", () => {
    const justOneSegment = new LinearTrackSegment(pointA, pointB);
    expect(isNetworkCoherent([justOneSegment])).toBe(false);
  });

  it("identifies a more complex network as coherent", () => {
    expect(isNetworkCoherent([h1, h2, h3, v1, v2, v3, v4])).toBe(true);
  });

  it("identifies a multi-segment, bad network as incoherent", () => {
    const firstSegment = new LinearTrackSegment(pointA, pointB);
    const secondSegment = new LinearTrackSegment(pointB, circleCentre);
    expect(isNetworkCoherent([firstSegment, secondSegment])).toBe(false);
  });
});
