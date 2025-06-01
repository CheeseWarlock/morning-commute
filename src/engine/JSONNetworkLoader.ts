import CircularTrackSegment from "./CircularTrackSegment";
import LinearTrackSegment from "./LinearTrackSegment";
import Network from "./Network";
import Point from "./Point";
import Station, { ALIGNMENT } from "./Station";
import TrackSegment from "./TrackSegment";

export type JSONTrackSegment = {
  id: string;
  start: Point;
  end: Point;
  atStart: string[];
  atEnd: string[];
  stations?: JSONStation[];
  center?: Point;
  counterClockWise?: boolean;
  trainStartPositions?: {
    distanceAlong: number;
    reverse: boolean;
  }[];
};

export type JSONStation = {
  distanceAlong: number;
  alignment: ALIGNMENT;
};

export const loadNetworkFromJSON = (jsonArray: JSONTrackSegment[]) => {
  const network = new Network();
  const createdSegments: Map<string, TrackSegment> = new Map();

  jsonArray.forEach((jsonItem) => {
    let segment: TrackSegment;
    if (jsonItem.center) {
      // Circular
      segment = new CircularTrackSegment(
        jsonItem.start,
        jsonItem.end,
        jsonItem.center,
        jsonItem.counterClockWise,
      );
      segment.id = jsonItem.id;
      createdSegments.set(jsonItem.id, segment);
      network.segments.push(segment);
    } else {
      // Linear
      segment = new LinearTrackSegment(jsonItem.start, jsonItem.end);
      segment.id = jsonItem.id;
      createdSegments.set(jsonItem.id, segment);
      network.segments.push(segment);
    }
    if (jsonItem.stations) {
      jsonItem.stations.forEach((station: JSONStation) => {
        const stationObject = new Station(
          segment,
          station.distanceAlong,
          station.alignment,
        );
        segment.stations.push(stationObject);
        network.stations.push(stationObject);
      });
    }
    if (jsonItem.trainStartPositions?.length) {
      segment.trainStartPositions = jsonItem.trainStartPositions;
    }
  });

  jsonArray.forEach((jsonItem) => {
    const segment = createdSegments.get(jsonItem.id)!;
    if (jsonItem.atStart) {
      jsonItem.atStart.forEach((id: string) => {
        const connectedSegment = createdSegments.get(id)!;
        segment.atStart.push(connectedSegment);
      });
    }
    if (jsonItem.atEnd) {
      jsonItem.atEnd.forEach((id: string) => {
        const connectedSegment = createdSegments.get(id)!;
        segment.atEnd.push(connectedSegment);
      });
    }
  });

  return network;
};
