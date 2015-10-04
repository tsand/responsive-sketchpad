
function Sketchpad(el, opts) {
    var that = this;

    if (!el) {
        throw new Error('Must pass in a container element');
    }

    var opts = opts || {};
    opts.aspectRatio = opts.aspectRatio || 1;
    opts.width = opts.width || el.clientWidth;
    opts.height = opts.height || opts.width * opts.aspectRatio;
    opts.data = opts.data || [];

    // Canvas Context
    opts.lineColor = opts.lineColor || 'black';
    opts.lineSize = opts.lineSize || 5;
    opts.lineCap = opts.lineCap || 'round';
    opts.lineJoin = opts.lineJoin || 'round';
    opts.lineMiterLimit = opts.lineMiterLimit || 10;

    strokes = opts.data;
    undos = [];

    // Boolean indicating if currently drawing
    var sketching = false;

    // Create a canvas element
    var canvas = document.createElement('canvas');
    canvas.setAttribute('width', opts.width);
    canvas.setAttribute('height', opts.height);
    canvas.style.width = opts.width + 'px';
    canvas.style.height = opts.height + 'px';
    el.appendChild(canvas);

    context = canvas.getContext('2d');

    // Return the mouse/touch location
    function getCursor(e) {
        var rect = that.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    function redraw () {
        var strokes = that.strokes;

        var width = that.canvas.width;
        var height = that.canvas.height;

        context.clearRect(0, 0, width, height);  // Clear Canvas

        for (var i = 0; i < strokes.length; i++) {
            var stroke = strokes[i].stroke;

            context.beginPath();
            for (var j = 0; j < stroke.length - 1; j++) {
                context.moveTo(stroke[j].x, stroke[j].y);
                context.lineTo(stroke[j + 1].x, stroke[j + 1].y);
            }
            context.closePath();

            context.strokeStyle = strokes[i].lineColor;
            context.lineWidth = strokes[i].lineSize;
            context.lineJoin = strokes[i].lineJoin;
            context.lineCap = strokes[i].lineCap;
            context.miterLimit = strokes[i].lineMiterLimit;

            context.stroke()
        }
    }

    // On mouse down, create a new stroke with a start location
    function startLine (e) {
        e.preventDefault();

        strokes = that.strokes;
        sketching = true;
        that.undos = [];

        strokes.push({
            stroke: [],
            lineColor: opts.lineColor,
            lineSize: opts.lineSize,
            lineCap: opts.lineCap,
            lineJoin: opts.lineJoin,
            lineMiterLimit: opts.lineMiterLimit
        });

        var cursor = getCursor(e);
        strokes[strokes.length - 1].stroke.push({
            x: cursor.x,
            y: cursor.y
        });
    }

    function drawLine (e) {
        if (!sketching) {
            return
        }

        var cursor = getCursor(e);
        that.strokes[strokes.length - 1].stroke.push({
            x: cursor.x,
            y: cursor.y
        });

        that.redraw();
    }

    function endLine (e) {
        sketching = false;
    }

    // Event Listeners
    canvas.addEventListener('mousedown', startLine);
    canvas.addEventListener('mousemove', drawLine);
    canvas.addEventListener('mouseup', endLine);
    canvas.addEventListener('mouseleave', endLine);

    // Public variables
    this.canvas = canvas;
    this.strokes = strokes;
    this.undos = undos;

    // Public functions
    this.redraw = redraw;
}


Sketchpad.prototype.undo = function () {
    if (this.strokes.length === 0){
        return;
    }

    this.undos.push(this.strokes.pop());
    this.redraw();
}


Sketchpad.prototype.redo = function () {
    if (this.undos.length === 0) {
        return;
    }

    this.strokes.push(this.undos.pop());
    this.redraw();
}


Sketchpad.prototype.clear = function () {
    this.undos = [];
    this.strokes = [];
    this.redraw();
}


Sketchpad.prototype.toJSON = function () {
    return {
        aspectRatio: 0,
        strokes: this.strokes
    };
}


Sketchpad.prototype.loadData = function (data) {
    this.strokes = data.strokes;
    this.redraw();
}


Sketchpad.prototype.getImage = function () {
    return '<img src="' + this.canvas.toDataURL('image/png') + '"/>';
}


Sketchpad.prototype.setLineSize = function (size) {
    this.lineSize = size;
}


Sketchpad.prototype.setLineColor = function (color) {
    this.lineColor = color;
}


window.Sketchpad = Sketchpad
