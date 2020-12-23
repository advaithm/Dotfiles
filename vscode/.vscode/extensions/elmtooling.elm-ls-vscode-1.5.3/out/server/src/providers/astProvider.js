"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTProvider = void 0;
const fs_1 = require("fs");
const tsyringe_1 = require("tsyringe");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const elmWorkspaceMatcher_1 = require("../util/elmWorkspaceMatcher");
const fileEventsHandler_1 = require("./handlers/fileEventsHandler");
const textDocumentEvents_1 = require("../util/textDocumentEvents");
const treeUtils_1 = require("../util/treeUtils");
class ASTProvider {
    constructor() {
        this.treeChangeEvent = new vscode_languageserver_1.Emitter();
        this.onTreeChange = this
            .treeChangeEvent.event;
        this.handleChangeTextDocument = (params, elmWorkspace) => {
            var _a, _b;
            this.connection.console.info(`Changed text document, going to parse it. ${params.textDocument.uri}`);
            const forest = elmWorkspace.getForest();
            const imports = elmWorkspace.getImports();
            const document = params.textDocument;
            let tree = forest.getTree(document.uri);
            if ("contentChanges" in params) {
                for (const change of params.contentChanges) {
                    if ("range" in change) {
                        tree === null || tree === void 0 ? void 0 : tree.edit(this.getEditFromChange(change, tree.rootNode.text));
                    }
                }
            }
            const newText = (_b = (_a = this.documentEvents.get(params.textDocument.uri)) === null || _a === void 0 ? void 0 : _a.getText()) !== null && _b !== void 0 ? _b : fs_1.readFileSync(vscode_uri_1.URI.parse(document.uri).fsPath, "utf8");
            const newTree = this.parser.parse(newText, tree);
            tree === null || tree === void 0 ? void 0 : tree.getChangedRanges(newTree).map((range) => [
                tree === null || tree === void 0 ? void 0 : tree.rootNode.descendantForPosition(range.startPosition),
                tree === null || tree === void 0 ? void 0 : tree.rootNode.descendantForPosition(range.endPosition),
            ]).map(([startNode, endNode]) => [
                startNode
                    ? treeUtils_1.TreeUtils.findParentOfType("value_declaration", startNode)
                    : undefined,
                endNode
                    ? treeUtils_1.TreeUtils.findParentOfType("value_declaration", endNode)
                    : undefined,
            ]).forEach(([startNode, endNode]) => {
                if (startNode &&
                    endNode &&
                    startNode.id === endNode.id &&
                    treeUtils_1.TreeUtils.getTypeAnnotation(startNode)) {
                    elmWorkspace.getTypeCache().invalidateValueDeclaration(startNode);
                }
                else {
                    elmWorkspace.getTypeCache().invalidateProject();
                }
            });
            tree = newTree;
            if (tree) {
                forest.setTree(document.uri, true, true, tree, true);
                // Figure out if we have files importing our changed file - update them
                const urisToRefresh = [];
                for (const uri in imports.imports) {
                    if (imports.imports.hasOwnProperty(uri)) {
                        const fileImports = imports.imports[uri];
                        if (fileImports.some((a) => a.fromUri === document.uri)) {
                            urisToRefresh.push(uri);
                        }
                    }
                }
                urisToRefresh.forEach((a) => {
                    imports.updateImports(a, forest.getTree(a), forest);
                });
                // Refresh imports of the calling file
                imports.updateImports(document.uri, tree, forest);
                this.treeChangeEvent.fire({ uri: document.uri, tree });
            }
        };
        this.parser = tsyringe_1.container.resolve("Parser");
        this.connection = tsyringe_1.container.resolve("Connection");
        this.documentEvents = tsyringe_1.container.resolve(textDocumentEvents_1.TextDocumentEvents);
        new fileEventsHandler_1.FileEventsHandler();
        this.documentEvents.on("change", new elmWorkspaceMatcher_1.ElmWorkspaceMatcher((params) => vscode_uri_1.URI.parse(params.textDocument.uri)).handlerForWorkspace(this.handleChangeTextDocument));
        this.documentEvents.on("open", new elmWorkspaceMatcher_1.ElmWorkspaceMatcher((params) => vscode_uri_1.URI.parse(params.textDocument.uri)).handlerForWorkspace(this.handleChangeTextDocument));
    }
    getEditFromChange(change, text) {
        const [startIndex, endIndex] = this.getIndexesFromRange(change.range, text);
        return {
            startIndex,
            oldEndIndex: endIndex,
            newEndIndex: startIndex + change.text.length,
            startPosition: this.toTSPoint(change.range.start),
            oldEndPosition: this.toTSPoint(change.range.end),
            newEndPosition: this.toTSPoint(this.addPositions(change.range.start, this.textToPosition(change.text))),
        };
    }
    textToPosition(text) {
        const lines = text.split(/\r\n|\r|\n/);
        return {
            line: lines.length - 1,
            character: lines[lines.length - 1].length,
        };
    }
    getIndexesFromRange(range, text) {
        let startIndex = range.start.character;
        let endIndex = range.end.character;
        const regex = new RegExp(/\r\n|\r|\n/);
        const eolResult = regex.exec(text);
        const lines = text.split(regex);
        const eol = eolResult && eolResult.length > 0 ? eolResult[0] : "";
        for (let i = 0; i < range.end.line; i++) {
            if (i < range.start.line) {
                startIndex += lines[i].length + eol.length;
            }
            endIndex += lines[i].length + eol.length;
        }
        return [startIndex, endIndex];
    }
    addPositions(pos1, pos2) {
        return {
            line: pos1.line + pos2.line,
            character: pos1.character + pos2.character,
        };
    }
    toTSPoint(position) {
        return { row: position.line, column: position.character };
    }
}
exports.ASTProvider = ASTProvider;
//# sourceMappingURL=astProvider.js.map