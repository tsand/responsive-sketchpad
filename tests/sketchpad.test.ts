var Pad = require('../src/sketchpad')

describe('Sketchpad', function() {
    it('should throw an error if not called with an element', function () {
        expect(() => new Pad(null)).toThrow(new Error('Must pass in a container element'));
    });
});
