// This file is part of nbind, copyright (C) 2014-2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
// This file handles creating invoker functions for Emscripten dyncalls
// wrapped in type conversions for arguments and return values.
var emscripten_library_decorator_1 = require("emscripten-library-decorator");
// Let decorators run eval in current scope to read function source code.
emscripten_library_decorator_1.setEvil(function (code) { return eval(code); });
var _nbind;
(function (_nbind) {
    var dirtyList = [];
    var gcTimer = 0;
    function sweep() {
        for (var _i = 0, dirtyList_1 = dirtyList; _i < dirtyList_1.length; _i++) {
            var obj = dirtyList_1[_i];
            if (!(obj.__nbindState & (1 /* isPersistent */ | 2 /* isDeleted */))) {
                obj.free();
            }
        }
        dirtyList = [];
        gcTimer = 0;
    }
    // tslint:disable-next-line:no-empty
    _nbind.mark = function (obj) { };
    function toggleLightGC(enable) {
        if (enable) {
            _nbind.mark = function (obj) {
                dirtyList.push(obj);
                if (!gcTimer)
                    gcTimer = setTimeout(sweep, 0);
            };
        }
        else {
            // tslint:disable-next-line:no-empty
            _nbind.mark = function (obj) { };
        }
    }
    _nbind.toggleLightGC = toggleLightGC;
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
