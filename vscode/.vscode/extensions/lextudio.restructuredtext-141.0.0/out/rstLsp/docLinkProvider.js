"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class DocumentLinkProvider {
    constructor(client) {
        this.client = client;
    }
    // Provides the text document with the ranges for document links
    provideDocumentLinks(document, token) {
        let result = this._findDocLinks(document, token);
        const directives = ['image', 'figure', 'include', 'literalinclude'];
        for (const directive of directives) {
            result = result.concat(this._findDirectiveLinks(document, directive, token));
        }
        return result;
    }
    // Adds the target uri to the document link
    async resolveDocumentLink(link, token) {
        const activeTextEditor = vscode.window.activeTextEditor;
        if (!activeTextEditor) {
            return undefined;
        }
        const document = activeTextEditor.document;
        const text = document.getText(link.range);
        link.target = await this._findTargetUri(document, text);
        return link;
    }
    // Returns document links found within the current text document
    _findDocLinks(document, token) {
        const docText = document.getText();
        const docRoles = docText.match(/:doc:`.+?`/gs);
        if (docRoles === null) {
            return [];
        }
        const doclinks = [];
        let docRoleOffsetStart = -1; // Initiated to -1 to accommodate 0th index
        // For every doc role found, find their respective target
        for (const docRole of docRoles) {
            if (token.isCancellationRequested) {
                return [];
            }
            docRoleOffsetStart = docText.indexOf(docRole, docRoleOffsetStart + 1);
            // Find target in doc role
            // Check if target exists in the form :doc:`text <target-name>`
            let targetMatches = docRole.match(/(?<=<)\S+(?=>)/);
            // If target not found, target should exist in the form :doc:`target-name`
            if (targetMatches === null) {
                targetMatches = docRole.match(/(?<=`)\S+(?=`)/);
            }
            if (!targetMatches) {
                continue;
            }
            const target = targetMatches[0];
            const targetIndex = docRole.indexOf(target);
            // Get range of the target within the scope of the whole text document
            const targetOffsetStart = docRoleOffsetStart + targetIndex;
            const targetOffsetEnd = targetOffsetStart + target.length;
            doclinks.push({
                range: new vscode.Range(document.positionAt(targetOffsetStart), document.positionAt(targetOffsetEnd))
            });
        }
        return doclinks;
    }
    _findDirectiveLinks(document, directive, token) {
        const header = `.. ${directive}::`;
        const docText = document.getText();
        const expression = new RegExp(`${header}\\s+<?([^\\n]+)>?(\\r)?\\n`, 'gs');
        const docRoles = docText.match(expression);
        if (docRoles === null) {
            return [];
        }
        const doclinks = [];
        let docRoleOffsetStart = -1; // Initiated to -1 to accommodate 0th index
        // For every doc role found, find their respective target
        for (const docRole of docRoles) {
            if (token.isCancellationRequested) {
                return [];
            }
            docRoleOffsetStart = docText.indexOf(docRole, docRoleOffsetStart + 1);
            // Find target in doc role
            // If target not found, target should exist in the form :doc:`target-name`
            let target = docRole.substring(header.length).trim();
            target = target.startsWith('<') ? target.substring(1, target.length - 1) : target;
            const targetIndex = docRole.indexOf(target);
            // Get range of the target within the scope of the whole text document
            const targetOffsetStart = docRoleOffsetStart + targetIndex;
            const targetOffsetEnd = targetOffsetStart + target.length;
            doclinks.push({
                range: new vscode.Range(document.positionAt(targetOffsetStart), document.positionAt(targetOffsetEnd))
            });
        }
        return doclinks;
    }
    // Returns the full uri given a target's name
    async _findTargetUri(document, target) {
        const file = await this.client
            .sendRequest('textDocument/resolve', {
            docPath: document.uri.path,
            fileName: target,
            resolveType: 'doc'
        });
        return vscode.Uri.file(file);
    }
}
exports.DocumentLinkProvider = DocumentLinkProvider;
//# sourceMappingURL=docLinkProvider.js.map