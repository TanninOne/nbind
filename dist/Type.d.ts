export declare const Type: new (spec: TypeSpec) => TypeClass, makeType: <BindType extends TypeClass>(constructType: (kind: TypeFlags, spec: TypeSpecWithName) => BindType, spec: TypeSpec) => BindType, structureList: [TypeFlags, number, string][];
export declare type PolicyTbl = {
    [name: string]: boolean;
};
export interface TypeSpec {
    [key: string]: any;
    id: number;
    name?: string;
    flags: TypeFlags;
    ptrSize?: number;
    paramList?: (TypeClass | number)[];
}
export interface TypeSpecWithName extends TypeSpec {
    name: string;
}
export interface TypeSpecWithParam extends TypeSpecWithName {
    paramList: (TypeClass | number)[];
}
export interface TypeSpecWithSize extends TypeSpecWithName {
    ptrSize: number;
}
export interface TypeClass extends TypeSpec {
    toString?(): string;
    makeWireRead?(expr: string, convertParamList?: any[], num?: number): string;
    makeWireWrite?(expr: string, policyTbl: PolicyTbl | null, convertParamList?: any[], num?: number): boolean | string | ((arg: any) => number | boolean);
    wireRead?: (arg: number) => any;
    wireWrite?: (arg: any) => number;
    spec: TypeSpec;
    name: string;
}
export declare const enum TypeFlagBase {
    flag = 1,
    num = 8,
    ref = 128,
    kind = 1024
}
export declare const enum TypeFlags {
    none = 0,
    flagMask = 3,
    isConst = 1,
    isValueObject = 2,
    isMethod = 4,
    numMask = 120,
    isUnsigned = 8,
    isSignless = 16,
    isFloat = 32,
    isBig = 64,
    refMask = 896,
    isPointer = 128,
    isReference = 256,
    isRvalueRef = 384,
    isSharedPtr = 512,
    isUniquePtr = 640,
    kindMask = 15360,
    isArithmetic = 1024,
    isClass = 2048,
    isClassPtr = 3072,
    isSharedClassPtr = 4096,
    isVector = 5120,
    isArray = 6144,
    isCString = 7168,
    isString = 8192,
    isCallback = 9216,
    isOther = 10240
}
export declare const enum StateFlags {
    none = 0,
    isPersistent = 1,
    isDeleted = 2
}
export declare const enum StructureType {
    none = 0,
    constant = 1,
    pointer = 2,
    reference = 3,
    rvalue = 4,
    shared = 5,
    unique = 6,
    vector = 7,
    array = 8,
    callback = 9,
    max = 10
}
export declare function typeModule(self: any): {
    Type: new (spec: TypeSpec) => TypeClass;
    getComplexType: <BindType extends TypeClass>(id: number, constructType: (kind: TypeFlags, spec: TypeSpecWithName) => BindType, getType: (id: number) => BindType, queryType: (id: number) => {
        placeholderFlag: number;
        paramList: (number | number[])[];
    }, place?: string | undefined, kind?: string, prevStructure?: [TypeFlags, number, string] | undefined, depth?: number) => BindType;
    makeType: <BindType_1 extends TypeClass>(constructType: (kind: TypeFlags, spec: TypeSpecWithName) => BindType_1, spec: TypeSpec) => BindType_1;
    structureList: [TypeFlags, number, string][];
};
