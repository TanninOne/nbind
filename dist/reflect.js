"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("./common");
var Type_1 = require("./Type");
var _a = Type_1.typeModule(Type_1.typeModule), Type = _a.Type, makeType = _a.makeType, getComplexType = _a.getComplexType;
exports.TypeBase = Type;
var NBindID = /** @class */ (function () {
    function NBindID(id) {
        this.id = id;
    }
    NBindID.prototype.fromJS = function (output) {
        output(this.id);
    };
    NBindID.prototype.toString = function () {
        return ('' + this.id);
    };
    return NBindID;
}());
var BindType = /** @class */ (function (_super) {
    __extends(BindType, _super);
    function BindType(spec) {
        var _this = _super.call(this, spec) || this;
        _this.isClass = (spec.flags & 15360 /* kindMask */) == 2048 /* isClass */;
        return _this;
    }
    return BindType;
}(exports.TypeBase));
exports.BindType = BindType;
var BindClass = /** @class */ (function (_super) {
    __extends(BindClass, _super);
    function BindClass() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.superList = [];
        _this.methodTbl = {};
        _this.methodList = [];
        _this.propertyTbl = {};
        _this.propertyList = [];
        return _this;
    }
    BindClass.prototype.addSuper = function (superClass) {
        this.superList.push(superClass);
    };
    BindClass.prototype.addMethod = function (name, kind, typeList, policyList) {
        var bindMethod = new BindMethod(this, name, typeList[0], typeList.slice(1), policyList, kind == 1 /* func */);
        this.methodTbl[name] = bindMethod;
        this.methodList.push(bindMethod);
    };
    BindClass.prototype.addProperty = function (name, kind, typeList, policyList) {
        name = common_1.removeAccessorPrefix(name);
        var bindProperty = this.propertyTbl[name];
        if (!bindProperty) {
            bindProperty = new BindProperty(this, name);
            this.propertyTbl[name] = bindProperty;
            this.propertyList.push(bindProperty);
        }
        if (kind == 3 /* getter */) {
            // Property type is getter's return type.
            bindProperty.makeReadable(typeList[0]);
        }
        else {
            // Property type is type of setter's first argument.
            bindProperty.makeWritable(typeList[1]);
        }
    };
    return BindClass;
}(BindType));
exports.BindClass = BindClass;
var BindMethod = /** @class */ (function () {
    function BindMethod(bindClass, name, returnType, argTypeList, policyList, isStatic) {
        this.bindClass = bindClass;
        this.name = name;
        this.returnType = returnType;
        this.argTypeList = argTypeList;
        this.policyList = policyList;
        this.isStatic = isStatic;
    }
    BindMethod.prototype.toString = function () {
        return ((this.name ?
            this.returnType + ' ' + this.name :
            this.bindClass.name) +
            '(' + this.argTypeList.join(', ') + ')');
    };
    return BindMethod;
}());
exports.BindMethod = BindMethod;
var BindProperty = /** @class */ (function () {
    function BindProperty(bindClass, name) {
        this.isReadable = false;
        this.isWritable = false;
        this.bindClass = bindClass;
        this.name = name;
    }
    BindProperty.prototype.makeReadable = function (bindType) {
        this.bindType = bindType;
        this.isReadable = true;
    };
    BindProperty.prototype.makeWritable = function (bindType) {
        this.bindType = bindType;
        this.isWritable = true;
    };
    BindProperty.prototype.toString = function () {
        return (this.bindType + ' ' + this.name);
    };
    return BindProperty;
}());
exports.BindProperty = BindProperty;
/** Type-safe Function.bind, name inspired by Dojo. */
function hitch(obj, method) {
    return method.bind(obj);
}
var Reflect = /** @class */ (function () {
    function Reflect(binding) {
        var _this = this;
        this.constructType = (function (kind, spec) {
            var construct = (kind == 2048 /* isClass */) ? BindClass : BindType;
            var bindType = new construct(spec);
            _this.typeNameTbl[spec.name] = bindType;
            _this.typeIdTbl[spec.id] = bindType;
            return (bindType);
        }).bind(this);
        this.skipNameTbl = {
            'Int64': true,
            'NBind': true,
            'NBindID': true
        };
        this.typeIdTbl = {};
        this.typeNameTbl = {};
        this.classList = [];
        this.binding = binding;
        // Bind value type on Emscripten target
        // (equivalent Node.js type has no toJS method).
        binding.bind('NBindID', NBindID);
        binding.reflect(hitch(this, this.readPrimitive), hitch(this, this.readType), hitch(this, this.readClass), hitch(this, this.readSuper), hitch(this, this.readMethod));
        function compareName(_a, _b) {
            var a = _a.name;
            var b = _b.name;
            return (~~(a > b) - ~~(a < b));
        }
        this.classList.sort(compareName);
        if (this.globalScope)
            this.globalScope.methodList.sort(compareName);
    }
    Reflect.prototype.readPrimitive = function (id, size, flags) {
        makeType(this.constructType, {
            flags: 1024 /* isArithmetic */ | flags,
            id: id,
            ptrSize: size
        });
    };
    Reflect.prototype.readType = function (id, name) {
        makeType(this.constructType, {
            flags: 10240 /* isOther */,
            id: id,
            name: name
        });
    };
    Reflect.prototype.readClass = function (id, name) {
        var bindClass = makeType(this.constructType, {
            flags: 2048 /* isClass */,
            id: id,
            name: name
        });
        if (!this.skipNameTbl[bindClass.name])
            this.classList.push(bindClass);
    };
    Reflect.prototype.readSuper = function (classId, superIdList) {
        var bindClass = this.getType(classId);
        for (var _i = 0, superIdList_1 = superIdList; _i < superIdList_1.length; _i++) {
            var superId = superIdList_1[_i];
            bindClass.addSuper(this.getType(superId));
        }
    };
    Reflect.prototype.readMethod = function (classId, name, kind, typeIdList, policyList) {
        var _this = this;
        var bindClass = this.getType(classId);
        if (!bindClass) {
            if (!this.globalScope) {
                bindClass = this.constructType(2048 /* isClass */, { flags: 0 /* none */, id: classId, name: 'global' });
                this.globalScope = bindClass;
            }
            else {
                throw (new Error('Unknown class ID ' + classId + ' for method ' + name));
            }
        }
        var typeList = typeIdList.map(function (id) { return getComplexType(id, _this.constructType, hitch(_this, _this.getType), hitch(_this, _this.queryType), 'reflect ' + bindClass.name + '.' + name); });
        switch (kind) {
            case 5 /* construct */:
            case 1 /* func */:
            case 2 /* method */:
                bindClass.addMethod(name, kind, typeList, policyList);
                break;
            case 3 /* getter */:
            case 4 /* setter */:
                bindClass.addProperty(name, kind, typeList, policyList);
                break;
            default:
                break;
        }
    };
    Reflect.prototype.getType = function (id) { return (this.typeIdTbl[id]); };
    Reflect.prototype.queryType = function (id) {
        return (this.binding.queryType(id, function (kind, target, param) { return ({
            paramList: [target, param],
            placeholderFlag: kind
        }); }));
    };
    Reflect.prototype.dumpPseudo = function () {
        var classCodeList = [];
        var indent;
        var staticPrefix;
        for (var _i = 0, _a = this.classList.concat([this.globalScope]); _i < _a.length; _i++) {
            var bindClass = _a[_i];
            if (bindClass.isClass) {
                indent = '\t';
                staticPrefix = 'static ';
            }
            else {
                indent = '';
                staticPrefix = '';
            }
            var methodBlock = bindClass.methodList.map(function (method) { return (indent +
                (method.name && method.isStatic ? staticPrefix : '') +
                method + ';' +
                (method.policyList.length ?
                    ' // ' + method.policyList.join(', ') :
                    '')); }).join('\n');
            var propertyBlock = bindClass.propertyList.map(function (property) { return (indent + property + ';' +
                (!(property.isReadable && property.isWritable) ?
                    ' // ' + (property.isReadable ? 'Read-only' : 'Write-only') :
                    '')); }).join('\n');
            var classCode = (methodBlock +
                (methodBlock && propertyBlock ? '\n\n' : '') +
                propertyBlock);
            var inheritCode = '';
            if (bindClass.superList.length) {
                inheritCode = ' : ' + bindClass.superList.map(function (superClass) { return 'public ' + superClass.name; }).join(', ');
            }
            if (indent) {
                classCode = ('class ' + bindClass.name + inheritCode + ' {' +
                    (classCode ? '\n' + classCode + '\n' : '') +
                    '};');
            }
            classCodeList.push(classCode);
        }
        return (classCodeList.join('\n\n') + '\n');
    };
    return Reflect;
}());
exports.Reflect = Reflect;
