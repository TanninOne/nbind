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
// This file contains the type conversion base class and handles conversion of
// C++ primitive types to / from JavaScript. Following emscripten conventions,
// the type passed between the two is called WireType.
// Anything from the standard library is instead in BindingStd.ts
var emscripten_library_decorator_1 = require("emscripten-library-decorator");
var Type_1 = require("../Type");
var _typeModule = Type_1.typeModule;
// Let decorators run eval in current scope to read function source code.
emscripten_library_decorator_1.setEvil(function (code) { return eval(code); });
var _nbind;
(function (_nbind) {
    var _a;
    _a = _typeModule(_typeModule), _nbind.Type = _a.Type, _nbind.makeType = _a.makeType, _nbind.getComplexType = _a.getComplexType, _nbind.structureList = _a.structureList;
    // A type definition, which registers itself upon construction.
    var BindType = /** @class */ (function (_super) {
        __extends(BindType, _super);
        function BindType() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.heap = HEAPU32;
            _this.ptrSize = 4;
            return _this;
        }
        BindType.prototype.needsWireRead = function (policyTbl) {
            return (!!this.wireRead || !!this.makeWireRead);
        };
        BindType.prototype.needsWireWrite = function (policyTbl) {
            return (!!this.wireWrite || !!this.makeWireWrite);
        };
        return BindType;
    }(_nbind.Type));
    _nbind.BindType = BindType;
    var PrimitiveType = /** @class */ (function (_super) {
        __extends(PrimitiveType, _super);
        function PrimitiveType(spec) {
            var _this = _super.call(this, spec) || this;
            var heapTbl = (spec.flags & 32 /* isFloat */ ? {
                32: HEAPF32,
                64: HEAPF64
            } : spec.flags & 8 /* isUnsigned */ ? {
                8: HEAPU8,
                16: HEAPU16,
                32: HEAPU32
            } : {
                8: HEAP8,
                16: HEAP16,
                32: HEAP32
            });
            _this.heap = heapTbl[spec.ptrSize * 8];
            _this.ptrSize = spec.ptrSize;
            return _this;
        }
        PrimitiveType.prototype.needsWireWrite = function (policyTbl) {
            return (!!policyTbl && !!policyTbl['Strict']);
        };
        PrimitiveType.prototype.makeWireWrite = function (expr, policyTbl) {
            return (policyTbl && policyTbl['Strict'] && (function (arg) {
                if (typeof (arg) == 'number')
                    return (arg);
                throw (new Error('Type mismatch'));
            }));
        };
        return PrimitiveType;
    }(BindType));
    _nbind.PrimitiveType = PrimitiveType;
    // Push a string to the C++ stack, zero-terminated and UTF-8 encoded.
    function pushCString(str, policyTbl) {
        if (str === null || str === undefined) {
            if (policyTbl && policyTbl['Nullable']) {
                return (0);
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
        var length = Module.lengthBytesUTF8(str) + 1;
        var result = _nbind.Pool.lalloc(length);
        // Convert the string and append a zero byte.
        Module.stringToUTF8Array(str, HEAPU8, result, length);
        return (result);
    }
    _nbind.pushCString = pushCString;
    // Read a zero-terminated, UTF-8 encoded string from the C++ stack.
    function popCString(ptr) {
        if (ptr === 0)
            return (null);
        return (Module.Pointer_stringify(ptr));
    }
    _nbind.popCString = popCString;
    // Zero-terminated 'const char *' style string, passed through the C++ stack.
    var CStringType = /** @class */ (function (_super) {
        __extends(CStringType, _super);
        function CStringType() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.wireRead = popCString;
            _this.wireWrite = pushCString;
            _this.readResources = [_nbind.resources.pool];
            _this.writeResources = [_nbind.resources.pool];
            return _this;
        }
        CStringType.prototype.makeWireWrite = function (expr, policyTbl) {
            return (function (arg) { return pushCString(arg, policyTbl); });
        };
        return CStringType;
    }(BindType));
    _nbind.CStringType = CStringType;
    // Booleans are returned as numbers from Asm.js.
    // Prefixing with !! converts them to JavaScript booleans.
    var BooleanType = /** @class */ (function (_super) {
        __extends(BooleanType, _super);
        function BooleanType() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.wireRead = function (arg) { return !!arg; };
            return _this;
        }
        BooleanType.prototype.needsWireWrite = function (policyTbl) {
            return (!!policyTbl && !!policyTbl['Strict']);
        };
        BooleanType.prototype.makeWireRead = function (expr) { return ('!!(' + expr + ')'); };
        BooleanType.prototype.makeWireWrite = function (expr, policyTbl) {
            return (policyTbl && policyTbl['Strict'] && (function (arg) {
                if (typeof (arg) == 'boolean')
                    return (arg);
                throw (new Error('Type mismatch'));
            }) || expr);
        };
        return BooleanType;
    }(BindType));
    _nbind.BooleanType = BooleanType;
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
