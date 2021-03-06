// This file is part of nbind, copyright (C) 2014-2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Type = (_a = typeModule(typeModule), _a.Type), exports.makeType = _a.makeType, exports.structureList = _a.structureList;
/* tslint:disable:no-shadowed-variable */
function typeModule(self) {
    // Parameter count and printable name of each StructureType.
    var structureList = [
        [0, 1, 'X'],
        [1 /* isConst */, 1, 'const X'],
        [128 /* isPointer */, 1, 'X *'],
        [256 /* isReference */, 1, 'X &'],
        [384 /* isRvalueRef */, 1, 'X &&'],
        [512 /* isSharedPtr */, 1, 'std::shared_ptr<X>'],
        [640 /* isUniquePtr */, 1, 'std::unique_ptr<X>'],
        [5120 /* isVector */, 1, 'std::vector<X>'],
        [6144 /* isArray */, 2, 'std::array<X, Y>'],
        [9216 /* isCallback */, -1, 'std::function<X (Y)>']
    ];
    function applyStructure(outerName, outerFlags, innerName, innerFlags, param, flip) {
        if (outerFlags == 1 /* isConst */) {
            var ref = innerFlags & 896 /* refMask */;
            if (ref == 128 /* isPointer */ ||
                ref == 256 /* isReference */ ||
                ref == 384 /* isRvalueRef */)
                outerName = 'X const';
        }
        var name;
        if (flip) {
            name = innerName.replace('X', outerName).replace('Y', param);
        }
        else {
            name = outerName.replace('X', innerName).replace('Y', param);
        }
        // Remove spaces between consecutive * and & characters.
        return (name.replace(/([*&]) (?=[*&])/g, '$1'));
    }
    function reportProblem(problem, id, kind, structureType, place) {
        throw (new Error(problem + ' type ' +
            kind.replace('X', id + '?') +
            (structureType ? ' with flag ' + structureType : '') +
            ' in ' + place));
    }
    function getComplexType(id, constructType, getType, queryType, place, 
    // C++ type name string built top-down, for printing helpful errors.
    kind, // tslint:disable-line
    // Outer type, used only for updating kind.
    prevStructure, // tslint:disable-line
    depth // tslint:disable-line
    ) {
        if (kind === void 0) { kind = 'X'; }
        if (depth === void 0) { depth = 1; }
        var result = getType(id);
        if (result)
            return (result);
        var query = queryType(id);
        var structureType = query.placeholderFlag;
        var structure = structureList[structureType];
        if (prevStructure && structure) {
            kind = applyStructure(prevStructure[2], prevStructure[0], kind, structure[0], '?', true);
        }
        var problem;
        if (structureType == 0)
            problem = 'Unbound';
        if (structureType >= 10 /* max */)
            problem = 'Corrupt';
        if (depth > 20)
            problem = 'Deeply nested';
        if (problem)
            reportProblem(problem, id, kind, structureType, place || '?');
        var subId = query.paramList[0];
        var subType = getComplexType(subId, constructType, getType, queryType, place, kind, structure, depth + 1);
        var srcSpec;
        var spec = {
            flags: structure[0],
            id: id,
            name: '',
            paramList: [subType]
        };
        var argList = [];
        var structureParam = '?';
        switch (query.placeholderFlag) {
            case 1 /* constant */:
                srcSpec = subType.spec;
                break;
            case 2 /* pointer */:
                if ((subType.flags & 15360 /* kindMask */) == 1024 /* isArithmetic */ &&
                    subType.spec.ptrSize == 1) {
                    spec.flags = 7168 /* isCString */;
                    break;
                }
            // tslint:disable-next-line:no-switch-case-fall-through
            case 3 /* reference */:
            // tslint:disable-next-line:no-switch-case-fall-through
            case 6 /* unique */:
            // tslint:disable-next-line:no-switch-case-fall-through
            case 5 /* shared */:
                srcSpec = subType.spec;
                if ((subType.flags & 15360 /* kindMask */) != 2048 /* isClass */) {
                    // reportProblem('Unsupported', id, kind, structureType, place);
                }
                break;
            case 8 /* array */:
                structureParam = '' + query.paramList[1];
                spec.paramList.push(query.paramList[1]);
                break;
            case 9 /* callback */:
                for (var _i = 0, _a = query.paramList[1]; _i < _a.length; _i++) {
                    var paramId = _a[_i];
                    var paramType = getComplexType(paramId, constructType, getType, queryType, place, kind, structure, depth + 1);
                    argList.push(paramType.name);
                    spec.paramList.push(paramType);
                }
                structureParam = argList.join(', ');
                break;
            default:
                break;
        }
        spec.name = applyStructure(structure[2], structure[0], subType.name, subType.flags, structureParam);
        if (srcSpec) {
            for (var _b = 0, _c = Object.keys(srcSpec); _b < _c.length; _b++) {
                var key = _c[_b];
                spec[key] = spec[key] || srcSpec[key];
            }
            spec.flags |= srcSpec.flags;
        }
        return (makeType(constructType, spec));
    }
    function makeType(constructType, spec) {
        var flags = spec.flags;
        var refKind = flags & 896 /* refMask */;
        var kind = flags & 15360 /* kindMask */;
        if (!spec.name && kind == 1024 /* isArithmetic */) {
            if (spec.ptrSize == 1) {
                spec.name = (flags & 16 /* isSignless */ ?
                    '' :
                    (flags & 8 /* isUnsigned */ ? 'un' : '') + 'signed ') + 'char';
            }
            else {
                spec.name = ((flags & 8 /* isUnsigned */ ? 'u' : '') +
                    (flags & 32 /* isFloat */ ? 'float' : 'int') +
                    (spec.ptrSize * 8 + '_t'));
            }
        }
        if (spec.ptrSize == 8 && !(flags & 32 /* isFloat */))
            kind = 64 /* isBig */;
        if (kind == 2048 /* isClass */) {
            if (refKind == 512 /* isSharedPtr */ || refKind == 640 /* isUniquePtr */) {
                kind = 4096 /* isSharedClassPtr */;
            }
            else if (refKind)
                kind = 3072 /* isClassPtr */;
        }
        return (constructType(kind, spec));
    }
    var Type = /** @class */ (function () {
        function Type(spec) {
            this.id = spec.id;
            this.name = spec.name;
            this.flags = spec.flags;
            this.spec = spec;
        }
        Type.prototype.toString = function () {
            return (this.name);
        };
        return Type;
    }());
    var output = {
        Type: Type,
        getComplexType: getComplexType,
        makeType: makeType,
        structureList: structureList
    };
    self.output = output;
    return (self.output || output);
}
exports.typeModule = typeModule;
