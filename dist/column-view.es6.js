"use strict";

// manges columns and the transition of the cariage
class CariageManager {

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
        return new ColumnView.prototype.Preview(col, data.dom);
      case 'html' in data:
        return new ColumnView.prototype.Preview(col, data.html);
      case 'items' in data:
      case 'groups' in data:
        data.onChange = onChange;
        return new ColumnView.prototype.CustomSelect(col, data, columnView);
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

"use strict";

function debounce(func, wait, immediate) {
  var timeout, args, context, timestamp, result;

  function now() { new Date().getTime(); }

  var later = () => {
    var last = now() - timestamp;
    if (last < wait) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        context = args = null;
      }
    }
  };

  return () => {
    args = arguments;
    timestamp = now();
    const callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(this, args);
      context = args = null;
    }

    return result;
  };
}

class ColumnView {

  constructor(el, options) {
    this.options = options || {};
    this.value = null;
    this.ready = false;
    this.carriageReady = false;
    this.colCount = 3; //default

    this.el = el;
    this.carriageManager = new CariageManager(this);
    this.carriageManager.changeCallbacks.push((data) => {
      // console.log("change");
      this.el.setAttribute("aria-activedescendant", `cv-${this.uid}-${data.key}`);
    });

    this.keyboardManager = new KeyboardManager(this);
    this.keyboardManager.changeCallback = this._onColumnChange.bind(this);

    this.models = options.items;
    this.path = options.path || [];

    this.callbacks = {
      change: this.options.onChange,
      source: (data) => new Promise((resolve, reject) => {
        this.options.source(data, (result) => {
          this._checkSourceResponse(result, reject);
          resolve(result);
        });
      }),
      ready:  this.options.ready,
    };

    // this.carriageManager._setLayout(options.layout);

    if (options.itemTemplate) {
      this.CustomSelect.prototype.itemTemplate = options.itemTemplate;
    }

    this.uid = this._uid();
    this.uniqueClassName = `column-view-${this.uid}`;
    this.el.classList.add(this.uniqueClassName);
    this.el.setAttribute("tabindex", 0);
    this.el.setAttribute("role", "tree");

    this._onColumnChangeBound = this._onColumnChange.bind(this);

    // window.addEventListener("resize", debounce(this._resize.bind(this), 300));

    // console.log("path", this.path);
    this._loadDataBySourceCalls(this.path).then((columnDataItems) => {
      this.carriageManager.seed(columnDataItems);
      this.ready = true;
      if (this.callbacks.ready) this.callbacks.ready.call(this);
    });
  }

  _checkSourceResponse(result, reject) {
    let checkItems = (items) => {
      if (!result.items.every((item) => 'key' in item)) {
        console.error("'key' propertie is missing on at least one item!", result);
        reject("'key' propertie is missing on at least one item!", result);
      }
    };

    if ('items' in result) checkItems(result.items);
    if ('groups' in result) result.groups.every((group) => checkItems(group.items));
  }

  // Getter
  // --------

  // TODO remove
  get columns() {
    return this.carriageManager.columns;
  }

  get canMoveBack() {
    switch (this.colCount) {
      case 3:
        return this.columns.length > 2;
      case 1:
        return this.columns.length > 1;
      default:
        console.warn("canMoveBack case not defined");
        return false;
    }
  }

  // @private
  _onColumnChange(data) {
    var column = data.column.el;

    // console.log("_onColumnChange", arguments);
    // TODO get rid of value
    this.value = data.key;

    this.carriageManager._removeAfter(column);

    this.callbacks.source(data).then((_data) => {
      if (this.value != data.key) return; // this call is outdated
      this.carriageManager._appendCol(_data);
      this.callbacks.change.call(this, data);
    });

    // todo handle case case no callback is called
  }

  _loadDataBySourceCalls(path) {
    const pathPairs = path.map((value, i, array) => [value, array[i + 1]]);

    var promises = pathPairs.map((pathPair) => {
      const id = pathPair[0], nextID = pathPair[1];
      return this.callbacks.source({ key: id, seed: true })
        .then((data) => {
          if (nextID) data.selectedValue = nextID;
          return data;
        });
    });
    return Promise.all(promises);
  }

  back() {
    if (!this.canMoveBack) return;
    this.carriageManager.back();
    this.value = this.carriageManager.focusedColumn.customSelect.value();
    this.callbacks.change.call(this, this.value);
  }

  _uid() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  // _transform(json) {
  //   var obj = typeof json == "object" ? json : JSON.parse(json);
  //   var nodes = {};
  //   var id = 0;
  //
  //   function parse(node) {
  //     var _ids = [];
  //     for (var i in node) {
  //       var _id = id++;
  //       _ids.push(_id);
  //
  //       if (typeof node[i] == "string" || (typeof node[i] == "object" && "__" in node[i])) {
  //         var newNode = { name: i, childIDs: [], data: node[i] };
  //       } else {
  //         var newNode = { name: i, childIDs: parse(node[i]) };
  //       }
  //
  //       nodes[_id] = newNode;
  //     }
  //
  //     return _ids;
  //   };
  //
  //   var rootId = id++;
  //   nodes[rootId] = { name: "root", childIDs: parse(obj) };
  //   return nodes;
  // }

}

"use strict";

function htmlToDocumentFragment(html) {
  var frag = document.createDocumentFragment();
  var tmp = document.createElement("body");
  tmp.innerHTML = html;
  var child;
  while (child = tmp.firstChild) {
    frag.appendChild(child);
  }

  return frag;
}

