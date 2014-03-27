
var ColumnView = (function() {
  "use strict";

  var keyCodes, _slice, transformPrefix;

  keyCodes = {
    enter: 13,
    space: 32,
    backspace: 8,
    tab: 9,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
  };

  _slice = Array.prototype.slice;

  transformPrefix = getTransformPrefix();
  
  function getTransformPrefix() {
    var el = document.createElement("_");
    var prefixes = ["transform", "webkitTransform", "MozTransform", "msTransform", "OTransform"];
    var prefix;
    while (prefix = prefixes.shift()) {
      if (prefix in el.style) return prefix;
    }
    throw new Error("transform not supported");
  }

  function uid() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  function ColumnView(el, options) {
    var that = this, onKeydown, onKeyup;

    this.options = options || {};
    this.value = null;
    this.ready = false;

    this.el = el;
    this.domCarriage = this.el.querySelector(".carriage");
    this.carriage = document.createDocumentFragment();
    this.style = this.el.querySelector("style");

    this.models = options.items;
    this.path = options.path;
    this.mobileLayout = false; //!!options.mobile;
    this.movingUpOrDown = false;

    this.callbacks = {
      change: that.options.onChange,
      source: that.options.source
    };

    if (this.mobileLayout) {
      this.colCount = 1;
    } else {
      this.colCount = 3;
    }

    this.uniqueClassName = "column-view-" + uid();
    this.el.classList.add(this.uniqueClassName);
    this.el.setAttribute("tabindex", 0);
    this.el.setAttribute("role", "tree");

    // bound functions
    onKeydown = this._onKeydown.bind(this);
    onKeyup = this._onKeyup.bind(this);
    this._onColumnChangeBound = this._onColumnChange.bind(this);
    // onResize = _.bind(this._onResize, this);

    if (!this.mobileLayout) {
      this.el.addEventListener("keydown", onKeydown, true);
      this.el.addEventListener("keyup", onKeyup, true);
    }

    // todo prevent scroll when focused and arrow key is pressed
    // this.el.addEventListener("keydown", function(e){e.preventDefault();});

    this._initialize();
  }

  // instance methods
  // ----------------

  ColumnView.prototype = {

    // Getter
    // --------

    columns: function columns() {
      return _slice.call( this.carriage.children );
    },

    focusedColumn: function focusedColumn() {
      var cols = this.columns();
      return cols[cols.length-2] || cols[0];
    },

    canMoveBack: function canMoveBack() {
      return this.columns().length > 2;
    },


    // Keyboard
    // --------

    _onKeydown: function onKeydown(e) {
      this.movingUpOrDown = false;
      if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey)
        return; // do nothing

      switch (e.keyCode) {
        case keyCodes.left:
        case keyCodes.backspace:
          this._keyLeft();
          e.preventDefault();
          break;
        case keyCodes.right:
        case keyCodes.space:
        case keyCodes.enter:
          this._keyRight();
          e.preventDefault();
          break;
        case keyCodes.up:
          this.movingUpOrDown = true;
          this._moveCursor(-1);
          e.preventDefault();
          break;
        case keyCodes.down:
          this.movingUpOrDown = true;
          this._moveCursor(1);
          e.preventDefault();
          break;
        default:
          return;
      }
    },

    _onKeyup: function onKeyup() {
      this.movingUpOrDown = false;
      if (this.fastMoveChangeFn) this.fastMoveChangeFn();
    },

    _keyLeft: function keyLeft() { this.back(); },

    _keyRight: function keyRight() {
      var col = this.carriage.lastChild;
      if (col.customSelect) col.customSelect.selectIndex(0); // COL ACTION!!!!!!
      // triggers change
    },

    _moveCursor: function moveCursor(direction) {
      var col = this.focusedColumn();
      col.customSelect.movePosition(direction);
    },

    _onColumnChange: function onColumnChange(columnClass, value, oldValue) {
      var that = this;
      var column = columnClass.el;

      if (!this.ready) return;

      if (this.movingUpOrDown) {
        this.fastMoveChangeFn = function() { that._onColumnChange(columnClass, value, oldValue); };
        return;
      }

      this.fastMoveChangeFn = null;
      // console.log("cv change", value)

      this.value = value;

      if (this.focusedColumn() == column && this.columns().indexOf(column) !== 0) {
        this.lastColEl = this.carriage.lastChild;
      } else {
        this._removeAfter(column);
        this.lastColEl = null;
      }
      // console.log("horizontal change", this._activeCol == column)

      function appendIfValueIsSame(data) {
        if (that.value !== value) return;
        that._appendCol(data);
        that.callbacks.change.call(that, value);
      }

      this.callbacks.source(value, appendIfValueIsSame);

      // todo handle case case no callback is called
    },

    // Calls the source callback for each value in
    // this.path and append the new columns 
    _initialize: function initialize() {
      var that = this;
      var path = this.path || [];
      var pathPairs = path.map(function(value, index, array) {
        return [value, array[index+1]];
      });
      this.carriage.innerHTML = "";

      function proccessPathPair(pathPair, cb) {
        var id = pathPair[0], nextID = pathPair[1];
        var customSelect;
        that.callbacks.source(String(id), function(data) {
          if (nextID) data.selectedValue = String(nextID);
          customSelect = that._appendCol(data);
          cb();
        });
      }

      function proccessPath() {
        var pathPair = pathPairs.shift();
        if (pathPair)
          proccessPathPair(pathPair, proccessPath);
        else
          ready();
      }

      function ready() {
        that.domCarriage.innerHTML = "";
        that.domCarriage.appendChild(that.carriage);
        that.carriage = that.domCarriage;
        that._onResize();
        that.ready = true;
      }

      proccessPath();
    },

    _appendCol: function appendCol(data) {
      var col = this._createCol(data);
      if (this.ready) this._alignCols();
      this.lastColEl = null;
      return col;
    },

    _createCol: function createCol(data) {
      var col;
      // use existing col if possible
      if (this.lastColEl) {
        col = this.lastColEl;
        col.innerHTML = "";
        // col.selectIndex = null;
      } else {
        col = document.createElement("div");
        col.classList.add("column");
        this.carriage.appendChild(col);
      }
      return this._newColInstance(data, col);
    },

    _newColInstance: function newColInstance(data, col) {
      var colInst;
      if (data.dom) {
        colInst = new this.Preview(col, data.dom);
        // reset monkeypatched properties for reused col elements
        col.customSelect = null; 
      }
      else if (data.items || data.groups) {
        data.onChange = this._onColumnChangeBound;
        colInst = new this.CustomSelect(col, data);
      }
      else {
        throw "Type error";
      }
      return colInst;
    },

    _removeAfter: function removeAfter(col) {
      var cols = this.columns();
      var toRemove = cols.splice(cols.indexOf(col)+1, cols.length);
      toRemove.forEach(function(col) { col.remove(); });
    },

    _alignCols: function alignCols() {
      var length = this.columns().length;
      if (this.lastAllignment === length)
        return; // skip if nothing has changed

      this.lastAllignment = length;
      var leftOut = Math.max(0, length - this.colCount);
      this._moveCarriage(leftOut);
    },

    _onResize: function onResize() {
      // console.log("resize");
      this.colWidth = this.el.offsetWidth / this.colCount;
      this.style.innerHTML = "." + this.uniqueClassName + " .column { width: " + this.colWidth + "px;}";
      this._alignCols();
    },

    _moveCarriage: function moveCarriage(leftOut) {
      // console.log("move", this.ready)
      var left = -1 * leftOut * this.colWidth;
      this.carriage.classList.toggle("transition", this.ready);
      this.carriage.style[transformPrefix] = "translate("+left+"px, 0px)";
    },

    // ### public

    back: function back() {
      if (!this.canMoveBack()) return;
      var lastCol = this.focusedColumn();
      this._removeAfter(lastCol);
      // triggers no change
      lastCol.customSelect.deselect(); // COL ACTION!!!!!!

      this._alignCols();
      this.value = this.focusedColumn().customSelect.value();
      this.callbacks.change.call(this, this.value);
    }


  };

  return ColumnView;


})();











