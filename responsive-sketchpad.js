
(function () {

    function mergeObjects(obj1, obj2) {
        var obj3 = {};
        var attrname;
        for (attrname in (obj1 || {})) {
            if (obj1.hasOwnProperty(attrname)) {
                obj3[attrname] = obj1[attrname];
            }
        }
        for (attrname in (obj2 || {})) {
            if (obj2.hasOwnProperty(attrname)) {
                obj3[attrname] = obj2[attrname];
            }
        }
        return obj3;
    }


    function Sketchpad(el, opts) {
        var that = this;

        if (!el) {
            throw new Error('Must pass in a container element');
        }

        opts = opts || {};
        opts.aspectRatio = opts.aspectRatio || 1;
        opts.width = opts.width || el.clientWidth;
        opts.height = opts.height || opts.width * opts.aspectRatio;
        opts.data = opts.data || [];
        opts.line = mergeObjects({
            color: '#000',
            size: 5,
            cap: 'round',
            join: 'round',
            miterLimit: 10
        }, opts.line);

        var strokes = opts.data;
        var undos = [];

        // Boolean indicating if currently drawing
        var sketching = false;

        // Create a canvas element
        var canvas = document.createElement('canvas');

        /**
         * Set the size of canvas
         */
        function setCanvasSize (width, height) {
            canvas.setAttribute('width', width);
            canvas.setAttribute('height', height);
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
        }

        /**
         * Get the size of the canvas
         */
        function getCanvasSize () {
            return {
                width: canvas.width,
                height: canvas.height
            };
        }

        setCanvasSize(opts.width, opts.height);
        el.appendChild(canvas);
        var context = canvas.getContext('2d');

        /**
         * Returns a points x,y locations relative to the size of the canvase
         */
        function getPointRelativeToCanvas (point) {
            var canvasSize = getCanvasSize();
            return {
                x: point.x / canvasSize.width,
                y: point.y / canvasSize.height
            };
        }

        /**
         * Get location of the cursor in the canvas
         */
        function getCursorRelativeToCanvas (e) {
            var rect = that.canvas.getBoundingClientRect();
            return getPointRelativeToCanvas({
                x: (e.clientX - rect.left),
                y: (e.clientY - rect.top)
            });
        }

        /**
         * Get the line size relative to the size of the canvas
         * @return {[type]} [description]
         */
        function getLineSizeRelativeToCanvas (size) {
            var canvasSize = getCanvasSize();
            return size / canvasSize.width;
        }

        /**
         * Erase everything in the canvase
         */
        function clearCanvas () {
            var width = that.canvas.width;
            var height = that.canvas.height;
            context.clearRect(0, 0, width, height);
        }

        /**
         * Since points are stored relative to the size of the canvas
         * this takes a point and converts it to actual x, y distances in the canvas
         */
        function normalizePoint (point) {
            return {
                x: point.x * that.canvas.width,
                y: point.y * that.canvas.height
            };
        }

        /**
         * Since line sizes are stored relative to the size of the canvas
         * this takes a line size and converts it to a line size
         * appropriate to the size of the canvas
         */
        function normalizeLineSize (size) {
            return size * that.canvas.width;
        }

        /**
         * Draw a stroke on the canvas
         */
        function drawStroke (stroke) {
            context.beginPath();
            for (var j = 0; j < stroke.points.length - 1; j++) {
                var start = normalizePoint(stroke.points[j]);
                var end = normalizePoint(stroke.points[j + 1]);

                context.moveTo(start.x, start.y);
                context.lineTo(end.x, end.y);
            }
            context.closePath();

            context.strokeStyle = stroke.color;
            context.lineWidth = normalizeLineSize(stroke.size);
            context.lineJoin = stroke.join;
            context.lineCap = stroke.cap;
            context.miterLimit = stroke.miterLimit;

            context.stroke();
        }

        /**
         * Redraw the canvas
         */
        function redraw () {
            clearCanvas();

            for (var i = 0; i < that.strokes.length; i++) {
                drawStroke(that.strokes[i]);
            }
        }

        // On mouse down, create a new stroke with a start location
        function startLine (e) {
            e.preventDefault();

            strokes = that.strokes;
            sketching = true;
            that.undos = [];

            var cursor = getCursorRelativeToCanvas(e);
            strokes.push({
                points: [cursor],
                color: opts.line.color,
                size: getLineSizeRelativeToCanvas(opts.line.size),
                cap: opts.line.cap,
                join: opts.line.join,
                miterLimit: opts.line.miterLimit
            });
        }

        function drawLine (e) {
            if (!sketching) {
                return;
            }

            var cursor = getCursorRelativeToCanvas(e);
            that.strokes[strokes.length - 1].points.push({
                x: cursor.x,
                y: cursor.y
            });

            that.redraw();
        }

        function endLine (e) {
            if (!sketching) {
                return;
            }

            sketching = false;
            var cursor = getCursorRelativeToCanvas(e);
            that.strokes[strokes.length - 1].points.push({
                x: cursor.x,
                y: cursor.y
            });

            that.redraw();
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
        this.opts = opts;

        // Public functions
        this.redraw = redraw;
        this.setCanvasSize = setCanvasSize;
        this.getPointRelativeToCanvas = getPointRelativeToCanvas;
        this.getLineSizeRelativeToCanvas = getLineSizeRelativeToCanvas;
    }


    /**
     * Undo the last action
     */
    Sketchpad.prototype.undo = function () {
        if (this.strokes.length === 0){
            return;
        }

        this.undos.push(this.strokes.pop());
        this.redraw();
    };


    /**
     * Redo the last undo action
     */
    Sketchpad.prototype.redo = function () {
        if (this.undos.length === 0) {
            return;
        }

        this.strokes.push(this.undos.pop());
        this.redraw();
    };


    /**
     * Clear the sketchpad
     */
    Sketchpad.prototype.clear = function () {
        this.undos = [];  // TODO: Add clear action to undo
        this.strokes = [];
        this.redraw();
    };


    /**
     * Convert the sketchpad to a JSON object that can be loaded into
     * other sketchpads or stored on a server
     */
    Sketchpad.prototype.toJSON = function () {
        return {
            aspectRatio: 0,
            strokes: this.strokes
        };
    };


    /**
     * Get a static image element of the canvas
     */
    Sketchpad.prototype.getImage = function () {
        return '<img src="' + this.canvas.toDataURL('image/png') + '"/>';
    };


    /**
     * Set the line size
     * @param {number} size - Size of the brush
     */
    Sketchpad.prototype.setLineSize = function (size) {
        this.opts.line.size = size;
    };


    /**
     * Set the line color
     * @param {string} color - Hexadecimal color code
     */
    Sketchpad.prototype.setLineColor = function (color) {
        this.opts.line.color = color;
    };


    /**
     * Draw a line
     * @param  {object} start    - Starting x and y locations
     * @param  {object} end      - Ending x and y locations
     * @param  {object} lineOpts - Options for line (color, size, etc.)
     */
    Sketchpad.prototype.drawLine = function (start, end, lineOpts) {
        lineOpts = mergeObjects(this.opts.line, lineOpts);
        start = this.getPointRelativeToCanvas(start);
        end = this.getPointRelativeToCanvas(end);

        this.strokes.push({
            points: [start, end],
            lineColor: lineOpts.color,
            lineSize: this.getLineSizeRelativeToCanvas(lineOpts.size),
            lineCap: lineOpts.cap,
            lineJoin: lineOpts.join,
            lineMiterLimit: lineOpts.miterLimit
        });
        this.redraw();
    };


    /**
     * Resize the canvas maintaining original aspect ratio
     * @param  {number} width - New width of the canvas
     */
    Sketchpad.prototype.resize = function (width) {
        var height = width * this.opts.aspectRatio;
        this.opts.lineSize = this.opts.lineSize * (width / this.opts.width);
        this.opts.width = width;
        this.opts.height = height;

        this.setCanvasSize(width, height);
        this.redraw();
    };


    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = Sketchpad;
    } else {
        window.Sketchpad = Sketchpad;
    }
})();
