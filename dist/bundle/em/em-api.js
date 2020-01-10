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
// This file contains JavaScript functions directly exposed to C++ through
// Emscripten library exports.
var emscripten_library_decorator_1 = require("emscripten-library-decorator");
var Globals_1 = require("./Globals");
exports._globals = Globals_1._nbind;
var BindingType_1 = require("./BindingType");
exports._type = BindingType_1._nbind;
var BindClass_1 = require("./BindClass");
exports._class = BindClass_1._nbind;
var External_1 = require("./External");
exports._external = External_1._nbind;
var Callback_1 = require("./Callback");
exports._callback = Callback_1._nbind;
var ValueObj_1 = require("./ValueObj");
exports._value = ValueObj_1._nbind;
var BindingStd_1 = require("./BindingStd");
exports._std = BindingStd_1._nbind;
var Caller_1 = require("./Caller");
exports._caller = Caller_1._nbind;
var Wrapper_1 = require("./Wrapper");
exports._wrapper = Wrapper_1._nbind;
var Resource_1 = require("./Resource");
exports._resource = Resource_1._nbind;
var Buffer_1 = require("./Buffer");
exports._buffer = Buffer_1._nbind;
var GC_1 = require("./GC");
exports._gc = GC_1._nbind;
var common_1 = require("../common");
var Type_1 = require("../Type");
// Let decorators run eval in current scope to read function source code.
emscripten_library_decorator_1.setEvil(function (code) { return eval(code); });
var _removeAccessorPrefix = common_1.removeAccessorPrefix;
var _typeModule = Type_1.typeModule;
var _nbind;
(function (_nbind) {
})(_nbind = exports._nbind || (exports._nbind = {}));
emscripten_library_decorator_1.publishNamespace('_nbind');
// Ensure the __extends function gets defined.
var Dummy = /** @class */ (function (_super) {
    __extends(Dummy, _super);
    function Dummy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Dummy;
}(Boolean));
var nbind = /** @class */ (function () {
    function nbind() {
    }
    nbind._nbind_register_pool = function (pageSize, usedPtr, rootPtr, pagePtr) {
        var _a;
        _nbind.Pool.pageSize = pageSize;
        _nbind.Pool.usedPtr = usedPtr / 4;
        _nbind.Pool.rootPtr = rootPtr;
        _nbind.Pool.pagePtr = pagePtr / 4;
        HEAP32[usedPtr / 4] = 0x01020304;
        if (HEAP8[usedPtr] == 1)
            _nbind.bigEndian = true;
        HEAP32[usedPtr / 4] = 0;
        _nbind.makeTypeKindTbl = (_a = {},
            _a[1024 /* isArithmetic */] = _nbind.PrimitiveType,
            _a[64 /* isBig */] = _nbind.Int64Type,
            _a[2048 /* isClass */] = _nbind.BindClass,
            _a[3072 /* isClassPtr */] = _nbind.BindClassPtr,
            _a[4096 /* isSharedClassPtr */] = _nbind.SharedClassPtr,
            _a[5120 /* isVector */] = _nbind.ArrayType,
            _a[6144 /* isArray */] = _nbind.ArrayType,
            _a[7168 /* isCString */] = _nbind.CStringType,
            _a[9216 /* isCallback */] = _nbind.CallbackType,
            _a[10240 /* isOther */] = _nbind.BindType,
            _a);
        _nbind.makeTypeNameTbl = {
            'Buffer': _nbind.BufferType,
            'External': _nbind.ExternalType,
            'Int64': _nbind.Int64Type,
            '_nbind_new': _nbind.CreateValueType,
            'bool': _nbind.BooleanType,
            // 'cbFunction': _nbind.CallbackType,
            'cbFunction &': _nbind.CallbackType,
            'const cbFunction &': _nbind.CallbackType,
            'const std::string &': _nbind.StringType,
            'std::string': _nbind.StringType
        };
        Module['toggleLightGC'] = _nbind.toggleLightGC;
        _nbind.callUpcast = Module['dynCall_ii'];
        var globalScope = _nbind.makeType(_nbind.constructType, {
            flags: 2048 /* isClass */,
            id: 0,
            name: ''
        });
        globalScope.proto = Module;
        _nbind.BindClass.list.push(globalScope);
    };
    nbind._nbind_register_type = function (id, namePtr) {
        var name = _nbind.readAsciiString(namePtr);
        var spec = {
            flags: 10240 /* isOther */,
            id: id,
            name: name
        };
        _nbind.makeType(_nbind.constructType, spec);
    };
    nbind._nbind_register_primitive = function (id, size, flags) {
        var spec = {
            flags: 1024 /* isArithmetic */ | flags,
            id: id,
            ptrSize: size
        };
        _nbind.makeType(_nbind.constructType, spec);
    };
    nbind._nbind_register_class = function (idListPtr, policyListPtr, superListPtr, upcastListPtr, superCount, destructorPtr, namePtr) {
        var name = _nbind.readAsciiString(namePtr);
        var policyTbl = _nbind.readPolicyList(policyListPtr);
        var idList = HEAPU32.subarray(idListPtr / 4, idListPtr / 4 + 2);
        var spec = {
            flags: 2048 /* isClass */ | (policyTbl['Value'] ? 2 /* isValueObject */ : 0),
            id: idList[0],
            name: name
        };
        var bindClass = _nbind.makeType(_nbind.constructType, spec);
        bindClass.ptrType = _nbind.getComplexType(idList[1], _nbind.constructType, _nbind.getType, _nbind.queryType);
        bindClass.destroy = _nbind.makeMethodCaller(bindClass.ptrType, {
            boundID: spec.id,
            flags: 0 /* none */,
            name: 'destroy',
            num: 0,
            ptr: destructorPtr,
            title: bindClass.name + '.free',
            typeList: ['void', 'uint32_t', 'uint32_t']
        });
        if (superCount) {
            bindClass.superIdList = Array.prototype.slice.call(HEAPU32.subarray(superListPtr / 4, superListPtr / 4 + superCount));
            bindClass.upcastList = Array.prototype.slice.call(HEAPU32.subarray(upcastListPtr / 4, upcastListPtr / 4 + superCount));
        }
        Module[bindClass.name] = bindClass.makeBound(policyTbl);
        _nbind.BindClass.list.push(bindClass);
    };
    nbind._nbind_register_function = function (boundID, policyListPtr, typeListPtr, typeCount, ptr, direct, signatureType, namePtr, num, flags) {
        var bindClass = _nbind.getType(boundID);
        var policyTbl = _nbind.readPolicyList(policyListPtr);
        var typeList = _nbind.readTypeIdList(typeListPtr, typeCount);
        var specList;
        if (signatureType == 5 /* construct */) {
            specList = [{
                    direct: ptr,
                    name: '__nbindConstructor',
                    ptr: 0,
                    title: bindClass.name + ' constructor',
                    typeList: ['uint32_t'].concat(typeList.slice(1))
                }, {
                    direct: direct,
                    name: '__nbindValueConstructor',
                    ptr: 0,
                    title: bindClass.name + ' value constructor',
                    typeList: ['void', 'uint32_t'].concat(typeList.slice(1))
                }];
        }
        else {
            var name = _nbind.readAsciiString(namePtr);
            var title = (bindClass.name && bindClass.name + '.') + name;
            if (signatureType == 3 /* getter */ || signatureType == 4 /* setter */) {
                name = _removeAccessorPrefix(name);
            }
            specList = [{
                    boundID: boundID,
                    direct: direct,
                    name: name,
                    ptr: ptr,
                    title: title,
                    typeList: typeList
                }];
        }
        for (var _i = 0, specList_1 = specList; _i < specList_1.length; _i++) {
            var spec = specList_1[_i];
            spec.signatureType = signatureType;
            spec.policyTbl = policyTbl;
            spec.num = num;
            spec.flags = flags;
            bindClass.addMethod(spec);
        }
    };
    nbind._nbind_finish = function () {
        for (var _i = 0, _a = _nbind.BindClass.list; _i < _a.length; _i++) {
            var bindClass = _a[_i];
            bindClass.finish();
        }
    };
    nbind.nbind_debug = function () { debugger; };
    __decorate([
        emscripten_library_decorator_1.dep('_nbind')
    ], nbind, "_nbind_register_pool", null);
    __decorate([
        emscripten_library_decorator_1.dep('_nbind', '_typeModule')
    ], nbind, "_nbind_register_type", null);
    __decorate([
        emscripten_library_decorator_1.dep('_nbind')
    ], nbind, "_nbind_register_primitive", null);
    __decorate([
        emscripten_library_decorator_1.dep('_nbind', '__extends')
    ], nbind, "_nbind_register_class", null);
    __decorate([
        emscripten_library_decorator_1.dep('_nbind', '_removeAccessorPrefix')
    ], nbind, "_nbind_register_function", null);
    __decorate([
        emscripten_library_decorator_1.dep('_nbind')
    ], nbind, "_nbind_finish", null);
    __decorate([
        emscripten_library_decorator_1.dep('_nbind')
    ], nbind, "nbind_debug", null);
    nbind = __decorate([
        emscripten_library_decorator_1.exportLibrary
    ], nbind);
    return nbind;
}());
