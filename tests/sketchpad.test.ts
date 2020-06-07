import Sketchpad from '../src/sketchpad'

describe('Sketchpad', function() {
    it('should throw an error if not called with an element', function () {
        // @ts-ignore - allow null for test
        expect(() => new Sketchpad(null)).toThrow(new Error('Must pass in a container element'));
    });
});
