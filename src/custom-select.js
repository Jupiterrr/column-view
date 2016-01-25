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

export default class CustomSelect {

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

export class Preview {

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
