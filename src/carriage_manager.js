"use strict";
import CustomSelect from './custom-select.js';
import { Preview } from './custom-select.js';

// manges columns and the transition of the cariage
export default class CariageManager {

  constructor(columnView) {
    this.parent = columnView;
    this.el = columnView.el;

    this.domCarriage = this.el.querySelector(".carriage");
    this.carriage = document.createDocumentFragment();
    this.changeCallbacks = [];

    this.domCarriage.innerHTML = "";
    this.domCarriage.appendChild(this.carriage);
    this.carriage = this.domCarriage;
    this.carriageReady = true;
    this.style = this.el.querySelector("style");
    this.transformPrefix = this.constructor.getTransformPrefix();
  }

  seed(dataItems) {
    this.seedPhase = true;
    dataItems.forEach(this._appendCol, this);
    this._resize();
    this._align();
    this.seedPhase = false;
  }

  get focusedColumn() {
    const cols = this.columns;
    return cols[cols.length - 2] || cols[0];
  }

  // TODO better name
  // selects first item in last column
  selectFirst() {
    const lastCol = this.carriage.lastChild;
    if (lastCol.customSelect) lastCol.customSelect.selectIndex(0); // COL ACTION!!!!!!
  }

  back() {
    const lastCol = this.focusedColumn;
    this._removeAfter(lastCol);
    if (lastCol.customSelect) lastCol.customSelect.deselect();
    this._align();
    // this._onChange(this.focusedColumn, this.focusedColumn.customSelect.value());

  }

  // @private
  _appendCol(data) {
    const col = this.createCol(data);
    if (!this.seedPhase) this._align();
    return col;
  }

  // @private
  createCol(data) {
    const col = document.createElement("div");
    col.classList.add("column");
    this.carriage.appendChild(col);
    return this.constructor.newColInstance(data, col, this.parent, (col, model) => this._onChange({ column: col, data: model, key: model.key }));
  }

  // Returns a Preview or CustomSelect instance, depending on the
  // passed in data
  // @private
  static newColInstance(data, col, columnView, onChange) {
    if (col.customSelect) col.customSelect.clear();
    switch (true) {
      case 'dom' in data:
        return new Preview(col, data.dom);
      case 'html' in data:
        return new Preview(col, data.html);
      case 'items' in data:
      case 'groups' in data:
        data.onChange = onChange;
        return new CustomSelect(col, data, columnView);
      default:
        console.error("Type error", arguments);
        throw "Type error";
    }
  }

  _onChange(data) {
    if (this.seedPhase) return;
    // console.log("_change", data);
    this.changeCallbacks.forEach((cb) => cb.apply(null, arguments));
  }

  // @private
  _removeAfter(col) {
    const cols = this.columns;
    const toRemove = cols.splice(cols.indexOf(col) + 1, cols.length);
    toRemove.forEach((col) => this.carriage.removeChild(col));
  }

  // @private
  _align() {
    const length = this.columns.length;
    if (this.lastAllignment === length) return; // skip if nothing has changed
    this.lastAllignment = length;

    const leftOut = Math.max(0, length - this.parent.colCount);
    this.lastLeftOut = leftOut;
    this._moveCarriage(leftOut);
    // this._resizeY();
  }

  get columns() {
    if (!this.carriageReady) throw "Carriage is not ready";
    return [].slice.call(this.carriage.children);
  }

  // @private
  _resize() {
    this.colWidth = this.el.offsetWidth / this.parent.colCount;
    const col = this.columns.slice(-1)[0];
    if (!col) return console.warn("No columns found. Can't determine height.");
    const height = col.offsetHeight;
    this._setStyle(`height: ${height}px; width: ${this.colWidth}px;`);
    this._moveCarriage(this.lastLeftOut, { transition: false });
    // console.log("colWidth", this.colWidth);
  }

  // @private
  _setStyle(css) {
    this.style.innerHTML = `.${this.parent.uniqueClassName} .column {${css}}`;
  }

  // // @private
  // _setLayout(layout) {
  //   // console.log("setLayout", layout);
  //   if (layout == "mobile") {
  //     this.colCount = 1;
  //     this.el.classList.add("mobile");
  //   } else {
  //     this.colCount = 3;
  //     this.el.classList.remove("mobile");
  //   }
  //
  //   if (!this.ready) return;
  //   this._resize();
  // }

  // @private
  _moveCarriage(leftOut, options) {
    options = options || {};
    if (!options.hasOwnProperty("transition")) options.transition = !this.seedPhase;
    this.lastLeftOut = leftOut;

    // console.log("move", this.ready)
    const left = -1 * leftOut * this.colWidth;
    this.carriage.classList.toggle("transition", options.transition);
    this.carriage.style[this.transformPrefix] = `translate(${left}px, 0px)`;
  }

  static getTransformPrefix() {
    const el = document.createElement("_");
    const prefixes = ["transform", "webkitTransform", "MozTransform", "msTransform", "OTransform"];
    let prefix;
    while (prefix = prefixes.shift()) {
      if (prefix in el.style) return prefix;
    }

    console.warn("transform not supported");
    return null;
  }
}
