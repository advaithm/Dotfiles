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
exports.registerCommand = void 0;
const vscode = require("vscode");
function registerCommand(langClients) {
    return vscode.commands.registerCommand("elm.commands.restart", () => __awaiter(this, void 0, void 0, function* () {
        for (const langClient of langClients.values()) {
            yield langClient.stop();
            langClient.start();
        }
    }));
}
exports.registerCommand = registerCommand;
//# sourceMappingURL=restart.js.map