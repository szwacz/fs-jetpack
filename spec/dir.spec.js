"use strict";

describe('dir |', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    describe('ensure dir exists |', function () {

        it("creates dir if it doesn't exist", function (done) {

            var expectations = function (jetpackContext) {
                expect(fse.existsSync('x')).toBe(true);
            };

            // SYNC
            var jetpackContext = jetpack.dir('x');
            expectations(jetpackContext);

            helper.clearWorkingDir();

            //ASYNC
            jetpack.dirAsync('x')
            .then(function (jetpackContext) {
                expectations(jetpackContext);
                done();
            });
        });

        it('does nothing if dir already exists', function (done) {

            var preparations = function () {
                fse.mkdirsSync('x');
            };

            var expectations = function () {
                expect(fse.existsSync('x')).toBe(true);
            };

            // SYNC
            preparations();
            jetpack.dir('x');
            expectations();

            helper.clearWorkingDir();

            //ASYNC
            preparations();
            jetpack.dirAsync('x')
            .then(function () {
                expectations();
                done();
            });
        });

        it('creates nested directories if necessary', function (done) {

            var path = 'a/b/c';

            var expectations = function () {
                expect(fse.existsSync(path)).toBe(true);
            };

            // SYNC
            jetpack.dir(path);
            expectations();

            helper.clearWorkingDir();

            // ASYNC
            jetpack.dirAsync(path)
            .then(function () {
                expectations();
                done();
            });
        });

    });

    describe('ensure dir does not exist |', function () {

        it("dir exists and it shouldn't", function (done) {

            var preparations = function () {
                fse.mkdirsSync('x');
            };

            var expectations = function (jetpackContext) {
                expect(fse.existsSync('x')).toBe(false);
            };

            // SYNC
            preparations();
            var jetpackContext = jetpack.dir('x', { exists: false });
            expectations(jetpackContext);

            helper.clearWorkingDir();

            // ASYNC
            preparations();
            jetpack.dirAsync('x', { exists: false })
            .then(function (jetpackContext) {
                expectations(jetpackContext);
                done();
            });
        });

        it("dir already doesn't exist", function (done) {

            var expectations = function () {
                expect(fse.existsSync('x')).toBe(false);
            };

            // SYNC
            jetpack.dir('x', { exists: false });
            expectations();

            // ASYNC
            jetpack.dirAsync('x', { exists: false })
            .then(function () {
                expectations();
                done();
            });
        });

    });

    describe('ensures dir empty |', function () {

        it('not bothers about emptiness if not specified', function (done) {

            var preparations = function () {
                fse.mkdirsSync('a/b');
            };

            var expectations = function () {
                expect(fse.existsSync('a/b')).toBe(true);
            };

            // SYNC
            preparations();
            jetpack.dir('a');
            expectations();

            helper.clearWorkingDir();

            // ASYNC
            preparations();
            jetpack.dirAsync('a')
            .then(function () {
                expectations();
                done();
            });
        });

        it('makes dir empty', function (done) {

            var preparations = function () {
                fse.mkdirsSync('a/b');
            };

            var expectations = function () {
                expect(fse.existsSync('a/b')).toBe(false);
            };

            // SYNC
            preparations();
            jetpack.dir('a', { empty: true });
            expectations();

            helper.clearWorkingDir();

            // ASYNC
            preparations();
            jetpack.dirAsync('a', { empty: true })
            .then(function () {
                expectations();
                done();
            });
        });

    });

    it('EXISTS=false takes precendence over EMPTY', function (done) {

        var preparations = function () {
            fse.mkdirsSync('a/b');
        };

        var expectations = function () {
            expect(fse.existsSync('a')).toBe(false);
        };

        // SYNC
        preparations();
        jetpack.dir('a', { exists: false, empty: true });
        expectations();

        helper.clearWorkingDir();

        // ASYNC
        preparations();
        jetpack.dirAsync('a', { exists: false, empty: true })
        .then(function () {
            expectations();
            done();
        })
    });

    it('if given path is file, deletes it and places dir instead', function (done) {

        var preparations = function () {
            fse.outputFileSync('a', 'abc');
        };

        var expectations = function () {
            expect(fse.statSync('a').isDirectory()).toBe(true);
        };

        // SYNC
        preparations();
        jetpack.dir('a');
        expectations();

        helper.clearWorkingDir();

        // ASYNC
        preparations();
        jetpack.dirAsync('a')
        .then(function () {
            expectations();
            done();
        });
    });

    describe("returns", function () {

        it("returns jetack instance pointing on this directory if EXISTS=true", function (done) {

            var expectations = function (ret) {
                expect(ret.cwd()).toBe(pathUtil.resolve('a'));
            };

            // SYNC
            var ret = jetpack.dir('a');
            expectations(ret);

            helper.clearWorkingDir();

            // ASYNC
            jetpack.dirAsync('a')
            .then(function (ret) {
                expectations(ret);
                done();
            });
        });

        it("returns undefined if EXISTS=false", function (done) {

            var expectations = function (ret) {
                expect(ret).toBe(undefined);
            };

            // SYNC
            var ret = jetpack.dir('a', { exists: false });
            expectations(ret);

            helper.clearWorkingDir();

            // ASYNC
            jetpack.dirAsync('a', { exists: false })
            .then(function (ret) {
                expectations(ret);
                done();
            });
        });

    });

    if (process.platform === 'win32') {

        describe('windows specyfic |', function () {

            it('specyfying mode have no effect, and throws no error', function (done) {
                // SYNC
                jetpack.dir('x', { mode: '511' });

                helper.clearWorkingDir();

                // ASYNC
                jetpack.dirAsync('x', { mode: '511' })
                .then(function () {
                    done();
                });
            });

        });

    } else {

        describe('*nix specyfic |', function () {

            // tests assume umask is not greater than 022

            it('sets mode to newly created directory', function (done) {

                var expectations = function () {
                    expect(fse.statSync('a').mode.toString(8)).toBe('40511');
                };

                // SYNC
                // mode as string
                jetpack.dir('a', { mode: '511' });
                expectations();
                helper.clearWorkingDir();

                // mode as number
                jetpack.dir('a', { mode: parseInt('511', 8) });
                expectations();
                helper.clearWorkingDir();

                // ASYNC
                // mode as string
                jetpack.dirAsync('a', { mode: '511' })
                .then(function () {
                    expectations();
                    helper.clearWorkingDir();
                    // mode as number
                    return jetpack.dirAsync('a', { mode: parseInt('511', 8) });
                })
                .then(function () {
                    expectations();
                    done();
                });
            });

            it('sets that mode to every created directory', function (done) {

                var expectations = function () {
                    expect(fse.statSync('a').mode.toString(8)).toBe('40711');
                    expect(fse.statSync('a/b').mode.toString(8)).toBe('40711');
                };

                // SYNC
                jetpack.dir('a/b', { mode: '711' });
                expectations();

                helper.clearWorkingDir();

                // ASYNC
                jetpack.dirAsync('a/b', { mode: '711' })
                .then(function () {
                    expectations();
                    done();
                });
            });

            it('changes mode of existing directory to desired', function (done) {

                var preparations = function () {
                    fse.mkdirSync('a', '777');
                };

                var expectations = function () {
                    expect(fse.statSync('a').mode.toString(8)).toBe('40511');
                };

                // SYNC
                preparations();
                jetpack.dir('a', { mode: '511' });
                expectations();

                helper.clearWorkingDir();

                // ASYNC
                preparations();
                jetpack.dirAsync('a', { mode: '511' })
                .then(function () {
                    expectations();
                    done();
                });
            });

            it('leaves mode of directory intact if not specified', function (done) {

                var expectations = function () {
                    expect(fse.statSync('a').mode.toString(8)).toBe('40700');
                };

                fse.mkdirSync('a', '700');

                // SYNC
                jetpack.dir('a');
                expectations();

                // ASYNC
                jetpack.dirAsync('x')
                .then(function () {
                    expectations();
                    done();
                });
            });

        });

    }

});
