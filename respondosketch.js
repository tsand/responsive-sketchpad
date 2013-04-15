$.fn.respondosketch = function(props) {

    var canvas = this;
    var ctx = $(this)[0].getContext('2d');

    var aspectRatio = props.aspectRatio;
    var sketch = false;
    var drawing = new Array();
    var width = canvas.width();
    var height = canvas.height();
    var lineColor = 'black';
    var lineSize = 5;

    // Setup Context
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    //
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

        var canvas = getCanvasLocation(this, e);

        drawing.push({
            x: canvas.x,
            y: canvas.y,
            type: e.type,
            color: lineColor,
            size: lineSize
        });

        redraw();
    });

    var moveEvent = 'mousemove touchmove ';
    canvas.on(moveEvent, function(e) {
        var canvas = getCanvasLocation(this, e);

        if (sketch) {
            drawing.push({
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

    function init() {

        var color = props.backgroundColor;
        var locked = props.locked;

        if (props.json) {
            drawing = props.json.lines;
            aspectRatio = props.json.aspectRatio;
        }

        if (props.locked) {
            canvas.unbind(startEvent + moveEvent + endEvent);
        } else {
            canvas.css('cursor', 'crosshair');
        }

        var width = canvas.parent().width();
        var height = width / aspectRatio;

        canvas.css('background-color', color);

        setSize(width, height);

        redraw();

    }

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
        ctx.beginPath();
        for (var i = 1; i < drawing.length; i++) {

            if (drawing[i].type == 'mousemove' || drawing[i].type == 'touchmove') {
                ctx.moveTo(drawing[i - 1].x * width, drawing[i - 1].y * height);
            } else {
                ctx.moveTo(drawing[i].x * width, drawing[i].y * height);
            }

            ctx.lineTo(drawing[i].x * width, drawing[i].y * height);
            ctx.strokeStyle = drawing[i].color;
            ctx.lineWidth = lineSize
            ctx.stroke()
        }
        ctx.closePath();
    }

    this.json = function() {
        return JSON.stringify({
            aspectRatio: aspectRatio,
            lines: drawing
        });
    };

    this.img = function() {
        var img = canvas[0].toDataURL("image/png");
        return img;
    };

    this.changeLineColor = function(color) {
        lineColor = color;
    };

    this.changeLineSize = function(size) {
        lineSize = size;
    };

    init();

    return this;
};