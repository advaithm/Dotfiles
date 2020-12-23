"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoverProvider = void 0;
const tsyringe_1 = require("tsyringe");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const elmUtils_1 = require("../util/elmUtils");
const elmWorkspaceMatcher_1 = require("../util/elmWorkspaceMatcher");
const hintHelper_1 = require("../util/hintHelper");
const treeUtils_1 = require("../util/treeUtils");
class HoverProvider {
    constructor() {
        this.handleHoverRequest = (params, elmWorkspace) => {
            this.connection.console.info(`A hover was requested`);
            const forest = elmWorkspace.getForest();
            const tree = forest.getTree(params.textDocument.uri);
            if (tree) {
                const nodeAtPosition = treeUtils_1.TreeUtils.getNamedDescendantForPosition(tree.rootNode, params.position);
                let definitionNode = treeUtils_1.TreeUtils.findDefinitionNodeByReferencingNode(nodeAtPosition, params.textDocument.uri, tree, elmWorkspace);
                if (definitionNode) {
                    if (definitionNode.nodeType === "Function" &&
                        definitionNode.node.parent) {
                        definitionNode = {
                            node: definitionNode.node.parent,
                            uri: definitionNode.uri,
                            nodeType: definitionNode.nodeType,
                        };
                    }
                    return this.createMarkdownHoverFromDefinition(definitionNode);
                }
                else {
                    const specialMatch = elmUtils_1.getEmptyTypes().find((a) => a.name === nodeAtPosition.text);
                    if (specialMatch) {
                        return {
                            contents: {
                                kind: vscode_languageserver_1.MarkupKind.Markdown,
                                value: specialMatch.markdown,
                            },
                        };
                    }
                }
            }
        };
        this.connection = tsyringe_1.container.resolve("Connection");
        this.connection.onHover(new elmWorkspaceMatcher_1.ElmWorkspaceMatcher((param) => vscode_uri_1.URI.parse(param.textDocument.uri)).handlerForWorkspace(this.handleHoverRequest));
    }
    createMarkdownHoverFromDefinition(definitionNode) {
        if (definitionNode) {
            const value = definitionNode.nodeType === "FunctionParameter" ||
                definitionNode.nodeType === "AnonymousFunctionParameter" ||
                definitionNode.nodeType === "CasePattern"
                ? hintHelper_1.HintHelper.createHintFromFunctionParameter(definitionNode.node)
                : hintHelper_1.HintHelper.createHint(definitionNode.node);
            if (value) {
                return {
                    contents: {
                        kind: vscode_languageserver_1.MarkupKind.Markdown,
                        value,
                    },
                };
            }
        }
    }
}
exports.HoverProvider = HoverProvider;
//# sourceMappingURL=hoverProvider.js.map