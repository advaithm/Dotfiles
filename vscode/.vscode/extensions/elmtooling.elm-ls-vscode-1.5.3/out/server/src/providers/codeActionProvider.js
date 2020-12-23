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
exports.CodeActionProvider = void 0;
const typeInference_1 = require("../util/types/typeInference");
const typeRenderer_1 = require("../util/types/typeRenderer");
const tsyringe_1 = require("tsyringe");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const elmWorkspaceMatcher_1 = require("../util/elmWorkspaceMatcher");
const refactorEditUtils_1 = require("../util/refactorEditUtils");
const treeUtils_1 = require("../util/treeUtils");
const elmAnalyseDiagnostics_1 = require("./diagnostics/elmAnalyseDiagnostics");
const elmMakeDiagnostics_1 = require("./diagnostics/elmMakeDiagnostics");
const typeInferenceDiagnostics_1 = require("./diagnostics/typeInferenceDiagnostics");
const exposeUnexposeHandler_1 = require("./handlers/exposeUnexposeHandler");
const moveRefactoringHandler_1 = require("./handlers/moveRefactoringHandler");
class CodeActionProvider {
    constructor() {
        var _a;
        this.elmAnalyse = null;
        this.settings = tsyringe_1.container.resolve("Settings");
        this.clientSettings = tsyringe_1.container.resolve("ClientSettings");
        if (this.clientSettings.elmAnalyseTrigger !== "never") {
            this.elmAnalyse = tsyringe_1.container.resolve(elmAnalyseDiagnostics_1.ElmAnalyseDiagnostics);
        }
        this.elmMake = tsyringe_1.container.resolve(elmMakeDiagnostics_1.ElmMakeDiagnostics);
        this.functionTypeAnnotationDiagnostics = tsyringe_1.container.resolve(typeInferenceDiagnostics_1.TypeInferenceDiagnostics);
        this.connection = tsyringe_1.container.resolve("Connection");
        this.onCodeAction = this.onCodeAction.bind(this);
        this.onExecuteCommand = this.onExecuteCommand.bind(this);
        this.connection.onCodeAction(new elmWorkspaceMatcher_1.ElmWorkspaceMatcher((param) => vscode_uri_1.URI.parse(param.textDocument.uri)).handlerForWorkspace(this.onCodeAction.bind(this)));
        this.connection.onExecuteCommand(this.onExecuteCommand.bind(this));
        if ((_a = this.settings.extendedCapabilities) === null || _a === void 0 ? void 0 : _a.moveFunctionRefactoringSupport) {
            new moveRefactoringHandler_1.MoveRefactoringHandler();
        }
        new exposeUnexposeHandler_1.ExposeUnexposeHandler();
    }
    onCodeAction(params, elmWorkspace) {
        var _a;
        this.connection.console.info("A code action was requested");
        const analyse = (_a = (this.elmAnalyse && this.elmAnalyse.onCodeAction(params))) !== null && _a !== void 0 ? _a : [];
        const make = this.elmMake.onCodeAction(params);
        const typeAnnotation = this.functionTypeAnnotationDiagnostics.onCodeAction(params);
        return [
            ...this.getRefactorCodeActions(params, elmWorkspace),
            ...this.getTypeAnnotationCodeActions(params, elmWorkspace),
            ...analyse,
            ...make,
            ...typeAnnotation,
        ];
    }
    onExecuteCommand(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.connection.console.info("A command execution was requested");
            return this.elmAnalyse && this.elmAnalyse.onExecuteCommand(params);
        });
    }
    getTypeAnnotationCodeActions(params, elmWorkspace) {
        // Top level annotation are handled by diagnostics
        var _a;
        const codeActions = [];
        const forest = elmWorkspace.getForest();
        const tree = forest.getTree(params.textDocument.uri);
        if (tree) {
            const nodeAtPosition = treeUtils_1.TreeUtils.getNamedDescendantForPosition(tree.rootNode, params.range.start);
            if (((_a = nodeAtPosition.parent) === null || _a === void 0 ? void 0 : _a.type) === "function_declaration_left" &&
                treeUtils_1.TreeUtils.findParentOfType("let_in_expr", nodeAtPosition) &&
                nodeAtPosition.parent.parent &&
                !treeUtils_1.TreeUtils.getTypeAnnotation(nodeAtPosition.parent.parent)) {
                const typeString = typeRenderer_1.TypeRenderer.typeToString(typeInference_1.findType(nodeAtPosition.parent, params.textDocument.uri, elmWorkspace), nodeAtPosition.tree, params.textDocument.uri, elmWorkspace.getImports());
                codeActions.push({
                    edit: {
                        changes: {
                            [params.textDocument.uri]: [
                                vscode_languageserver_1.TextEdit.insert({
                                    line: nodeAtPosition.startPosition.row,
                                    character: nodeAtPosition.startPosition.column,
                                }, `${nodeAtPosition.text} : ${typeString}\n${Array(nodeAtPosition.startPosition.column + 1).join(" ")}`),
                            ],
                        },
                    },
                    kind: vscode_languageserver_1.CodeActionKind.QuickFix,
                    title: "Add inferred annotation",
                });
            }
        }
        return codeActions;
    }
    getRefactorCodeActions(params, elmWorkspace) {
        const codeActions = [];
        const forest = elmWorkspace.getForest();
        const tree = forest.getTree(params.textDocument.uri);
        if (tree) {
            const nodeAtPosition = treeUtils_1.TreeUtils.getNamedDescendantForPosition(tree.rootNode, params.range.start);
            codeActions.push(...this.getFunctionCodeActions(params, tree, nodeAtPosition), ...this.getTypeAliasCodeActions(params, tree, nodeAtPosition), ...this.getMakeDeclarationFromUsageCodeActions(params, elmWorkspace, nodeAtPosition));
        }
        return codeActions;
    }
    getFunctionCodeActions(params, tree, nodeAtPosition) {
        var _a, _b, _c;
        const codeActions = [];
        if ((((_a = nodeAtPosition.parent) === null || _a === void 0 ? void 0 : _a.type) === "type_annotation" ||
            ((_b = nodeAtPosition.parent) === null || _b === void 0 ? void 0 : _b.type) === "function_declaration_left") &&
            !treeUtils_1.TreeUtils.findParentOfType("let_in_expr", nodeAtPosition)) {
            const functionName = nodeAtPosition.text;
            if ((_c = this.settings.extendedCapabilities) === null || _c === void 0 ? void 0 : _c.moveFunctionRefactoringSupport) {
                codeActions.push({
                    title: "Move Function",
                    command: {
                        title: "Refactor",
                        command: "elm.refactor",
                        arguments: ["moveFunction", params, functionName],
                    },
                    kind: vscode_languageserver_1.CodeActionKind.RefactorRewrite,
                });
            }
            if (treeUtils_1.TreeUtils.isExposedFunction(tree, functionName)) {
                const edit = refactorEditUtils_1.RefactorEditUtils.unexposedValueInModule(tree, functionName);
                if (edit) {
                    codeActions.push({
                        title: "Unexpose Function",
                        edit: {
                            changes: {
                                [params.textDocument.uri]: [edit],
                            },
                        },
                        kind: vscode_languageserver_1.CodeActionKind.Refactor,
                    });
                }
            }
            else {
                const edit = refactorEditUtils_1.RefactorEditUtils.exposeValueInModule(tree, functionName);
                if (edit) {
                    codeActions.push({
                        title: "Expose Function",
                        edit: {
                            changes: {
                                [params.textDocument.uri]: [edit],
                            },
                        },
                        kind: vscode_languageserver_1.CodeActionKind.Refactor,
                    });
                }
            }
        }
        return codeActions;
    }
    getTypeAliasCodeActions(params, tree, nodeAtPosition) {
        var _a, _b, _c;
        const codeActions = [];
        if (nodeAtPosition.type === "upper_case_identifier" &&
            (((_a = nodeAtPosition.parent) === null || _a === void 0 ? void 0 : _a.type) === "type_alias_declaration" ||
                ((_b = nodeAtPosition.parent) === null || _b === void 0 ? void 0 : _b.type) === "type_declaration")) {
            const typeName = nodeAtPosition.text;
            const alias = ((_c = nodeAtPosition.parent) === null || _c === void 0 ? void 0 : _c.type) === "type_alias_declaration"
                ? " Alias"
                : "";
            if (treeUtils_1.TreeUtils.isExposedTypeOrTypeAlias(tree, typeName)) {
                const edit = refactorEditUtils_1.RefactorEditUtils.unexposedValueInModule(tree, typeName);
                if (edit) {
                    codeActions.push({
                        title: `Unexpose Type${alias}`,
                        edit: {
                            changes: {
                                [params.textDocument.uri]: [edit],
                            },
                        },
                        kind: vscode_languageserver_1.CodeActionKind.Refactor,
                    });
                }
            }
            else {
                const edit = refactorEditUtils_1.RefactorEditUtils.exposeValueInModule(tree, typeName);
                if (edit) {
                    codeActions.push({
                        title: `Expose Type${alias}`,
                        edit: {
                            changes: {
                                [params.textDocument.uri]: [edit],
                            },
                        },
                        kind: vscode_languageserver_1.CodeActionKind.Refactor,
                    });
                }
            }
        }
        return codeActions;
    }
    getMakeDeclarationFromUsageCodeActions(params, elmWorkspace, nodeAtPosition) {
        var _a, _b, _c, _d, _e, _f;
        const codeActions = [];
        if (nodeAtPosition.type === "lower_case_identifier" &&
            ((_b = (_a = nodeAtPosition.parent) === null || _a === void 0 ? void 0 : _a.parent) === null || _b === void 0 ? void 0 : _b.type) === "value_expr" && ((_d = (_c = nodeAtPosition.parent) === null || _c === void 0 ? void 0 : _c.parent) === null || _d === void 0 ? void 0 : _d.parent) &&
            ((_e = nodeAtPosition.previousSibling) === null || _e === void 0 ? void 0 : _e.type) !== "dot") {
            const funcName = nodeAtPosition.text;
            const tree = elmWorkspace.getForest().getTree(params.textDocument.uri);
            if (tree &&
                !((_f = treeUtils_1.TreeUtils.findAllTopLevelFunctionDeclarations(tree)) === null || _f === void 0 ? void 0 : _f.some((a) => {
                    var _a, _b, _c;
                    return ((_a = a.firstChild) === null || _a === void 0 ? void 0 : _a.text) == funcName ||
                        ((_c = (_b = a.firstChild) === null || _b === void 0 ? void 0 : _b.firstChild) === null || _c === void 0 ? void 0 : _c.text) == funcName;
                }))) {
                const insertLineNumber = refactorEditUtils_1.RefactorEditUtils.findLineNumberAfterCurrentFunction(nodeAtPosition);
                const typeString = typeRenderer_1.TypeRenderer.typeToString(typeInference_1.findType(nodeAtPosition, params.textDocument.uri, elmWorkspace), nodeAtPosition.tree, params.textDocument.uri, elmWorkspace.getImports());
                const edit = refactorEditUtils_1.RefactorEditUtils.createTopLevelFunction(insertLineNumber !== null && insertLineNumber !== void 0 ? insertLineNumber : tree.rootNode.endPosition.row, funcName, typeString, treeUtils_1.TreeUtils.findParentOfType("function_call_expr", nodeAtPosition));
                if (edit) {
                    codeActions.push({
                        title: `Create local function`,
                        edit: {
                            changes: {
                                [params.textDocument.uri]: [edit],
                            },
                        },
                        kind: vscode_languageserver_1.CodeActionKind.QuickFix,
                    });
                }
            }
        }
        return codeActions;
    }
}
exports.CodeActionProvider = CodeActionProvider;
//# sourceMappingURL=codeActionProvider.js.map