"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentSymbolProvider = void 0;
const tsyringe_1 = require("tsyringe");
const vscode_uri_1 = require("vscode-uri");
const elmWorkspaceMatcher_1 = require("../util/elmWorkspaceMatcher");
const symbolTranslator_1 = require("../util/symbolTranslator");
class DocumentSymbolProvider {
    constructor() {
        this.handleDocumentSymbolRequest = (param, elmWorkspace) => {
            this.connection.console.info(`Document Symbols were requested`);
            const symbolInformationList = [];
            const forest = elmWorkspace.getForest();
            const tree = forest.getTree(param.textDocument.uri);
            const traverse = (node) => {
                const symbolInformation = symbolTranslator_1.SymbolInformationTranslator.translateNodeToSymbolInformation(param.textDocument.uri, node);
                if (symbolInformation) {
                    symbolInformationList.push(symbolInformation);
                }
                for (const childNode of node.children) {
                    traverse(childNode);
                }
            };
            if (tree) {
                traverse(tree.rootNode);
            }
            return symbolInformationList;
        };
        this.connection = tsyringe_1.container.resolve("Connection");
        this.connection.onDocumentSymbol(new elmWorkspaceMatcher_1.ElmWorkspaceMatcher((param) => vscode_uri_1.URI.parse(param.textDocument.uri)).handlerForWorkspace(this.handleDocumentSymbolRequest));
    }
}
exports.DocumentSymbolProvider = DocumentSymbolProvider;
//# sourceMappingURL=documentSymbolProvider.js.map