// aria-owns="catGroup" aria-expanded="false"
// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_group_role

ColumnView.prototype.CustomSelect = class CustomSelect {

  constructor(parent, data, columnView) {
    if (!data) data = {};

    this.el = parent;
    this.columnView = columnView;

    this.data = data;
    this.models = data.items;
    this.groups = data.groups;
    this.changeCB = data.onChange;

    this._selectedEl = this.el.querySelector(".selected");
    this.items = this.el.querySelectorAll(".item");

    this.value = null;

    this.el.setAttribute("role", "group");

    this.boundOnClick = this._onClick.bind(this);
    this.el.addEventListener("click", this.boundOnClick);

    this._monkeyPatchEl();

    if (this.models || this.groups) this._render(data.selectedValue);
  }

  _monkeyPatchEl() {
    var selectIndex = this.selectIndex.bind(this);
    var movePosition = this.movePosition.bind(this);
    var canMoveInPosition = this.canMoveInPosition.bind(this);
    var deselect = this.deselect.bind(this);
    var clear = this.clear.bind(this);
    var selectValue = this._selectValue.bind(this);
    var elMethods = {
      selectIndex: selectIndex,
      movePosition: movePosition,
      deselect: deselect,
      selectValue: selectValue,
      clear: clear,
      canMoveInPosition: canMoveInPosition,
      value: () => this.value,
    };
    this.el.customSelect = elMethods;
  }

  _render(selectedValue) {
    var container = document.createDocumentFragment();
    if (this.data.header) this._renderHeader(container);
    if (this.groups) {
      this._renderGroups(container, this.groups);
    } else if (this.models) {
      this._renderItems(container, this.models);
    } else {
      this._renderEmpty(container);
    }

    this.el.innerHTML = "";
    this.el.appendChild(container);
    this.items = this.el.querySelectorAll(".item");
    if (selectedValue) this._selectValue(selectedValue);
  }

  _renderHeader(container) {
    let header = document.createElement("header");
    header.innerHTML = this.data.header;
    container.appendChild(header);
  }

  _renderItems(container, models) {
    models.forEach((model) => {
      var html = this.itemTemplate(model);
      var item = htmlToDocumentFragment(html);
      item.firstChild.__columviewData__ = model;
      container.appendChild(item);
    });
  }

  _renderGroups(container, groups) {
    groups.forEach((group) => {
      var html = this.groupTemplate(group);
      var item = htmlToDocumentFragment(html);
      container.appendChild(item);
      this._renderItems(container, group.items);
    });
  }

  _renderEmpty(container) {
    var el = document.createTextNode("empty");
    container.appendChild(el);
  }

  clear() {
    this.el.customSelect = null;
    this.el.removeEventListener("click", this.boundOnClick);
  }

  _scrollIntoView() {
    var elRect = this.el.getBoundingClientRect();
    var itemRect = this._selectedEl.getBoundingClientRect();

    if (itemRect.bottom > elRect.bottom) {
      this.el.scrollTop += itemRect.bottom - elRect.bottom;
    }

    if (itemRect.top < elRect.top) {
      this.el.scrollTop -= elRect.top - itemRect.top;
      if (this._getActiveIndex() == 0) this.el.scrollTop = 0;
    }
  }

  _deselect(el) {
    el.classList.remove("selected");
    this._selectedEl = null;
  }

  _select(el) {
    if (this._selectedEl === el) return;
    if (this._selectedEl) this._deselect(this._selectedEl);
    el.classList.add("selected");
    this._selectedEl = el;
    var oldValue = this.value;
    this.value = el.__columviewData__;

    // console.log("select", this.value);
    this.changeCB(this, this.value, oldValue);
  }

  _onClick(e) {
    if (e.ctrlKey || e.metaKey) return;
    if (!e.target.classList.contains("item")) return;
    e.preventDefault();
    this._select(e.target);
  }

  _getActiveIndex() {
    var active = this._selectedEl;
    var index = [].indexOf.call(this.items, active);
    return index;
  }

  canMoveInPosition(direction) {
    var index = this._getActiveIndex();
    var newIndex = index + direction;
    return newIndex >= 0 && newIndex < this.items.length;
  }

  movePosition(direction) {
    var index = this._getActiveIndex();
    this.selectIndex(index + direction);
  }

  selectIndex(index) {
    var item = this.items[index];
    if (item) this._select(item);
    this._scrollIntoView();
  }

  remove() {
    this.el.remove();
  }

  deselect() {
    if (this._selectedEl) this._deselect(this._selectedEl);
  }

  _selectValue(key) {
    var el = this.el.querySelector(`[data-value='${key}']`);
    this._select(el);
  }

  itemTemplate(data) {
    return `<div id="cv-${this.columnView.uid}-${data.key}" class="item" data-value="${data.key}" role="listitem">${data.name}</div>`;
  }

  groupTemplate(data) {
    return `<div class="divider">${data.title }</div>`;
  }

};

ColumnView.prototype.Preview = class Preview {

  constructor(parent, dom) {
    this.el = parent;
    this.el.classList.add("html");
    if (typeof dom == "string") {
      this.el.innerHTML = dom;
    } else {
      this.el.appendChild(dom);
    }
  }

  remove() {
    this.el.remove();
  }

};

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
