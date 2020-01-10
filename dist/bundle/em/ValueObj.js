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
// This file handles value objects, which are represented by equivalent C++ and
// JavaScript classes, with toJS and fromJS methods calling each others'
// constructors to marshal the class between languages and providing a similar
// API in both.
var emscripten_library_decorator_1 = require("emscripten-library-decorator");
var BindingType_1 = require("./BindingType");
// Let decorators run eval in current scope to read function source code.
emscripten_library_decorator_1.setEvil(function (code) { return eval(code); });
var _defineHidden = emscripten_library_decorator_1.defineHidden;
var _nbind;
(function (_nbind) {
    _nbind.BindType = BindingType_1._nbind.BindType;
})(_nbind = exports._nbind || (exports._nbind = {}));
(function (_nbind) {
    /** Storage for value objects. Slot 0 is reserved to represent errors. */
    _nbind.valueList = [0];
    /** Value object storage slot free list head. */
    var firstFreeValue = 0;
    function pushValue(value) {
        var num = firstFreeValue;
        if (num) {
            firstFreeValue = _nbind.valueList[num];
        }
        else
            num = _nbind.valueList.length;
        _nbind.valueList[num] = value;
        return (num * 2 + 1);
    }
    _nbind.pushValue = pushValue;
    function popValue(num, type) {
        if (!num)
            _nbind.throwError('Value type JavaScript class is missing or not registered');
        if (num & 1) {
            num >>= 1;
            var obj = _nbind.valueList[num];
            _nbind.valueList[num] = firstFreeValue;
            firstFreeValue = num;
            return (obj);
        }
        else if (type) {
            return (_nbind.popShared(num, type));
        }
        else
            throw (new Error('Invalid value slot ' + num));
    }
    _nbind.popValue = popValue;
    // 2^64, first integer not representable with uint64_t.
    // Start of range used for other flags.
    var valueBase = 18446744073709551616.0;
    function push64(num) {
        if (typeof (num) == 'number')
            return (num);
        return (pushValue(num) * 4096 + valueBase);
    }
    function pop64(num) {
        if (num < valueBase)
            return (num);
        return (popValue((num - valueBase) / 4096));
    }
    // Special type that constructs a new object.
    var CreateValueType = /** @class */ (function (_super) {
        __extends(CreateValueType, _super);
        function CreateValueType() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        CreateValueType.prototype.makeWireWrite = function (expr) {
            return ('(_nbind.pushValue(new ' + expr + '))');
        };
        return CreateValueType;
    }(_nbind.BindType));
    _nbind.CreateValueType = CreateValueType;
    var Int64Type = /** @class */ (function (_super) {
        __extends(Int64Type, _super);
        function Int64Type() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.wireWrite = push64;
            _this.wireRead = pop64;
            return _this;
        }
        return Int64Type;
    }(_nbind.BindType));
    _nbind.Int64Type = Int64Type;
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
    // Initialize a C++ object based on a JavaScript object's contents.
    nbind._nbind_get_value_object = function (num, ptr) {
        var obj = _nbind.popValue(num);
        if (!obj.fromJS) {
            throw (new Error('Object ' + obj + ' has no fromJS function'));
        }
        obj.fromJS(function () {
            obj.__nbindValueConstructor.apply(this, Array.prototype.concat.apply([ptr], arguments));
        });
    };
    nbind._nbind_get_int_64 = function (num, ptr) {
        var obj = _nbind.popValue(num);
        obj.fromJS(function (lo, hi, sign) {
            if (sign) {
                lo = ~lo;
                hi = ~hi;
                if (!++lo)
                    ++hi;
            }
            ptr >>= 2;
            if (_nbind.bigEndian) {
                // Emscripten itself might not work on big endian,
                // but we support it here anyway.
                HEAP32[ptr] = hi;
                HEAP32[ptr + 1] = lo;
            }
            else {
                HEAP32[ptr] = lo;
                HEAP32[ptr + 1] = hi;
            }
        });
    };
    nbind.nbind_value = function (name, proto) {
        if (!_nbind.typeNameTbl[name])
            _nbind.throwError('Unknown value type ' + name);
        Module['NBind'].bind_value(name, proto);
        // Copy value constructor reference from C++ wrapper prototype
        // to equivalent JS prototype.
        _defineHidden(_nbind.typeNameTbl[name].proto.prototype.__nbindValueConstructor)(proto.prototype, '__nbindValueConstructor');
    };
    __decorate([
        emscripten_library_decorator_1.dep('_nbind')
    ], nbind, "_nbind_get_value_object", null);
    __decorate([
        emscripten_library_decorator_1.dep('_nbind')
    ], nbind, "_nbind_get_int_64", null);
    __decorate([
        emscripten_library_decorator_1.dep('_nbind')
    ], nbind, "nbind_value", null);
    nbind = __decorate([
        emscripten_library_decorator_1.exportLibrary
    ], nbind);
    return nbind;
}());
