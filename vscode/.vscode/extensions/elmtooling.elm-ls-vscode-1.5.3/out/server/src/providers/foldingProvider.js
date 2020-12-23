"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoldingRangeProvider = void 0;
const tsyringe_1 = require("tsyringe");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const elmWorkspaceMatcher_1 = require("../util/elmWorkspaceMatcher");
class FoldingRangeProvider {
    constructor() {
        this.REGION_CONSTRUCTS = new Set([
            "case_of_expr",
            "value_declaration",
            "type_alias_declaration",
            "type_declaration",
            "record_expr",
            "case_of_branch",
        ]);
        this.handleFoldingRange = (param, elmWorkspace) => {
            this.connection.console.info(`Folding ranges were requested`);
            const folds = [];
            const forest = elmWorkspace.getForest();
            const tree = forest.getTree(param.textDocument.uri);
            const findLastIdenticalNamedSibling = (node) => {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    if (node.nextNamedSibling &&
                        node.nextNamedSibling.type === "import_clause") {
                        node = node.nextNamedSibling;
                    }
                    else {
                        return node;
                    }
                }
            };
            const traverse = (node) => {
                if (node.parent && node.parent.lastChild && node.isNamed) {
                    if ("import_clause" === node.type) {
                        if (node.previousNamedSibling === null ||
                            node.previousNamedSibling.type !== "import_clause") {
                            const lastNode = findLastIdenticalNamedSibling(node);
                            folds.push({
                                endCharacter: lastNode.endPosition.column,
                                endLine: lastNode.endPosition.row,
                                kind: vscode_languageserver_1.FoldingRangeKind.Imports,
                                startCharacter: node.startPosition.column,
                                startLine: node.startPosition.row,
                            });
                        }
                    }
                    else if (node.type === "let_in_expr") {
                        // Use fields in the future
                        const valueDeclarations = node.namedChildren.filter((n) => n.type === "value_declaration");
                        const lastValueDeclaration = valueDeclarations[valueDeclarations.length - 1];
                        const letBody = node.lastNamedChild;
                        if (lastValueDeclaration) {
                            folds.push({
                                endCharacter: lastValueDeclaration.endPosition.column,
                                endLine: lastValueDeclaration.endPosition.row,
                                kind: vscode_languageserver_1.FoldingRangeKind.Region,
                                startCharacter: node.startPosition.column,
                                startLine: node.startPosition.row,
                            });
                        }
                        if (letBody) {
                            folds.push({
                                endCharacter: node.endPosition.column,
                                endLine: node.endPosition.row,
                                kind: vscode_languageserver_1.FoldingRangeKind.Region,
                                startCharacter: letBody.startPosition.column,
                                startLine: letBody.startPosition.row - 1,
                            });
                        }
                    }
                    else if (node.type === "if_else_expr") {
                        node.namedChildren.slice(1).forEach((child) => {
                            folds.push({
                                endCharacter: child.endPosition.column,
                                endLine: child.endPosition.row,
                                kind: vscode_languageserver_1.FoldingRangeKind.Region,
                                startCharacter: child.startPosition.column,
                                startLine: child.startPosition.row - 1,
                            });
                        });
                    }
                    else if (this.REGION_CONSTRUCTS.has(node.type)) {
                        folds.push({
                            endCharacter: node.endPosition.column,
                            endLine: node.endPosition.row,
                            kind: vscode_languageserver_1.FoldingRangeKind.Region,
                            startCharacter: node.startPosition.column,
                            startLine: node.startPosition.row,
                        });
                    }
                    else if ("block_comment" === node.type) {
                        folds.push({
                            endCharacter: node.endPosition.column,
                            endLine: node.endPosition.row,
                            kind: vscode_languageserver_1.FoldingRangeKind.Comment,
                            startCharacter: node.startPosition.column,
                            startLine: node.startPosition.row,
                        });
                    }
                }
                for (const childNode of node.children) {
                    traverse(childNode);
                }
            };
            if (tree) {
                traverse(tree.rootNode);
            }
            this.connection.console.info(`Returned ${folds.length} folding ranges`);
            return folds;
        };
        this.connection = tsyringe_1.container.resolve("Connection");
        this.connection.onFoldingRanges(new elmWorkspaceMatcher_1.ElmWorkspaceMatcher((param) => vscode_uri_1.URI.parse(param.textDocument.uri)).handlerForWorkspace(this.handleFoldingRange));
    }
}
exports.FoldingRangeProvider = FoldingRangeProvider;
//# sourceMappingURL=foldingProvider.js.map