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
    context.subscriptions.push(vscode_1.commands.registerCommand("elm.refactor", (command, params, commandInfo) => __awaiter(this, void 0, void 0, function* () {
        if (command === "moveFunction") {
            yield moveFunction(languageClient, params, commandInfo);
        }
    })));
}
exports.registerCommands = registerCommands;
function moveFunction(languageClient, params, commandInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const moveDestinations = yield languageClient.sendRequest(protocol_1.GetMoveDestinationRequest, {
            sourceUri: params.textDocument.uri,
            params,
        });
        if (!moveDestinations ||
            !moveDestinations.destinations ||
            !moveDestinations.destinations.length) {
            void vscode_1.window.showErrorMessage("Cannot find possible file targets to move the selected method to.");
            return;
        }
        const destinationNodeItems = moveDestinations.destinations.map((destination) => {
            return {
                label: destination.name,
                description: destination.path,
                destination,
            };
        });
        const functionName = commandInfo || "";
        const selected = yield vscode_1.window.showQuickPick(destinationNodeItems, {
            placeHolder: `Select the new file for the function ${functionName}.`,
        });
        if (!selected) {
            return;
        }
        yield languageClient.sendRequest(protocol_1.MoveRequest, {
            sourceUri: params.textDocument.uri,
            params,
            destination: selected.destination,
        });
    });
}
//# sourceMappingURL=refactorAction.js.map