"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommands = void 0;
const vscode_1 = require("vscode");
const protocol_1 = require("./protocol");
function registerCommands(languageClient, context) {
    context.subscriptions.push(vscode_1.commands.registerCommand("elm.expose", (params) => __awaiter(this, void 0, void 0, function* () {
        yield expose(languageClient, params);
    })));
    context.subscriptions.push(vscode_1.commands.registerCommand("elm.unexpose", (params) => __awaiter(this, void 0, void 0, function* () {
        yield unexpose(languageClient, params);
    })));
}
exports.registerCommands = registerCommands;
function expose(languageClient, params) {
    return __awaiter(this, void 0, void 0, function* () {
        yield languageClient.sendRequest(protocol_1.ExposeRequest, params);
    });
}
function unexpose(languageClient, params) {
    return __awaiter(this, void 0, void 0, function* () {
        yield languageClient.sendRequest(protocol_1.UnexposeRequest, params);
    });
}
//# sourceMappingURL=exposeUnexposeAction.js.map