import Point from "./Point";

class TrackSegment {
    length: number;
    start: Point;
    end: Point;
    
    constructor(start: Point, end: Point) {
        this.start = start;
        this.end = end;
        this.length = Math.sqrt((start.x - end.x) ** 2 + (start.y - end.y) ** 2);
    }

    getPositionAlong(distance: number): Point {
        const dx = (this.end.x - this.start.x) / this.length;
        const dy = (this.end.y - this.start.y) / this.length;

        return {
            x: this.start.x + dx * distance,
            y: this.start.y + dy * distance
        };
    }
}

export default TrackSegment;