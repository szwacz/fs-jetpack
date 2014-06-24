"use strict";

describe('jetpack', function () {
    
    var jetpack = require('..');
    
    it('exposes methods of internal/inspector', function () {
        expect(jetpack.inspect).toBeDefined();
        expect(jetpack.inspectAsync).toBeDefined();
        expect(jetpack.list).toBeDefined();
        expect(jetpack.listAsync).toBeDefined();
        expect(jetpack.tree).toBeDefined();
        expect(jetpack.treeAsync).toBeDefined();
    });
    
});
