export default class Sketchpad {
  readonly canvas: HTMLCanvasElement

  private readonly ctx: CanvasRenderingContext2D
  private sketching = false
  private _strokes: Array<Stroke> = [] // v2.0 - Rename to strokes
  private undoneStrokes: Array<Stroke> = []

  // Options
  private backgroundColor?: string
  private aspectRatio = 1 // v2.0 - Remove; rely on canvas as source-of-truth
  private lineWidth = 5
  private lineColor = '#000'
  private lineCap: CanvasLineCap = 'round'
  private lineJoin: CanvasLineJoin = 'round'
  private lineMiterLimit = 10
  private onDrawEnd?: () => void // v2.0 - Remove

  constructor (
    el: HTMLElement,
    opts?: SketchpadOptionsI
  ) {
    if (el == null) {
      throw new Error('Must pass in a container element')
    }
    if (opts != null) {
      this.setOptions(opts)
    }

    this.canvas = document.createElement('canvas')
    this.canvas.style.touchAction = 'none'
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D

    const width = opts?.width || el.clientWidth
    const height = opts?.height || width * this.aspectRatio
    this.setCanvasSize(width, height)

    el.appendChild(this.canvas)

    if (this._strokes.length > 0) {
      this.redraw()
    }

    this.listen()
  }

  // v2.0 - Remove; rename `_strokes`
  get strokes (): Array<StrokeI> {
    return this._strokes.map((s) => s.toObj())
  }

  // v2.0 - Remove
  get undos (): Array<StrokeI> {
    return this.undoneStrokes.map((s) => s.toObj())
  }

