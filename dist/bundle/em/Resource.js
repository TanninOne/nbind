// This file is part of nbind, copyright (C) 2014-2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
// This file handles resource allocation and freeing for invoker functions.
// For example if any type conversion requires space in the C++ stack,
// at the end of the invoker it must be reset as it was before.
var emscripten_library_decorator_1 = require("emscripten-library-decorator");
// Let decorators run eval in current scope to read function source code.
emscripten_library_decorator_1.setEvil(function (code) { return eval(code); });
var _nbind;
(function (_nbind) {
    var Resource = /** @class */ (function () {
        function Resource(open, close) {
            var _this = this;
            this.makeOpen = function () { return Object.keys(_this.openTbl).join(''); };
            this.makeClose = function () { return Object.keys(_this.closeTbl).join(''); };
            this.openTbl = {};
            this.closeTbl = {};
            if (open)
                this.openTbl[open] = true;
            if (close)
                this.closeTbl[close] = true;
        }
        Resource.prototype.add = function (other) {
            for (var _i = 0, _a = Object.keys(other.openTbl); _i < _a.length; _i++) {
                var key = _a[_i];
                this.openTbl[key] = true;
            }
            for (var _b = 0, _c = Object.keys(other.closeTbl); _b < _c.length; _b++) {
                var key = _c[_b];
                this.closeTbl[key] = true;
            }
        };
        Resource.prototype.remove = function (other) {
            for (var _i = 0, _a = Object.keys(other.openTbl); _i < _a.length; _i++) {
                var key = _a[_i];
                delete (this.openTbl[key]);
            }
            for (var _b = 0, _c = Object.keys(other.closeTbl); _b < _c.length; _b++) {
                var key = _c[_b];
                delete (this.closeTbl[key]);
            }
        };
        return Resource;
    }());
    _nbind.Resource = Resource;
    /** Create a single resource with open and close code included
      * once from each type of resource needed by a list of types. */
    function listResources(readList, writeList) {
        var result = new Resource();
        for (var _i = 0, readList_1 = readList; _i < readList_1.length; _i++) {
            var bindType = readList_1[_i];
            for (var _a = 0, _b = bindType.readResources || []; _a < _b.length; _a++) {
                var resource = _b[_a];
                result.add(resource);
            }
        }
        for (var _c = 0, writeList_1 = writeList; _c < writeList_1.length; _c++) {
            var bindType = writeList_1[_c];
            for (var _d = 0, _e = bindType.writeResources || []; _d < _e.length; _d++) {
                var resource = _e[_d];
                result.add(resource);
            }
        }
        return (result);
    }
    _nbind.listResources = listResources;
    _nbind.resources = {
        pool: new Resource('var used=HEAPU32[_nbind.Pool.usedPtr],page=HEAPU32[_nbind.Pool.pagePtr];', '_nbind.Pool.lreset(used,page);')
        /*
                stack: new Resource(
                    'var sp=Runtime.stackSave();',
                    'Runtime.stackRestore(sp);'
                )
        */
    };
    var _ = /** @class */ (function () {
        function _() {
        }
        _ = __decorate([
            emscripten_library_decorator_1.prepareNamespace('_nbind')
        ], _);
        return _;
    }()); // tslint:disable-line:class-name
    _nbind._ = _;
})(_nbind = exports._nbind || (exports._nbind = {}));
