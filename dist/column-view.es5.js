"use strict";

// manges columns and the transition of the cariage

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CariageManager = function () {
  function CariageManager(columnView) {
    _classCallCheck(this, CariageManager);

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

  _createClass(CariageManager, [{
    key: "seed",
    value: function seed(dataItems) {
      this.seedPhase = true;
      dataItems.forEach(this._appendCol, this);
      this._resize();
      this._align();
      this.seedPhase = false;
    }
  }, {
    key: "selectFirst",

    // TODO better name
    // selects first item in last column
    value: function selectFirst() {
      var lastCol = this.carriage.lastChild;
      if (lastCol.customSelect) lastCol.customSelect.selectIndex(0); // COL ACTION!!!!!!
    }
  }, {
    key: "back",
    value: function back() {
      var lastCol = this.focusedColumn;
      this._removeAfter(lastCol);
      if (lastCol.customSelect) lastCol.customSelect.deselect();
      this._align();
      // this._onChange(this.focusedColumn, this.focusedColumn.customSelect.value());
    }

    // @private

  }, {
    key: "_appendCol",
    value: function _appendCol(data) {
      var col = this.createCol(data);
      if (!this.seedPhase) this._align();
      return col;
    }

    // @private

  }, {
    key: "createCol",
    value: function createCol(data) {
      var _this = this;

      var col = document.createElement("div");
      col.classList.add("column");
      this.carriage.appendChild(col);
      return this.constructor.newColInstance(data, col, this.parent, function (col, model) {
        return _this._onChange({ column: col, data: model, key: model.key });
      });
    }

    // Returns a Preview or CustomSelect instance, depending on the
    // passed in data
    // @private

  }, {
    key: "_onChange",
    value: function _onChange(data) {
      var _arguments = arguments;

      if (this.seedPhase) return;
      // console.log("_change", data);
      this.changeCallbacks.forEach(function (cb) {
        return cb.apply(null, _arguments);
      });
    }

    // @private

  }, {
    key: "_removeAfter",
    value: function _removeAfter(col) {
      var _this2 = this;

      var cols = this.columns;
      var toRemove = cols.splice(cols.indexOf(col) + 1, cols.length);
      toRemove.forEach(function (col) {
        return _this2.carriage.removeChild(col);
      });
    }

    // @private

  }, {
    key: "_align",
    value: function _align() {
      var length = this.columns.length;
      if (this.lastAllignment === length) return; // skip if nothing has changed
      this.lastAllignment = length;

      var leftOut = Math.max(0, length - this.parent.colCount);
      this.lastLeftOut = leftOut;
      this._moveCarriage(leftOut);
      // this._resizeY();
    }
  }, {
    key: "_resize",

    // @private
    value: function _resize() {
      this.colWidth = this.el.offsetWidth / this.parent.colCount;
      var col = this.columns.slice(-1)[0];
      if (!col) return console.warn("No columns found. Can't determine height.");
      var height = col.offsetHeight;
      this._setStyle("height: " + height + "px; width: " + this.colWidth + "px;");
      this._moveCarriage(this.lastLeftOut, { transition: false });
      // console.log("colWidth", this.colWidth);
    }

    // @private

  }, {
    key: "_setStyle",
    value: function _setStyle(css) {
      this.style.innerHTML = "." + this.parent.uniqueClassName + " .column {" + css + "}";
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

  }, {
    key: "_moveCarriage",
    value: function _moveCarriage(leftOut, options) {
      options = options || {};
      if (!options.hasOwnProperty("transition")) options.transition = !this.seedPhase;
      this.lastLeftOut = leftOut;

      // console.log("move", this.ready)
      var left = -1 * leftOut * this.colWidth;
      this.carriage.classList.toggle("transition", options.transition);
      this.carriage.style[this.transformPrefix] = "translate(" + left + "px, 0px)";
    }
  }, {
    key: "focusedColumn",
    get: function get() {
      var cols = this.columns;
      return cols[cols.length - 2] || cols[0];
    }
  }, {
    key: "columns",
    get: function get() {
      if (!this.carriageReady) throw "Carriage is not ready";
      return [].slice.call(this.carriage.children);
    }
  }], [{
    key: "newColInstance",
    value: function newColInstance(data, col, columnView, onChange) {
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
  }, {
    key: "getTransformPrefix",
    value: function getTransformPrefix() {
      var el = document.createElement("_");
      var prefixes = ["transform", "webkitTransform", "MozTransform", "msTransform", "OTransform"];
      var prefix = undefined;
      while (prefix = prefixes.shift()) {
        if (prefix in el.style) return prefix;
      }

      console.warn("transform not supported");
      return null;
    }
  }]);

  return CariageManager;
}();
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function debounce(func, wait, immediate) {
  var _arguments = arguments,
      _this = this;

  var timeout, args, context, timestamp, result;

  function now() {
    new Date().getTime();
  }

  var later = function later() {
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

  return function () {
    args = _arguments;
    timestamp = now();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(_this, args);
      context = args = null;
    }

    return result;
  };
}

var ColumnView = function () {
  function ColumnView(el, options) {
    var _this2 = this;

    _classCallCheck(this, ColumnView);

    this.options = options || {};
    this.value = null;
    this.ready = false;
    this.carriageReady = false;
    this.colCount = 3; //default

    this.el = el;
    this.carriageManager = new CariageManager(this);
    this.carriageManager.changeCallbacks.push(function (data) {
      // console.log("change");
      _this2.el.setAttribute("aria-activedescendant", "cv-" + _this2.uid + "-" + data.key);
    });

    this.keyboardManager = new KeyboardManager(this);
    this.keyboardManager.changeCallback = this._onColumnChange.bind(this);

    this.models = options.items;
    this.path = options.path || [];

    this.callbacks = {
      change: this.options.onChange,
      source: function source(data) {
        return new Promise(function (resolve, reject) {
          _this2.options.source(data, function (result) {
            _this2._checkSourceResponse(result, reject);
            resolve(result);
          });
        });
      },
      ready: this.options.ready
    };

    // this.carriageManager._setLayout(options.layout);

    if (options.itemTemplate) {
      this.CustomSelect.prototype.itemTemplate = options.itemTemplate;
    }

    this.uid = this._uid();
    this.uniqueClassName = "column-view-" + this.uid;
    this.el.classList.add(this.uniqueClassName);
    this.el.setAttribute("tabindex", 0);
    this.el.setAttribute("role", "tree");

    this._onColumnChangeBound = this._onColumnChange.bind(this);

    // window.addEventListener("resize", debounce(this._resize.bind(this), 300));

    // console.log("path", this.path);
    this._loadDataBySourceCalls(this.path).then(function (columnDataItems) {
      _this2.carriageManager.seed(columnDataItems);
      _this2.ready = true;
      if (_this2.callbacks.ready) _this2.callbacks.ready.call(_this2);
    });
  }

  _createClass(ColumnView, [{
    key: "_checkSourceResponse",
    value: function _checkSourceResponse(result, reject) {
      var checkItems = function checkItems(items) {
        if (!result.items.every(function (item) {
          return 'key' in item;
        })) {
          console.error("'key' propertie is missing on at least one item!", result);
          reject("'key' propertie is missing on at least one item!", result);
        }
      };

      if ('items' in result) checkItems(result.items);
      if ('groups' in result) result.groups.every(function (group) {
        return checkItems(group.items);
      });
    }

    // Getter
    // --------

    // TODO remove

  }, {
    key: "_onColumnChange",

    // @private
    value: function _onColumnChange(data) {
      var _this3 = this;

      var column = data.column.el;

      // console.log("_onColumnChange", arguments);
      // TODO get rid of value
      this.value = data.key;

      this.carriageManager._removeAfter(column);

      this.callbacks.source(data).then(function (_data) {
        if (_this3.value != data.key) return; // this call is outdated
        _this3.carriageManager._appendCol(_data);
        _this3.callbacks.change.call(_this3, data);
      });

      // todo handle case case no callback is called
    }
  }, {
    key: "_loadDataBySourceCalls",
    value: function _loadDataBySourceCalls(path) {
      var _this4 = this;

      var pathPairs = path.map(function (value, i, array) {
        return [value, array[i + 1]];
      });

      var promises = pathPairs.map(function (pathPair) {
        var id = pathPair[0],
            nextID = pathPair[1];
        return _this4.callbacks.source({ key: id, seed: true }).then(function (data) {
          if (nextID) data.selectedValue = nextID;
          return data;
        });
      });
      return Promise.all(promises);
    }
  }, {
    key: "back",
    value: function back() {
      if (!this.canMoveBack) return;
      this.carriageManager.back();
      this.value = this.carriageManager.focusedColumn.customSelect.value();
      this.callbacks.change.call(this, this.value);
    }
  }, {
    key: "_uid",
    value: function _uid() {
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

  }, {
    key: "columns",
    get: function get() {
      return this.carriageManager.columns;
    }
  }, {
    key: "canMoveBack",
    get: function get() {
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
  }]);

  return ColumnView;
}();
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

ColumnView.prototype.CustomSelect = function () {
  function CustomSelect(parent, data, columnView) {
    _classCallCheck(this, CustomSelect);

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

  _createClass(CustomSelect, [{
    key: "_monkeyPatchEl",
    value: function _monkeyPatchEl() {
      var _this = this;

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
        value: function value() {
          return _this.value;
        }
      };
      this.el.customSelect = elMethods;
    }
  }, {
    key: "_render",
    value: function _render(selectedValue) {
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
  }, {
    key: "_renderHeader",
    value: function _renderHeader(container) {
      var header = document.createElement("header");
      header.innerHTML = this.data.header;
      container.appendChild(header);
    }
  }, {
    key: "_renderItems",
    value: function _renderItems(container, models) {
      var _this2 = this;

      models.forEach(function (model) {
        var html = _this2.itemTemplate(model);
        var item = htmlToDocumentFragment(html);
        item.firstChild.__columviewData__ = model;
        container.appendChild(item);
      });
    }
  }, {
    key: "_renderGroups",
    value: function _renderGroups(container, groups) {
      var _this3 = this;

      groups.forEach(function (group) {
        var html = _this3.groupTemplate(group);
        var item = htmlToDocumentFragment(html);
        container.appendChild(item);
        _this3._renderItems(container, group.items);
      });
    }
  }, {
    key: "_renderEmpty",
    value: function _renderEmpty(container) {
      var el = document.createTextNode("empty");
      container.appendChild(el);
    }
  }, {
    key: "clear",
    value: function clear() {
      this.el.customSelect = null;
      this.el.removeEventListener("click", this.boundOnClick);
    }
  }, {
    key: "_scrollIntoView",
    value: function _scrollIntoView() {
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
  }, {
    key: "_deselect",
    value: function _deselect(el) {
      el.classList.remove("selected");
      this._selectedEl = null;
    }
  }, {
    key: "_select",
    value: function _select(el) {
      if (this._selectedEl === el) return;
      if (this._selectedEl) this._deselect(this._selectedEl);
      el.classList.add("selected");
      this._selectedEl = el;
      var oldValue = this.value;
      this.value = el.__columviewData__;

      // console.log("select", this.value);
      this.changeCB(this, this.value, oldValue);
    }
  }, {
    key: "_onClick",
    value: function _onClick(e) {
      if (e.ctrlKey || e.metaKey) return;
      if (!e.target.classList.contains("item")) return;
      e.preventDefault();
      this._select(e.target);
    }
  }, {
    key: "_getActiveIndex",
    value: function _getActiveIndex() {
      var active = this._selectedEl;
      var index = [].indexOf.call(this.items, active);
      return index;
    }
  }, {
    key: "canMoveInPosition",
    value: function canMoveInPosition(direction) {
      var index = this._getActiveIndex();
      var newIndex = index + direction;
      return newIndex >= 0 && newIndex < this.items.length;
    }
  }, {
    key: "movePosition",
    value: function movePosition(direction) {
      var index = this._getActiveIndex();
      this.selectIndex(index + direction);
    }
  }, {
    key: "selectIndex",
    value: function selectIndex(index) {
      var item = this.items[index];
      if (item) this._select(item);
      this._scrollIntoView();
    }
  }, {
    key: "remove",
    value: function remove() {
      this.el.remove();
    }
  }, {
    key: "deselect",
    value: function deselect() {
      if (this._selectedEl) this._deselect(this._selectedEl);
    }
  }, {
    key: "_selectValue",
    value: function _selectValue(key) {
      var el = this.el.querySelector("[data-value='" + key + "']");
      this._select(el);
    }
  }, {
    key: "itemTemplate",
    value: function itemTemplate(data) {
      return "<div id=\"cv-" + this.columnView.uid + "-" + data.key + "\" class=\"item\" data-value=\"" + data.key + "\" role=\"listitem\">" + data.name + "</div>";
    }
  }, {
    key: "groupTemplate",
    value: function groupTemplate(data) {
      return "<div class=\"divider\">" + data.title + "</div>";
    }
  }]);

  return CustomSelect;
}();

ColumnView.prototype.Preview = function () {
  function Preview(parent, dom) {
    _classCallCheck(this, Preview);

    this.el = parent;
    this.el.classList.add("html");
    if (typeof dom == "string") {
      this.el.innerHTML = dom;
    } else {
      this.el.appendChild(dom);
    }
  }

  _createClass(Preview, [{
    key: "remove",
    value: function remove() {
      this.el.remove();
    }
  }]);

  return Preview;
}();
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KeyboardManager = function () {
  function KeyboardManager(columnView) {
    var _this = this;

    _classCallCheck(this, KeyboardManager);

    this.keyCodes = {
      enter: 13,
      space: 32,
      backspace: 8,
      tab: 9,
      left: 37,
      up: 38,
      right: 39,
      down: 40
    };

    this.parent = columnView;
    this.el = columnView.el;
    this.carriageManager = columnView.carriageManager;

    this.movingUpOrDown = false;
    this.changeCallback = function () {};

    this.el.addEventListener("keydown", this._onKeydown.bind(this), true);
    this.el.addEventListener("keyup", this._onKeyup.bind(this), true);

    this.lastChangeArguments = null;

    this.parent.carriageManager.changeCallbacks.push(function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (_this.movingUpOrDown) {
        _this.lastChangeArguments = args;
      } else {
        _this.lastChangeArguments = null;
        _this.changeCallback.apply(null, args);
      }
    });
  }

  // @private

  _createClass(KeyboardManager, [{
    key: "_onKeydown",
    value: function _onKeydown(e) {
      this.movingUpOrDown = false;
      var keyCodes = this.keyCodes;
      if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) return; // do nothing

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

  }, {
    key: "_onKeyup",
    value: function _onKeyup() {
      this._endKeyUp();
    }
  }, {
    key: "_endKeyUp",
    value: function _endKeyUp() {
      if (this.movingUpOrDown && this.lastChangeArguments) this.changeCallback.apply(null, this.lastChangeArguments);
      this.lastChangeArguments = null;
      this.movingUpOrDown = false;
    }

    // @private

  }, {
    key: "_moveCursor",
    value: function _moveCursor(direction) {
      var col = this.carriageManager.focusedColumn;
      if (col.customSelect.canMoveInPosition(direction)) {
        col.customSelect.movePosition(direction);
      } else {
        this._endKeyUp();
      }
    }
  }]);

  return KeyboardManager;
}();