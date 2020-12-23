"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenameUtils = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const references_1 = require("./references");
const treeUtils_1 = require("./treeUtils");
class RenameUtils {
    static getRenameAffectedNodes(elmWorkspace, uri, position) {
        const forest = elmWorkspace.getForest();
        const tree = forest.getTree(uri);
        if (tree) {
            const nodeAtPosition = treeUtils_1.TreeUtils.getNamedDescendantForPosition(tree.rootNode, position);
            const definitionNode = treeUtils_1.TreeUtils.findDefinitionNodeByReferencingNode(nodeAtPosition, uri, tree, elmWorkspace);
            if (definitionNode) {
                const refTree = forest.getByUri(definitionNode.uri);
                if (refTree && refTree.writeable) {
                    return {
                        originalNode: nodeAtPosition,
                        references: references_1.References.find(definitionNode, elmWorkspace),
                    };
                }
                if (refTree && !refTree.writeable) {
                    throw new vscode_languageserver_1.ResponseError(1, "Can not rename, due to source being outside of you project.");
                }
            }
        }
    }
}
exports.RenameUtils = RenameUtils;
//# sourceMappingURL=renameUtils.js.map