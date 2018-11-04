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
        var strokes = [];
        var undos = [];

        if (opts.data) {
      	    opts.aspectRatio = opts.data.aspectRatio;
      	    strokes = opts.data.strokes;
      	}

        opts.readOnly = opts.readOnly || false;
        opts.aspectRatio = opts.aspectRatio || 1;
        opts.width = opts.width || el.clientWidth;
        opts.height = opts.height || opts.width * opts.aspectRatio;
        opts.line = mergeObjects({
            color: '#000',
            size: 5,
            cap: 'round',
            join: 'round',
            miterLimit: 10
        }, opts.line);

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
            return {
                x: point.x / canvas.width,
                y: point.y / canvas.height
            };
        }

        /**
         * Returns true if is a touch event, false otherwise
         */
        function isTouchEvent (e) {
            return e.type.indexOf('touch') !== -1;
        }

        /**
         * Get location of the cursor in the canvas
         */
        function getCursorRelativeToCanvas (e) {
            var cur = {};

            if (isTouchEvent(e)) {
                cur.x = e.touches[0].pageX - canvas.offsetLeft;
                cur.y = e.touches[0].pageY - canvas.offsetTop;
            } else {
                var rect = that.canvas.getBoundingClientRect();
                cur.x = e.clientX - rect.left;
                cur.y = e.clientY - rect.top;
            }

            return getPointRelativeToCanvas(cur);
        }

        /**
         * Get the line size relative to the size of the canvas
         * @return {[type]} [description]
         */
        function getLineSizeRelativeToCanvas (size) {
            return size / canvas.width;
        }

        /**
         * Erase everything in the canvase
         */
        function clearCanvas () {
            context.clearRect(0, 0, canvas.width, canvas.height);

            if (opts.backgroundColor) {
                context.fillStyle = opts.backgroundColor;
                context.fillRect(0, 0, canvas.width, canvas.height);
            }
        }

        /**
         * Since points are stored relative to the size of the canvas
         * this takes a point and converts it to actual x, y distances in the canvas
         */
        function normalizePoint (point) {
            return {
                x: point.x * canvas.width,
                y: point.y * canvas.height
            };
        }

        /**
         * Since line sizes are stored relative to the size of the canvas
         * this takes a line size and converts it to a line size
         * appropriate to the size of the canvas
         */
        function normalizeLineSize (size) {
            return size * canvas.width;
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
            if (opts.readOnly) {
                return
            }

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

            e.preventDefault();
            if (opts.readOnly) {
                return
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

            e.preventDefault();

            if (opts.readOnly) {
                return
            }

            sketching = false;

            if (isTouchEvent(e)) {
                return;  // touchend events do not have a cursor position
            }

            var cursor = getCursorRelativeToCanvas(e);
            that.strokes[strokes.length - 1].points.push({
                x: cursor.x,
                y: cursor.y
            });
            that.redraw();
			
            if (that.onDrawEnd) that.onDrawEnd();
        }

        // Event Listeners
        canvas.addEventListener('mousedown', startLine);
        canvas.addEventListener('touchstart', startLine);

        canvas.addEventListener('mousemove', drawLine);
        canvas.addEventListener('touchmove', drawLine);

        canvas.addEventListener('mouseup', endLine);
        canvas.addEventListener('mouseleave', endLine);
        canvas.addEventListener('touchend', endLine);
		
        if (typeof opts.onDrawEnd === 'function') {
            this.onDrawEnd = opts.onDrawEnd;
        }

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

        if (strokes) {
            redraw();
        }
    }

    /**
     * Make sketchpad readonly
     */
    Sketchpad.prototype.setReadOnly = function (value) {
        this.opts.readOnly = value;
    };


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
            aspectRatio: this.canvas.width / this.canvas.height,
            strokes: this.strokes
        };
    };

    /**
     * Load a json object into the sketchpad
     * @return {object} - JSON object to load
     */
    Sketchpad.prototype.loadJSON = function (data) {
        this.strokes = data.strokes;
        this.redraw();
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
            color: lineOpts.color,
            size: this.getLineSizeRelativeToCanvas(lineOpts.size),
            cap: lineOpts.cap,
            join: lineOpts.join,
            miterLimit: lineOpts.miterLimit
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
