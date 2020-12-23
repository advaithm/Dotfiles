"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElmDiagnosticsHelper = void 0;
const path_1 = __importDefault(require("path"));
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
class ElmDiagnosticsHelper {
    static issuesToDiagnosticMap(issues, elmWorkspaceFolder) {
        return issues.reduce((acc, issue) => {
            var _a;
            const uri = this.getUriFromIssue(issue, elmWorkspaceFolder);
            const diagnostic = this.elmMakeIssueToDiagnostic(issue);
            const arr = (_a = acc.get(uri)) !== null && _a !== void 0 ? _a : [];
            arr.push(diagnostic);
            acc.set(uri, arr);
            return acc;
        }, new Map());
    }
    static severityStringToDiagnosticSeverity(severity) {
        switch (severity) {
            case "error":
                return vscode_languageserver_1.DiagnosticSeverity.Error;
            case "warning":
                return vscode_languageserver_1.DiagnosticSeverity.Warning;
            default:
                return vscode_languageserver_1.DiagnosticSeverity.Error;
        }
    }
    static getUriFromIssue(issue, elmWorkspaceFolder) {
        return vscode_uri_1.URI.file(path_1.default.join(elmWorkspaceFolder.fsPath, issue.file)).toString();
    }
    static elmMakeIssueToDiagnostic(issue) {
        const lineRange = vscode_languageserver_1.Range.create(issue.region.start.line - 1, issue.region.start.column - 1, issue.region.end.line - 1, issue.region.end.column - 1);
        const messagePrefix = issue.overview ? `${issue.overview} - ` : "";
        return vscode_languageserver_1.Diagnostic.create(lineRange, `${messagePrefix}${issue.details.replace(/\[\d+m/g, "")}`, this.severityStringToDiagnosticSeverity(issue.type), undefined, "Elm");
    }
}
exports.ElmDiagnosticsHelper = ElmDiagnosticsHelper;
//# sourceMappingURL=elmDiagnosticsHelper.js.map