  // v2.0 - Remove
  get opts (): SketchpadOptionsI {
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
        miterLimit: this.lineMiterLimit
      }
    }
  }

  // Convert the sketchpad to a JSON object that can be loaded into
  // other sketchpads or stored on a server
  toJSON (): DataI {
    return {
      aspectRatio: this.canvas.width / this.canvas.height,
      strokes: this.strokes
    }
  }

  // Load a json object into the sketchpad
  loadJSON (data: DataI): void {
    const strokeObjs = data.strokes || []
    this._strokes = strokeObjs.map((s) => Stroke.fromObj(s))
    this.redraw()
  }

  // Converts to image File
  toDataURL (type: string): string {
    return this.canvas.toDataURL(type)
  }

  // Set the size of canvas
  setCanvasSize (width: number, height: number): void {
    this.canvas.setAttribute('width', width.toString())
    this.canvas.setAttribute('height', height.toString())
    this.canvas.style.width = width + 'px'
    this.canvas.style.height = height + 'px'
  }

  // Get the size of the canvas
  getCanvasSize (): RectI {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    }
  }

  // Set the line width
  setLineWidth (width: number): void {
    this.lineWidth = width
  }

  // Set the line width
  setLineSize (size: number): void {
    this.lineWidth = size
  }

  // Set the line color
  setLineColor (color: string): void {
    this.lineColor = color
  }

  // Undo the last stroke
  undo (): void {
    if (this._strokes.length === 0) {
      return
    }

    this.undoneStrokes.push(this._strokes.pop() as Stroke)
    this.redraw()
  }

  // Redo the last undone stroke
  redo (): void {
    if (this.undoneStrokes.length === 0) {
      return
    }

    this._strokes.push(this.undoneStrokes.pop() as Stroke)
    this.redraw()
  }

  // Clear the sketchpad
  clear (): void {
    this.undoneStrokes = []
    this._strokes = []
    this.redraw()
  }

  // Draw a straight line
  drawLine (start: PointI, end: PointI, lineOpts: LineOptionsI): void {
    this.setOptions({ line: lineOpts })
    start = this.getPointRelativeToCanvas(new Point(start.x, start.y))
    end = this.getPointRelativeToCanvas(new Point(end.x, end.y))
    this.pushStroke([start, end])
    this.redraw()
  }

  // Resize the canvas maintaining original aspect ratio
  resize (width: number): void {
    const height = width * this.aspectRatio
    this.lineWidth = this.lineWidth * (width / this.canvas.width)

    this.setCanvasSize(width, height)
    this.redraw()
  }

  // Returns a points x,y locations relative to the size of the canvas
  getPointRelativeToCanvas (point: PointI): PointI {
    return {
      x: point.x / this.canvas.width,
      y: point.y / this.canvas.height
    }
  }

  //  Get the line size relative to the size of the canvas
  getLineSizeRelativeToCanvas (width: number): number {
    return width / this.canvas.width
  }

  private setOptions (opts: SketchpadOptionsI): void {
    if (opts.backgroundColor) {
      this.backgroundColor = opts.backgroundColor
    }
    if (opts.line?.size) {
      this.lineWidth = opts.line.size
    }
    if (opts.line?.cap) {
      this.lineCap = opts.line.cap
    }
    if (opts.line?.join) {
      this.lineJoin = opts.line.join
    }
    if (opts.line?.miterLimit) {
      this.lineMiterLimit = opts.line.miterLimit
    }
    if (opts.aspectRatio) {
      this.aspectRatio = opts.aspectRatio
    }
    if (opts.data) {
      this._strokes = opts.data.strokes?.map((s) => Stroke.fromObj(s)) ?? []
    }
    if (opts.onDrawEnd) {
      this.onDrawEnd = opts.onDrawEnd
    }
  }

  // For a given event, get the point at which the event occurred
  // relative to the canvas
  private getCursorRelativeToCanvas (e: Event): Point {
    const pointerEvent = e as PointerEvent
    const rect = this.canvas.getBoundingClientRect()
    const point: Point = new Point(
      pointerEvent.clientX - rect.left,
      pointerEvent.clientY - rect.top
    )

    return new Point(
      point.x / this.canvas.width,
      point.y / this.canvas.height
    )
  }

  private normalizePoint (p: Point): Point {
    return new Point(
      p.x * this.canvas.width,
      p.y * this.canvas.height
    )
  }

  private getLineWidthRelativeToCanvas (size: number): number {
    return size / this.canvas.width
  }

  private normalizeLineWidth (width: number): number {
    return width * this.canvas.width
  }

  // Erase the entire canvas
  private clearCanvas (): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    if (this.backgroundColor) {
      this.ctx.fillStyle = this.backgroundColor
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
  }

  // Draw a single stroke
  private drawStroke (stroke: Stroke): void {
    if (stroke.points == null) return

    this.ctx.beginPath()

    for (let i = 0; i < stroke.points.length - 1; i++) {
      const start = this.normalizePoint(stroke.points[i])
      const end = this.normalizePoint(stroke.points[i + 1])

      this.ctx.moveTo(start.x, start.y)
      this.ctx.lineTo(end.x, end.y)
    }
    this.ctx.closePath()

    if (stroke.color) {
      this.ctx.strokeStyle = stroke.color
    }
    if (stroke.width) {
      this.ctx.lineWidth = this.normalizeLineWidth(stroke.width)
    }
    if (stroke.join) {
      this.ctx.lineJoin = stroke.join
    }
    if (stroke.cap) {
      this.ctx.lineCap = stroke.cap
    }
    if (stroke.miterLimit) {
      this.ctx.miterLimit = stroke.miterLimit
    }

    this.ctx.stroke()
  }

  private pushStroke (points: Array<Point>): void {
    this._strokes.push(Stroke.fromObj({
      points: points,
      size: this.getLineWidthRelativeToCanvas(this.lineWidth),
      color: this.lineColor,
      cap: this.lineCap,
      join: this.lineJoin,
      miterLimit: this.lineMiterLimit
    }))
  }

  private pushPoint (point: Point): void {
    const stroke = this._strokes[this._strokes.length - 1]
    if (stroke.points) {
      stroke.points.push(point)
    }
  }

  // Redraw the whole canvas
  private redraw (): void {
    this.clearCanvas()
    this._strokes.forEach((s) => this.drawStroke(s))
  }

  private listen (): void {
    this.canvas.addEventListener('pointerdown', (e) => this.startStrokeHandler(e));
    this.canvas.addEventListener('pointermove', (e) => this.drawStrokeHandler(e));
    ['pointerleave', 'pointerup'].forEach((name) => this.canvas.addEventListener(name, (e) => this.endStrokeHandler(e)));
  }

  private startStrokeHandler (e: Event): void {
    e.preventDefault()
    this.sketching = true

    const point = this.getCursorRelativeToCanvas(e)
    this.pushStroke([point])
    this.redraw()
  }

  private drawStrokeHandler (e: Event): void {
    e.preventDefault()
    if (!this.sketching) return

    const point = this.getCursorRelativeToCanvas(e)
    this.pushPoint(point)
    this.redraw()
  }

  private endStrokeHandler (e: Event): void {
    e.preventDefault()
    if (!this.sketching) return
    this.sketching = false

    const point = this.getCursorRelativeToCanvas(e)
    this.pushPoint(point)
    this.redraw()

    if (this.onDrawEnd) {
      this.onDrawEnd()
    }
  }
}

interface PointI {
  readonly x: number
  readonly y: number
}

class Point implements PointI {
  constructor (public x: number, public y: number) {}
}

interface RectI {
  readonly width: number
  readonly height: number
}

interface DataI {
  aspectRatio?: number,
  strokes?: Array<StrokeI>
}

interface LineOptionsI {
  size?: number
  color?: string
  cap?: CanvasLineCap
  join?: CanvasLineJoin
  miterLimit?: number
}

interface SketchpadOptionsI {
  backgroundColor?: string
  width?: number
  height?: number
  aspectRatio?: number
  line?: LineOptionsI
  data?: DataI
  onDrawEnd?: () => void
}

interface StrokeI extends LineOptionsI {
  points?: Array<PointI>
}

class Stroke {
  points?: Array<Point>
  width?: number
  color?: string
  cap?: CanvasLineCap
  join?: CanvasLineJoin
  miterLimit?: number

  static fromObj (s: StrokeI): Stroke {
    const stroke = new Stroke()
    stroke.points = s.points
    stroke.width = s.size
    stroke.color = s.color
    stroke.cap = s.cap
    stroke.join = s.join
    stroke.miterLimit = s.miterLimit
    return stroke
  }

  toObj (): StrokeI {
    return {
      points: this.points,
      size: this.width,
      color: this.color,
      cap: this.cap,
      join: this.join,
      miterLimit: this.miterLimit
    }
  }
}
