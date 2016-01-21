# column-view

A Javascript column view component: without dependencies, with native feel

* no dependencies
* keyboard control
* custom data format
* mobile

<a href="https://rawgithub.com/Jupiterrr/column-view/master/demo.html"><img src="https://cloud.githubusercontent.com/assets/681942/12482634/fceb3cf6-c050-11e5-841e-4cbbb24149f1.gif" alt="demo-video" width="650" height="329" /></a>

### [Demo](https://rawgithub.com/Jupiterrr/column-view/master/demo.html)

## Examples

```html
<div id="column-view"></div>
```

### JSON / PlainObject

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


### Custom Data Format

```javascript
var data = {
  0: {name: "root", childIDs: [1,2]}, // not vissible
  1: {name: "Item 1", childIDs: [3,4,5]},
  2: {name: "Item 2"},
  3: {name: "Item 3"},
  4: {name: "Item 4"},
  5: {name: "Item 5"}
};

function getChildren(itemData) {
  return itemData.childIDs.map(function(id) {
    const childItem = data[id];
    return { name: childItem.name, key: id, data: childItem };
  });
}

var columnView = new ColumnView(
  document.getElementById("column-view"),
  {
    source: function(item, cb) {
      var key = item.key;
      if (item.data.childIDs) {
        cb({ items: getChildren(item.data) });
      } else {
        cb({ html: "Preview: " + selectedItem.name })
      }
    },
    path: [0, 1, 4],
    onChange: function(item) {
      console.log("Selection changed", item);
    }
  }
);
```

## Documentation

### Types

**Item** `[{name: <String>, key: <Any>, ...}]`

**Key** A key is typically some sort of uniq id.

---

### new ColumnView(...)

```javascript
new ColumnView(
  <HTMLElement> container,
  {
    source: <Function(<ItemData>, <CallbackFunction(<PlainObject>)>)>,
    data: <PlainObject>
    path: <Keys[]>,
    onChange: <Function(<ItemData>)>
  }
);
```

**`container: <HTMLElement>`:**
The HTML container, which is typically a DIV element, where the column-view will be created.

**`source: <Function(<ItemData>, <CallbackFunction(<PlainObject>)>)>`:**
This function provides the data for the componenten. So whenever the selection changes this function is called.

CallbackFunction:
* Normal List: `{items: <Item[]>}`
* Grouped List: `{groups: [{title: <String>: items: <Item[]>}, ...]}`
* Preview: `{html: <String>}`

**`data: <PlainObject>`:**


**`path: <Keys[]>`:**
Use an array of keys here if you want to preselect a certain route in the tree.

**`onChange: <Function(<Item>)>`:**
This function is called whenever the selection changes.

## License

[MIT License](http://opensource.org/licenses/MIT) © 2016 Carsten Griesheimer (hallo@carstengriesheimer.de)
