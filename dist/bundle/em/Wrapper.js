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
var emscripten_library_decorator_1 = require("emscripten-library-decorator");
// Let decorators run eval in current scope to read function source code.
emscripten_library_decorator_1.setEvil(function (code) { return eval(code); });
var _defineHidden = emscripten_library_decorator_1.defineHidden;
var _nbind;
(function (_nbind) {
    /** Base class for wrapped instances of bound C++ classes.
      * Note that some hacks avoid ever constructing this,
      * so initializing values inside its definition won't work. */
    var Wrapper = /** @class */ (function () {
        function Wrapper() {
        }
        Wrapper.prototype.persist = function () { this.__nbindState |= 1 /* isPersistent */; };
        return Wrapper;
    }());
    _nbind.Wrapper = Wrapper;
    function makeBound(policyTbl, bindClass) {
        var Bound = /** @class */ (function (_super) {
            __extends(Bound, _super);
            function Bound(marker, flags, ptr, shared) {
                var _this = _super.call(this) || this;
                if (!(_this instanceof Bound)) {
                    // Constructor called without new operator.
                    // Make correct call with given arguments.
                    // Few ways to do this work. This one should. See:
                    // http://stackoverflow.com/questions/1606797
                    // /use-of-apply-with-new-operator-is-this-possible
                    return (new (Function.prototype.bind.apply(Bound, // arguments.callee
                    Array.prototype.concat.apply([null], arguments)))());
                }
                var nbindFlags = flags;
                var nbindPtr = ptr;
                var nbindShared = shared;
                if (marker !== _nbind.ptrMarker) {
                    var wirePtr = _this.__nbindConstructor.apply(_this, arguments);
                    nbindFlags = 4096 /* isSharedClassPtr */ | 512 /* isSharedPtr */;
                    nbindShared = HEAPU32[wirePtr / 4];
                    nbindPtr = HEAPU32[wirePtr / 4 + 1];
                }
                var spec = {
                    configurable: true,
                    enumerable: false,
                    value: null,
                    writable: false
                };
                var propTbl = {
                    '__nbindFlags': nbindFlags,
                    '__nbindPtr': nbindPtr
                };
                if (nbindShared) {
                    propTbl['__nbindShared'] = nbindShared;
                    _nbind.mark(_this);
                }
                for (var _i = 0, _a = Object.keys(propTbl); _i < _a.length; _i++) {
                    var key = _a[_i];
                    spec.value = propTbl[key];
                    Object.defineProperty(_this, key, spec);
                }
                _defineHidden(0 /* none */)(_this, '__nbindState');
                return _this;
            }
            Bound.prototype.free = function () {
                bindClass.destroy.call(this, this.__nbindShared, this.__nbindFlags);
                this.__nbindState |= 2 /* isDeleted */;
                disableMember(this, '__nbindShared');
                disableMember(this, '__nbindPtr');
            };
            __decorate([
                _defineHidden()
            ], Bound.prototype, "__nbindConstructor", void 0);
            __decorate([
                _defineHidden()
            ], Bound.prototype, "__nbindValueConstructor", void 0);
            __decorate([
                _defineHidden(policyTbl)
            ], Bound.prototype, "__nbindPolicies", void 0);
            return Bound;
        }(Wrapper));
        return (Bound);
    }
    _nbind.makeBound = makeBound;
    function disableMember(obj, name) {
        function die() { throw (new Error('Accessing deleted object')); }
        Object.defineProperty(obj, name, {
            configurable: false,
            enumerable: false,
            get: die,
            set: die
        });
    }
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
