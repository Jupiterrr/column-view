var ColumnView = (function () {
                  'use strict';

                  var __commonjs_global = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this;
                  function __commonjs(fn, module) { return module = { exports: {} }, fn(module, module.exports, __commonjs_global), module.exports; }


                  var babelHelpers = {};
                  babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
                    return typeof obj;
                  } : function (obj) {
                    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
                  };

                  babelHelpers.classCallCheck = function (instance, Constructor) {
                    if (!(instance instanceof Constructor)) {
                      throw new TypeError("Cannot call a class as a function");
                    }
                  };

                  babelHelpers.createClass = function () {
                    function defineProperties(target, props) {
                      for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                      }
                    }

                    return function (Constructor, protoProps, staticProps) {
                      if (protoProps) defineProperties(Constructor.prototype, protoProps);
                      if (staticProps) defineProperties(Constructor, staticProps);
                      return Constructor;
                    };
                  }();

                  babelHelpers;

                  var KeyboardManager = function () {
                    function KeyboardManager(columnView) {
                      var _this = this;

                      babelHelpers.classCallCheck(this, KeyboardManager);

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

                    babelHelpers.createClass(KeyboardManager, [{
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

                  var CustomSelect = function () {
                    function CustomSelect(parent, data, columnView) {
                      babelHelpers.classCallCheck(this, CustomSelect);

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

                    babelHelpers.createClass(CustomSelect, [{
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

                  var Preview = function () {
                    function Preview(parent, dom) {
                      babelHelpers.classCallCheck(this, Preview);

                      this.el = parent;
                      this.el.classList.add("html");
                      if (typeof dom == "string") {
                        this.el.innerHTML = dom;
                      } else {
                        this.el.appendChild(dom);
                      }
                    }

                    babelHelpers.createClass(Preview, [{
                      key: "remove",
                      value: function remove() {
                        this.el.remove();
                      }
                    }]);
                    return Preview;
                  }();;

                  // manges columns and the transition of the cariage

                  var CariageManager = function () {
                    function CariageManager(columnView) {
                      babelHelpers.classCallCheck(this, CariageManager);

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

                    babelHelpers.createClass(CariageManager, [{
                      key: 'seed',
                      value: function seed(dataItems) {
                        this.seedPhase = true;
                        dataItems.forEach(this._appendCol, this);
                        this._resize();
                        this._align();
                        this.seedPhase = false;
                      }
                    }, {
                      key: 'selectFirst',

                      // TODO better name
                      // selects first item in last column
                      value: function selectFirst() {
                        var lastCol = this.carriage.lastChild;
                        if (lastCol.customSelect) lastCol.customSelect.selectIndex(0); // COL ACTION!!!!!!
                      }
                    }, {
                      key: 'back',
                      value: function back() {
                        var lastCol = this.focusedColumn;
                        this._removeAfter(lastCol);
                        if (lastCol.customSelect) lastCol.customSelect.deselect();
                        this._align();
                        // this._onChange(this.focusedColumn, this.focusedColumn.customSelect.value());
                      }

                      // @private

                    }, {
                      key: '_appendCol',
                      value: function _appendCol(data) {
                        var col = this.createCol(data);
                        if (!this.seedPhase) this._align();
                        return col;
                      }

                      // @private

                    }, {
                      key: 'createCol',
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
                      key: '_onChange',
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
                      key: '_removeAfter',
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
                      key: '_align',
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
                      key: '_resize',

                      // @private
                      value: function _resize() {
                        this.colWidth = this.el.offsetWidth / this.parent.colCount;
                        var col = this.columns.slice(-1)[0];
                        if (!col) return console.warn("No columns found. Can't determine height.");
                        var height = col.offsetHeight;
                        this._setStyle('height: ' + height + 'px; width: ' + this.colWidth + 'px;');
                        this._moveCarriage(this.lastLeftOut, { transition: false });
                        // console.log("colWidth", this.colWidth);
                      }

                      // @private

                    }, {
                      key: '_setStyle',
                      value: function _setStyle(css) {
                        this.style.innerHTML = '.' + this.parent.uniqueClassName + ' .column {' + css + '}';
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
                      key: '_moveCarriage',
                      value: function _moveCarriage(leftOut, options) {
                        options = options || {};
                        if (!options.hasOwnProperty("transition")) options.transition = !this.seedPhase;
                        this.lastLeftOut = leftOut;

                        // console.log("move", this.ready)
                        var left = -1 * leftOut * this.colWidth;
                        this.carriage.classList.toggle("transition", options.transition);
                        this.carriage.style[this.transformPrefix] = 'translate(' + left + 'px, 0px)';
                      }
                    }, {
                      key: 'focusedColumn',
                      get: function get() {
                        var cols = this.columns;
                        return cols[cols.length - 2] || cols[0];
                      }
                    }, {
                      key: 'columns',
                      get: function get() {
                        if (!this.carriageReady) throw "Carriage is not ready";
                        return [].slice.call(this.carriage.children);
                      }
                    }], [{
                      key: 'newColInstance',
                      value: function newColInstance(data, col, columnView, onChange) {
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
                    }, {
                      key: 'getTransformPrefix',
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

                  var _core = __commonjs(function (module) {
                    var core = module.exports = { version: '2.0.3' };
                    if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef
                  });

                  var require$$0 = _core && (typeof _core === 'undefined' ? 'undefined' : babelHelpers.typeof(_core)) === 'object' && 'default' in _core ? _core['default'] : _core;

                  var _global = __commonjs(function (module) {
                    // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
                    var global = module.exports = typeof window != 'undefined' && window.Math == Math ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
                    if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef
                  });

                  var require$$0$6 = _global && (typeof _global === 'undefined' ? 'undefined' : babelHelpers.typeof(_global)) === 'object' && 'default' in _global ? _global['default'] : _global;

                  var _uid = __commonjs(function (module) {
                    var id = 0,
                        px = Math.random();
                    module.exports = function (key) {
                      return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
                    };
                  });

                  var require$$1$6 = _uid && (typeof _uid === 'undefined' ? 'undefined' : babelHelpers.typeof(_uid)) === 'object' && 'default' in _uid ? _uid['default'] : _uid;

                  var _shared = __commonjs(function (module) {
                    var global = require$$0$6,
                        SHARED = '__core-js_shared__',
                        store = global[SHARED] || (global[SHARED] = {});
                    module.exports = function (key) {
                      return store[key] || (store[key] = {});
                    };
                  });

                  var require$$2$3 = _shared && (typeof _shared === 'undefined' ? 'undefined' : babelHelpers.typeof(_shared)) === 'object' && 'default' in _shared ? _shared['default'] : _shared;

                  var _wks = __commonjs(function (module) {
                    var store = require$$2$3('wks'),
                        uid = require$$1$6,
                        _Symbol = require$$0$6.Symbol,
                        USE_SYMBOL = typeof _Symbol == 'function';
                    module.exports = function (name) {
                      return store[name] || (store[name] = USE_SYMBOL && _Symbol[name] || (USE_SYMBOL ? _Symbol : uid)('Symbol.' + name));
                    };
                  });

                  var require$$0$7 = _wks && (typeof _wks === 'undefined' ? 'undefined' : babelHelpers.typeof(_wks)) === 'object' && 'default' in _wks ? _wks['default'] : _wks;

                  var _iterDetect = __commonjs(function (module) {
                    var ITERATOR = require$$0$7('iterator'),
                        SAFE_CLOSING = false;

                    try {
                      var riter = [7][ITERATOR]();
                      riter['return'] = function () {
                        SAFE_CLOSING = true;
                      };
                      Array.from(riter, function () {
                        throw 2;
                      });
                    } catch (e) {/* empty */}

                    module.exports = function (exec, skipClosing) {
                      if (!skipClosing && !SAFE_CLOSING) return false;
                      var safe = false;
                      try {
                        var arr = [7],
                            iter = arr[ITERATOR]();
                        iter.next = function () {
                          safe = true;
                        };
                        arr[ITERATOR] = function () {
                          return iter;
                        };
                        exec(arr);
                      } catch (e) {/* empty */}
                      return safe;
                    };
                  });

                  var require$$0$1 = _iterDetect && (typeof _iterDetect === 'undefined' ? 'undefined' : babelHelpers.typeof(_iterDetect)) === 'object' && 'default' in _iterDetect ? _iterDetect['default'] : _iterDetect;

                  var _fails = __commonjs(function (module) {
                    module.exports = function (exec) {
                      try {
                        return !!exec();
                      } catch (e) {
                        return true;
                      }
                    };
                  });

                  var require$$0$11 = _fails && (typeof _fails === 'undefined' ? 'undefined' : babelHelpers.typeof(_fails)) === 'object' && 'default' in _fails ? _fails['default'] : _fails;

                  var _descriptors = __commonjs(function (module) {
                    // Thank's IE8 for his funny defineProperty
                    module.exports = !require$$0$11(function () {
                      return Object.defineProperty({}, 'a', { get: function get() {
                          return 7;
                        } }).a != 7;
                    });
                  });

                  var require$$0$2 = _descriptors && (typeof _descriptors === 'undefined' ? 'undefined' : babelHelpers.typeof(_descriptors)) === 'object' && 'default' in _descriptors ? _descriptors['default'] : _descriptors;

                  var _ = __commonjs(function (module) {
                    var $Object = Object;
                    module.exports = {
                      create: $Object.create,
                      getProto: $Object.getPrototypeOf,
                      isEnum: {}.propertyIsEnumerable,
                      getDesc: $Object.getOwnPropertyDescriptor,
                      setDesc: $Object.defineProperty,
                      setDescs: $Object.defineProperties,
                      getKeys: $Object.keys,
                      getNames: $Object.getOwnPropertyNames,
                      getSymbols: $Object.getOwnPropertySymbols,
                      each: [].forEach
                    };
                  });

                  var require$$4$1 = _ && (typeof _ === 'undefined' ? 'undefined' : babelHelpers.typeof(_)) === 'object' && 'default' in _ ? _['default'] : _;

                  var _setSpecies = __commonjs(function (module) {
                    'use strict';

                    var core = require$$0,
                        $ = require$$4$1,
                        DESCRIPTORS = require$$0$2,
                        SPECIES = require$$0$7('species');

                    module.exports = function (KEY) {
                      var C = core[KEY];
                      if (DESCRIPTORS && C && !C[SPECIES]) $.setDesc(C, SPECIES, {
                        configurable: true,
                        get: function get() {
                          return this;
                        }
                      });
                    };
                  });

                  var require$$2 = _setSpecies && (typeof _setSpecies === 'undefined' ? 'undefined' : babelHelpers.typeof(_setSpecies)) === 'object' && 'default' in _setSpecies ? _setSpecies['default'] : _setSpecies;

                  var _has = __commonjs(function (module) {
                    var hasOwnProperty = {}.hasOwnProperty;
                    module.exports = function (it, key) {
                      return hasOwnProperty.call(it, key);
                    };
                  });

                  var require$$5 = _has && (typeof _has === 'undefined' ? 'undefined' : babelHelpers.typeof(_has)) === 'object' && 'default' in _has ? _has['default'] : _has;

                  var _setToStringTag = __commonjs(function (module) {
                    var def = require$$4$1.setDesc,
                        has = require$$5,
                        TAG = require$$0$7('toStringTag');

                    module.exports = function (it, tag, stat) {
                      if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
                    };
                  });

                  var require$$2$1 = _setToStringTag && (typeof _setToStringTag === 'undefined' ? 'undefined' : babelHelpers.typeof(_setToStringTag)) === 'object' && 'default' in _setToStringTag ? _setToStringTag['default'] : _setToStringTag;

                  var _propertyDesc = __commonjs(function (module) {
                    module.exports = function (bitmap, value) {
                      return {
                        enumerable: !(bitmap & 1),
                        configurable: !(bitmap & 2),
                        writable: !(bitmap & 4),
                        value: value
                      };
                    };
                  });

                  var require$$3$3 = _propertyDesc && (typeof _propertyDesc === 'undefined' ? 'undefined' : babelHelpers.typeof(_propertyDesc)) === 'object' && 'default' in _propertyDesc ? _propertyDesc['default'] : _propertyDesc;

                  var _hide = __commonjs(function (module) {
                    var $ = require$$4$1,
                        createDesc = require$$3$3;
                    module.exports = require$$0$2 ? function (object, key, value) {
                      return $.setDesc(object, key, createDesc(1, value));
                    } : function (object, key, value) {
                      object[key] = value;
                      return object;
                    };
                  });

                  var require$$0$8 = _hide && (typeof _hide === 'undefined' ? 'undefined' : babelHelpers.typeof(_hide)) === 'object' && 'default' in _hide ? _hide['default'] : _hide;

                  var _redefineAll = __commonjs(function (module) {
                    var hide = require$$0$8;
                    module.exports = function (target, src, safe) {
                      for (var key in src) {
                        if (safe && target[key]) target[key] = src[key];else hide(target, key, src[key]);
                      }return target;
                    };
                  });

                  var require$$4 = _redefineAll && (typeof _redefineAll === 'undefined' ? 'undefined' : babelHelpers.typeof(_redefineAll)) === 'object' && 'default' in _redefineAll ? _redefineAll['default'] : _redefineAll;

                  var _cof = __commonjs(function (module) {
                    var toString = {}.toString;

                    module.exports = function (it) {
                      return toString.call(it).slice(8, -1);
                    };
                  });

                  var require$$0$10 = _cof && (typeof _cof === 'undefined' ? 'undefined' : babelHelpers.typeof(_cof)) === 'object' && 'default' in _cof ? _cof['default'] : _cof;

                  var _isObject = __commonjs(function (module) {
                    module.exports = function (it) {
                      return (typeof it === 'undefined' ? 'undefined' : babelHelpers.typeof(it)) === 'object' ? it !== null : typeof it === 'function';
                    };
                  });

                  var require$$1$1 = _isObject && (typeof _isObject === 'undefined' ? 'undefined' : babelHelpers.typeof(_isObject)) === 'object' && 'default' in _isObject ? _isObject['default'] : _isObject;

                  var _domCreate = __commonjs(function (module) {
                    var isObject = require$$1$1,
                        document = require$$0$6.document
                    // in old IE typeof document.createElement is 'object'
                    ,
                        is = isObject(document) && isObject(document.createElement);
                    module.exports = function (it) {
                      return is ? document.createElement(it) : {};
                    };
                  });

                  var require$$2$2 = _domCreate && (typeof _domCreate === 'undefined' ? 'undefined' : babelHelpers.typeof(_domCreate)) === 'object' && 'default' in _domCreate ? _domCreate['default'] : _domCreate;

                  var _html = __commonjs(function (module) {
                    module.exports = require$$0$6.document && document.documentElement;
                  });

                  var require$$3$1 = _html && (typeof _html === 'undefined' ? 'undefined' : babelHelpers.typeof(_html)) === 'object' && 'default' in _html ? _html['default'] : _html;

                  var _invoke = __commonjs(function (module) {
                                    // fast apply, http://jsperf.lnkit.com/fast-apply/5
                                    module.exports = function (fn, args, that) {
                                                      var un = that === undefined;
                                                      switch (args.length) {
                                                                        case 0:
                                                                                          return un ? fn() : fn.call(that);
                                                                        case 1:
                                                                                          return un ? fn(args[0]) : fn.call(that, args[0]);
                                                                        case 2:
                                                                                          return un ? fn(args[0], args[1]) : fn.call(that, args[0], args[1]);
                                                                        case 3:
                                                                                          return un ? fn(args[0], args[1], args[2]) : fn.call(that, args[0], args[1], args[2]);
                                                                        case 4:
                                                                                          return un ? fn(args[0], args[1], args[2], args[3]) : fn.call(that, args[0], args[1], args[2], args[3]);
                                                      }return fn.apply(that, args);
                                    };
                  });

                  var require$$4$2 = _invoke && (typeof _invoke === 'undefined' ? 'undefined' : babelHelpers.typeof(_invoke)) === 'object' && 'default' in _invoke ? _invoke['default'] : _invoke;

                  var _aFunction = __commonjs(function (module) {
                    module.exports = function (it) {
                      if (typeof it != 'function') throw TypeError(it + ' is not a function!');
                      return it;
                    };
                  });

                  var require$$0$5 = _aFunction && (typeof _aFunction === 'undefined' ? 'undefined' : babelHelpers.typeof(_aFunction)) === 'object' && 'default' in _aFunction ? _aFunction['default'] : _aFunction;

                  var _ctx = __commonjs(function (module) {
                    // optional / simple context binding
                    var aFunction = require$$0$5;
                    module.exports = function (fn, that, length) {
                      aFunction(fn);
                      if (that === undefined) return fn;
                      switch (length) {
                        case 1:
                          return function (a) {
                            return fn.call(that, a);
                          };
                        case 2:
                          return function (a, b) {
                            return fn.call(that, a, b);
                          };
                        case 3:
                          return function (a, b, c) {
                            return fn.call(that, a, b, c);
                          };
                      }
                      return function () /* ...args */{
                        return fn.apply(that, arguments);
                      };
                    };
                  });

                  var require$$1$2 = _ctx && (typeof _ctx === 'undefined' ? 'undefined' : babelHelpers.typeof(_ctx)) === 'object' && 'default' in _ctx ? _ctx['default'] : _ctx;

                  var _task = __commonjs(function (module, exports, global) {
                    var ctx = require$$1$2,
                        invoke = require$$4$2,
                        html = require$$3$1,
                        cel = require$$2$2,
                        global = require$$0$6,
                        process = global.process,
                        setTask = global.setImmediate,
                        clearTask = global.clearImmediate,
                        MessageChannel = global.MessageChannel,
                        counter = 0,
                        queue = {},
                        ONREADYSTATECHANGE = 'onreadystatechange',
                        defer,
                        channel,
                        port;
                    var run = function run() {
                      var id = +this;
                      if (queue.hasOwnProperty(id)) {
                        var fn = queue[id];
                        delete queue[id];
                        fn();
                      }
                    };
                    var listner = function listner(event) {
                      run.call(event.data);
                    };
                    // Node.js 0.9+ & IE10+ has setImmediate, otherwise:
                    if (!setTask || !clearTask) {
                      setTask = function setImmediate(fn) {
                        var args = [],
                            i = 1;
                        while (arguments.length > i) {
                          args.push(arguments[i++]);
                        }queue[++counter] = function () {
                          invoke(typeof fn == 'function' ? fn : Function(fn), args);
                        };
                        defer(counter);
                        return counter;
                      };
                      clearTask = function clearImmediate(id) {
                        delete queue[id];
                      };
                      // Node.js 0.8-
                      if (require$$0$10(process) == 'process') {
                        defer = function defer(id) {
                          process.nextTick(ctx(run, id, 1));
                        };
                        // Browsers with MessageChannel, includes WebWorkers
                      } else if (MessageChannel) {
                          channel = new MessageChannel();
                          port = channel.port2;
                          channel.port1.onmessage = listner;
                          defer = ctx(port.postMessage, port, 1);
                          // Browsers with postMessage, skip WebWorkers
                          // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
                        } else if (global.addEventListener && typeof postMessage == 'function' && !global.importScripts) {
                            defer = function defer(id) {
                              global.postMessage(id + '', '*');
                            };
                            global.addEventListener('message', listner, false);
                            // IE8-
                          } else if (ONREADYSTATECHANGE in cel('script')) {
                              defer = function defer(id) {
                                html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function () {
                                  html.removeChild(this);
                                  run.call(id);
                                };
                              };
                              // Rest old browsers
                            } else {
                                defer = function defer(id) {
                                  setTimeout(ctx(run, id, 1), 0);
                                };
                              }
                    }
                    module.exports = {
                      set: setTask,
                      clear: clearTask
                    };
                  });

                  var require$$1 = _task && (typeof _task === 'undefined' ? 'undefined' : babelHelpers.typeof(_task)) === 'object' && 'default' in _task ? _task['default'] : _task;

                  var _microtask = __commonjs(function (module) {
                    var global = require$$0$6,
                        macrotask = require$$1.set,
                        Observer = global.MutationObserver || global.WebKitMutationObserver,
                        process = global.process,
                        Promise = global.Promise,
                        isNode = require$$0$10(process) == 'process',
                        head,
                        last,
                        notify;

                    var flush = function flush() {
                      var parent, domain, fn;
                      if (isNode && (parent = process.domain)) {
                        process.domain = null;
                        parent.exit();
                      }
                      while (head) {
                        domain = head.domain;
                        fn = head.fn;
                        if (domain) domain.enter();
                        fn(); // <- currently we use it only for Promise - try / catch not required
                        if (domain) domain.exit();
                        head = head.next;
                      }last = undefined;
                      if (parent) parent.enter();
                    };

                    // Node.js
                    if (isNode) {
                      notify = function notify() {
                        process.nextTick(flush);
                      };
                      // browsers with MutationObserver
                    } else if (Observer) {
                        var toggle = 1,
                            node = document.createTextNode('');
                        new Observer(flush).observe(node, { characterData: true }); // eslint-disable-line no-new
                        notify = function notify() {
                          node.data = toggle = -toggle;
                        };
                        // environments with maybe non-completely correct, but existent Promise
                      } else if (Promise && Promise.resolve) {
                          notify = function notify() {
                            Promise.resolve().then(flush);
                          };
                          // for other environments - macrotask based on:
                          // - setImmediate
                          // - MessageChannel
                          // - window.postMessag
                          // - onreadystatechange
                          // - setTimeout
                        } else {
                            notify = function notify() {
                              // strange IE + webpack dev server bug - use .call(global)
                              macrotask.call(global, flush);
                            };
                          }

                    module.exports = function asap(fn) {
                      var task = { fn: fn, next: undefined, domain: isNode && process.domain };
                      if (last) last.next = task;
                      if (!head) {
                        head = task;
                        notify();
                      }last = task;
                    };
                  });

                  var require$$6 = _microtask && (typeof _microtask === 'undefined' ? 'undefined' : babelHelpers.typeof(_microtask)) === 'object' && 'default' in _microtask ? _microtask['default'] : _microtask;

                  var _anObject = __commonjs(function (module) {
                    var isObject = require$$1$1;
                    module.exports = function (it) {
                      if (!isObject(it)) throw TypeError(it + ' is not an object!');
                      return it;
                    };
                  });

                  var require$$0$3 = _anObject && (typeof _anObject === 'undefined' ? 'undefined' : babelHelpers.typeof(_anObject)) === 'object' && 'default' in _anObject ? _anObject['default'] : _anObject;

                  var _speciesConstructor = __commonjs(function (module) {
                    // 7.3.20 SpeciesConstructor(O, defaultConstructor)
                    var anObject = require$$0$3,
                        aFunction = require$$0$5,
                        SPECIES = require$$0$7('species');
                    module.exports = function (O, D) {
                      var C = anObject(O).constructor,
                          S;
                      return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
                    };
                  });

                  var require$$8 = _speciesConstructor && (typeof _speciesConstructor === 'undefined' ? 'undefined' : babelHelpers.typeof(_speciesConstructor)) === 'object' && 'default' in _speciesConstructor ? _speciesConstructor['default'] : _speciesConstructor;

                  var _setProto = __commonjs(function (module) {
                    // Works with __proto__ only. Old v8 can't work with null proto objects.
                    /* eslint-disable no-proto */
                    var getDesc = require$$4$1.getDesc,
                        isObject = require$$1$1,
                        anObject = require$$0$3;
                    var check = function check(O, proto) {
                      anObject(O);
                      if (!isObject(proto) && proto !== null) throw TypeError(proto + ": can't set as prototype!");
                    };
                    module.exports = {
                      set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
                      function (test, buggy, set) {
                        try {
                          set = require$$1$2(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
                          set(test, []);
                          buggy = !(test instanceof Array);
                        } catch (e) {
                          buggy = true;
                        }
                        return function setPrototypeOf(O, proto) {
                          check(O, proto);
                          if (buggy) O.__proto__ = proto;else set(O, proto);
                          return O;
                        };
                      }({}, false) : undefined),
                      check: check
                    };
                  });

                  var require$$9 = _setProto && (typeof _setProto === 'undefined' ? 'undefined' : babelHelpers.typeof(_setProto)) === 'object' && 'default' in _setProto ? _setProto['default'] : _setProto;

                  var _iterators = __commonjs(function (module) {
                    module.exports = {};
                  });

                  var require$$1$3 = _iterators && (typeof _iterators === 'undefined' ? 'undefined' : babelHelpers.typeof(_iterators)) === 'object' && 'default' in _iterators ? _iterators['default'] : _iterators;

                  var _classof = __commonjs(function (module) {
                    // getting tag from 19.1.3.6 Object.prototype.toString()
                    var cof = require$$0$10,
                        TAG = require$$0$7('toStringTag')
                    // ES3 wrong here
                    ,
                        ARG = cof(function () {
                      return arguments;
                    }()) == 'Arguments';

                    module.exports = function (it) {
                      var O, T, B;
                      return it === undefined ? 'Undefined' : it === null ? 'Null'
                      // @@toStringTag case
                      : typeof (T = (O = Object(it))[TAG]) == 'string' ? T
                      // builtinTag case
                      : ARG ? cof(O)
                      // ES3 arguments fallback
                      : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
                    };
                  });

                  var require$$3 = _classof && (typeof _classof === 'undefined' ? 'undefined' : babelHelpers.typeof(_classof)) === 'object' && 'default' in _classof ? _classof['default'] : _classof;

                  var core_getIteratorMethod = __commonjs(function (module) {
                    var classof = require$$3,
                        ITERATOR = require$$0$7('iterator'),
                        Iterators = require$$1$3;
                    module.exports = require$$0.getIteratorMethod = function (it) {
                      if (it != undefined) return it[ITERATOR] || it['@@iterator'] || Iterators[classof(it)];
                    };
                  });

                  var require$$0$12 = core_getIteratorMethod && (typeof core_getIteratorMethod === 'undefined' ? 'undefined' : babelHelpers.typeof(core_getIteratorMethod)) === 'object' && 'default' in core_getIteratorMethod ? core_getIteratorMethod['default'] : core_getIteratorMethod;

                  var _toInteger = __commonjs(function (module) {
                    // 7.1.4 ToInteger
                    var ceil = Math.ceil,
                        floor = Math.floor;
                    module.exports = function (it) {
                      return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
                    };
                  });

                  var require$$0$14 = _toInteger && (typeof _toInteger === 'undefined' ? 'undefined' : babelHelpers.typeof(_toInteger)) === 'object' && 'default' in _toInteger ? _toInteger['default'] : _toInteger;

                  var _toLength = __commonjs(function (module) {
                    // 7.1.15 ToLength
                    var toInteger = require$$0$14,
                        min = Math.min;
                    module.exports = function (it) {
                      return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
                    };
                  });

                  var require$$1$5 = _toLength && (typeof _toLength === 'undefined' ? 'undefined' : babelHelpers.typeof(_toLength)) === 'object' && 'default' in _toLength ? _toLength['default'] : _toLength;

                  var _isArrayIter = __commonjs(function (module) {
                    // check on default Array iterator
                    var Iterators = require$$1$3,
                        ITERATOR = require$$0$7('iterator'),
                        ArrayProto = Array.prototype;

                    module.exports = function (it) {
                      return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
                    };
                  });

                  var require$$3$2 = _isArrayIter && (typeof _isArrayIter === 'undefined' ? 'undefined' : babelHelpers.typeof(_isArrayIter)) === 'object' && 'default' in _isArrayIter ? _isArrayIter['default'] : _isArrayIter;

                  var _iterCall = __commonjs(function (module) {
                    // call something on iterator step with safe closing on error
                    var anObject = require$$0$3;
                    module.exports = function (iterator, fn, value, entries) {
                      try {
                        return entries ? fn(anObject(value)[0], value[1]) : fn(value);
                        // 7.4.6 IteratorClose(iterator, completion)
                      } catch (e) {
                        var ret = iterator['return'];
                        if (ret !== undefined) anObject(ret.call(iterator));
                        throw e;
                      }
                    };
                  });

                  var require$$4$3 = _iterCall && (typeof _iterCall === 'undefined' ? 'undefined' : babelHelpers.typeof(_iterCall)) === 'object' && 'default' in _iterCall ? _iterCall['default'] : _iterCall;

                  var _forOf = __commonjs(function (module) {
                    var ctx = require$$1$2,
                        call = require$$4$3,
                        isArrayIter = require$$3$2,
                        anObject = require$$0$3,
                        toLength = require$$1$5,
                        getIterFn = require$$0$12;
                    module.exports = function (iterable, entries, fn, that, ITERATOR) {
                      var iterFn = ITERATOR ? function () {
                        return iterable;
                      } : getIterFn(iterable),
                          f = ctx(fn, that, entries ? 2 : 1),
                          index = 0,
                          length,
                          step,
                          iterator;
                      if (typeof iterFn != 'function') throw TypeError(iterable + ' is not iterable!');
                      // fast case for arrays with default iterator
                      if (isArrayIter(iterFn)) for (length = toLength(iterable.length); length > index; index++) {
                        entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
                      } else for (iterator = iterFn.call(iterable); !(step = iterator.next()).done;) {
                        call(iterator, f, step.value, entries);
                      }
                    };
                  });

                  var require$$0$4 = _forOf && (typeof _forOf === 'undefined' ? 'undefined' : babelHelpers.typeof(_forOf)) === 'object' && 'default' in _forOf ? _forOf['default'] : _forOf;

                  var _arrayFromIterable = __commonjs(function (module) {
                    var forOf = require$$0$4;

                    module.exports = function (iter, ITERATOR) {
                      var result = [];
                      forOf(iter, false, result.push, result, ITERATOR);
                      return result;
                    };
                  });

                  var require$$10 = _arrayFromIterable && (typeof _arrayFromIterable === 'undefined' ? 'undefined' : babelHelpers.typeof(_arrayFromIterable)) === 'object' && 'default' in _arrayFromIterable ? _arrayFromIterable['default'] : _arrayFromIterable;

                  var _anInstance = __commonjs(function (module) {
                    module.exports = function (it, Constructor, name, forbiddenField) {
                      if (!(it instanceof Constructor) || forbiddenField !== undefined && forbiddenField in it) {
                        throw TypeError(name + ': incorrect invocation!');
                      }return it;
                    };
                  });

                  var require$$12 = _anInstance && (typeof _anInstance === 'undefined' ? 'undefined' : babelHelpers.typeof(_anInstance)) === 'object' && 'default' in _anInstance ? _anInstance['default'] : _anInstance;

                  var _export = __commonjs(function (module, exports) {
                    var global = require$$0$6,
                        core = require$$0,
                        ctx = require$$1$2,
                        hide = require$$0$8,
                        PROTOTYPE = 'prototype';

                    var $export = function $export(type, name, source) {
                      var IS_FORCED = type & $export.F,
                          IS_GLOBAL = type & $export.G,
                          IS_STATIC = type & $export.S,
                          IS_PROTO = type & $export.P,
                          IS_BIND = type & $export.B,
                          IS_WRAP = type & $export.W,
                          exports = IS_GLOBAL ? core : core[name] || (core[name] = {}),
                          expProto = exports[PROTOTYPE],
                          target = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE],
                          key,
                          own,
                          out;
                      if (IS_GLOBAL) source = name;
                      for (key in source) {
                        // contains in native
                        own = !IS_FORCED && target && target[key] !== undefined;
                        if (own && key in exports) continue;
                        // export native or passed
                        out = own ? target[key] : source[key];
                        // prevent global pollution for namespaces
                        exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
                        // bind timers to global for call from export context
                        : IS_BIND && own ? ctx(out, global)
                        // wrap global constructors for prevent change them in library
                        : IS_WRAP && target[key] == out ? function (C) {
                          var F = function F(a, b, c) {
                            if (this instanceof C) {
                              switch (arguments.length) {
                                case 0:
                                  return new C();
                                case 1:
                                  return new C(a);
                                case 2:
                                  return new C(a, b);
                              }return new C(a, b, c);
                            }return C.apply(this, arguments);
                          };
                          F[PROTOTYPE] = C[PROTOTYPE];
                          return F;
                          // make static versions for prototype methods
                        }(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
                        // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
                        if (IS_PROTO) {
                          (exports.virtual || (exports.virtual = {}))[key] = out;
                          // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
                          if (type & $export.R && expProto && !expProto[key]) hide(expProto, key, out);
                        }
                      }
                    };
                    // type bitmap
                    $export.F = 1; // forced
                    $export.G = 2; // global
                    $export.S = 4; // static
                    $export.P = 8; // proto
                    $export.B = 16; // bind
                    $export.W = 32; // wrap
                    $export.U = 64; // safe
                    $export.R = 128; // real proto method for `library`
                    module.exports = $export;
                  });

                  var require$$8$1 = _export && (typeof _export === 'undefined' ? 'undefined' : babelHelpers.typeof(_export)) === 'object' && 'default' in _export ? _export['default'] : _export;

                  var _library = __commonjs(function (module) {
                    module.exports = true;
                  });

                  var require$$9$1 = _library && (typeof _library === 'undefined' ? 'undefined' : babelHelpers.typeof(_library)) === 'object' && 'default' in _library ? _library['default'] : _library;

                  var es6_promise = __commonjs(function (module, exports, global) {
                    'use strict';

                    var $ = require$$4$1,
                        LIBRARY = require$$9$1,
                        global = require$$0$6,
                        ctx = require$$1$2,
                        classof = require$$3,
                        $export = require$$8$1,
                        isObject = require$$1$1,
                        anObject = require$$0$3,
                        aFunction = require$$0$5,
                        anInstance = require$$12,
                        forOf = require$$0$4,
                        from = require$$10,
                        setProto = require$$9.set,
                        speciesConstructor = require$$8,
                        task = require$$1.set,
                        microtask = require$$6,
                        PROMISE = 'Promise',
                        TypeError = global.TypeError,
                        process = global.process,
                        $Promise = global[PROMISE],
                        isNode = classof(process) == 'process',
                        empty = function empty() {/* empty */},
                        Internal,
                        GenericPromiseCapability,
                        Wrapper;

                    var testResolve = function testResolve(sub) {
                      var test = new $Promise(empty),
                          promise;
                      if (sub) test.constructor = function (exec) {
                        exec(empty, empty);
                      };
                      (promise = $Promise.resolve(test))['catch'](empty);
                      return promise === test;
                    };

                    var USE_NATIVE = function () {
                      var works = false;
                      var SubPromise = function SubPromise(x) {
                        var self = new $Promise(x);
                        setProto(self, SubPromise.prototype);
                        return self;
                      };
                      try {
                        works = $Promise && $Promise.resolve && testResolve();
                        setProto(SubPromise, $Promise);
                        SubPromise.prototype = $.create($Promise.prototype, { constructor: { value: SubPromise } });
                        // actual Firefox has broken subclass support, test that
                        if (!(SubPromise.resolve(5).then(empty) instanceof SubPromise)) {
                          works = false;
                        }
                        // V8 4.8- bug, https://code.google.com/p/v8/issues/detail?id=4162
                        if (works && require$$0$2) {
                          var thenableThenGotten = false;
                          $Promise.resolve($.setDesc({}, 'then', {
                            get: function get() {
                              thenableThenGotten = true;
                            }
                          }));
                          works = thenableThenGotten;
                        }
                      } catch (e) {
                        works = false;
                      }
                      return !!works;
                    }();

                    // helpers
                    var sameConstructor = function sameConstructor(a, b) {
                      // with library wrapper special case
                      return a === b || a === $Promise && b === Wrapper;
                    };
                    var isThenable = function isThenable(it) {
                      var then;
                      return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
                    };
                    var newPromiseCapability = function newPromiseCapability(C) {
                      return sameConstructor($Promise, C) ? new PromiseCapability(C) : new GenericPromiseCapability(C);
                    };
                    var PromiseCapability = GenericPromiseCapability = function GenericPromiseCapability(C) {
                      var resolve, reject;
                      this.promise = new C(function ($$resolve, $$reject) {
                        if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
                        resolve = $$resolve;
                        reject = $$reject;
                      });
                      this.resolve = aFunction(resolve);
                      this.reject = aFunction(reject);
                    };
                    var perform = function perform(exec) {
                      try {
                        exec();
                      } catch (e) {
                        return { error: e };
                      }
                    };
                    var notify = function notify(promise, isReject) {
                      if (promise._n) return;
                      promise._n = true;
                      var chain = promise._c;
                      microtask(function () {
                        var value = promise._v,
                            ok = promise._s == 1,
                            i = 0;
                        var run = function run(reaction) {
                          var handler = ok ? reaction.ok : reaction.fail,
                              resolve = reaction.resolve,
                              reject = reaction.reject,
                              result,
                              then;
                          try {
                            if (handler) {
                              if (!ok) {
                                if (promise._h == 2) onHandleUnhandled(promise);
                                promise._h = 1;
                              }
                              result = handler === true ? value : handler(value);
                              if (result === reaction.promise) {
                                reject(TypeError('Promise-chain cycle'));
                              } else if (then = isThenable(result)) {
                                then.call(result, resolve, reject);
                              } else resolve(result);
                            } else reject(value);
                          } catch (e) {
                            reject(e);
                          }
                        };
                        while (chain.length > i) {
                          run(chain[i++]);
                        } // variable length - can't use forEach
                        promise._c = [];
                        promise._n = false;
                        if (isReject && !promise._h) onUnhandled(promise);
                      });
                    };
                    var onUnhandled = function onUnhandled(promise) {
                      task.call(global, function () {
                        if (isUnhandled(promise)) {
                          var value = promise._v,
                              handler,
                              console;
                          if (isNode) {
                            process.emit('unhandledRejection', value, promise);
                          } else if (handler = global.onunhandledrejection) {
                            handler({ promise: promise, reason: value });
                          } else if ((console = global.console) && console.error) {
                            console.error('Unhandled promise rejection', value);
                          }promise._h = 2;
                        }promise._a = undefined;
                      });
                    };
                    var isUnhandled = function isUnhandled(promise) {
                      var chain = promise._a || promise._c,
                          i = 0,
                          reaction;
                      if (promise._h == 1) return false;
                      while (chain.length > i) {
                        reaction = chain[i++];
                        if (reaction.fail || !isUnhandled(reaction.promise)) return false;
                      }return true;
                    };
                    var onHandleUnhandled = function onHandleUnhandled(promise) {
                      task.call(global, function () {
                        var handler;
                        if (isNode) {
                          process.emit('rejectionHandled', promise);
                        } else if (handler = global.onrejectionhandled) {
                          handler({ promise: promise, reason: promise._v });
                        }
                      });
                    };
                    var $reject = function $reject(value) {
                      var promise = this;
                      if (promise._d) return;
                      promise._d = true;
                      promise = promise._w || promise; // unwrap
                      promise._v = value;
                      promise._s = 2;
                      if (!promise._a) promise._a = promise._c.slice();
                      notify(promise, true);
                    };
                    var $resolve = function $resolve(value) {
                      var promise = this,
                          then;
                      if (promise._d) return;
                      promise._d = true;
                      promise = promise._w || promise; // unwrap
                      try {
                        if (promise === value) throw TypeError("Promise can't be resolved itself");
                        if (then = isThenable(value)) {
                          microtask(function () {
                            var wrapper = { _w: promise, _d: false }; // wrap
                            try {
                              then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
                            } catch (e) {
                              $reject.call(wrapper, e);
                            }
                          });
                        } else {
                          promise._v = value;
                          promise._s = 1;
                          notify(promise, false);
                        }
                      } catch (e) {
                        $reject.call({ _w: promise, _d: false }, e); // wrap
                      }
                    };

                    // constructor polyfill
                    if (!USE_NATIVE) {
                      // 25.4.3.1 Promise(executor)
                      $Promise = function Promise(executor) {
                        anInstance(this, $Promise, PROMISE, '_h');
                        aFunction(executor);
                        Internal.call(this);
                        try {
                          executor(ctx($resolve, this, 1), ctx($reject, this, 1));
                        } catch (err) {
                          $reject.call(this, err);
                        }
                      };
                      Internal = function Promise(executor) {
                        this._c = []; // <- awaiting reactions
                        this._a = undefined; // <- checked in isUnhandled reactions
                        this._s = 0; // <- state
                        this._d = false; // <- done
                        this._v = undefined; // <- value
                        this._h = 0; // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
                        this._n = false; // <- notify
                      };
                      Internal.prototype = require$$4($Promise.prototype, {
                        // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
                        then: function then(onFulfilled, onRejected) {
                          var reaction = newPromiseCapability(speciesConstructor(this, $Promise));
                          reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
                          reaction.fail = typeof onRejected == 'function' && onRejected;
                          this._c.push(reaction);
                          if (this._a) this._a.push(reaction);
                          if (this._s) notify(this, false);
                          return reaction.promise;
                        },
                        // 25.4.5.1 Promise.prototype.catch(onRejected)
                        'catch': function _catch(onRejected) {
                          return this.then(undefined, onRejected);
                        }
                      });
                      PromiseCapability = function PromiseCapability() {
                        var promise = new Internal();
                        this.promise = promise;
                        this.resolve = ctx($resolve, promise, 1);
                        this.reject = ctx($reject, promise, 1);
                      };
                    }

                    $export($export.G + $export.W + $export.F * !USE_NATIVE, { Promise: $Promise });
                    require$$2$1($Promise, PROMISE);
                    require$$2(PROMISE);
                    Wrapper = require$$0[PROMISE];

                    // statics
                    $export($export.S + $export.F * !USE_NATIVE, PROMISE, {
                      // 25.4.4.5 Promise.reject(r)
                      reject: function reject(r) {
                        var capability = newPromiseCapability(this),
                            $$reject = capability.reject;
                        $$reject(r);
                        return capability.promise;
                      }
                    });
                    $export($export.S + $export.F * (LIBRARY || !USE_NATIVE || testResolve(true)), PROMISE, {
                      // 25.4.4.6 Promise.resolve(x)
                      resolve: function resolve(x) {
                        // instanceof instead of internal slot check because we should fix it without replacement native Promise core
                        if (x instanceof $Promise && sameConstructor(x.constructor, this)) return x;
                        var capability = newPromiseCapability(this),
                            $$resolve = capability.resolve;
                        $$resolve(x);
                        return capability.promise;
                      }
                    });
                    $export($export.S + $export.F * !(USE_NATIVE && require$$0$1(function (iter) {
                      $Promise.all(iter)['catch'](empty);
                    })), PROMISE, {
                      // 25.4.4.1 Promise.all(iterable)
                      all: function all(iterable) {
                        var C = this,
                            capability = newPromiseCapability(C),
                            resolve = capability.resolve,
                            reject = capability.reject;
                        var abrupt = perform(function () {
                          var values = from(iterable),
                              remaining = values.length,
                              results = Array(remaining);
                          if (remaining) $.each.call(values, function (promise, index) {
                            var alreadyCalled = false;
                            C.resolve(promise).then(function (value) {
                              if (alreadyCalled) return;
                              alreadyCalled = true;
                              results[index] = value;
                              --remaining || resolve(results);
                            }, reject);
                          });else resolve(results);
                        });
                        if (abrupt) reject(abrupt.error);
                        return capability.promise;
                      },
                      // 25.4.4.4 Promise.race(iterable)
                      race: function race(iterable) {
                        var C = this,
                            capability = newPromiseCapability(C),
                            reject = capability.reject;
                        var abrupt = perform(function () {
                          forOf(iterable, false, function (promise) {
                            C.resolve(promise).then(capability.resolve, reject);
                          });
                        });
                        if (abrupt) reject(abrupt.error);
                        return capability.promise;
                      }
                    });
                  });

                  es6_promise && (typeof es6_promise === 'undefined' ? 'undefined' : babelHelpers.typeof(es6_promise)) === 'object' && 'default' in es6_promise ? es6_promise['default'] : es6_promise;

                  var _iterCreate = __commonjs(function (module) {
                    'use strict';

                    var $ = require$$4$1,
                        descriptor = require$$3$3,
                        setToStringTag = require$$2$1,
                        IteratorPrototype = {};

                    // 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
                    require$$0$8(IteratorPrototype, require$$0$7('iterator'), function () {
                      return this;
                    });

                    module.exports = function (Constructor, NAME, next) {
                      Constructor.prototype = $.create(IteratorPrototype, { next: descriptor(1, next) });
                      setToStringTag(Constructor, NAME + ' Iterator');
                    };
                  });

                  var require$$3$4 = _iterCreate && (typeof _iterCreate === 'undefined' ? 'undefined' : babelHelpers.typeof(_iterCreate)) === 'object' && 'default' in _iterCreate ? _iterCreate['default'] : _iterCreate;

                  var _redefine = __commonjs(function (module) {
                    module.exports = require$$0$8;
                  });

                  var require$$7 = _redefine && (typeof _redefine === 'undefined' ? 'undefined' : babelHelpers.typeof(_redefine)) === 'object' && 'default' in _redefine ? _redefine['default'] : _redefine;

                  var _iterDefine = __commonjs(function (module) {
                    'use strict';

                    var LIBRARY = require$$9$1,
                        $export = require$$8$1,
                        redefine = require$$7,
                        hide = require$$0$8,
                        has = require$$5,
                        Iterators = require$$1$3,
                        $iterCreate = require$$3$4,
                        setToStringTag = require$$2$1,
                        getProto = require$$4$1.getProto,
                        ITERATOR = require$$0$7('iterator'),
                        BUGGY = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
                    ,
                        FF_ITERATOR = '@@iterator',
                        KEYS = 'keys',
                        VALUES = 'values';

                    var returnThis = function returnThis() {
                      return this;
                    };

                    module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
                      $iterCreate(Constructor, NAME, next);
                      var getMethod = function getMethod(kind) {
                        if (!BUGGY && kind in proto) return proto[kind];
                        switch (kind) {
                          case KEYS:
                            return function keys() {
                              return new Constructor(this, kind);
                            };
                          case VALUES:
                            return function values() {
                              return new Constructor(this, kind);
                            };
                        }return function entries() {
                          return new Constructor(this, kind);
                        };
                      };
                      var TAG = NAME + ' Iterator',
                          DEF_VALUES = DEFAULT == VALUES,
                          VALUES_BUG = false,
                          proto = Base.prototype,
                          $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT],
                          $default = $native || getMethod(DEFAULT),
                          $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined,
                          $anyNative = NAME == 'Array' ? proto.entries || $native : $native,
                          methods,
                          key,
                          IteratorPrototype;
                      // Fix native
                      if ($anyNative) {
                        IteratorPrototype = getProto($anyNative.call(new Base()));
                        if (IteratorPrototype !== Object.prototype) {
                          // Set @@toStringTag to native iterators
                          setToStringTag(IteratorPrototype, TAG, true);
                          // fix for some old engines
                          if (!LIBRARY && !has(IteratorPrototype, ITERATOR)) hide(IteratorPrototype, ITERATOR, returnThis);
                        }
                      }
                      // fix Array#{values, @@iterator}.name in V8 / FF
                      if (DEF_VALUES && $native && $native.name !== VALUES) {
                        VALUES_BUG = true;
                        $default = function values() {
                          return $native.call(this);
                        };
                      }
                      // Define iterator
                      if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
                        hide(proto, ITERATOR, $default);
                      }
                      // Plug for library
                      Iterators[NAME] = $default;
                      Iterators[TAG] = returnThis;
                      if (DEFAULT) {
                        methods = {
                          values: DEF_VALUES ? $default : getMethod(VALUES),
                          keys: IS_SET ? $default : getMethod(KEYS),
                          entries: $entries
                        };
                        if (FORCED) for (key in methods) {
                          if (!(key in proto)) redefine(proto, key, methods[key]);
                        } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
                      }
                      return methods;
                    };
                  });

                  var require$$0$9 = _iterDefine && (typeof _iterDefine === 'undefined' ? 'undefined' : babelHelpers.typeof(_iterDefine)) === 'object' && 'default' in _iterDefine ? _iterDefine['default'] : _iterDefine;

                  var _defined = __commonjs(function (module) {
                    // 7.2.1 RequireObjectCoercible(argument)
                    module.exports = function (it) {
                      if (it == undefined) throw TypeError("Can't call method on  " + it);
                      return it;
                    };
                  });

                  var require$$0$13 = _defined && (typeof _defined === 'undefined' ? 'undefined' : babelHelpers.typeof(_defined)) === 'object' && 'default' in _defined ? _defined['default'] : _defined;

                  var _iobject = __commonjs(function (module) {
                    // fallback for non-array-like ES3 and non-enumerable old V8 strings
                    var cof = require$$0$10;
                    module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
                      return cof(it) == 'String' ? it.split('') : Object(it);
                    };
                  });

                  var require$$1$8 = _iobject && (typeof _iobject === 'undefined' ? 'undefined' : babelHelpers.typeof(_iobject)) === 'object' && 'default' in _iobject ? _iobject['default'] : _iobject;

                  var _toIobject = __commonjs(function (module) {
                    // to indexed object, toObject with fallback for non-array-like ES3 strings
                    var IObject = require$$1$8,
                        defined = require$$0$13;
                    module.exports = function (it) {
                      return IObject(defined(it));
                    };
                  });

                  var require$$1$7 = _toIobject && (typeof _toIobject === 'undefined' ? 'undefined' : babelHelpers.typeof(_toIobject)) === 'object' && 'default' in _toIobject ? _toIobject['default'] : _toIobject;

                  var _iterStep = __commonjs(function (module) {
                    module.exports = function (done, value) {
                      return { value: value, done: !!done };
                    };
                  });

                  var require$$3$5 = _iterStep && (typeof _iterStep === 'undefined' ? 'undefined' : babelHelpers.typeof(_iterStep)) === 'object' && 'default' in _iterStep ? _iterStep['default'] : _iterStep;

                  var _addToUnscopables = __commonjs(function (module) {
                    module.exports = function () {/* empty */};
                  });

                  var require$$4$4 = _addToUnscopables && (typeof _addToUnscopables === 'undefined' ? 'undefined' : babelHelpers.typeof(_addToUnscopables)) === 'object' && 'default' in _addToUnscopables ? _addToUnscopables['default'] : _addToUnscopables;

                  var es6_array_iterator = __commonjs(function (module) {
                    'use strict';

                    var addToUnscopables = require$$4$4,
                        step = require$$3$5,
                        Iterators = require$$1$3,
                        toIObject = require$$1$7;

                    // 22.1.3.4 Array.prototype.entries()
                    // 22.1.3.13 Array.prototype.keys()
                    // 22.1.3.29 Array.prototype.values()
                    // 22.1.3.30 Array.prototype[@@iterator]()
                    module.exports = require$$0$9(Array, 'Array', function (iterated, kind) {
                      this._t = toIObject(iterated); // target
                      this._i = 0; // next index
                      this._k = kind; // kind
                      // 22.1.5.2.1 %ArrayIteratorPrototype%.next()
                    }, function () {
                      var O = this._t,
                          kind = this._k,
                          index = this._i++;
                      if (!O || index >= O.length) {
                        this._t = undefined;
                        return step(1);
                      }
                      if (kind == 'keys') return step(0, index);
                      if (kind == 'values') return step(0, O[index]);
                      return step(0, [index, O[index]]);
                    }, 'values');

                    // argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
                    Iterators.Arguments = Iterators.Array;

                    addToUnscopables('keys');
                    addToUnscopables('values');
                    addToUnscopables('entries');
                  });

                  es6_array_iterator && (typeof es6_array_iterator === 'undefined' ? 'undefined' : babelHelpers.typeof(es6_array_iterator)) === 'object' && 'default' in es6_array_iterator ? es6_array_iterator['default'] : es6_array_iterator;

                  var web_dom_iterable = __commonjs(function (module) {
                    var global = require$$0$6,
                        hide = require$$0$8,
                        Iterators = require$$1$3,
                        TO_STRING_TAG = require$$0$7('toStringTag'),
                        ArrayValues = Iterators.Array;

                    require$$4$1.each.call(['NodeList', 'DOMTokenList', 'MediaList', 'StyleSheetList', 'CSSRuleList'], function (NAME) {
                      var Collection = global[NAME],
                          proto = Collection && Collection.prototype;
                      if (proto && !proto[TO_STRING_TAG]) hide(proto, TO_STRING_TAG, NAME);
                      Iterators[NAME] = ArrayValues;
                    });
                  });

                  web_dom_iterable && (typeof web_dom_iterable === 'undefined' ? 'undefined' : babelHelpers.typeof(web_dom_iterable)) === 'object' && 'default' in web_dom_iterable ? web_dom_iterable['default'] : web_dom_iterable;

                  var _stringAt = __commonjs(function (module) {
                    var toInteger = require$$0$14,
                        defined = require$$0$13;
                    // true  -> String#at
                    // false -> String#codePointAt
                    module.exports = function (TO_STRING) {
                      return function (that, pos) {
                        var s = String(defined(that)),
                            i = toInteger(pos),
                            l = s.length,
                            a,
                            b;
                        if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
                        a = s.charCodeAt(i);
                        return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff ? TO_STRING ? s.charAt(i) : a : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
                      };
                    };
                  });

                  var require$$1$4 = _stringAt && (typeof _stringAt === 'undefined' ? 'undefined' : babelHelpers.typeof(_stringAt)) === 'object' && 'default' in _stringAt ? _stringAt['default'] : _stringAt;

                  var es6_string_iterator = __commonjs(function (module) {
                    'use strict';

                    var $at = require$$1$4(true);

                    // 21.1.3.27 String.prototype[@@iterator]()
                    require$$0$9(String, 'String', function (iterated) {
                      this._t = String(iterated); // target
                      this._i = 0; // next index
                      // 21.1.5.2.1 %StringIteratorPrototype%.next()
                    }, function () {
                      var O = this._t,
                          index = this._i,
                          point;
                      if (index >= O.length) return { value: undefined, done: true };
                      point = $at(O, index);
                      this._i += point.length;
                      return { value: point, done: false };
                    });
                  });

                  es6_string_iterator && (typeof es6_string_iterator === 'undefined' ? 'undefined' : babelHelpers.typeof(es6_string_iterator)) === 'object' && 'default' in es6_string_iterator ? es6_string_iterator['default'] : es6_string_iterator;

                  var promise = __commonjs(function (module) {
                    module.exports = require$$0.Promise;
                  });

                  var Promise = promise && (typeof promise === 'undefined' ? 'undefined' : babelHelpers.typeof(promise)) === 'object' && 'default' in promise ? promise['default'] : promise;

                  var ColumnView = function () {
                    function ColumnView(el, options) {
                      var _this = this;

                      babelHelpers.classCallCheck(this, ColumnView);

                      this.options = options || {};
                      this.value = null;
                      this.ready = false;
                      this.carriageReady = false;
                      this.colCount = 3; //default

                      this.el = el;
                      this.carriageManager = new CariageManager(this);
                      this.carriageManager.changeCallbacks.push(function (data) {
                        // console.log("change");
                        _this.el.setAttribute("aria-activedescendant", 'cv-' + _this.uid + '-' + data.key);
                      });

                      this.keyboardManager = new KeyboardManager(this);
                      this.keyboardManager.changeCallback = this._onColumnChange.bind(this);

                      this.models = options.items;
                      this.path = options.path || [];

                      this.callbacks = {
                        change: this.options.onChange,
                        source: function source(data) {
                          return new Promise(function (resolve, reject) {
                            _this.options.source(data, function (result) {
                              _this._checkSourceResponse(result, reject);
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
                      this.uniqueClassName = 'column-view-' + this.uid;
                      this.el.classList.add(this.uniqueClassName);
                      this.el.setAttribute("tabindex", 0);
                      this.el.setAttribute("role", "tree");

                      this._onColumnChangeBound = this._onColumnChange.bind(this);

                      // window.addEventListener("resize", debounce(this._resize.bind(this), 300));

                      // console.log("path", this.path);
                      this._loadDataBySourceCalls(this.path).then(function (columnDataItems) {
                        _this.carriageManager.seed(columnDataItems);
                        _this.ready = true;
                        if (_this.callbacks.ready) _this.callbacks.ready.call(_this);
                      });
                    }

                    babelHelpers.createClass(ColumnView, [{
                      key: '_checkSourceResponse',
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
                      key: '_onColumnChange',

                      // @private
                      value: function _onColumnChange(data) {
                        var _this2 = this;

                        var column = data.column.el;

                        // console.log("_onColumnChange", arguments);
                        // TODO get rid of value
                        this.value = data.key;

                        this.carriageManager._removeAfter(column);

                        this.callbacks.source(data).then(function (_data) {
                          if (_this2.value != data.key) return; // this call is outdated
                          _this2.carriageManager._appendCol(_data);
                          _this2.callbacks.change.call(_this2, data);
                        });

                        // todo handle case case no callback is called
                      }
                    }, {
                      key: '_loadDataBySourceCalls',
                      value: function _loadDataBySourceCalls(path) {
                        var _this3 = this;

                        var pathPairs = path.map(function (value, i, array) {
                          return [value, array[i + 1]];
                        });

                        var promises = pathPairs.map(function (pathPair) {
                          var id = pathPair[0],
                              nextID = pathPair[1];
                          return _this3.callbacks.source({ key: id, seed: true }).then(function (data) {
                            if (nextID) data.selectedValue = nextID;
                            return data;
                          });
                        });
                        return Promise.all(promises);
                      }
                    }, {
                      key: 'back',
                      value: function back() {
                        if (!this.canMoveBack) return;
                        this.carriageManager.back();
                        this.value = this.carriageManager.focusedColumn.customSelect.value();
                        this.callbacks.change.call(this, this.value);
                      }
                    }, {
                      key: '_uid',
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
                      key: 'columns',
                      get: function get() {
                        return this.carriageManager.columns;
                      }
                    }, {
                      key: 'canMoveBack',
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

                  return ColumnView;

}());
//# sourceMappingURL=bundle.js.map