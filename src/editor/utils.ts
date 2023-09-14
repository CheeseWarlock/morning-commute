import Point from "../engine/Point";

export const findCenter = (
  start: Point,
  end: Point,
  angle: number,
  counterClockWise: boolean,
) => {
  const chordLength = Math.sqrt(
    (start.x - end.x) ** 2 + (start.y - end.y) ** 2,
  );

  const radius = chordLength / (2 * Math.sin(angle / 2));

  const angleToEnd = Math.atan2(end.y - start.y, end.x - start.x);

  const angleToOrigin =
    angleToEnd +
    (angle / 2) * (counterClockWise ? 1 : -1) +
    (counterClockWise ? -Math.PI / 2 : Math.PI / 2);

  const centerPos = {
    x: start.x + Math.cos(angleToOrigin) * radius,
    y: start.y + Math.sin(angleToOrigin) * radius,
  };

  return centerPos;
};
