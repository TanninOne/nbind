// This file is part of nbind, copyright (C) 2014-2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
// This file contains some assorted functions.
var emscripten_library_decorator_1 = require("emscripten-library-decorator");
// Let decorators run eval in current scope to read function source code.
emscripten_library_decorator_1.setEvil(function (code) { return eval(code); });
// Namespace that will be made available inside Emscripten compiled module.
var _nbind;
(function (_nbind) {
    // Generic table and list of functions.
    // Mapping from numeric typeIDs and type names to objects with type information.
    var typeIdTbl = {};
    _nbind.typeNameTbl = {};
    var Pool = /** @class */ (function () {
        function Pool() {
        }
        Pool.lalloc = function (size) {
            // Round size up to a multiple of 8 bytes (size of a double)
            // to align pointers allocated later.
            size = (size + 7) & ~7;
            var used = HEAPU32[Pool.usedPtr];
            if (size > Pool.pageSize / 2 || size > Pool.pageSize - used) {
                var NBind = _nbind.typeNameTbl['NBind'].proto;
                return (NBind.lalloc(size));
            }
            else {
                HEAPU32[Pool.usedPtr] = used + size;
                return (Pool.rootPtr + used);
            }
        };
        /** Reset linear allocator to a previous state, effectively to free
          * a stack frame. */
        Pool.lreset = function (used, page) {
            var topPage = HEAPU32[Pool.pagePtr];
            if (topPage) {
                var NBind = _nbind.typeNameTbl['NBind'].proto;
                NBind.lreset(used, page);
            }
            else {
                HEAPU32[Pool.usedPtr] = used;
            }
        };
        return Pool;
    }());
    _nbind.Pool = Pool;
    function constructType(kind, spec) {
        var construct = (kind == 10240 /* isOther */ ?
            _nbind.makeTypeNameTbl[spec.name] || _nbind.BindType :
            _nbind.makeTypeKindTbl[kind]);
        // console.error(spec.id + ' ' + spec.name + ' ' + kind); // tslint:disable-line
        // console.error(construct.toString()); // tslint:disable-line
        var bindType = new construct(spec);
        typeIdTbl[spec.id] = bindType;
        _nbind.typeNameTbl[spec.name] = bindType;
        return (bindType);
    }
    _nbind.constructType = constructType;
    function getType(id) {
        return (typeIdTbl[id]);
    }
    _nbind.getType = getType;
    function queryType(id) {
        var placeholderFlag = HEAPU8[id];
        var paramCount = _nbind.structureList[placeholderFlag][1];
        id /= 4;
        if (paramCount < 0) {
            ++id;
            paramCount = HEAPU32[id] + 1;
        }
        var paramList = Array.prototype.slice.call(HEAPU32.subarray(id + 1, id + 1 + paramCount));
        if (placeholderFlag == 9 /* callback */) {
            paramList = [paramList[0], paramList.slice(1)];
        }
        return ({
            paramList: paramList,
            placeholderFlag: placeholderFlag
        });
    }
    _nbind.queryType = queryType;
    // Look up a list of type objects based on their numeric typeID or name.
    function getTypes(idList, place) {
        return (idList.map(function (id) { return (typeof (id) == 'number' ?
            _nbind.getComplexType(id, constructType, getType, queryType, place) :
            _nbind.typeNameTbl[id]); }));
    }
    _nbind.getTypes = getTypes;
    function readTypeIdList(typeListPtr, typeCount) {
        return (Array.prototype.slice.call(HEAPU32, typeListPtr / 4, typeListPtr / 4 + typeCount));
    }
    _nbind.readTypeIdList = readTypeIdList;
    function readAsciiString(ptr) {
        var endPtr = ptr;
        while (HEAPU8[endPtr++])
            ;
        return (String.fromCharCode.apply('', HEAPU8.subarray(ptr, endPtr - 1)));
    }
    _nbind.readAsciiString = readAsciiString;
    function readPolicyList(policyListPtr) {
        var policyTbl = {};
        if (policyListPtr) {
            while (1) {
                var namePtr = HEAPU32[policyListPtr / 4];
                if (!namePtr)
                    break;
                policyTbl[readAsciiString(namePtr)] = true;
                policyListPtr += 4;
            }
        }
        return (policyTbl);
    }
    _nbind.readPolicyList = readPolicyList;
    // Generate a mangled signature from argument types.
    // Asm.js functions can only be called though Emscripten-generated invoker functions,
    // with slightly mangled type signatures appended to their names.
    // tslint:disable-next-line:no-shadowed-variable
    function getDynCall(typeList, name) {
        var mangleMap = {
            float32_t: 'd',
            float64_t: 'd',
            int64_t: 'd',
            uint64_t: 'd',
            void: 'v'
        };
        var signature = typeList.map(function (type) { return (mangleMap[type.name] || 'i'); }).join('');
        var dynCall = Module['dynCall_' + signature];
        if (!dynCall) {
            throw (new Error('dynCall_' + signature + ' not found for ' + name + '(' + (typeList.map(function (type) { return type.name; })).join(', ') + ')'));
        }
        return (dynCall);
    }
    _nbind.getDynCall = getDynCall;
    // Add a method to a C++ class constructor (for static methods) or prototype,
    // or overload an existing method.
    function addMethod(obj, name, func, arity) {
        var overload = obj[name];
        // Check if the function has been overloaded.
        if (obj.hasOwnProperty(name) && overload) {
            if (overload.arity || overload.arity === 0) {
                // Found an existing function, but it's not an overloader.
                // Make a new overloader and add the existing function to it.
                overload = _nbind.makeOverloader(overload, overload.arity);
                obj[name] = overload;
            }
            // Add this function as an overload.
            overload.addMethod(func, arity);
        }
        else {
            // Add a new function and store its arity in case it gets overloaded.
            func.arity = arity;
            obj[name] = func;
        }
    }
    _nbind.addMethod = addMethod;
    function throwError(message) {
        throw (new Error(message));
    }
    _nbind.throwError = throwError;
    _nbind.bigEndian = false;
    // Export the namespace to Emscripten compiled output.
    // This must be at the end of the namespace!
    // The dummy class is needed because unfortunately namespaces can't have decorators.
    // Everything after it inside the namespace will be discarded.
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
