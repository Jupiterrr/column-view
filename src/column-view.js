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
    }

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
