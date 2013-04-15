$.fn.respondosketch = function(props) {

    var canvas = this;
    var ctx = $(this)[0].getContext('2d');

    var backgroundColor = props.backgroundColor;
    var aspectRatio = props.aspectRatio;

    var sketch = false;
    var drawing = new Array();

    var width = canvas.width();
    var height = canvas.height();

    /* Drawing on Paint App */
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    $(window).resize(function(e) {
        var newWidth = canvas.parent().width();
        var newHeight = newWidth / aspectRatio;

        var xScale = newWidth/width;
        var yScale = newHeight/height;

        for (var i = 0; i < drawing.length; i++) {
            drawing[i].x *= xScale;
            drawing[i].y *= yScale;
        }

        setSize(newWidth, newHeight);

        redraw();
    });

    var startEvent = 'mousedown touchstart';
    canvas.on(startEvent, function(e) {
        if (e.type == 'touchstart') {
            e.preventDefault();
        }

        sketch = true;

        var mouse = getMouseLocation(this, e);

        drawing.push({
            x: mouse.x,
            y: mouse.y,
            type: e.type
        });

        redraw();
    });

    var moveEvent = 'mousemove touchmove';
    canvas.on(moveEvent, function(e) {
        var mouse = getMouseLocation(this, e);

        if (sketch) {
            drawing.push({
                x: mouse.x,
                y: mouse.y,
                type: e.type
            });
            redraw();
        }
    });

    var endEvent = 'mouseup mouseleave touchend';
    canvas.on(endEvent, function(e) {
        sketch = false;
    });

    function init() {
        var width = canvas.parent().width();
        var height = width / aspectRatio;

        canvas.css('background-color', backgroundColor);

        setSize(width, height);
    }

    function getMouseLocation(element, event) {
        if (event.type.indexOf('touch') !== -1) {
            return {
                x: event.originalEvent.touches[0].pageX - element.offsetLeft,
                y: event.originalEvent.touches[0].pageY - element.offsetTop
            }
        } else {
            return {
                x: event.pageX - element.offsetLeft,
                y: event.pageY - element.offsetTop
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
                ctx.moveTo(drawing[i - 1].x, drawing[i - 1].y);
            } else {
                ctx.moveTo(drawing[i].x, drawing[i].y);
            }


            ctx.lineTo(drawing[i].x, drawing[i].y);
            ctx.stroke()
        }
        ctx.closePath();
    }

    function toJson() {
        return JSON.stringify(drawing);
    }

    init();
};