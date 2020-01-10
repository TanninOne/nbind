// This file is part of nbind, copyright (C) 2014-2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
// This file handles creating invoker functions for Emscripten dyncalls
// wrapped in type conversions for arguments and return values.
var emscripten_library_decorator_1 = require("emscripten-library-decorator");
// Let decorators run eval in current scope to read function source code.
emscripten_library_decorator_1.setEvil(function (code) { return eval(code); });
var _nbind;
(function (_nbind) {
    /** Make a list of argument names a1, a2, a3...
      * for dynamically generating function source code. */
    function makeArgList(argCount) {
        return (Array.apply(null, Array(argCount)).map(function (dummy, num) { return ('a' + (num + 1)); }));
    }
    /** Check if any type on the list requires conversion writing to C++.
      * Mainly numbers can be passed as-is between Asm.js and JavaScript. */
    function anyNeedsWireWrite(typeList, policyTbl) {
        return (typeList.reduce(function (result, type) {
            return (result || type.needsWireWrite(policyTbl));
        }, false));
    }
    /** Check if any type on the list requires conversion reading from C++.
      * Mainly numbers can be passed as-is between Asm.js and JavaScript. */
    function anyNeedsWireRead(typeList, policyTbl) {
        return (typeList.reduce(function (result, type) {
            return (result || !!type.needsWireRead(policyTbl));
        }, false));
    }
    function makeWireRead(convertParamList, policyTbl, type, expr) {
        /** Next free slot number in type converter data list. */
        var paramNum = convertParamList.length;
        if (type.makeWireRead) {
            return (type.makeWireRead(expr, convertParamList, paramNum));
        }
        else if (type.wireRead) {
            convertParamList[paramNum] = type.wireRead;
            return ('(convertParamList[' + paramNum + '](' + expr + '))');
        }
        else
            return (expr);
    }
    function makeWireWrite(convertParamList, policyTbl, type, expr) {
        var wireWrite;
        /** Next free slot number in type converter data list. */
        var paramNum = convertParamList.length;
        if (type.makeWireWrite) {
            wireWrite = type.makeWireWrite(expr, policyTbl, convertParamList, paramNum);
        }
        else
            wireWrite = type.wireWrite;
        if (wireWrite) {
            if (typeof (wireWrite) == 'string') {
                return (wireWrite);
            }
            else {
                convertParamList[paramNum] = wireWrite;
                return ('(convertParamList[' + paramNum + '](' + expr + '))');
            }
        }
        else
            return (expr);
    }
    /** Dynamically build a function that calls an Asm.js invoker
      * with appropriate type conversion for complicated types:
        * - Push arguments to stack.
        * - Read return value.
        * - Restore stack pointer if necessary. */
    function buildCallerFunction(dynCall, ptrType, ptr, num, policyTbl, needsWireWrite, prefix, returnType, argTypeList, mask, err) {
        var argList = makeArgList(argTypeList.length);
        /** List of arbitrary data for type converters.
          * Each one may read and write its own slot. */
        var convertParamList = [];
        // Build code for function call and type conversion.
        var callExpression = makeWireRead(convertParamList, policyTbl, returnType, 'dynCall(' +
            [prefix].concat(argList.map(
            // TODO: if one wireWrite throws,
            // resources allocated by others may leak!
            function (name, index) { return makeWireWrite(convertParamList, policyTbl, argTypeList[index], name); })).join(',') +
            ')');
        // Build code to allocate and free the stack etc. if necessary.
        var resourceSet = _nbind.listResources([returnType], argTypeList);
        var sourceCode = ('function(' + argList.join(',') + '){' +
            (mask ? 'this.__nbindFlags&mask&&err();' : '') +
            resourceSet.makeOpen() +
            'var r=' + callExpression + ';' +
            resourceSet.makeClose() +
            'return r;' +
            '}');
        // Use eval to allow JIT compiling the function.
        return eval('(' + sourceCode + ')');
    }
    /** Dynamically build a function that calls a JavaScript callback invoker
      * with appropriate type conversion for complicated types:
        * - Read arguments from stack.
        * - Push return value.
        * - Restore stack pointer if necessary. */
    function buildJSCallerFunction(returnType, argTypeList) {
        var argList = makeArgList(argTypeList.length);
        /** List of arbitrary data for type converters.
          * Each one may read and write its own slot. */
        var convertParamList = [];
        var callExpression = makeWireWrite(convertParamList, null, returnType, '_nbind.externalList[num].data(' +
            argList.map(
            // TODO: if one wireRead throws,
            // resources held by others may leak!
            function (name, index) { return makeWireRead(convertParamList, null, argTypeList[index], name); }).join(',') +
            ')');
        var resourceSet = _nbind.listResources(argTypeList, [returnType]);
        // Let the calling C++ side handle resetting the pool (using the
        // PoolRestore class) after parsing the callback return value passed
        // through the pool.
        resourceSet.remove(_nbind.resources.pool);
        var sourceCode = ('function(' + ['dummy', 'num'].concat(argList).join(',') + '){' +
            resourceSet.makeOpen() +
            'var r=' + callExpression + ';' +
            resourceSet.makeClose() +
            'return r;' +
            '}');
        // Use eval to allow JIT compiling the function.
        return eval('(' + sourceCode + ')');
    }
    _nbind.buildJSCallerFunction = buildJSCallerFunction;
    /* tslint:disable:indent */
    /** Dynamically create an invoker for a JavaScript callback. */
    function makeJSCaller(idList) {
        var argCount = idList.length - 1;
        var typeList = _nbind.getTypes(idList, 'callback');
        var returnType = typeList[0];
        var argTypeList = typeList.slice(1);
        var needsWireRead = anyNeedsWireRead(argTypeList, null);
        var needsWireWrite = returnType.needsWireWrite(null);
        if (!needsWireWrite && !needsWireRead) {
            switch (argCount) {
                case 0: return (function (dummy, num) {
                    return (_nbind.externalList[num].data());
                });
                case 1: return (function (dummy, num, a1) {
                    return (_nbind.externalList[num].data(a1));
                });
                case 2: return (function (dummy, num, a1, a2) {
                    return (_nbind.externalList[num].data(a1, a2));
                });
                case 3: return (function (dummy, num, a1, a2, a3) {
                    return (_nbind.externalList[num].data(a1, a2, a3));
                });
                default:
                    // Function takes over 3 arguments.
                    // Let's create the invoker dynamically then.
                    break;
            }
        }
        return (buildJSCallerFunction(returnType, argTypeList));
    }
    _nbind.makeJSCaller = makeJSCaller;
    /** Dynamically create an invoker function for calling a C++ class method. */
    function makeMethodCaller(ptrType, spec) {
        var argCount = spec.typeList.length - 1;
        // The method invoker function adds two arguments to those of the method:
        // - Number of the method in a list of methods with identical signatures.
        // - Target object
        var typeIdList = spec.typeList.slice(0);
        typeIdList.splice(1, 0, 'uint32_t', spec.boundID);
        var typeList = _nbind.getTypes(typeIdList, spec.title);
        var returnType = typeList[0];
        var argTypeList = typeList.slice(3);
        var needsWireRead = returnType.needsWireRead(spec.policyTbl);
        var needsWireWrite = anyNeedsWireWrite(argTypeList, spec.policyTbl);
        var ptr = spec.ptr;
        var num = spec.num;
        var dynCall = _nbind.getDynCall(typeList, spec.title);
        var mask = ~spec.flags & 1 /* isConst */;
        function err() {
            throw (new Error('Calling a non-const method on a const object'));
        }
        if (!needsWireRead && !needsWireWrite) {
            // If there are only a few arguments not requiring type conversion,
            // build a simple invoker function without using eval.
            switch (argCount) {
                case 0: return (function () {
                    return (this.__nbindFlags & mask ? err() :
                        dynCall(ptr, num, _nbind.pushPointer(this, ptrType)));
                });
                case 1: return (function (a1) {
                    return (this.__nbindFlags & mask ? err() :
                        dynCall(ptr, num, _nbind.pushPointer(this, ptrType), a1));
                });
                case 2: return (function (a1, a2) {
                    return (this.__nbindFlags & mask ? err() :
                        dynCall(ptr, num, _nbind.pushPointer(this, ptrType), a1, a2));
                });
                case 3: return (function (a1, a2, a3) {
                    return (this.__nbindFlags & mask ? err() :
                        dynCall(ptr, num, _nbind.pushPointer(this, ptrType), a1, a2, a3));
                });
                default:
                    // Function takes over 3 arguments or needs type conversion.
                    // Let's create the invoker dynamically then.
                    break;
            }
        }
        return (buildCallerFunction(dynCall, ptrType, ptr, num, spec.policyTbl, needsWireWrite, 'ptr,num,pushPointer(this,ptrType)', returnType, argTypeList, mask, err));
    }
    _nbind.makeMethodCaller = makeMethodCaller;
    /** Dynamically create an invoker function for calling a C++ function. */
    function makeCaller(spec) {
        var argCount = spec.typeList.length - 1;
        var typeList = _nbind.getTypes(spec.typeList, spec.title);
        var returnType = typeList[0];
        var argTypeList = typeList.slice(1);
        var needsWireRead = returnType.needsWireRead(spec.policyTbl);
        var needsWireWrite = anyNeedsWireWrite(argTypeList, spec.policyTbl);
        var direct = spec.direct;
        var dynCall;
        var ptr = spec.ptr;
        if (spec.direct && !needsWireRead && !needsWireWrite) {
            // If there are only a few arguments not requiring type conversion,
            // build a simple invoker function without using eval.
            dynCall = _nbind.getDynCall(typeList, spec.title);
            switch (argCount) {
                case 0: return (function () {
                    return dynCall(direct);
                });
                case 1: return (function (a1) {
                    return dynCall(direct, a1);
                });
                case 2: return (function (a1, a2) {
                    return dynCall(direct, a1, a2);
                });
                case 3: return (function (a1, a2, a3) {
                    return dynCall(direct, a1, a2, a3);
                });
                default:
                    // Function takes over 3 arguments.
                    // Let's create the invoker dynamically then.
                    break;
            }
            // Input and output types don't need conversion so omit dispatcher.
            ptr = 0;
        }
        var prefix;
        if (ptr) {
            // The function invoker adds an argument to those of the function:
            // - Number of the function in a list of functions with identical signatures.
            var typeIdList = spec.typeList.slice(0);
            typeIdList.splice(1, 0, 'uint32_t');
            typeList = _nbind.getTypes(typeIdList, spec.title);
            prefix = 'ptr,num';
        }
        else {
            ptr = direct;
            prefix = 'ptr';
        }
        // Type ID list was changed.
        dynCall = _nbind.getDynCall(typeList, spec.title);
        return (buildCallerFunction(dynCall, null, ptr, spec.num, spec.policyTbl, needsWireWrite, prefix, returnType, argTypeList));
    }
    _nbind.makeCaller = makeCaller;
    /* tslint:enable:indent */
    /** Create an overloader that can call several methods with the same name,
      * depending on the number of arguments passed in the call. */
    function makeOverloader(func, arity) {
        var callerList = [];
        function call() {
            return (callerList[arguments.length].apply(this, arguments));
        }
        call.addMethod = function (_func, _arity) {
            callerList[_arity] = _func;
        };
        call.addMethod(func, arity);
        return (call);
    }
    _nbind.makeOverloader = makeOverloader;
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
