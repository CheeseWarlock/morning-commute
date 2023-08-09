import Point from "./Point";

class TrackSegment {
    length: number;
    #start: Point;
    #end: Point;
    
    constructor(start: Point, end: Point) {
        this.#start = start;
        this.#end = end;
        this.length = Math.sqrt((start.x - end.x) ** 2 + (start.y - end.y) ** 2);
    }

    getDistanceAlong(distance: number) {
        return 0;
    }
}

export default TrackSegment;