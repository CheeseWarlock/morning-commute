/**
 * An object that models some game logic.
 */
interface GameObject {
  /**
   * Update this object's game state.
   * @param deltaT the amount of time, in milliseconds, to progress by.
   */
  update: (deltaT: number) => void;
}

export default GameObject;
