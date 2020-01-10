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
// This file handles type conversion of JavaScript callback functions
// accessible from C++. See also Caller.ts
var emscripten_library_decorator_1 = require("emscripten-library-decorator");
var BindingType_1 = require("./BindingType");
var External_1 = require("./External");
// Let decorators run eval in current scope to read function source code.
emscripten_library_decorator_1.setEvil(function (code) { return eval(code); });
var _nbind;
(function (_nbind) {
    _nbind.BindType = BindingType_1._nbind.BindType;
    _nbind.External = External_1._nbind.External;
})(_nbind = exports._nbind || (exports._nbind = {}));
(function (_nbind) {
    // List of invoker functions for all argument and return value combinations
    // seen so far.
    _nbind.callbackSignatureList = [];
    var CallbackType = /** @class */ (function (_super) {
        __extends(CallbackType, _super);
        function CallbackType() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.wireWrite = function (func) {
                if (typeof (func) != 'function')
                    _nbind.throwError('Type mismatch');
                return (new _nbind.External(func).register());
            };
            return _this;
            // Optional type conversion code
            // makeWireWrite = (expr: string) => '_nbind.registerCallback(' + expr + ')';
        }
        return CallbackType;
    }(_nbind.BindType));
    _nbind.CallbackType = CallbackType;
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
    nbind._nbind_register_callback_signature = function (typeListPtr, typeCount) {
        var typeList = _nbind.readTypeIdList(typeListPtr, typeCount);
        var num = _nbind.callbackSignatureList.length;
        _nbind.callbackSignatureList[num] = _nbind.makeJSCaller(typeList);
        return (num);
    };
    __decorate([
        emscripten_library_decorator_1.dep('_nbind')
    ], nbind, "_nbind_register_callback_signature", null);
    nbind = __decorate([
        emscripten_library_decorator_1.exportLibrary
    ], nbind);
    return nbind;
}());
