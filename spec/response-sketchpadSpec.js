var Sketchpad = require('../responsive-sketchpad');


describe('Sketchpad', function() {

    it('should throw an error if not called with an element', function () {
        expect(function () {
            var pad = new Sketchpad(null);
        }).toThrow(new Error('Must pass in a container element'));
    });

});
