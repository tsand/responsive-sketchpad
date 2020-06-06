var Sketchpad = (function () {
    function Sketchpad(el, opts) {
        this.sketching = false;
        this._strokes = [];
        this.undoneStrokes = [];
        this.aspectRatio = 1;
        this.lineWidth = 5;
        this.lineColor = "#000";
        this.lineCap = 'round';
        this.lineJoin = 'round';
        this.lineMiterLimit = 10;
        if (el == null) {
            throw new Error('Must pass in a container element');
        }
        if (opts != null) {
            this.setOptions(opts);
        }
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        var width = (opts === null || opts === void 0 ? void 0 : opts.width) || el.clientWidth;
        var height = (opts === null || opts === void 0 ? void 0 : opts.height) || width * this.aspectRatio;
        this.setCanvasSize(width, height);
        el.appendChild(this.canvas);
        if (this._strokes.length > 0) {
            this.redraw();
        }
        this.listen();
    }
    Object.defineProperty(Sketchpad.prototype, "strokes", {
        get: function () {
            return this._strokes.map(function (s) { return s.toObj(); });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sketchpad.prototype, "undos", {
        get: function () {
            return this.undoneStrokes.map(function (s) { return s.toObj(); });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sketchpad.prototype, "opts", {
        get: function () {
            return {
                backgroundColor: this.backgroundColor,
                width: this.canvas.width,
                height: this.canvas.height,
                aspectRatio: this.canvas.width / this.canvas.height,
                line: {
                    size: this.lineWidth,
                    color: this.lineColor,
                    cap: this.lineCap,
                    join: this.lineJoin,
                    miterLimit: this.lineMiterLimit,
                }
            };
        },
        enumerable: false,
        configurable: true
    });
    Sketchpad.prototype.toJSON = function () {
        return {
            aspectRatio: this.canvas.width / this.canvas.height,
            strokes: this.strokes
        };
    };
    ;
    Sketchpad.prototype.loadJSON = function (data) {
        var strokeObjs = data.strokes || [];
        this._strokes = strokeObjs.map(function (s) { return Stroke.fromObj(s); });
        this.redraw();
    };
    ;
    Sketchpad.prototype.toDataURL = function (type) {
        return this.canvas.toDataURL(type);
    };
    Sketchpad.prototype.setCanvasSize = function (width, height) {
        this.canvas.setAttribute('width', width.toString());
        this.canvas.setAttribute('height', height.toString());
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    };
    Sketchpad.prototype.getCanvasSize = function () {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    };
    Sketchpad.prototype.setLineWidth = function (width) {
        this.lineWidth = width;
    };
    ;
    Sketchpad.prototype.setLineSize = function (size) {
        this.lineWidth = size;
    };
    ;
    Sketchpad.prototype.setLineColor = function (color) {
        this.lineColor = color;
    };
    ;
    Sketchpad.prototype.undo = function () {
        if (this._strokes.length === 0) {
            return;
        }
        this.undoneStrokes.push(this._strokes.pop());
        this.redraw();
    };
    Sketchpad.prototype.redo = function () {
        if (this.undoneStrokes.length === 0) {
            return;
        }
        this._strokes.push(this.undoneStrokes.pop());
        this.redraw();
    };
    Sketchpad.prototype.clear = function () {
        this.undoneStrokes = [];
        this._strokes = [];
        this.redraw();
    };
    Sketchpad.prototype.drawLine = function (start, end, lineOpts) {
        this.setOptions({ line: lineOpts });
        start = this.getPointRelativeToCanvas(new Point(start.x, start.y));
        end = this.getPointRelativeToCanvas(new Point(end.x, end.y));
        this.pushStroke([start, end]);
        this.redraw();
    };
    Sketchpad.prototype.resize = function (width) {
        var height = width * this.aspectRatio;
        this.lineWidth = this.lineWidth * (width / this.canvas.width);
        this.setCanvasSize(width, height);
        this.redraw();
    };
    ;
    Sketchpad.prototype.getPointRelativeToCanvas = function (point) {
        return {
            x: point.x / this.canvas.width,
            y: point.y / this.canvas.height,
        };
    };
    Sketchpad.prototype.getLineSizeRelativeToCanvas = function (width) {
        return width / this.canvas.width;
    };
    Sketchpad.prototype.setOptions = function (opts) {
        var _a, _b, _c, _d, _e, _f;
        if (opts.backgroundColor) {
            this.backgroundColor = opts.backgroundColor;
        }
        if ((_a = opts.line) === null || _a === void 0 ? void 0 : _a.size) {
            this.lineWidth = opts.line.size;
        }
        if ((_b = opts.line) === null || _b === void 0 ? void 0 : _b.cap) {
            this.lineCap = opts.line.cap;
        }
        if ((_c = opts.line) === null || _c === void 0 ? void 0 : _c.join) {
            this.lineJoin = opts.line.join;
        }
        if ((_d = opts.line) === null || _d === void 0 ? void 0 : _d.miterLimit) {
            this.lineMiterLimit = opts.line.miterLimit;
        }
        if (opts.aspectRatio) {
            this.aspectRatio = opts.aspectRatio;
        }
        if (opts.data) {
            this._strokes = (_f = (_e = opts.data.strokes) === null || _e === void 0 ? void 0 : _e.map(function (s) { return Stroke.fromObj(s); })) !== null && _f !== void 0 ? _f : [];
        }
        if (opts.onDrawEnd) {
            this.onDrawEnd = opts.onDrawEnd;
        }
    };
    Sketchpad.prototype.getCursorRelativeToCanvas = function (e) {
        var point;
        if (isTouchEvent(e)) {
            var touchEvent = e;
            point = new Point(touchEvent.touches[0].pageX - this.canvas.offsetLeft, touchEvent.touches[0].pageY - this.canvas.offsetTop);
        }
        else {
            var mouseEvent = e;
            var rect = this.canvas.getBoundingClientRect();
            point = new Point(mouseEvent.clientX - rect.left, mouseEvent.clientY - rect.top);
        }
        return new Point(point.x / this.canvas.width, point.y / this.canvas.height);
    };
    Sketchpad.prototype.normalizePoint = function (p) {
        return new Point(p.x * this.canvas.width, p.y * this.canvas.height);
    };
    Sketchpad.prototype.getLineWidthRelativeToCanvas = function (size) {
        return size / this.canvas.width;
    };
    Sketchpad.prototype.normalizeLineWidth = function (width) {
        return width * this.canvas.width;
    };
    Sketchpad.prototype.clearCanvas = function () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.backgroundColor) {
            this.ctx.fillStyle = this.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    };
    Sketchpad.prototype.drawStroke = function (stroke) {
        if (stroke.points == null)
            return;
        this.ctx.beginPath();
        for (var i = 0; i < stroke.points.length - 1; i++) {
            var start = this.normalizePoint(stroke.points[i]);
            var end = this.normalizePoint(stroke.points[i + 1]);
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
        }
        this.ctx.closePath();
        if (stroke.color) {
            this.ctx.strokeStyle = stroke.color;
        }
        if (stroke.width) {
            this.ctx.lineWidth = this.normalizeLineWidth(stroke.width);
        }
        if (stroke.join) {
            this.ctx.lineJoin = stroke.join;
        }
        if (stroke.cap) {
            this.ctx.lineCap = stroke.cap;
        }
        if (stroke.miterLimit) {
            this.ctx.miterLimit = stroke.miterLimit;
        }
        this.ctx.stroke();
    };
    Sketchpad.prototype.pushStroke = function (points) {
        this._strokes.push(Stroke.fromObj({
            points: points,
            size: this.getLineWidthRelativeToCanvas(this.lineWidth),
            color: this.lineColor,
            cap: this.lineCap,
            join: this.lineJoin,
            miterLimit: this.lineMiterLimit,
        }));
    };
    Sketchpad.prototype.redraw = function () {
        var _this = this;
        this.clearCanvas();
        this._strokes.forEach(function (s) { return _this.drawStroke(s); });
    };
    Sketchpad.prototype.listen = function () {
        var _this = this;
        ['mousedown', 'touchstart'].forEach(function (name) { return _this.canvas.addEventListener(name, function (e) { return _this.startStrokeHandler(e); }); });
        ['mousemove', 'touchmove'].forEach(function (name) { return _this.canvas.addEventListener(name, function (e) { return _this.drawStrokeHandler(e); }); });
        ['mouseup', 'mouseleave', 'touchend'].forEach(function (name) { return _this.canvas.addEventListener(name, function (e) { return _this.endStrokeHandler(e); }); });
    };
    Sketchpad.prototype.startStrokeHandler = function (e) {
        e.preventDefault();
        this.sketching = true;
        var point = this.getCursorRelativeToCanvas(e);
        this.pushStroke([point]);
        this.redraw();
    };
    Sketchpad.prototype.drawStrokeHandler = function (e) {
        var _a;
        e.preventDefault();
        if (!this.sketching)
            return;
        var point = this.getCursorRelativeToCanvas(e);
        (_a = this._strokes[this._strokes.length - 1].points) === null || _a === void 0 ? void 0 : _a.push(point);
        this.redraw();
    };
    Sketchpad.prototype.endStrokeHandler = function (e) {
        var _a;
        e.preventDefault();
        if (!this.sketching)
            return;
        this.sketching = false;
        if (isTouchEvent(e)) {
            return;
        }
        var point = this.getCursorRelativeToCanvas(e);
        (_a = this._strokes[this._strokes.length - 1].points) === null || _a === void 0 ? void 0 : _a.push(point);
        this.redraw();
        if (this.onDrawEnd) {
            this.onDrawEnd();
        }
    };
    return Sketchpad;
}());
function isTouchEvent(e) {
    return e.type.indexOf('touch') !== -1;
}
var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
}());
var Stroke = (function () {
    function Stroke() {
    }
    Stroke.fromObj = function (s) {
        var stroke = new Stroke();
        stroke.points = s.points;
        stroke.width = s.size;
        stroke.color = s.color;
        stroke.cap = s.cap;
        stroke.join = s.join;
        stroke.miterLimit = s.miterLimit;
        return stroke;
    };
    Stroke.prototype.toObj = function () {
        return {
            points: this.points,
            size: this.width,
            color: this.color,
            cap: this.cap,
            join: this.join,
            miterLimit: this.miterLimit,
        };
    };
    return Stroke;
}());
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Sketchpad;
}
else {
    window.Sketchpad = Sketchpad;
}
