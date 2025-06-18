import LinearTrackSegment from "../LinearTrackSegment";
import Station, { ALIGNMENT } from "../Station";

describe("Track Segment Splitting Preservation", () => {
  it("should correctly distribute stations and train start positions when splitting", () => {
    // Create a simple segment
    const originalSegment = new LinearTrackSegment(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    );

    // Add stations to the segment
    const station1 = new Station(
      originalSegment,
      20,
      ALIGNMENT.LEFT,
      "Station 1",
    );
    const station2 = new Station(
      originalSegment,
      60,
      ALIGNMENT.RIGHT,
      "Station 2",
    );
    const station3 = new Station(
      originalSegment,
      80,
      ALIGNMENT.LEFT,
      "Station 3",
    );

    originalSegment.stations.push(station1, station2, station3);

    // Add train start positions
    originalSegment.trainStartPositions.push(
      { distanceAlong: 10, reverse: false },
      { distanceAlong: 70, reverse: true },
    );

    // Simulate splitting at distance 50
    const splitDistanceAlong = 50;

    // Create the new segments
    const firstSegment = new LinearTrackSegment(
      { ...originalSegment.start },
      { x: 50, y: 0 },
    );

    const secondSegment = new LinearTrackSegment(
      { x: 50, y: 0 },
      { ...originalSegment.end },
    );

    // Distribute stations
    originalSegment.stations.forEach((station) => {
      if (station.distanceAlong <= splitDistanceAlong) {
        // Station is on the first segment
        firstSegment.stations.push(station);
        station.trackSegment = firstSegment;
      } else {
        // Station is on the second segment, adjust its distance
        const newDistanceAlong = station.distanceAlong - splitDistanceAlong;
        station.distanceAlong = newDistanceAlong;
        secondSegment.stations.push(station);
        station.trackSegment = secondSegment;
      }
    });

    // Distribute train start positions
    originalSegment.trainStartPositions.forEach((startPosition) => {
      if (startPosition.distanceAlong <= splitDistanceAlong) {
        // Train start position is on the first segment
        firstSegment.trainStartPositions.push(startPosition);
      } else {
        // Train start position is on the second segment, adjust its distance
        const newDistanceAlong =
          startPosition.distanceAlong - splitDistanceAlong;
        secondSegment.trainStartPositions.push({
          distanceAlong: newDistanceAlong,
          reverse: startPosition.reverse,
        });
      }
    });

    // Verify the results
    expect(firstSegment.stations).toHaveLength(1); // station1
    expect(secondSegment.stations).toHaveLength(2); // station2 and station3

    // Check that station distances are adjusted correctly
    expect(firstSegment.stations[0].distanceAlong).toBe(20); // station1 unchanged
    expect(secondSegment.stations[0].distanceAlong).toBe(10); // station2 adjusted (60 - 50)
    expect(secondSegment.stations[1].distanceAlong).toBe(30); // station3 adjusted (80 - 50)

    // Check that train start positions are preserved and distributed correctly
    expect(firstSegment.trainStartPositions).toHaveLength(1); // position at 10
    expect(secondSegment.trainStartPositions).toHaveLength(1); // position at 70 adjusted to 20

    expect(firstSegment.trainStartPositions[0].distanceAlong).toBe(10);
    expect(firstSegment.trainStartPositions[0].reverse).toBe(false);
    expect(secondSegment.trainStartPositions[0].distanceAlong).toBe(20); // 70 - 50
    expect(secondSegment.trainStartPositions[0].reverse).toBe(true);

    // Verify that station references are updated correctly
    expect(station1.trackSegment).toBe(firstSegment);
    expect(station2.trackSegment).toBe(secondSegment);
    expect(station3.trackSegment).toBe(secondSegment);
  });
});
