"use strict";

describe('jetpack', function () {
    
    var jetpack = require('..');
    
    // TODO those specs are not sufficient test coverage
    
    it('exposes methods of inspector', function () {
        expect(jetpack.inspect).toBeDefined();
        expect(jetpack.inspectAsync).toBeDefined();
        expect(jetpack.list).toBeDefined();
        expect(jetpack.listAsync).toBeDefined();
        expect(jetpack.tree).toBeDefined();
        expect(jetpack.treeAsync).toBeDefined();
    });
    
    it('exposes append methods from internal/fileOperations', function () {
        expect(jetpack.append).toBeDefined();
        expect(jetpack.appendAsync).toBeDefined();
    });
    
});
