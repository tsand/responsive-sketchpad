# Responsive-Sketchpad [![Build Status](https://travis-ci.org/trsanders/responsive-sketchpad.svg?branch=master)](https://travis-ci.org/trsanders/responsive-sketchpad)

A completely responsive, HTML5 canvas sketchpad for use on desktop and mobile browsers


## Getting Started

### Installation

`npm install responsive-sketchpad`

### Example

Create a sketchpad

html:
```html
<body>
<div id="sketchpad"></div>
</body>
```

javascript:
```js
var Sketchpad = require('responsive-sketchpad');

var el = document.getElementById('sketchpad');
var pad = new Sketchpad(el);
pad.setLineColor('#4CAF50');
```

## Running tests

`npm install`

`npm test`
