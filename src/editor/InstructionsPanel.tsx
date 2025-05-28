import React from "react";
import Panel from "./components/Panel";

const InstructionsPanel = ({ onClose }: { onClose: () => void }) => (
  <Panel title="Instructions" onClose={onClose}>
    <div className="flex-1 overflow-auto mt-4 text-sm">
      {/* Your instructions content here */}
      <p>Build a track out of connected segments and playtest it.</p>
      <h2 className="text-lg font-bold">Adding Segments</h2>
      <ul className="list-disc ml-6 mb-2">
        <li>For lines, click to start a new segment, then click again to place the end.</li>
        <li>For connections, click on the ends of two line segments to connect them. They will be connected with a curved segment and a straight segment.</li>
        <li>The direction of attachment is determined by which segment was hovered before the end was hovered.</li>
      </ul>
      <h2 className="text-lg font-bold">Editing Segments</h2>
      <ul className="list-disc ml-6 mb-2">
        <li>Click on a segment to select it.</li>
        <li>Segments with no connections can be moved.</li>
        <li>Line segments with one connected end can be extended, but their direction is fixed.</li>
        <li>Curved segments with one connected end can't be edited- delete their connection first.</li>
        <li>Segments with two connected ends can't be edited- delete their connections first.</li>
      </ul>
      <h2 className="text-lg font-bold">Network Completeness</h2>
      <ul className="list-disc ml-6 mb-2">
        <li>The game can only run on complete networks.</li>
        <li>A network is complete if every segment is connected at both ends. The entire network must be a connected graph.</li>
        <li>The direction of a segment has no effect on the game.</li>
      </ul>
      <h2 className="text-lg font-bold">Playing the Game</h2>
      <ul className="list-disc ml-6 mb-2">
        <li>Click Run Game to playtest your network.</li>
        <li>In game, use W and S to switch between trains, and A and D to choose which path to take at intersections.</li>
      </ul>
    </div>
  </Panel>
);

export default InstructionsPanel;
