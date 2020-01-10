export declare const enum SignatureType {
    none = 0,
    func = 1,
    method = 2,
    getter = 3,
    setter = 4,
    construct = 5
}
export declare function removeAccessorPrefix(name: string): string;
