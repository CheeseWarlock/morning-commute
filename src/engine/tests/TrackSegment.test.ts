import TrackSegment from "../TrackSegment";

describe('a single TrackSegment', () => {
    const pointA = { x: 0, y: 0 };
    const pointB = { x: 10, y: 0 };
    const pointC = { x: 10, y: 10 };

    it('should construct a track segment', () => {
        new TrackSegment(pointA, pointB);
    });

    it('should calculate distance along a track segment for a y=0 line', () => {
        const segment = new TrackSegment(pointA, pointB);
        const positionAlong = segment.getPositionAlong(1);
        expect(positionAlong.x).toBe(1);
        expect(positionAlong.y).toBe(0);
    });

    it('should calculate distance along a track segment for a diagonal line', () => {
        const segment = new TrackSegment(pointA, pointC);
        const positionAlong = segment.getPositionAlong(Math.sqrt(2));
        expect(positionAlong.x).toBeCloseTo(1, 4);
        expect(positionAlong.y).toBeCloseTo(1, 4);
    });
});
