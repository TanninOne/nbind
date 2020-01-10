// This file is part of nbind, copyright (C) 2014-2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
// This file allows C++ to hold references to arbitrary JavaScript objects.
// Each object is stored in a JavaScript array, and C++ receives its index.
// C++ can then call JavaScript methods and refer to the object by index.
var emscripten_library_decorator_1 = require("emscripten-library-decorator");
var BindingType_1 = require("./BindingType");
// Let decorators run eval in current scope to read function source code.
emscripten_library_decorator_1.setEvil(function (code) { return eval(code); });
var _nbind;
(function (_nbind) {
    _nbind.BindType = BindingType_1._nbind.BindType;
})(_nbind = exports._nbind || (exports._nbind = {}));
(function (_nbind) {
    // External JavaScript types are stored in a list,
    // so C++ code can find them by number.
    // A reference count allows storing them in C++ without leaking memory.
    // The first element is a dummy value just so that a valid index to
    // the list always tests as true (useful for the free list implementation).
    _nbind.externalList = [0];
    // Head of free list for recycling available slots in the externals list.
    var firstFreeExternal = 0;
    var External = /** @class */ (function () {
        function External(data) {
            this.refCount = 1;
            this.data = data;
        }
        // Store this external in a JavaScript array and return its index
        // creating a reference that can be passed to C++.
        External.prototype.register = function () {
            var num = firstFreeExternal;
            if (num) {
                firstFreeExternal = _nbind.externalList[num];
            }
            else
                num = _nbind.externalList.length;
            _nbind.externalList[num] = this;
            return (num);
        };
        External.prototype.reference = function () { ++this.refCount; };
        External.prototype.dereference = function (num) {
            if (--this.refCount == 0) {
                if (this.free)
                    this.free();
                _nbind.externalList[num] = firstFreeExternal;
                firstFreeExternal = num;
            }
        };
        return External;
    }());
    _nbind.External = External;
    function popExternal(num) {
        var obj = _nbind.externalList[num];
        obj.dereference(num);
        return (obj.data);
    }
    function pushExternal(obj) {
        var external = new External(obj);
        external.reference();
        return (external.register());
    }
    var ExternalType = /** @class */ (function (_super) {
        __extends(ExternalType, _super);
        function ExternalType() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.wireRead = popExternal;
            _this.wireWrite = pushExternal;
            return _this;
        }
        return ExternalType;
    }(_nbind.BindType));
    _nbind.ExternalType = ExternalType;
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
var nbind = /** @class */ (function () {
    function nbind() {
    }
    nbind._nbind_reference_external = function (num) {
        _nbind.externalList[num].reference();
    };
    nbind._nbind_free_external = function (num) {
        _nbind.externalList[num].dereference(num);
    };
    __decorate([
        emscripten_library_decorator_1.dep('_nbind')
    ], nbind, "_nbind_reference_external", null);
    __decorate([
        emscripten_library_decorator_1.dep('_nbind')
    ], nbind, "_nbind_free_external", null);
    nbind = __decorate([
        emscripten_library_decorator_1.exportLibrary
    ], nbind);
    return nbind;
}());
