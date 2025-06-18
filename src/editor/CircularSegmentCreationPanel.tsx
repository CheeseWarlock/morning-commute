import React from "react";
import Button from "./components/Button";

interface CircularSegmentCreationPanelProps {
  isCounterClockwise: boolean;
  onDirectionChange: (counterClockwise: boolean) => void;
  angle: number;
  onAngleChange: (angle: number) => void;
}

const CircularSegmentCreationPanel: React.FC<
  CircularSegmentCreationPanelProps
> = ({ isCounterClockwise, onDirectionChange, angle, onAngleChange }) => {
  return (
    <div className="flex flex-col m-4 border-2 border-zinc-300 rounded-md p-2 bg-zinc-100 w-[400px]">
      <h3 className="text-xl mb-4">Create Circular Segment</h3>

      <div className="flex flex-col gap-4">
        <div>
          <h4 className="text-lg mb-2">Direction</h4>
          <div className="flex gap-2">
            <Button
              selected={!isCounterClockwise}
              value="Clockwise"
              onClick={() => onDirectionChange(false)}
            />
            <Button
              selected={isCounterClockwise}
              value="Counter-clockwise"
              onClick={() => onDirectionChange(true)}
            />
          </div>
        </div>

        <div>
          <h4 className="text-lg mb-2">Angle</h4>
          <div className="flex gap-2">
            <Button
              selected={angle === Math.PI / 2}
              value="90°"
              onClick={() => onAngleChange(Math.PI / 2)}
            />
            <Button
              selected={angle === Math.PI}
              value="180°"
              onClick={() => onAngleChange(Math.PI)}
            />
          </div>
        </div>

        <div className="text-sm text-zinc-600">
          Click to place the start point, then click again to place the end
          point. The arc will be created with the selected angle and direction.
        </div>
      </div>
    </div>
  );
};

export default CircularSegmentCreationPanel;
