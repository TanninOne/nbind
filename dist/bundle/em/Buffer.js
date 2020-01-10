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
var Globals_1 = require("./Globals");
var BindingType_1 = require("./BindingType");
var External_1 = require("./External");
// Let decorators run eval in current scope to read function source code.
emscripten_library_decorator_1.setEvil(function (code) { return eval(code); });
var _nbind;
(function (_nbind) {
    _nbind.Pool = Globals_1._nbind.Pool;
    _nbind.BindType = BindingType_1._nbind.BindType;
    _nbind.External = External_1._nbind.External;
})(_nbind = exports._nbind || (exports._nbind = {}));
(function (_nbind) {
    var ExternalBuffer = /** @class */ (function (_super) {
        __extends(ExternalBuffer, _super);
        function ExternalBuffer(buf, ptr) {
            var _this = _super.call(this, buf) || this;
            _this.ptr = ptr;
            return _this;
        }
        ExternalBuffer.prototype.free = function () { _free(this.ptr); };
        return ExternalBuffer;
    }(_nbind.External));
    function getBuffer(buf) {
        if (buf instanceof ArrayBuffer) {
            return (new Uint8Array(buf));
        }
        else if (buf instanceof DataView) {
            return (new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
        }
        else
            return (buf);
    }
    function pushBuffer(buf, policyTbl) {
        if (buf === null || buf === undefined) {
            if (policyTbl && policyTbl['Nullable'])
                buf = [];
        }
        if (typeof (buf) != 'object')
            throw (new Error('Type mismatch'));
        var b = buf;
        var length = b.byteLength || b.length;
        if (!length && length !== 0 && b.byteLength !== 0)
            throw (new Error('Type mismatch'));
        var result = _nbind.Pool.lalloc(8);
        var data = _malloc(length);
        var ptr = result / 4;
        HEAPU32[ptr++] = length;
        HEAPU32[ptr++] = data;
        HEAPU32[ptr++] = new ExternalBuffer(buf, data).register();
        HEAPU8.set(getBuffer(buf), data);
        return (result);
    }
    var BufferType = /** @class */ (function (_super) {
        __extends(BufferType, _super);
        function BufferType() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.wireWrite = pushBuffer;
            _this.readResources = [_nbind.resources.pool];
            _this.writeResources = [_nbind.resources.pool];
            return _this;
        }
        BufferType.prototype.makeWireWrite = function (expr, policyTbl) {
            return (function (arg) { return pushBuffer(arg, policyTbl); });
        };
        return BufferType;
    }(_nbind.BindType));
    _nbind.BufferType = BufferType;
    // Called from EM_ASM block in Buffer.h
    function commitBuffer(num, data, length) {
        var buf = _nbind.externalList[num].data;
        var NodeBuffer = Buffer;
        // tslint:disable-next-line:no-empty
        if (typeof (Buffer) != 'function')
            NodeBuffer = (function () { });
        if (buf instanceof Array) {
            // TODO if needed
        }
        else {
            var src = HEAPU8.subarray(data, data + length);
            if (buf instanceof NodeBuffer) {
                var srcBuf = void 0;
                if (typeof (Buffer.from) == 'function' && Buffer.from.length >= 3) {
                    srcBuf = Buffer.from(src);
                }
                else
                    srcBuf = new Buffer(src);
                srcBuf.copy(buf);
            }
            else
                getBuffer(buf).set(src);
        }
    }
    _nbind.commitBuffer = commitBuffer;
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
