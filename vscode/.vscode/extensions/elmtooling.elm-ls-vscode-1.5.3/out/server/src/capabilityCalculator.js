"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapabilityCalculator = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const ElmAnalyseDiagnostics = __importStar(require("./providers/diagnostics/elmAnalyseDiagnostics"));
const ElmMakeDiagnostics = __importStar(require("./providers/diagnostics/elmMakeDiagnostics"));
class CapabilityCalculator {
    constructor(clientCapabilities) {
        this.clientCapabilities = clientCapabilities;
    }
    get capabilities() {
        this.clientCapabilities;
        return {
            codeActionProvider: true,
            codeLensProvider: {
                resolveProvider: true,
            },
            completionProvider: {
                triggerCharacters: ["."],
            },
            definitionProvider: true,
            documentFormattingProvider: true,
            documentSymbolProvider: true,
            executeCommandProvider: {
                commands: [
                    ElmAnalyseDiagnostics.CODE_ACTION_ELM_ANALYSE,
                    ElmAnalyseDiagnostics.CODE_ACTION_ELM_ANALYSE_FIX_ALL,
                    ElmMakeDiagnostics.CODE_ACTION_ELM_MAKE,
                ],
            },
            foldingRangeProvider: true,
            hoverProvider: true,
            referencesProvider: true,
            renameProvider: {
                prepareProvider: true,
            },
            selectionRangeProvider: true,
            textDocumentSync: vscode_languageserver_1.TextDocumentSyncKind.Incremental,
            workspaceSymbolProvider: true,
        };
    }
}
exports.CapabilityCalculator = CapabilityCalculator;
//# sourceMappingURL=capabilityCalculator.js.map