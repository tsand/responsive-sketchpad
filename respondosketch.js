$.fn.respondosketch = function(e) {

    var canvas = this;
    var ctx = $(this)[0].getContext('2d');

    var mouse = {x: 0, y: 0};
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
        var newWidth = $(window).width();
        var newHeight = $(window).height();

        var xScale = newWidth/width;
        var yScale = newHeight/height;

        for (var i = 0; i < drawing.length; i++) {
            drawing[i].x *= xScale;
            drawing[i].y *= yScale;
        }

        setSize(newWidth, newHeight);

        redraw();
    });

    canvas.on('mousedown', function(e) {
        sketch = true;

        drawing.push({
            x: mouse.x,
            y: mouse.y,
            type: e.type
        });
    });

    canvas.on('mousemove', function(e) {
        mouse.x = e.pageX - this.offsetLeft;
        mouse.y = e.pageY - this.offsetTop;

        if (sketch) {
            drawing.push({
                x: mouse.x,
                y: mouse.y,
                type: e.type
            });
            redraw();
        }
    });

    canvas.on('mouseup mouseleave', function(e) {
        sketch = false;
    });

    function init() {
        var width = $(window).width();
        var height = $(window).height();

        setSize(width, height);
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

            if (drawing[i].type == 'mousemove') {
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