function htmlToDocumentFragment(html) {
  "use strict";
  var frag = document.createDocumentFragment();
  var tmp = document.createElement("body");
  tmp.innerHTML = html;
  var child;
  while (child = tmp.firstChild) {
    frag.appendChild(child);
  }
  return frag;
}

ColumnView.prototype.CustomSelect = (function() {
  "use strict";

  var indexOf = Array.prototype.indexOf;

  // aria-owns="catGroup" aria-expanded="false"
  // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_group_role

  function CustomSelect(parent, data) {
    if (!data) data = {};

    this.el = parent;

    this.models = data.items;
    this.groups = data.groups;
    this.changeCB = data.onChange;

    this._selectedEl = this.el.querySelector(".selected");
    this.items = this.el.querySelectorAll(".item");

    this.value = null;

    this.el.setAttribute("role", "group");

    

    this.el.addEventListener("click", this._onClick.bind(this));

    this._monkeyPatchEl();

    if (this.models || this.groups) this._render(data.selectedValue);
  }

  // instance methods
  // ----------------

  CustomSelect.prototype = {

    _monkeyPatchEl: function monkeyPatchEl() {
      var that = this;
      var selectIndex = this.selectIndex.bind(this);
      var movePosition = this.movePosition.bind(this);
      var deselect = this.deselect.bind(this);
      var selectValue = this.selectValue.bind(this);
      var elMethods = {
        selectIndex: selectIndex,
        movePosition: movePosition,
        deselect: deselect,
        selectValue: selectValue,
        value : function value() { return that.value; }
      };
      this.el.customSelect = elMethods;
    },

    _render: function render(selectedValue) {
      var container = document.createDocumentFragment();

      if (this.groups) {
        this._renderGroups(container, this.groups);
      }
      else if (this.models) {
        this._renderItems(container, this.models);
      }
      else {
        this._renderEmpty(container);
      }

      this.el.innerHTML = "";
      this.el.appendChild(container);
      this.items = this.el.querySelectorAll(".item");
      if (selectedValue) this.selectValue(selectedValue);
    },

    _renderItems: function renderItems(container, models) {
      var that = this;
      models.forEach(function(model) {
        var html = that.itemTemplate(model);
        var item = htmlToDocumentFragment(html);
        container.appendChild(item);
      });
    },

    _renderGroups: function renderGroups(container, groups) {
      var that = this;
      groups.forEach(function(group) {
        var html = that.groupTemplate(group);
        var item = htmlToDocumentFragment(html);
        container.appendChild(item);
        that._renderItems(container, group.items);
      });
    },

    _renderEmpty: function renderEmpty(container) {
      var el = document.createTextNode("empty");
      container.appendChild(el);
    },

    _scrollIntoView: function scrollIntoView() {
      var itemRect = this._selectedEl.getBoundingClientRect();
      var elRect = this.el.getBoundingClientRect();
      var relativeToBottom = elRect.height - itemRect.bottom;

      if (relativeToBottom < 0) {
        this._selectedEl.scrollIntoView(false);
      }

      if (itemRect.top < 0) {
        this._selectedEl.scrollIntoView(true);
      }
    },

    _deselect: function deselect(el) {
      el.classList.remove("selected");
      this._selectedEl = null;
    },

    _select: function select(el) {
      if (this._selectedEl === el) return;

      if (this._selectedEl) this._deselect(this._selectedEl);
      el.classList.add("selected");
      this._selectedEl = el;
      var oldValue = this.value;
      this.value = el.dataset.value;
      this.changeCB(this, this.value, oldValue);
    },

    _onClick: function onClick(e) {
      if (e.ctrlKey || e.metaKey) return;
      if ( !e.target.classList.contains("item") ) return;
      e.preventDefault();
      this._select(e.target);
    },

    _getActiveIndex: function getActiveIndex() {
      var active = this._selectedEl;
      var index = indexOf.call(this.items, active);
      return index;
    },

    movePosition: function movePosition(direction) {
      var index = this._getActiveIndex();
      this.selectIndex(index+direction);
    },

    selectIndex:  function selectIndex(index) {
      var item = this.items[index];
      if (item) this._select(item);
      this._scrollIntoView();
    },

    // ### public

    remove: function remove() {
      this.el.remove();
    },

    deselect: function deselect() {
      if (this._selectedEl) this._deselect(this._selectedEl);
    },

    selectValue: function selectValue(value) {
      var el = this.el.querySelector("[data-value='"+value+"']");
      this._select(el);
    },

    itemTemplate: function itemTemplate(data) {
      return '<div class="item" data-value="'+data.value+'" role="treeitem">'+data.name+'</div>';
    },
    
    groupTemplate: function groupTemplate(data) {
      return '<div class="divider">'+data.title+'</div>';
    }

  };

  return CustomSelect;

})();


ColumnView.prototype.Preview = (function() {
  "use strict";

  function Preview(parent, el) {
    this.el = parent;
    this.el.appendChild(el);
    this.el.classList.add("html");
  }

  Preview.prototype = {
    remove: function remove() {
      this.el.remove();
    }
  };
  return Preview;
})();
