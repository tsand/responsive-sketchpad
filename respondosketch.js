$.fn.respondosketch = function(options) {

    var canvas = this;
    var ctx = $(this)[0].getContext('2d');

    var strokes = [];
    var aspectRatio = 1;

    var sketch = false;

    var lineColor = 'black';
    var lineSize = 5;


    $(window).resize(function(e) {
        var newWidth = canvas.parent().width();
        var newHeight = newWidth / aspectRatio;

        setSize(newWidth, newHeight);

        redraw();
    });

    var startEvent = 'mousedown touchstart ';
    canvas.on(startEvent, function(e) {
        if (e.type == 'touchstart') {
            e.preventDefault();
        } else {
            e.originalEvent.preventDefault();
        }

        sketch = true;
        strokes.push({
            stroke: [],
            color: lineColor,
            size: lineSize
        });

        var canvas = getCanvasLocation(this, e);

        strokes[strokes.length - 1].stroke.push({
            x: canvas.x,
            y: canvas.y,
            type: e.type
        });

        redraw();
    });

    var moveEvent = 'mousemove touchmove ';
    canvas.on(moveEvent, function(e) {
        var canvas = getCanvasLocation(this, e);

        if (sketch) {
            strokes[strokes.length - 1].stroke.push({
                x: canvas.x,
                y: canvas.y,
                type: e.type,
                color: lineColor,
                size: lineSize
            });

            redraw();
        }
    });

    var endEvent = 'mouseup mouseleave touchend ';
    canvas.on(endEvent, function(e) {
        sketch = false;
    });

    function getCanvasLocation(element, event) {
        if (event.type.indexOf('touch') !== -1) {
            return {
                x: (event.originalEvent.touches[0].pageX - element.offsetLeft) / width,
                y: (event.originalEvent.touches[0].pageY - element.offsetTop) / height
            }
        } else {
            return {
                x: (event.pageX - element.offsetLeft) / width,
                y: (event.pageY - element.offsetTop) / height
            };
        }
    }

    function setSize(w, h) {
        width = w;
        height = h;

        canvas.width(width);
        canvas.height(height);

        canvas[0].setAttribute('width', width);
        canvas[0].setAttribute('height', height);
    }

    function redraw() {
        canvas[0].width = canvas[0].width; // Clears canvas

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        for (var i = 0; i < strokes.length; i++) {
            var stroke = strokes[i].stroke;

            ctx.beginPath();
            for (var j = 1; j < stroke.length; j++) {
                ctx.moveTo(stroke[j - 1].x * width, stroke[j - 1].y * height);
                ctx.lineTo(stroke[j].x * width, stroke[j].y * height);
            }
            ctx.closePath();

            ctx.strokeStyle = strokes[i].color;
            ctx.lineWidth = strokes[i].size;
            ctx.stroke()
        }
    }

    this.json = function() {
        return JSON.stringify({
            aspectRatio: aspectRatio, // Is this needed?
            strokes: strokes
        });
    };

    this.img = function() {
        return canvas[0].toDataURL("image/png");
    };

    this.lineColor = function(color) {
        lineColor = color;
    };

    this.undo = function() {
        strokes.pop();
        redraw();
    };


    function init() {

        if (options.data) {
            aspectRatio = typeof options.data.aspectRatio !== 'undefined' ? options.data.aspectRatio : aspectRatio;
            strokes = typeof options.data.strokes !== 'undefined' ? options.data.strokes : [];
        } else {
            aspectRatio = typeof options.aspectRatio !== 'undefined' ? options.aspectRatio : aspectRatio;
        }

        var canvasColor = typeof options.canvasColor !== 'undefined' ? options.canvasColor : '#fff';
        var locked = typeof options.locked !== 'undefined' ? options.locked : false;
        var live = typeof options.live !== 'undefined' ? options.live : true;

        if (options.locked) {
            canvas.unbind(startEvent + moveEvent + endEvent);
        } else {
            canvas.css('cursor', 'crosshair');
        }

        canvas.css('background-color', canvasColor);

        // Set canvas size
        var width = canvas.parent().width();
        setSize(width, width / aspectRatio);

        redraw();
    }

    init();

    return this;
};