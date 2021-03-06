"use strict";
// This file is part of nbind, copyright (C) 2014-2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.
Object.defineProperty(exports, "__esModule", { value: true });
function zeroes(count) {
    return (new Array(count + 1).join('0'));
}
var padTbl = {
    2: zeroes(32),
    4: zeroes(16),
    10: zeroes(9),
    16: zeroes(8)
};
/** Simple bignum style class for formatting 64-bit integers. */
var Int64 = /** @class */ (function () {
    function Int64(lo, hi, sign) {
        this.lo = lo >>> 0;
        this.hi = hi >>> 0;
        this.sign = sign;
    }
    Int64.prototype.fromJS = function (output) {
        output(this.lo, this.hi, this.sign);
    };
    Int64.prototype.toString = function (base) {
        var prefix = this.sign ? '-' : '';
        var hi = this.hi;
        var lo = this.lo;
        if (!base)
            base = 10;
        if (!hi)
            return (prefix + lo.toString(base));
        var pad = padTbl[base];
        var part;
        if (base != 10) {
            if (!pad)
                throw (new Error('Unsupported base ' + base));
            part = lo.toString(base);
            return (prefix + hi.toString(base) + pad.substr(part.length) + part);
        }
        var groupSize = 1000000000;
        var result = '';
        var carry;
        function step(limb) {
            carry = carry * 0x10000 + (limb >>> 16);
            var hi16 = (carry / groupSize) >>> 0;
            carry = carry - hi16 * groupSize;
            carry = carry * 0x10000 + (limb & 0xffff);
            var lo16 = (carry / groupSize) >>> 0;
            carry = carry - lo16 * groupSize;
            return (((hi16 << 16) | lo16) >>> 0);
        }
        while (hi || lo >= groupSize) {
            carry = 0;
            hi = step(hi);
            lo = step(lo);
            part = '' + carry;
            result = pad.substr(part.length) + part + result;
        }
        result = prefix + lo + result;
        return (result);
    };
    return Int64;
}());
exports.Int64 = Int64;
