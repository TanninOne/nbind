"use strict";
// This file is part of nbind, copyright (C) 2014-2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.
Object.defineProperty(exports, "__esModule", { value: true });
// TypeScript alternatives to named C++ types,
// and a flag whether they need surrounding parentheses when nested.
var nameTbl = {
    'Buffer': ['number[] | ArrayBuffer | DataView | Uint8Array | Buffer', true],
    'External': ['any', false],
    'Int64': ['number', false],
    'bool': ['boolean', false],
    'cbFunction &': ['(...args: any[]) => any', true],
    'std::string': ['string', false],
    'void': ['void', false]
};
// tslint:disable-next-line:typedef
function formatType(bindType, policyTbl, needParens) {
    if (policyTbl === void 0) { policyTbl = {}; }
    if (needParens === void 0) { needParens = false; }
    var flags = bindType.flags;
    var kind = flags & 15360 /* kindMask */;
    var refKind = flags & 896 /* refMask */;
    // tslint:disable-next-line:typedef
    function formatSubType(needsParens, num) {
        if (num === void 0) { num = 0; }
        return (formatType(bindType.spec.paramList[num], policyTbl, needsParens));
    }
    function addParens(name) {
        return (needParens ? '(' + name + ')' : name);
    }
    if (flags & 1 /* isConst */)
        return (formatSubType(needParens));
    var isNullable = policyTbl['Nullable'];
    var argList = [];
    switch (kind) {
        case 1024 /* isArithmetic */:
            return ('number');
        case 2048 /* isClass */:
            // Objects passed by pointer (not value or reference)
            // may be nullable.
            isNullable = isNullable && (refKind == 128 /* isPointer */ ||
                refKind == 512 /* isSharedPtr */ ||
                refKind == 640 /* isUniquePtr */);
            needParens = needParens && isNullable;
            return (addParens((refKind ? formatSubType(isNullable) : bindType.name) +
                (isNullable ? ' | null' : '')));
        case 5120 /* isVector */:
        case 6144 /* isArray */:
            return (addParens(formatSubType(true) + '[]'));
        case 7168 /* isCString */:
            return (isNullable ? addParens('string | null') : 'string');
        case 8192 /* isString */:
            return ('string');
        case 9216 /* isCallback */:
            for (var num = 1; num < bindType.spec.paramList.length; ++num) {
                argList.push('p' + (num - 1) + ': ' + formatSubType(false, num));
            }
            return (addParens('(' + argList.join(', ') + ') => ' + formatSubType(true)));
        case 10240 /* isOther */:
            var spec = nameTbl[bindType.name];
            return (spec ? (spec[1] ? addParens(spec[0]) : spec[0]) : 'any');
        default:
            return ('any');
    }
}
function formatMethod(method) {
    var policyTbl = {};
    for (var _i = 0, _a = method.policyList; _i < _a.length; _i++) {
        var key = _a[_i];
        policyTbl[key] = true;
    }
    var args = ('(' + method.argTypeList.map(function (bindType, num) { return 'p' + num + ': ' + formatType(bindType, policyTbl); }).join(', ') + ')');
    if (method.name) {
        // Most return types may be null.
        return (method.name + args + ': ' + formatType(method.returnType, { 'Nullable': true }) + ';');
    }
    else {
        return ('constructor' + args + ';');
    }
}
function formatProperty(prop) {
    return (prop.name + ': ' + formatType(prop.bindType) + ';');
}
function dump(options) {
    var classCodeList = [];
    var indent;
    var staticPrefixCC;
    var staticPrefixJS;
    var classList = options.reflect.classList;
    if (options.shim) {
        classCodeList.push('import { Buffer } from "nbind/dist/shim";');
    }
    classCodeList.push('export class NBindBase { free?(): void }');
    if (options.reflect.globalScope) {
        classList = classList.concat([options.reflect.globalScope]);
    }
    for (var _i = 0, classList_1 = classList; _i < classList_1.length; _i++) {
        var bindClass = classList_1[_i];
        if (bindClass.isClass) {
            indent = '\t';
            staticPrefixCC = 'static ';
            staticPrefixJS = 'static ';
        }
        else {
            indent = '';
            staticPrefixCC = '';
            staticPrefixJS = 'export function ';
        }
        var methodBlock = bindClass.methodList.map(function (method) { return (indent +
            '/** ' + (method.name && method.isStatic ? staticPrefixCC : '') +
            method + ';' + (method.policyList.length ?
            ' -- ' + method.policyList.join(', ') :
            '') +
            ' */\n' +
            indent + (method.name && method.isStatic ? staticPrefixJS : '') +
            formatMethod(method)); }).join('\n\n');
        var propertyBlock = bindClass.propertyList.map(function (property) { return (indent +
            '/** ' + property + ';' +
            (!(property.isReadable && property.isWritable) ?
                ' -- ' + (property.isReadable ? 'Read-only' : 'Write-only') :
                '') +
            ' */\n' +
            indent +
            formatProperty(property)); }).join('\n\n');
        var classCode = (methodBlock +
            (methodBlock && propertyBlock ? '\n\n' : '') +
            propertyBlock);
        var superClass = 'NBindBase';
        if (bindClass.superList.length == 1) {
            superClass = bindClass.superList[0].name;
        }
        else if (bindClass.superList.length > 1) {
            superClass = '_' + bindClass.name;
            classCodeList.push('export interface ' + superClass + ' extends ' + bindClass.superList.map(function (superClassEntry) { return superClassEntry.name; }).join(', ') + ' {}\n' +
                'export var ' + superClass + ': { new(): ' + superClass + ' };');
        }
        if (indent) {
            classCode = ('export class ' + bindClass.name + ' extends ' + superClass + ' {' +
                (classCode ? '\n' + classCode + '\n' : '') +
                '}');
        }
        classCodeList.push(classCode);
    }
    return (classCodeList.join('\n\n') + '\n');
}
exports.dump = dump;
