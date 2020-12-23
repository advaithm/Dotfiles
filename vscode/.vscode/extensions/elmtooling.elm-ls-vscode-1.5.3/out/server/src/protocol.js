"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnDidRenameFilesRequest = exports.OnDidCreateFilesRequest = exports.UnexposeRequest = exports.ExposeRequest = exports.MoveRequest = exports.GetMoveDestinationRequest = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
exports.GetMoveDestinationRequest = new vscode_languageserver_1.RequestType("elm/getMoveDestinations");
exports.MoveRequest = new vscode_languageserver_1.RequestType("elm/move");
exports.ExposeRequest = new vscode_languageserver_1.RequestType("elm/expose");
exports.UnexposeRequest = new vscode_languageserver_1.RequestType("elm/unexpose");
exports.OnDidCreateFilesRequest = new vscode_languageserver_1.RequestType("elm/ondidCreateFiles");
exports.OnDidRenameFilesRequest = new vscode_languageserver_1.RequestType("elm/ondidRenameFiles");
//# sourceMappingURL=protocol.js.map