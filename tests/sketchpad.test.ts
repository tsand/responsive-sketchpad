import Sketchpad from '../src/sketchpad';

import jsdom = require('jsdom-global');
jsdom();

describe('Sketchpad', function () {
  it('should add a stroke when a line is drawn', function () {
    const pad = new Sketchpad(document.createElement('div'));
    expect(pad.strokes.length).toEqual(0);
    pad.drawLine({ x: 10, y: 10 }, { x: 20, y: 20 }, { size: 5 });
    expect(pad.strokes.length).toEqual(1);
  });

  it('should add a stroke with mouse events', function () {
    const pad = new Sketchpad(document.createElement('div'));
    drawStrokeWithMouse(pad.canvas);
    expect(pad.strokes.length).toEqual(1);
  });

  it('should not add a stroke if readOnly == true', function () {
    const pad = new Sketchpad(document.createElement('div'));
    pad.setReadOnly(true);
    drawStrokeWithMouse(pad.canvas);
    expect(pad.strokes.length).toEqual(0);
  });
});

function drawStrokeWithMouse(canvas: HTMLCanvasElement): void {
  // Actual points don't matter since responsive width isn't currently possible with jsdom
  const mousedownEvent = new Event('mousedown');
  Object.assign(mousedownEvent, { clientX: 10, clientY: 10 });
  canvas.dispatchEvent(mousedownEvent);

  const mouseupEvent = new Event('mouseup');
  Object.assign(mouseupEvent, { clientX: 20, clientY: 20 });
  canvas.dispatchEvent(mouseupEvent);
}
