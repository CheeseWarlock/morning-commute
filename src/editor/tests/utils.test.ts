import CircularTrackSegment from "../../engine/CircularTrackSegment";
import { findCenter } from "../utils";

describe("findCenter", () => {
  const start = { x: 0, y: 0 };
  const end = { x: 20, y: 20 };
  const angle = Math.PI / 2;

  it("should work for 90 degrees", () => {
    const center = findCenter(start, end, angle, false);
    expect(center.x).toBeCloseTo(0);
    expect(center.y).toBeCloseTo(20);
  });

  it("should work for 90 degrees ccw", () => {
    const center = findCenter(start, end, angle, true);
    expect(center.x).toBeCloseTo(20);
    expect(center.y).toBeCloseTo(0);
  });

  it("should be able to reverse engineer an actual circular track segment", () => {
    const segment = new CircularTrackSegment(
      { x: 0, y: 30 },
      { x: 60, y: 30 },
      { x: 30, y: 30 },
      false,
    );

    expect(
      findCenter(
        segment.start,
        segment.end,
        segment.theta,
        segment.counterClockWise,
      ).x,
    ).toBeCloseTo(30);
    expect(
      findCenter(
        segment.start,
        segment.end,
        segment.theta,
        segment.counterClockWise,
      ).y,
    ).toBeCloseTo(30);
  });

  it("should be able to reverse engineer an actual circular track segment with a different angle", () => {
    const segment = new CircularTrackSegment(
      { x: 0, y: 30 },
      {
        x: 30 + Math.sin(Math.PI / 4) * 30,
        y: 30 - Math.sin(Math.PI / 4) * 30,
      },
      { x: 30, y: 30 },
      false,
    );

    expect(
      findCenter(
        segment.start,
        segment.end,
        segment.theta,
        segment.counterClockWise,
      ).x,
    ).toBeCloseTo(30);
    expect(
      findCenter(
        segment.start,
        segment.end,
        segment.theta,
        segment.counterClockWise,
      ).y,
    ).toBeCloseTo(30);
  });
});
