import TrackSegment from "../TrackSegment";

describe('TrackSegment', () => {
    it('should construct a track segment', () => {
        const pointA = { x: 0, y: 0 };
        const pointB = { x: 1, y: 1 };

        const segment = new TrackSegment(pointA, pointB);
    });

    it('should calculate distance along a track segment', () => {

    });
});