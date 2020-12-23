"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefinitionProvider = void 0;
const tsyringe_1 = require("tsyringe");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const elmWorkspaceMatcher_1 = require("../util/elmWorkspaceMatcher");
const treeUtils_1 = require("../util/treeUtils");
class DefinitionProvider {
    constructor() {
        this.handleDefinitionRequest = (param, elmWorkspace) => {
            this.connection.console.info(`A definition was requested`);
            const forest = elmWorkspace.getForest();
            const tree = forest.getTree(param.textDocument.uri);
            if (tree) {
                const nodeAtPosition = treeUtils_1.TreeUtils.getNamedDescendantForPosition(tree.rootNode, param.position);
                const definitionNode = treeUtils_1.TreeUtils.findDefinitionNodeByReferencingNode(nodeAtPosition, param.textDocument.uri, tree, elmWorkspace);
                if (definitionNode) {
                    return this.createLocationFromDefinition(definitionNode.node, definitionNode.uri);
                }
            }
        };
        this.connection = tsyringe_1.container.resolve("Connection");
        this.connection.onDefinition(new elmWorkspaceMatcher_1.ElmWorkspaceMatcher((param) => vscode_uri_1.URI.parse(param.textDocument.uri)).handlerForWorkspace(this.handleDefinitionRequest));
    }
    createLocationFromDefinition(definitionNode, uri) {
        if (definitionNode) {
            return vscode_languageserver_1.Location.create(uri, vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(definitionNode.startPosition.row, definitionNode.startPosition.column), vscode_languageserver_1.Position.create(definitionNode.endPosition.row, definitionNode.endPosition.column)));
        }
    }
}
exports.DefinitionProvider = DefinitionProvider;
//# sourceMappingURL=definitionProvider.js.map