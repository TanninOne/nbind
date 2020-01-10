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
// This file handles type conversion of C++ standard library types
// to / from JavaScript.
var emscripten_library_decorator_1 = require("emscripten-library-decorator");
var Globals_1 = require("./Globals");
var BindingType_1 = require("./BindingType");
// Let decorators run eval in current scope to read function source code.
emscripten_library_decorator_1.setEvil(function (code) { return eval(code); });
var _nbind;
(function (_nbind) {
    _nbind.Pool = Globals_1._nbind.Pool;
    _nbind.BindType = BindingType_1._nbind.BindType;
})(_nbind = exports._nbind || (exports._nbind = {}));
(function (_nbind) {
    function pushArray(arr, type) {
        if (!arr)
            return (0);
        var length = arr.length;
        if ((type.size || type.size === 0) && length < type.size) {
            throw (new Error('Type mismatch'));
        }
        var ptrSize = type.memberType.ptrSize;
        var result = _nbind.Pool.lalloc(4 + length * ptrSize);
        HEAPU32[result / 4] = length;
        var heap = type.memberType.heap;
        var ptr = (result + 4) / ptrSize;
        var wireWrite = type.memberType.wireWrite;
        var num = 0;
        if (wireWrite) {
            while (num < length) {
                heap[ptr++] = wireWrite(arr[num++]);
            }
        }
        else {
            while (num < length) {
                heap[ptr++] = arr[num++];
            }
        }
        return (result);
    }
    _nbind.pushArray = pushArray;
    function popArray(ptr, type) {
        if (ptr === 0)
            return (null);
        var length = HEAPU32[ptr / 4];
        var arr = new Array(length);
        var heap = type.memberType.heap;
        ptr = (ptr + 4) / type.memberType.ptrSize;
        var wireRead = type.memberType.wireRead;
        var num = 0;
        if (wireRead) {
            while (num < length) {
                arr[num++] = wireRead(heap[ptr++]);
            }
        }
        else {
            while (num < length) {
                arr[num++] = heap[ptr++];
            }
        }
        return (arr);
    }
    _nbind.popArray = popArray;
    var ArrayType = /** @class */ (function (_super) {
        __extends(ArrayType, _super);
        function ArrayType(spec) {
            var _this = _super.call(this, spec) || this;
            _this.wireRead = function (arg) { return popArray(arg, _this); };
            _this.wireWrite = function (arg) { return pushArray(arg, _this); };
            // Optional type conversion code
            /*
            makeWireRead = (expr: string, convertParamList: any[], num: number) => {
                convertParamList[num] = this;
                return('_nbind.popArray(' + expr + ',convertParamList[' + num + '])');
            };
            makeWireWrite = (expr: string, convertParamList: any[], num: number) => {
                convertParamList[num] = this;
                return('_nbind.pushArray(' + expr + ',convertParamList[' + num + '])');
            };
            */
            _this.readResources = [_nbind.resources.pool];
            _this.writeResources = [_nbind.resources.pool];
            _this.memberType = spec.paramList[0];
            if (spec.paramList[1])
                _this.size = spec.paramList[1];
            return _this;
        }
        return ArrayType;
    }(_nbind.BindType));
    _nbind.ArrayType = ArrayType;
    function pushString(str, policyTbl) {
        if (str === null || str === undefined) {
            if (policyTbl && policyTbl['Nullable']) {
                str = '';
            }
            else
                throw (new Error('Type mismatch'));
        }
        if (policyTbl && policyTbl['Strict']) {
            if (typeof (str) != 'string')
                throw (new Error('Type mismatch'));
        }
        else
            str = str.toString();
        var length = Module.lengthBytesUTF8(str);
        // 32-bit length, string and a zero terminator
        // (stringToUTF8Array insists on adding it)
        var result = _nbind.Pool.lalloc(4 + length + 1);
        HEAPU32[result / 4] = length;
        Module.stringToUTF8Array(str, HEAPU8, result + 4, length + 1);
        return (result);
    }
    _nbind.pushString = pushString;
    function popString(ptr) {
        if (ptr === 0)
            return (null);
        var length = HEAPU32[ptr / 4];
        return (Module.Pointer_stringify(ptr + 4, length));
    }
    _nbind.popString = popString;
    var StringType = /** @class */ (function (_super) {
        __extends(StringType, _super);
        function StringType() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.wireRead = popString;
            _this.wireWrite = pushString;
            _this.readResources = [_nbind.resources.pool];
            _this.writeResources = [_nbind.resources.pool];
            return _this;
        }
        StringType.prototype.makeWireWrite = function (expr, policyTbl) {
            return (function (arg) { return pushString(arg, policyTbl); });
        };
        return StringType;
    }(_nbind.BindType));
    _nbind.StringType = StringType;
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
