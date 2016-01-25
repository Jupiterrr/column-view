# column-view

A Javascript column view component: without dependencies, with native feel

* no dependencies
* keyboard control
* custom data format

<a href="http://jupiterrr.github.io/column-view/demo.html"><img src="https://cloud.githubusercontent.com/assets/681942/12482634/fceb3cf6-c050-11e5-841e-4cbbb24149f1.gif" alt="demo-video" width="650" height="329" /></a>

### [Demo](http://jupiterrr.github.io/column-view/demo.html)

## Examples

```html
<div id="column-view"></div>
```
<!--
### JSON / PlainObject Notation

```javascript
var data = {
  "Fruits": {
    "Banana": '<img src="banana.gif" />',
    "Apple": '🍎'
  },
  "Cars": {
    "Invisible Car": {
      _html: '<h1>Aston Martin V12 Vanquish</h1>',
      additionalData: 5
    },
    "Racing Car": "🏎",
    "Police Car": "🚓"
  }
};

var columnView = new ColumnView(
  document.getElementById("column-view"),
  {
    data: data
    onChange: function(item) {
      console.log("Selection changed", item.additionalData);
    }
  }
);
```

### OO Array Notation

```javascript
var data = [
  {
    name: "Fruits", children: [
      { name: "Banana", htm: "'<img src="banana.gif" />'" },
      { name : "Apple", html: "🍎"}
    ]
  }],
  {
    name: "Cars", children: [
      { name: "Invisible Car", html: "<h1>Aston Martin V12 Vanquish</h1>", additionalData: 5 },
      { name: "Racing Car", html: "🏎"},
      { name: "Police Car", html: "🚓"}
    ]
  }
];

var columnView = new ColumnView(
  document.getElementById("column-view"),
  {
    data: data
    onChange: function(item) {
      console.log("Selection changed", item.additionalData);
    }
  }
);
```
-->

### Custom Data Format

```javascript
var data = {
  0: { childIDs: [1,2] }, // root node
  1: { name: "Item 1", childIDs: [3,4,5] },
  2: { name: "Item 2" },
  3: { name: "Item 1.1" },
  4: { name: "Item 1.2" },
  5: { name: "Item 1.3", additionalData: 5 }
};

function getChildItems(itemData) {
  return itemData.childIDs.map(function(id) {
    var childItem = data[id];
    return { name: childItem.name, key: id, data: childItem };
  });
}

var columnView = new ColumnView(
  document.getElementById("column-view"),
  {
    source: function(item, cb) {
      var key = item.key;
      if (item.data.childIDs) {
        cb({ items: getChildItems(item.data) });
      } else {
        cb({ html: "Preview: " + selectedItem.name })
      }
    },
    path: [0, 1, 4],
    onChange: function(item) {
      console.log("Selection changed", item.data.additionalData);
    }
  }
);
```

## Documentation

#### Types

**Item** `{ name: <String>, key: <Any>, ... }`

**Key** A key is typically some sort of uniq id.

---

#### new ColumnView(...)

```javascript
new ColumnView(
  <HTMLElement> container,
  {
    // use source or data
    source: <Function(<Item>, <CallbackFunction(<PlainObject>)>)>,
    data: <PlainObject>

    path: <Keys[]>, // optional
    onChange: <Function(<Item>)> // optional
  }
);
```

<br>

##### `container: <HTMLElement>`:
The HTML container, which is typically a DIV element, where the column-view will be created.

<br>

##### `source: <Function(<ItemData>, <CallbackFunction(<PlainObject>)>)>`:
This function provides the data for the component. So whenever new data is
required this function is called. This happens whenever the selection changes or
a for every key that you passed via `path`.
<!-- TODO ItemData key attribute -->

CallbackFunction:
* Normal List: `{ items: <Item[]> }`
* Grouped List: `{ groups: [{title: <String>: items: <Item[]>}, ...] }`
* Preview: `{ html: <String> }`

<br>


##### `data: <PlainObject|Array>`:
*wip*

<!--
This entry set the data for the component. Use this as a static alternative to the dynamic `source` calls.
By default two data formats are supported:

###### PlainObject Notation
```javascript
{
  "1": {
    "1.1": "<b>HTML</b>",
    "1.2": { _html: "..." }
  },
  "2": ...
}
```

###### OO Array Notation
```javascript
[
  {
    name: "1",
    children: [
      { name: "1.1", html: "<b>HTML</b>" },
      ...
    ]
  },
  { name: "2", children: ... },
  ...
]
```
-->

<br>

##### `path: <Keys[]> [optional]`:
Use an array of keys here if you want to preselect items.
(Works currently only when `source` is used)

<br>

##### `onChange: <Function(<Item>)> [optional]`:
This function is called whenever the selection changes.

---

#### #back()
Removes the last column and last active selection.

---

#### #canMoveBack()
Returns a boolean whether a back move is possible.
Useful in conjunction with onChange to show or hide back buttons.


## Alternatives
* [WebComponent for this component](https://github.com/Jupiterrr/column-view-component)
* Some alternatives are listed in this StackExchange question: [Client-side, JavaScript-based Miller Columns](http://softwarerecs.stackexchange.com/questions/14074/client-side-javascript-based-miller-columns)

## License

[MIT License](http://opensource.org/licenses/MIT) © 2016 Carsten Griesheimer (hallo@carstengriesheimer.de)
