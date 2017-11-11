"use strict";

const fse = require("fs-extra");
const pathUtil = require("path");
const expect = require("chai").expect;
const helper = require("../helper");
const walker = require("../../lib/utils/tree_walker");

describe("tree walker", () => {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("inspects all files and folders recursively and returns them one by one", () => {
    const preparations = () => {
      fse.outputFileSync("a/a.txt", "a");
      fse.outputFileSync("a/b/z1.txt", "z1");
      fse.outputFileSync("a/b/z2.txt", "z2");
      fse.mkdirsSync("a/b/c");
    };

    const expectations = data => {
      expect(data).to.eql([
        {
          path: pathUtil.resolve("a"),
          item: {
            type: "dir",
            name: "a"
          }
        },
        {
          path: pathUtil.resolve("a", "a.txt"),
          item: {
            type: "file",
            name: "a.txt",
            size: 1
          }
        },
        {
          path: pathUtil.resolve("a", "b"),
          item: {
            type: "dir",
            name: "b"
          }
        },
        {
          path: pathUtil.resolve("a", "b", "c"),
          item: {
            type: "dir",
            name: "c"
          }
        },
        {
          path: pathUtil.resolve("a", "b", "z1.txt"),
          item: {
            type: "file",
            name: "z1.txt",
            size: 2
          }
        },
        {
          path: pathUtil.resolve("a", "b", "z2.txt"),
          item: {
            type: "file",
            name: "z2.txt",
            size: 2
          }
        }
      ]);
    };

    it("sync", () => {
      const absoluteStartingPath = pathUtil.resolve("a");
      const data = [];
      preparations();
      walker.sync(absoluteStartingPath, {}, (path, item) => {
        data.push({ path, item });
      });
      expectations(data);
    });

    it("async", done => {
      const absoluteStartingPath = pathUtil.resolve("a");
      const data = [];
      preparations();
      const st = walker
        .stream(absoluteStartingPath, {})
        .on("readable", () => {
          const a = st.read();
          if (a) {
            data.push(a);
          }
        })
        .on("error", done)
        .on("end", () => {
          expectations(data);
          done();
        });
    });
  });

  describe("can walk through many nested directories", () => {
    const preparations = () => {
      fse.outputFileSync("a/b/x/z1.txt", "z1");
      fse.outputFileSync("a/c/y/z2.txt", "z2");
    };

    const expectations = data => {
      expect(data).to.eql([
        {
          path: pathUtil.resolve("a"),
          item: {
            type: "dir",
            name: "a"
          }
        },
        {
          path: pathUtil.resolve("a", "b"),
          item: {
            type: "dir",
            name: "b"
          }
        },
        {
          path: pathUtil.resolve("a", "b", "x"),
          item: {
            type: "dir",
            name: "x"
          }
        },
        {
          path: pathUtil.resolve("a", "b", "x", "z1.txt"),
          item: {
            type: "file",
            name: "z1.txt",
            size: 2
          }
        },
        {
          path: pathUtil.resolve("a", "c"),
          item: {
            type: "dir",
            name: "c"
          }
        },
        {
          path: pathUtil.resolve("a", "c", "y"),
          item: {
            type: "dir",
            name: "y"
          }
        },
        {
          path: pathUtil.resolve("a", "c", "y", "z2.txt"),
          item: {
            type: "file",
            name: "z2.txt",
            size: 2
          }
        }
      ]);
    };

    it("sync", () => {
      const absoluteStartingPath = pathUtil.resolve("a");
      const data = [];
      preparations();
      walker.sync(absoluteStartingPath, {}, (path, item) => {
        data.push({ path, item });
      });
      expectations(data);
    });

    it("async", done => {
      const absoluteStartingPath = pathUtil.resolve("a");
      const data = [];
      preparations();
      const st = walker
        .stream(absoluteStartingPath, {})
        .on("readable", () => {
          const a = st.read();
          if (a) {
            data.push(a);
          }
        })
        .on("error", done)
        .on("end", () => {
          expectations(data);
          done();
        });
    });
  });

  describe("won't penetrate folder tree deeper than maxLevelsDeep option tells", () => {
    const options = {
      maxLevelsDeep: 1
    };

    const preparations = () => {
      fse.outputFileSync("a/a.txt", "a");
      fse.outputFileSync("a/b/z1.txt", "z1");
    };

    const expectations = data => {
      expect(data).to.eql([
        {
          path: pathUtil.resolve("a"),
          item: {
            type: "dir",
            name: "a"
          }
        },
        {
          path: pathUtil.resolve("a", "a.txt"),
          item: {
            type: "file",
            name: "a.txt",
            size: 1
          }
        },
        {
          path: pathUtil.resolve("a", "b"),
          item: {
            type: "dir",
            name: "b"
          }
        }
      ]);
    };

    it("sync", () => {
      const absoluteStartingPath = pathUtil.resolve("a");
      const data = [];
      preparations();
      walker.sync(absoluteStartingPath, options, (path, item) => {
        data.push({ path, item });
      });
      expectations(data);
    });

    it("async", done => {
      const absoluteStartingPath = pathUtil.resolve("a");
      const data = [];
      preparations();
      const st = walker
        .stream(absoluteStartingPath, options)
        .on("readable", () => {
          const a = st.read();
          if (a) {
            data.push(a);
          }
        })
        .on("error", done)
        .on("end", () => {
          expectations(data);
          done();
        });
    });
  });

  describe("will do fine with empty directory as entry point", () => {
    const preparations = () => {
      fse.mkdirsSync("abc");
    };

    const expectations = data => {
      expect(data).to.eql([
        {
          path: pathUtil.resolve("abc"),
          item: {
            type: "dir",
            name: "abc"
          }
        }
      ]);
    };

    it("sync", () => {
      const absoluteStartingPath = pathUtil.resolve("abc");
      const data = [];
      preparations();
      walker.sync(absoluteStartingPath, {}, (path, item) => {
        data.push({ path, item });
      });
      expectations(data);
    });

    it("async", done => {
      const absoluteStartingPath = pathUtil.resolve("abc");
      const data = [];
      preparations();
      const st = walker
        .stream(absoluteStartingPath, {})
        .on("readable", () => {
          const a = st.read();
          if (a) {
            data.push(a);
          }
        })
        .on("error", done)
        .on("end", () => {
          expectations(data);
          done();
        });
    });
  });

  describe("will do fine with file as entry point", () => {
    const preparations = () => {
      fse.outputFileSync("abc.txt", "abc");
    };

    const expectations = data => {
      expect(data).to.eql([
        {
          path: pathUtil.resolve("abc.txt"),
          item: {
            type: "file",
            name: "abc.txt",
            size: 3
          }
        }
      ]);
    };

    it("sync", () => {
      const absoluteStartingPath = pathUtil.resolve("abc.txt");
      const data = [];
      preparations();
      walker.sync(absoluteStartingPath, {}, (path, item) => {
        data.push({ path, item });
      });
      expectations(data);
    });

    it("async", done => {
      const absoluteStartingPath = pathUtil.resolve("abc.txt");
      const data = [];
      preparations();
      const st = walker
        .stream(absoluteStartingPath, {})
        .on("readable", () => {
          const a = st.read();
          if (a) {
            data.push(a);
          }
        })
        .on("error", done)
        .on("end", () => {
          expectations(data);
          done();
        });
    });
  });

  describe("will do fine with nonexistent entry point", () => {
    const expectations = data => {
      expect(data).to.eql([
        {
          path: pathUtil.resolve("abc.txt"),
          item: undefined
        }
      ]);
    };

    it("sync", () => {
      const absoluteStartingPath = pathUtil.resolve("abc.txt");
      const data = [];
      walker.sync(absoluteStartingPath, {}, (path, item) => {
        data.push({ path, item });
      });
      expectations(data);
    });

    it("async", done => {
      const absoluteStartingPath = pathUtil.resolve("abc.txt");
      const data = [];
      const st = walker
        .stream(absoluteStartingPath, {})
        .on("readable", () => {
          const a = st.read();
          if (a) {
            data.push(a);
          }
        })
        .on("error", done)
        .on("end", () => {
          expectations(data);
          done();
        });
    });
  });

  describe("supports inspect options", () => {
    const options = {
      inspectOptions: {
        checksum: "md5"
      }
    };

    const preparations = () => {
      fse.outputFileSync("abc/a.txt", "a");
    };

    const expectations = data => {
      expect(data).to.eql([
        {
          path: pathUtil.resolve("abc"),
          item: {
            type: "dir",
            name: "abc"
          }
        },
        {
          path: pathUtil.resolve("abc", "a.txt"),
          item: {
            type: "file",
            name: "a.txt",
            size: 1,
            md5: "0cc175b9c0f1b6a831c399e269772661"
          }
        }
      ]);
    };

    it("sync", () => {
      const absoluteStartingPath = pathUtil.resolve("abc");
      const data = [];
      preparations();
      walker.sync(absoluteStartingPath, options, (path, item) => {
        data.push({ path, item });
      });
      expectations(data);
    });

    it("async", done => {
      const absoluteStartingPath = pathUtil.resolve("abc");
      const data = [];
      preparations();
      const st = walker
        .stream(absoluteStartingPath, options)
        .on("readable", () => {
          const a = st.read();
          if (a) {
            data.push(a);
          }
        })
        .on("error", done)
        .on("end", () => {
          expectations(data);
          done();
        });
    });
  });
});
