import loopNetwork from "../networks/Loop";
import doubleLoopNetwork from "../networks/DoubleLoop";
describe("the loop network", () => {
  it("should connect segments based on position", () => {
    loopNetwork.autoConnect();
    expect(loopNetwork.segments.length).toBe(8);
    loopNetwork.segments.forEach((segment) => {
      expect(segment.atEnd.length).toBe(1);
      expect(segment.atStart.length).toBe(1);
    });
  });
});

describe("the double loop network", () => {
  it("should connect segments based on position and angle by default", () => {
    doubleLoopNetwork.autoConnect();
    expect(doubleLoopNetwork.segments.length).toBe(15);
    const multiSplits = doubleLoopNetwork.segments.filter(
      (segment) => segment.atStart.length + segment.atEnd.length > 2,
    );
    expect(multiSplits.length).toBe(1);
  });
});
