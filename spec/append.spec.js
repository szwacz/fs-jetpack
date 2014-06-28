"use strict";

describe('append |', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');
    
    var path = 'file.txt';
    
    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    // TODO append should also allow to specify file mode
    
    it('appends String to file', function (done) {
        
        var preparations = function () {
            fse.writeFileSync(path, 'abc');
        };
        
        var expectations = function () {
            expect(fse.readFileSync(path, 'utf8')).toBe('abcxyz');
        };
        
        // SYNC
        preparations();
        jetpack.append(path, 'xyz');
        expectations();
        
        // ASYNC
        preparations();
        jetpack.appendAsync(path, 'xyz')
        .then(function () {
            expectations();
            done();
        });
    });
    
    it('appends Buffer to file', function (done) {
        
        var preparations = function () {
            fse.writeFileSync(path, new Buffer([11]));
        };
        
        var expectations = function () {
            var buf = fse.readFileSync(path);
            expect(buf.length).toBe(2);
            expect(buf[0]).toBe(11);
            expect(buf[1]).toBe(22);
        };
        
        // SYNC
        preparations();
        jetpack.append(path, new Buffer([22]));
        expectations();
        
        // ASYNC
        preparations();
        jetpack.appendAsync(path, new Buffer([22]))
        .then(function () {
            expectations();
            done();
        });
    });
    
    it("if file doesn't exist creates it", function (done) {
        
        var expectations = function () {
            expect(fse.readFileSync(path, 'utf8')).toBe('xyz');
        };
        
        // SYNC
        jetpack.append(path, 'xyz');
        expectations();
        
        fse.unlinkSync(path);
        
        // ASYNC
        jetpack.appendAsync(path, 'xyz')
        .then(function () {
            expectations();
            done();
        });
    });
    
    it("if parent directory doesn't exist creates it as well", function (done) {
        
        var path = 'dir/dir/file.txt';
        
        var expectations = function () {
            expect(fse.readFileSync(path, 'utf8')).toBe('xyz');
        };
        
        // SYNC
        jetpack.append(path, 'xyz');
        expectations();
        
        fse.removeSync('dir');
        
        // ASYNC
        jetpack.appendAsync(path, 'xyz')
        .then(function () {
            expectations();
            done();
        });
    });
    
});
