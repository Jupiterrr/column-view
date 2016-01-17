"use strict";

class KeyboardManager {

  constructor(columnView) {
    this.keyCodes = {
      enter: 13,
      space: 32,
      backspace: 8,
      tab: 9,
      left: 37,
      up: 38,
      right: 39,
      down: 40,
    };

    this.parent = columnView;
    this.el = columnView.el;
    this.carriageManager = columnView.carriageManager;

    this.movingUpOrDown = false;
    this.changeCallback = () => {};

    this.el.addEventListener("keydown", this._onKeydown.bind(this), true);
    this.el.addEventListener("keyup", this._onKeyup.bind(this), true);

    this.lastChangeArguments = null;

    this.parent.carriageManager.changeCallbacks.push((...args) => {
      if (this.movingUpOrDown) {
        this.lastChangeArguments = args;
      } else {
        this.lastChangeArguments = null;
        this.changeCallback.apply(null, args);
      }
    });
  }

  // @private
  _onKeydown(e) {
    this.movingUpOrDown = false;
    const keyCodes = this.keyCodes;
    if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey)
      return; // do nothing

    switch (e.keyCode) {
      case keyCodes.left:
      case keyCodes.backspace:
        this.parent.back();
        e.preventDefault();
        return;
      case keyCodes.right:
      case keyCodes.space:
      case keyCodes.enter:
        this.parent.carriageManager.selectFirst();
        e.preventDefault();
        return;
      case keyCodes.up:
        this.movingUpOrDown = true;
        this._moveCursor(-1);
        e.preventDefault();
        return;
      case keyCodes.down:
        this.movingUpOrDown = true;
        this._moveCursor(1);
        e.preventDefault();
        return;
      default:
        return;
    }
  }

  // @private
  _onKeyup() {
    this._endKeyUp();
  }

  _endKeyUp() {
    if (this.movingUpOrDown && this.lastChangeArguments) this.changeCallback.apply(null, this.lastChangeArguments);
    this.lastChangeArguments = null;
    this.movingUpOrDown = false;
  }

  // @private
  _moveCursor(direction) {
    var col = this.carriageManager.focusedColumn;
    if (col.customSelect.canMoveInPosition(direction)) {
      col.customSelect.movePosition(direction);
    } else {
      this._endKeyUp();
    }
  }
}
