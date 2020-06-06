# Responsive-Sketchpad

[![npm version](https://img.shields.io/npm/v/responsive-sketchpad)](https://www.npmjs.com/package/responsive-sketchpad)
[![Node.js Build](https://github.com/tsand/responsive-sketchpad/workflows/Node.js%20Build/badge.svg)](https://github.com/tsand/responsive-sketchpad/actions)

A completely responsive, HTML5 canvas sketchpad for use on desktop and mobile browsers with no dependencies.

[Demo](https://tsand.github.io/responsive-sketchpad/)

### Installation

`npm install responsive-sketchpad`

### Example Usage

```html
<!-- index.html -->
<html>
  <head>
    <script src="script.js" async></script>
  </head>
  <body>
    <div id="sketchpad"></div>
  </body>
</html>
```

```js
// script.js
var Sketchpad = require('responsive-sketchpad');

var el = document.getElementById('sketchpad');
var pad = new Sketchpad(el);
pad.setLineColor('#4CAF50');
```
