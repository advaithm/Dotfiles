"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const LLDB_1 = require("./LLDB");
const VSCodeServer_1 = require("./VSCodeServer");
const MiddlewareProtocol_1 = require("./MiddlewareProtocol");
class MiddlewareDap {
    constructor(logger) {
        this.logger = logger;
        this.lldbVSCode = LLDB_1.spawnLLDBVSCode(this.logger);
        this.vscodeServer = VSCodeServer_1.createVSCodeServer(this.logger, () => this.dispose(), (vscodeSocket) => __awaiter(this, void 0, void 0, function* () {
            const lldbSocket = yield this.lldbVSCode.connect();
            MiddlewareProtocol_1.startCommunication(this.logger, lldbSocket, vscodeSocket);
        }));
    }
    getVSCodePort() {
        return this.vscodeServer.address().port;
    }
    dispose() {
        this.vscodeServer.close();
        this.lldbVSCode.dispose();
    }
}
exports.MiddlewareDap = MiddlewareDap;
//# sourceMappingURL=MiddlewareDap.js.map