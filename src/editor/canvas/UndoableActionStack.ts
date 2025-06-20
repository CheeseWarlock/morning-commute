/**
 * An action that can be undone and redone.
 */
export type UndoableAction = {
  name: string;
  undoAction: () => void;
  doAction: () => void;
};

/**
 * A stack of undoable actions, for implementing undo/redo functionality.
 */
export type UndoableActionStack = {
  /**
   * The maximum number of actions to keep in the history.
   */
  historyLength: number;
  /**
   * The actions that have been applied, and the ones that have been undone.
   */
  actions: UndoableAction[];
  /**
   * The index of the last action that was applied, from the start of the stack.
   */
  currentIndex: number;
};

/**
 * Manages a stack of undoable actions with undo/redo functionality.
 */
export class UndoableActionManager {
  private stack: UndoableActionStack;

  constructor(historyLength: number = 10) {
    this.stack = {
      historyLength,
      actions: [],
      currentIndex: 0,
    };
  }

  /**
   * Push an undoable action to the stack, trim if needed, and execute it.
   */
  pushAndDoAction(action: UndoableAction) {
    if (this.stack.currentIndex < this.stack.actions.length) {
      // Splitting the timeline, so we need to trim the stack
      this.stack.actions.splice(
        this.stack.currentIndex,
        this.stack.actions.length - this.stack.currentIndex,
      );
      this.stack.currentIndex = this.stack.actions.length;
    }
    this.stack.actions.push(action);
    this.stack.currentIndex++;
    // Trim the stack if it exceeds the history length
    if (this.stack.actions.length > this.stack.historyLength) {
      this.stack.actions.shift();
      this.stack.currentIndex--;
    }
    action.doAction();
  }

  /**
   * A description of the action that can be currently undone.
   * If there is no action that can be undone, returns null.
   */
  get undoStatement(): string | null {
    if (this.stack.currentIndex > 0) {
      return this.stack.actions[this.stack.currentIndex - 1].name;
    }
    return null;
  }

  /**
   * Undo the last action.
   */
  undo() {
    if (this.stack.currentIndex > 0) {
      this.stack.currentIndex--;
      const action = this.stack.actions[this.stack.currentIndex];
      action.undoAction();
    }
  }

  /**
   * A description of the action that can be currently redone.
   * If there is no action that can be redone, returns null.
   */
  get redoStatement(): string | null {
    if (this.stack.currentIndex < this.stack.actions.length) {
      return this.stack.actions[this.stack.currentIndex].name;
    }
    return null;
  }

  /**
   * Redo the last undone action.
   */
  redo() {
    if (this.stack.currentIndex < this.stack.actions.length) {
      const action = this.stack.actions[this.stack.currentIndex];
      action.doAction();
      this.stack.currentIndex++;
    }
  }

  /**
   * Clear all actions from the stack.
   */
  clear() {
    this.stack.actions = [];
    this.stack.currentIndex = 0;
  }

  /**
   * Get the current stack state (for debugging or persistence).
   */
  getStackState(): UndoableActionStack {
    return { ...this.stack };
  }
}
