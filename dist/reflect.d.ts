import { Binding } from './nbind';
import { SignatureType } from './common';
import { TypeSpec, TypeClass } from './Type';
export declare type TypeBase = TypeClass;
export declare const TypeBase: new (spec: TypeSpec) => TypeClass;
export declare class BindType extends TypeBase {
    constructor(spec: TypeSpec);
    isClass: boolean;
}
export declare class BindClass extends BindType {
    addSuper(superClass: BindClass): void;
    addMethod(name: string, kind: SignatureType, typeList: BindType[], policyList: string[]): void;
    addProperty(name: string, kind: SignatureType, typeList: BindType[], policyList: string[]): void;
    name: string;
    superList: BindClass[];
    methodTbl: {
        [name: string]: BindMethod;
    };
    methodList: BindMethod[];
    propertyTbl: {
        [name: string]: BindProperty;
    };
    propertyList: BindProperty[];
}
export declare class BindMethod {
    constructor(bindClass: BindClass, name: string, returnType: BindType, argTypeList: BindType[], policyList: string[], isStatic: boolean);
    toString(): string;
    bindClass: BindClass;
    name: string;
    returnType: BindType;
    argTypeList: BindType[];
    policyList: string[];
    isStatic: boolean;
}
export declare class BindProperty {
    constructor(bindClass: BindClass, name: string);
    makeReadable(bindType: BindType): void;
    makeWritable(bindType: BindType): void;
    toString(): string;
    bindClass: BindClass;
    name: string;
    bindType: BindType;
    isReadable: boolean;
    isWritable: boolean;
}
export declare class Reflect {
    constructor(binding: Binding<any>);
    private readPrimitive;
    private readType;
    private readClass;
    private readSuper;
    private readMethod;
    private getType;
    private queryType;
    dumpPseudo(): string;
    private constructType;
    skipNameTbl: {
        [key: string]: boolean;
    };
    binding: Binding<any>;
    typeIdTbl: {
        [id: number]: BindType;
    };
    typeNameTbl: {
        [name: string]: BindType;
    };
    globalScope: BindClass;
    classList: BindClass[];
}
