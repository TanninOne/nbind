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
var BindingType_1 = require("./BindingType");
var Wrapper_1 = require("./Wrapper");
// Let decorators run eval in current scope to read function source code.
emscripten_library_decorator_1.setEvil(function (code) { return eval(code); });
var _nbind;
(function (_nbind) {
    _nbind.BindType = BindingType_1._nbind.BindType;
    _nbind.Wrapper = Wrapper_1._nbind.Wrapper;
})(_nbind = exports._nbind || (exports._nbind = {}));
(function (_nbind) {
    _nbind.ptrMarker = {};
    // Base class for all bound C++ classes (not their instances),
    // also inheriting from a generic type definition.
    var BindClass = /** @class */ (function (_super) {
        __extends(BindClass, _super);
        function BindClass(spec) {
            var _this = _super.call(this, spec) || this;
            _this.wireRead = function (arg) { return _nbind.popValue(arg, _this.ptrType); };
            _this.wireWrite = function (arg) { return pushPointer(arg, _this.ptrType, true); };
            /** Number of super classes left to initialize. */
            _this.pendingSuperCount = 0;
            _this.ready = false;
            _this.methodTbl = {};
            if (spec.paramList) {
                _this.classType = spec.paramList[0].classType;
                _this.proto = _this.classType.proto;
            }
            else
                _this.classType = _this;
            return _this;
        }
        BindClass.prototype.makeBound = function (policyTbl) {
            var Bound = _nbind.makeBound(policyTbl, this);
            this.proto = Bound;
            this.ptrType.proto = Bound;
            return (Bound);
        };
        BindClass.prototype.addMethod = function (spec) {
            var overloadList = this.methodTbl[spec.name] || [];
            overloadList.push(spec);
            this.methodTbl[spec.name] = overloadList;
        };
        BindClass.prototype.registerMethods = function (src, staticOnly) {
            var setter;
            for (var _i = 0, _a = Object.keys(src.methodTbl); _i < _a.length; _i++) {
                var name = _a[_i];
                var overloadList = src.methodTbl[name];
                for (var _b = 0, overloadList_1 = overloadList; _b < overloadList_1.length; _b++) {
                    var spec = overloadList_1[_b];
                    var target = void 0;
                    var caller = void 0;
                    target = this.proto.prototype;
                    if (staticOnly && spec.signatureType != 1 /* func */)
                        continue;
                    switch (spec.signatureType) {
                        case 1 /* func */:
                            target = this.proto;
                        // tslint:disable-next-line:no-switch-case-fall-through
                        case 5 /* construct */:
                            caller = _nbind.makeCaller(spec);
                            _nbind.addMethod(target, spec.name, caller, spec.typeList.length - 1);
                            break;
                        case 4 /* setter */:
                            setter = _nbind.makeMethodCaller(src.ptrType, spec);
                            break;
                        case 3 /* getter */:
                            Object.defineProperty(target, spec.name, {
                                configurable: true,
                                enumerable: false,
                                get: _nbind.makeMethodCaller(src.ptrType, spec),
                                set: setter
                            });
                            break;
                        case 2 /* method */:
                            caller = _nbind.makeMethodCaller(src.ptrType, spec);
                            _nbind.addMethod(target, spec.name, caller, spec.typeList.length - 1);
                            break;
                        default:
                            break;
                    }
                }
            }
        };
        BindClass.prototype.registerSuperMethods = function (src, firstSuper, visitTbl) {
            if (visitTbl[src.name])
                return;
            visitTbl[src.name] = true;
            var superNum = 0;
            var nextFirst;
            for (var _i = 0, _a = src.superIdList || []; _i < _a.length; _i++) {
                var superId = _a[_i];
                var superClass = _nbind.getType(superId);
                if (superNum++ < firstSuper || firstSuper < 0) {
                    nextFirst = -1;
                }
                else {
                    nextFirst = 0;
                }
                this.registerSuperMethods(superClass, nextFirst, visitTbl);
            }
            this.registerMethods(src, firstSuper < 0);
        };
        BindClass.prototype.finish = function () {
            if (this.ready)
                return (this);
            this.ready = true;
            this.superList = (this.superIdList || []).map(function (superId) { return _nbind.getType(superId).finish(); });
            var Bound = this.proto;
            if (this.superList.length) {
                var Proto = function () {
                    this.constructor = Bound;
                };
                Proto.prototype = this.superList[0].proto.prototype;
                Bound.prototype = new Proto();
            }
            if (Bound != Module)
                Bound.prototype.__nbindType = this;
            this.registerSuperMethods(this, 1, {});
            return (this);
        };
        BindClass.prototype.upcastStep = function (dst, ptr) {
            if (dst == this)
                return (ptr);
            for (var i = 0; i < this.superList.length; ++i) {
                var superPtr = this.superList[i].upcastStep(dst, _nbind.callUpcast(this.upcastList[i], ptr));
                if (superPtr)
                    return (superPtr);
            }
            return (0);
        };
        BindClass.list = [];
        return BindClass;
    }(_nbind.BindType));
    _nbind.BindClass = BindClass;
    function popPointer(ptr, type) {
        return (ptr ? new type.proto(_nbind.ptrMarker, type.flags, ptr) : null);
    }
    _nbind.popPointer = popPointer;
    function pushPointer(obj, type, tryValue) {
        if (!(obj instanceof _nbind.Wrapper)) {
            if (tryValue) {
                return (_nbind.pushValue(obj));
            }
            else
                throw (new Error('Type mismatch'));
        }
        var ptr = obj.__nbindPtr;
        var objType = (obj.__nbindType).classType;
        var classType = type.classType;
        if (obj instanceof type.proto) {
            // Fast path, requested type is in object's prototype chain.
            while (objType != classType) {
                ptr = _nbind.callUpcast(objType.upcastList[0], ptr);
                objType = objType.superList[0];
            }
        }
        else {
            ptr = objType.upcastStep(classType, ptr);
            if (!ptr)
                throw (new Error('Type mismatch'));
        }
        return (ptr);
    }
    _nbind.pushPointer = pushPointer;
    function pushMutablePointer(obj, type) {
        var ptr = pushPointer(obj, type);
        if (obj.__nbindFlags & 1 /* isConst */) {
            throw (new Error('Passing a const value as a non-const argument'));
        }
        return (ptr);
    }
    var BindClassPtr = /** @class */ (function (_super) {
        __extends(BindClassPtr, _super);
        function BindClassPtr(spec) {
            var _this = _super.call(this, spec) || this;
            _this.classType = spec.paramList[0].classType;
            _this.proto = _this.classType.proto;
            var isConst = spec.flags & 1 /* isConst */;
            var isValue = ((_this.flags & 896 /* refMask */) == 256 /* isReference */ &&
                (spec.flags & 2 /* isValueObject */));
            var push = isConst ? pushPointer : pushMutablePointer;
            var pop = isValue ? _nbind.popValue : popPointer;
            _this.makeWireWrite = function (expr, policyTbl) { return (policyTbl['Nullable'] ?
                // Handle null pointers.
                function (arg) { return (arg ? push(arg, _this) : 0); } :
                function (arg) { return push(arg, _this); }); };
            _this.wireRead = function (arg) { return pop(arg, _this); };
            _this.wireWrite = function (arg) { return push(arg, _this); };
            return _this;
        }
        return BindClassPtr;
    }(_nbind.BindType));
    _nbind.BindClassPtr = BindClassPtr;
    function popShared(ptr, type) {
        var shared = HEAPU32[ptr / 4];
        var unsafe = HEAPU32[ptr / 4 + 1];
        return (unsafe ? new type.proto(_nbind.ptrMarker, type.flags, unsafe, shared) : null);
    }
    _nbind.popShared = popShared;
    function pushShared(obj, type) {
        if (!(obj instanceof type.proto))
            throw (new Error('Type mismatch'));
        return (obj.__nbindShared);
    }
    function pushMutableShared(obj, type) {
        if (!(obj instanceof type.proto))
            throw (new Error('Type mismatch'));
        if (obj.__nbindFlags & 1 /* isConst */) {
            throw (new Error('Passing a const value as a non-const argument'));
        }
        return (obj.__nbindShared);
    }
    var SharedClassPtr = /** @class */ (function (_super) {
        __extends(SharedClassPtr, _super);
        function SharedClassPtr(spec) {
            var _this = _super.call(this, spec) || this;
            _this.readResources = [_nbind.resources.pool];
            _this.classType = spec.paramList[0].classType;
            _this.proto = _this.classType.proto;
            var isConst = spec.flags & 1 /* isConst */;
            var push = isConst ? pushShared : pushMutableShared;
            _this.wireRead = function (arg) { return popShared(arg, _this); };
            _this.wireWrite = function (arg) { return push(arg, _this); };
            return _this;
        }
        return SharedClassPtr;
    }(_nbind.BindType));
    _nbind.SharedClassPtr = SharedClassPtr;
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
