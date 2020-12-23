"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionProvider = void 0;
const typeInference_1 = require("../util/types/typeInference");
const typeRenderer_1 = require("../util/types/typeRenderer");
const tsyringe_1 = require("tsyringe");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const positionUtil_1 = require("../positionUtil");
const elmUtils_1 = require("../util/elmUtils");
const elmWorkspaceMatcher_1 = require("../util/elmWorkspaceMatcher");
const hintHelper_1 = require("../util/hintHelper");
const importUtils_1 = require("../util/importUtils");
const refactorEditUtils_1 = require("../util/refactorEditUtils");
const treeUtils_1 = require("../util/treeUtils");
const ranking_1 = __importDefault(require("./ranking"));
class CompletionProvider {
    constructor() {
        this.qidRegex = /[a-zA-Z0-9.]+/;
        this.handleCompletionRequest = (params, elmWorkspace) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
            this.connection.console.info(`A completion was requested`);
            const completions = [];
            const forest = elmWorkspace.getForest();
            const tree = forest.getTree(params.textDocument.uri);
            if (tree) {
                const nodeAtPosition = treeUtils_1.TreeUtils.getNamedDescendantForPosition(tree.rootNode, params.position);
                const nodeAtLineBefore = treeUtils_1.TreeUtils.getNamedDescendantForLineBeforePosition(tree.rootNode, params.position);
                const nodeAtLineAfter = treeUtils_1.TreeUtils.getNamedDescendantForLineAfterPosition(tree.rootNode, params.position);
                const targetLine = tree.rootNode.text.split("\n")[params.position.line];
                let currentCharacter = params.position.character;
                while (currentCharacter - 1 >= 0 &&
                    this.qidRegex.test(targetLine[currentCharacter - 1])) {
                    currentCharacter--;
                }
                let replaceRange = vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(params.position.line, currentCharacter), params.position);
                const previousWord = this.findPreviousWord(currentCharacter, targetLine);
                const isAtStartOfLine = replaceRange.start.character === 0;
                let targetWord = targetLine.substring(replaceRange.start.character, replaceRange.end.character);
                let contextNode = treeUtils_1.TreeUtils.findPreviousNode(tree.rootNode, params.position);
                // If we are in a partial identifier, skip that and adjust the contextNode to be the previous node
                if (contextNode &&
                    positionUtil_1.comparePosition(params.position, contextNode.endPosition) <= 0 &&
                    treeUtils_1.TreeUtils.isIdentifier(contextNode)) {
                    contextNode = treeUtils_1.TreeUtils.findPreviousNode(tree.rootNode, positionUtil_1.PositionUtil.FROM_TS_POSITION(contextNode.startPosition).toVSPosition());
                }
                const isAfterDot = (contextNode === null || contextNode === void 0 ? void 0 : contextNode.type) === "dot";
                if (treeUtils_1.TreeUtils.findParentOfType("block_comment", nodeAtPosition) ||
                    treeUtils_1.TreeUtils.findParentOfType("line_comment", nodeAtPosition)) {
                    // Don't complete in comments
                    return [];
                }
                else if (isAtStartOfLine &&
                    nodeAtLineBefore.type === "lower_case_identifier" &&
                    nodeAtLineBefore.parent &&
                    nodeAtLineBefore.parent.type === "type_annotation") {
                    return [
                        this.createCompletion({
                            kind: vscode_languageserver_1.CompletionItemKind.Text,
                            label: nodeAtLineBefore.text,
                            range: replaceRange,
                            sortPrefix: "a",
                        }),
                    ];
                }
                else if (isAtStartOfLine &&
                    nodeAtLineAfter.type === "lower_case_identifier" &&
                    nodeAtLineAfter.parent &&
                    (nodeAtLineAfter.parent.type === "value_qid" ||
                        nodeAtLineAfter.parent.type === "function_declaration_left" ||
                        nodeAtLineAfter.parent.type === "lower_pattern")) {
                    return [
                        this.createCompletion({
                            kind: vscode_languageserver_1.CompletionItemKind.Text,
                            label: `${nodeAtLineAfter.text} : `,
                            range: replaceRange,
                            sortPrefix: "a",
                        }),
                    ];
                }
                else if (isAtStartOfLine) {
                    const topLevelFunctions = treeUtils_1.TreeUtils.findAllTopLevelFunctionDeclarations(tree);
                    const exposedValues = treeUtils_1.TreeUtils.descendantsOfType(tree.rootNode, "exposed_value");
                    const possibleMissingImplementations = treeUtils_1.TreeUtils.descendantsOfType(tree.rootNode, "function_call_expr")
                        .filter((a) => a.firstChild && !a.firstChild.text.includes("."))
                        .filter((a) => !exposedValues.some((b) => { var _a, _b; return ((_a = b.firstChild) === null || _a === void 0 ? void 0 : _a.text) === ((_b = a.firstChild) === null || _b === void 0 ? void 0 : _b.text); }))
                        .filter((a) => !(topLevelFunctions === null || topLevelFunctions === void 0 ? void 0 : topLevelFunctions.some((b) => { var _a, _b; return ((_a = b.firstChild) === null || _a === void 0 ? void 0 : _a.text) === ((_b = a.firstChild) === null || _b === void 0 ? void 0 : _b.text); })));
                    const snippetsFroMissingImplementations = possibleMissingImplementations.map((a) => this.createSnippet("func " + a.firstChild.text, [
                        a.firstChild.text + " : ${1:ArgumentType} -> ${2:ReturnType}",
                        a.firstChild.text + " ${3:arguments} =",
                        "    ${4}",
                    ], "Function with type annotation"));
                    return [
                        ...snippetsFroMissingImplementations,
                        ...possibleMissingImplementations.map((a) => this.createCompletion({
                            kind: vscode_languageserver_1.CompletionItemKind.Text,
                            label: a.firstChild.text,
                            range: replaceRange,
                            sortPrefix: "a",
                        })),
                        ...this.getKeywordsStartOfLine(),
                        ...this.createSnippetsStartOfLine(),
                    ];
                }
                else if (previousWord && previousWord === "module") {
                    return undefined;
                }
                else if (nodeAtPosition.parent &&
                    nodeAtPosition.parent.type === "module_declaration" &&
                    nodeAtPosition &&
                    nodeAtPosition.type === "exposing_list") {
                    return this.getSameFileTopLevelCompletions(tree, replaceRange, true);
                }
                else if (nodeAtPosition.parent &&
                    nodeAtPosition.parent.type === "exposing_list" &&
                    nodeAtPosition.parent.parent &&
                    nodeAtPosition.parent.parent.type === "module_declaration" &&
                    nodeAtPosition &&
                    (nodeAtPosition.type === "comma" ||
                        nodeAtPosition.type === "right_parenthesis")) {
                    return this.getSameFileTopLevelCompletions(tree, replaceRange, true);
                }
                else if (((_a = nodeAtPosition.parent) === null || _a === void 0 ? void 0 : _a.type) === "exposing_list" &&
                    ((_b = nodeAtPosition.parent.parent) === null || _b === void 0 ? void 0 : _b.type) === "import_clause" &&
                    ((_c = nodeAtPosition.parent.firstNamedChild) === null || _c === void 0 ? void 0 : _c.type) === "exposing") {
                    return this.getExposedFromModule(forest, nodeAtPosition.parent, replaceRange);
                }
                else if ((((_e = (_d = nodeAtPosition.parent) === null || _d === void 0 ? void 0 : _d.parent) === null || _e === void 0 ? void 0 : _e.type) === "exposing_list" &&
                    ((_h = (_g = (_f = nodeAtPosition.parent) === null || _f === void 0 ? void 0 : _f.parent) === null || _g === void 0 ? void 0 : _g.parent) === null || _h === void 0 ? void 0 : _h.type) === "import_clause" &&
                    ((_k = (_j = nodeAtPosition.parent) === null || _j === void 0 ? void 0 : _j.parent.firstNamedChild) === null || _k === void 0 ? void 0 : _k.type) === "exposing") ||
                    ((nodeAtPosition.type === "comma" ||
                        nodeAtPosition.type === "right_parenthesis") &&
                        ((_l = nodeAtPosition.parent) === null || _l === void 0 ? void 0 : _l.type) === "ERROR" &&
                        ((_o = (_m = nodeAtPosition.parent) === null || _m === void 0 ? void 0 : _m.parent) === null || _o === void 0 ? void 0 : _o.type) === "exposing_list")) {
                    return this.getExposedFromModule(forest, nodeAtPosition.parent.parent, replaceRange);
                }
                else if (((_q = (_p = nodeAtPosition.parent) === null || _p === void 0 ? void 0 : _p.parent) === null || _q === void 0 ? void 0 : _q.type) === "record_expr") {
                    return this.getRecordCompletions(nodeAtPosition, tree, replaceRange, params.textDocument.uri, elmWorkspace);
                }
                let targetNode;
                if (contextNode) {
                    const parent = contextNode.parent;
                    if (isAfterDot) {
                        targetWord = targetLine.substring(replaceRange.start.character, contextNode.startPosition.column);
                        replaceRange = vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(params.position.line, contextNode.startPosition.column + 1), params.position);
                        if ((parent === null || parent === void 0 ? void 0 : parent.type) === "value_qid") {
                            // Qualified submodule and value access
                            targetNode = contextNode.previousNamedSibling;
                        }
                        else if ((parent === null || parent === void 0 ? void 0 : parent.type) === "field_access_expr") {
                            // Record field access
                            targetNode = (_t = (_s = (_r = contextNode === null || contextNode === void 0 ? void 0 : contextNode.previousNamedSibling) === null || _r === void 0 ? void 0 : _r.lastNamedChild) === null || _s === void 0 ? void 0 : _s.lastNamedChild) !== null && _t !== void 0 ? _t : (_u = contextNode.previousNamedSibling) === null || _u === void 0 ? void 0 : _u.lastNamedChild;
                        }
                        else if ((parent === null || parent === void 0 ? void 0 : parent.type) === "upper_case_qid") {
                            // Imports
                            targetNode = contextNode.previousNamedSibling;
                        }
                        else if ((parent === null || parent === void 0 ? void 0 : parent.type) === "ERROR") {
                            targetNode = treeUtils_1.TreeUtils.findPreviousNode(tree.rootNode, positionUtil_1.PositionUtil.FROM_TS_POSITION(contextNode.startPosition).toVSPosition());
                        }
                    }
                    else {
                        if (contextNode.type === "import") {
                            return this.getImportableModules(tree, forest, replaceRange);
                        }
                    }
                }
                if (targetNode) {
                    const moduleCompletions = this.getSubmodulesOrValues(targetNode, params.textDocument.uri, tree, elmWorkspace, replaceRange, targetWord);
                    if (moduleCompletions.length > 0) {
                        return moduleCompletions;
                    }
                    const recordCompletions = this.getRecordCompletions(targetNode, tree, replaceRange, params.textDocument.uri, elmWorkspace);
                    if (recordCompletions.length > 0) {
                        return recordCompletions;
                    }
                    return this.getRecordCompletionsUsingInference(targetNode, replaceRange, params.textDocument.uri, elmWorkspace);
                }
                completions.push(...this.getSameFileTopLevelCompletions(tree, replaceRange));
                completions.push(...this.findDefinitionsForScope(nodeAtPosition, tree, replaceRange));
                completions.push(...this.getCompletionsFromOtherFile(tree, elmWorkspace.getImports(), params.textDocument.uri, replaceRange, targetWord));
                completions.push(...this.createSnippetsInline());
                completions.push(...this.getKeywordsInline());
                const possibleImportCompletions = this.getPossibleImports(replaceRange, forest, tree, params.textDocument.uri, nodeAtPosition.text);
                completions.push(...possibleImportCompletions.list);
                return {
                    items: completions,
                    isIncomplete: possibleImportCompletions.isIncomplete,
                };
            }
        };
        this.connection = tsyringe_1.container.resolve("Connection");
        this.connection.onCompletion(new elmWorkspaceMatcher_1.ElmWorkspaceMatcher((param) => vscode_uri_1.URI.parse(param.textDocument.uri)).handlerForWorkspace(this.handleCompletionRequest));
    }
    findPreviousWord(currentCharacter, targetLine) {
        currentCharacter--;
        const previousWordEnd = currentCharacter;
        while (currentCharacter - 1 >= 0 &&
            this.qidRegex.test(targetLine[currentCharacter - 1])) {
            currentCharacter--;
        }
        return targetLine.slice(currentCharacter, previousWordEnd);
    }
    getImportableModules(tree, forest, range, targetModule) {
        const currentModuleNameNode = treeUtils_1.TreeUtils.getModuleNameNode(tree);
        return forest.treeIndex
            .filter((t) => {
            var _a;
            return t.moduleName &&
                (!targetModule || ((_a = t.moduleName) === null || _a === void 0 ? void 0 : _a.startsWith(targetModule + "."))) &&
                t.moduleName !== (currentModuleNameNode === null || currentModuleNameNode === void 0 ? void 0 : currentModuleNameNode.text) &&
                t.moduleName !== targetModule;
        })
            .map((t) => {
            var _a, _b, _c;
            const moduleNode = treeUtils_1.TreeUtils.findModuleDeclaration(t.tree);
            const markdownDocumentation = hintHelper_1.HintHelper.createHint(moduleNode);
            return this.createModuleCompletion({
                label: (_c = (targetModule
                    ? (_b = (_a = t.moduleName) === null || _a === void 0 ? void 0 : _a.slice(targetModule.length + 1)) !== null && _b !== void 0 ? _b : t.moduleName : t.moduleName)) !== null && _c !== void 0 ? _c : "",
                sortPrefix: "b",
                range,
                markdownDocumentation,
            });
        });
    }
    getExposedFromModule(forest, exposingListNode, range) {
        // Skip as clause to always get Module Name
        if (exposingListNode.previousNamedSibling &&
            exposingListNode.previousNamedSibling.type === "as_clause" &&
            exposingListNode.previousNamedSibling.previousNamedSibling) {
            exposingListNode = exposingListNode.previousNamedSibling;
        }
        if (exposingListNode.previousNamedSibling &&
            exposingListNode.previousNamedSibling.type === "upper_case_qid") {
            const sortPrefix = "c";
            const moduleName = exposingListNode.previousNamedSibling.text;
            const exposedByModule = forest.getExposingByModuleName(moduleName);
            if (exposedByModule) {
                return exposedByModule
                    .map((a) => {
                    const markdownDocumentation = hintHelper_1.HintHelper.createHint(a.syntaxNode);
                    switch (a.type) {
                        case "TypeAlias":
                            return [
                                this.createTypeAliasCompletion({
                                    markdownDocumentation,
                                    label: a.name,
                                    range,
                                    sortPrefix,
                                }),
                            ];
                        case "Type":
                            return a.exposedUnionConstructors
                                ? [
                                    this.createTypeCompletion({
                                        markdownDocumentation,
                                        label: `${a.name}(..)`,
                                        range,
                                        sortPrefix,
                                    }),
                                    this.createTypeCompletion({
                                        markdownDocumentation,
                                        label: a.name,
                                        range,
                                        sortPrefix,
                                    }),
                                ]
                                : [
                                    this.createTypeCompletion({
                                        markdownDocumentation,
                                        label: a.name,
                                        range,
                                        sortPrefix,
                                    }),
                                ];
                        default:
                            return [
                                this.createFunctionCompletion({
                                    markdownDocumentation,
                                    label: a.name,
                                    range,
                                    sortPrefix,
                                }),
                            ];
                    }
                })
                    .reduce((a, b) => a.concat(b), []);
            }
        }
    }
    getCompletionsFromOtherFile(tree, imports, uri, range, inputText) {
        const completions = [];
        if (imports.imports && imports.imports[uri]) {
            const importList = imports.imports[uri];
            importList.forEach((element) => {
                const markdownDocumentation = hintHelper_1.HintHelper.createHint(element.node);
                let sortPrefix = "d";
                if (element.maintainerAndPackageName) {
                    const matchedRanking = ranking_1.default[element.maintainerAndPackageName];
                    if (matchedRanking) {
                        sortPrefix = `e${matchedRanking}`;
                    }
                }
                const label = element.alias;
                let filterText = label;
                const dotIndex = label.lastIndexOf(".");
                const valuePart = label.slice(dotIndex + 1);
                const importNode = treeUtils_1.TreeUtils.findImportClauseByName(tree, element.fromModuleName);
                // Check if a value is already imported for this module using the exposing list
                // In this case, we want to prefex the unqualified value since they are using the import exposing list
                const valuesAlreadyExposed = importNode &&
                    !!treeUtils_1.TreeUtils.findFirstNamedChildOfType("exposing_list", importNode);
                // Try to determine if just the value is being typed
                if (!valuesAlreadyExposed &&
                    valuePart.toLowerCase().startsWith(inputText.toLowerCase())) {
                    filterText = valuePart;
                }
                switch (element.type) {
                    case "Function":
                        completions.push(this.createFunctionCompletion({
                            markdownDocumentation,
                            label,
                            range,
                            sortPrefix,
                            filterText,
                        }));
                        break;
                    case "UnionConstructor":
                        completions.push(this.createUnionConstructorCompletion({
                            label,
                            range,
                            sortPrefix,
                            filterText,
                        }));
                        break;
                    case "Operator":
                        completions.push(this.createOperatorCompletion({
                            markdownDocumentation,
                            label,
                            range,
                            sortPrefix,
                        }));
                        break;
                    case "Type":
                        completions.push(this.createTypeCompletion({
                            markdownDocumentation,
                            label,
                            range,
                            sortPrefix,
                            filterText,
                        }));
                        break;
                    case "TypeAlias":
                        completions.push(this.createTypeAliasCompletion({
                            markdownDocumentation,
                            label,
                            range,
                            sortPrefix,
                            filterText,
                        }));
                        break;
                    // Do not handle operators, they are not valid if prefixed
                }
            });
        }
        completions.push(...elmUtils_1.getEmptyTypes().map((a) => this.createCompletion({
            markdownDocumentation: a.markdown,
            kind: a.symbolKind,
            label: a.name,
            range,
            sortPrefix: "d0000",
        })));
        return completions;
    }
    getSameFileTopLevelCompletions(tree, range, moduleDefinition = false) {
        const completions = [];
        const topLevelFunctions = treeUtils_1.TreeUtils.findAllTopLevelFunctionDeclarations(tree);
        const sortPrefix = "b";
        // Add functions
        if (topLevelFunctions) {
            const declarations = topLevelFunctions.filter((a) => a.firstNamedChild !== null &&
                a.firstNamedChild.type === "function_declaration_left" &&
                a.firstNamedChild.firstNamedChild !== null &&
                a.firstNamedChild.firstNamedChild.type === "lower_case_identifier");
            for (const declaration of declarations) {
                const markdownDocumentation = hintHelper_1.HintHelper.createHint(declaration);
                completions.push(this.createFunctionCompletion({
                    markdownDocumentation,
                    label: declaration.firstNamedChild.firstNamedChild.text,
                    range,
                    sortPrefix,
                }));
            }
        }
        // Add types
        const typeDeclarations = treeUtils_1.TreeUtils.findAllTypeDeclarations(tree);
        if (typeDeclarations) {
            for (const declaration of typeDeclarations) {
                const markdownDocumentation = hintHelper_1.HintHelper.createHint(declaration);
                const name = treeUtils_1.TreeUtils.findFirstNamedChildOfType("upper_case_identifier", declaration);
                if (name) {
                    completions.push(this.createTypeCompletion({
                        markdownDocumentation,
                        label: name.text,
                        range,
                        sortPrefix,
                    }));
                    if (moduleDefinition) {
                        completions.push(this.createTypeCompletion({
                            markdownDocumentation,
                            label: `${name.text}(..)`,
                            range,
                            sortPrefix,
                        }));
                    }
                }
                // Add types constructors
                const unionVariants = treeUtils_1.TreeUtils.descendantsOfType(declaration, "union_variant");
                for (const unionVariant of unionVariants) {
                    const unionVariantName = treeUtils_1.TreeUtils.findFirstNamedChildOfType("upper_case_identifier", unionVariant);
                    if (unionVariantName) {
                        completions.push(this.createUnionConstructorCompletion({
                            label: unionVariantName.text,
                            range,
                            sortPrefix,
                        }));
                    }
                }
            }
        }
        // Add alias types
        const typeAliasDeclarations = treeUtils_1.TreeUtils.findAllTypeAliasDeclarations(tree);
        if (typeAliasDeclarations) {
            for (const declaration of typeAliasDeclarations) {
                const markdownDocumentation = hintHelper_1.HintHelper.createHint(declaration);
                const name = treeUtils_1.TreeUtils.findFirstNamedChildOfType("upper_case_identifier", declaration);
                if (name) {
                    completions.push(this.createTypeAliasCompletion({
                        markdownDocumentation,
                        label: name.text,
                        range,
                        sortPrefix,
                    }));
                }
            }
        }
        return completions;
    }
    getRecordCompletions(node, tree, range, uri, elmWorkspace) {
        var _a, _b, _c, _d, _e, _f;
        const result = [];
        let typeDeclarationNode = (_a = treeUtils_1.TreeUtils.getTypeAliasOfRecord(node, tree, uri, elmWorkspace)) === null || _a === void 0 ? void 0 : _a.node;
        if (!typeDeclarationNode && ((_b = node.parent) === null || _b === void 0 ? void 0 : _b.parent)) {
            typeDeclarationNode = (_c = treeUtils_1.TreeUtils.getTypeAliasOfRecordField(node.parent.parent, tree, uri, elmWorkspace)) === null || _c === void 0 ? void 0 : _c.node;
        }
        if (!typeDeclarationNode && ((_d = node.parent) === null || _d === void 0 ? void 0 : _d.parent)) {
            typeDeclarationNode = treeUtils_1.TreeUtils.getTypeOrTypeAliasOfFunctionRecordParameter(node.parent.parent, tree, uri, elmWorkspace);
        }
        if (typeDeclarationNode) {
            const fields = treeUtils_1.TreeUtils.getAllFieldsFromTypeAlias(typeDeclarationNode);
            const typeName = (_f = (_e = treeUtils_1.TreeUtils.findFirstNamedChildOfType("upper_case_identifier", typeDeclarationNode)) === null || _e === void 0 ? void 0 : _e.text) !== null && _f !== void 0 ? _f : "";
            fields === null || fields === void 0 ? void 0 : fields.forEach((element) => {
                const hint = hintHelper_1.HintHelper.createHintForTypeAliasReference(element.type, element.field, typeName);
                result.push(this.createFieldOrParameterCompletion(hint, element.field, range));
            });
        }
        return result;
    }
    getRecordCompletionsUsingInference(targetNode, replaceRange, uri, elmWorkspace) {
        var _a, _b;
        const result = [];
        const foundType = typeInference_1.findType(targetNode, uri, elmWorkspace);
        if (foundType.nodeType === "Record") {
            for (const field in foundType.fields) {
                const hint = hintHelper_1.HintHelper.createHintForTypeAliasReference(typeRenderer_1.TypeRenderer.typeToString(foundType.fields[field]), field, (_b = (_a = foundType.alias) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "");
                result.push(this.createFieldOrParameterCompletion(hint, field, replaceRange));
            }
        }
        return result;
    }
    createFunctionCompletion(options) {
        options.kind = vscode_languageserver_1.CompletionItemKind.Function;
        return this.createCompletion(options);
    }
    createFieldOrParameterCompletion(markdownDocumentation, label, range) {
        return this.createPreselectedCompletion(markdownDocumentation, vscode_languageserver_1.CompletionItemKind.Field, label, range);
    }
    createTypeCompletion(options) {
        options.kind = vscode_languageserver_1.CompletionItemKind.Enum;
        return this.createCompletion(options);
    }
    createTypeAliasCompletion(options) {
        options.kind = vscode_languageserver_1.CompletionItemKind.Struct;
        return this.createCompletion(options);
    }
    createOperatorCompletion(options) {
        options.kind = vscode_languageserver_1.CompletionItemKind.Operator;
        return this.createCompletion(options);
    }
    createUnionConstructorCompletion(options) {
        options.kind = vscode_languageserver_1.CompletionItemKind.EnumMember;
        return this.createCompletion(options);
    }
    createModuleCompletion(options) {
        options.kind = vscode_languageserver_1.CompletionItemKind.Module;
        return this.createCompletion(options);
    }
    createCompletion(options) {
        var _a;
        return {
            documentation: options.markdownDocumentation
                ? {
                    kind: vscode_languageserver_1.MarkupKind.Markdown,
                    value: (_a = options.markdownDocumentation) !== null && _a !== void 0 ? _a : "",
                }
                : undefined,
            kind: options.kind,
            label: options.label,
            sortText: `${options.sortPrefix}_${options.label}`,
            textEdit: vscode_languageserver_1.TextEdit.replace(options.range, options.label),
            detail: options.detail,
            additionalTextEdits: options.additionalTextEdits,
            filterText: options.filterText,
        };
    }
    createPreselectedCompletion(markdownDocumentation, kind, label, range) {
        return {
            documentation: markdownDocumentation
                ? {
                    kind: vscode_languageserver_1.MarkupKind.Markdown,
                    value: markdownDocumentation !== null && markdownDocumentation !== void 0 ? markdownDocumentation : "",
                }
                : undefined,
            kind,
            label,
            preselect: true,
            textEdit: vscode_languageserver_1.TextEdit.replace(range, label),
        };
    }
    findDefinitionsForScope(node, tree, range) {
        const result = [];
        const sortPrefix = "a";
        if (node.parent) {
            if (node.parent.type === "let_in_expr") {
                node.parent.children.forEach((nodeToProcess) => {
                    if (nodeToProcess &&
                        nodeToProcess.type === "value_declaration" &&
                        nodeToProcess.firstNamedChild !== null &&
                        nodeToProcess.firstNamedChild.type ===
                            "function_declaration_left" &&
                        nodeToProcess.firstNamedChild.firstNamedChild !== null &&
                        nodeToProcess.firstNamedChild.firstNamedChild.type ===
                            "lower_case_identifier") {
                        const markdownDocumentation = hintHelper_1.HintHelper.createHintFromDefinitionInLet(nodeToProcess);
                        result.push(this.createFunctionCompletion({
                            markdownDocumentation,
                            label: nodeToProcess.firstNamedChild.firstNamedChild.text,
                            range,
                            sortPrefix,
                        }));
                    }
                });
            }
            if (node.parent.type === "case_of_branch" &&
                node.parent.firstNamedChild &&
                node.parent.firstNamedChild.type === "pattern" &&
                node.parent.firstNamedChild.firstNamedChild &&
                node.parent.firstNamedChild.firstNamedChild.type === "union_pattern" &&
                node.parent.firstNamedChild.firstNamedChild.childCount > 1 // Ignore cases of case branches with no params
            ) {
                const caseBranchVariableNodes = treeUtils_1.TreeUtils.findAllNamedChildrenOfType("lower_pattern", node.parent.firstNamedChild.firstNamedChild);
                if (caseBranchVariableNodes) {
                    caseBranchVariableNodes.forEach((a) => {
                        const markdownDocumentation = hintHelper_1.HintHelper.createHintFromDefinitionInCaseBranch();
                        result.push(this.createFunctionCompletion({
                            markdownDocumentation,
                            label: a.text,
                            range,
                            sortPrefix,
                        }));
                    });
                }
            }
            if (node.parent.type === "value_declaration" &&
                node.parent.firstChild &&
                node.parent.firstChild.type === "function_declaration_left") {
                node.parent.firstChild.children.forEach((child) => {
                    if (child.type === "lower_pattern") {
                        const markdownDocumentation = hintHelper_1.HintHelper.createHintFromFunctionParameter(child);
                        result.push(this.createFieldOrParameterCompletion(markdownDocumentation, child.text, range));
                        const annotationTypeNode = treeUtils_1.TreeUtils.getTypeOrTypeAliasOfFunctionParameter(child);
                        if (annotationTypeNode) {
                            const typeDeclarationNode = treeUtils_1.TreeUtils.findTypeAliasDeclaration(tree, annotationTypeNode.text);
                            if (typeDeclarationNode) {
                                const fields = treeUtils_1.TreeUtils.getAllFieldsFromTypeAlias(typeDeclarationNode);
                                if (fields) {
                                    fields.forEach((element) => {
                                        const hint = hintHelper_1.HintHelper.createHintForTypeAliasReference(element.type, element.field, child.text);
                                        result.push(this.createFieldOrParameterCompletion(hint, `${child.text}.${element.field}`, range));
                                    });
                                }
                            }
                        }
                    }
                });
            }
            result.push(...this.findDefinitionsForScope(node.parent, tree, range));
        }
        return result;
    }
    getPossibleImports(range, forest, tree, uri, filterText) {
        const result = [];
        const possibleImports = importUtils_1.ImportUtils.getPossibleImportsFiltered(forest, uri, filterText);
        const isIncomplete = possibleImports.length > 50;
        possibleImports.splice(0, 49).forEach((possibleImport, i) => {
            var _a;
            const markdownDocumentation = hintHelper_1.HintHelper.createHint(possibleImport.node);
            const detail = `Auto import from module '${possibleImport.module}'`;
            const importTextEdit = refactorEditUtils_1.RefactorEditUtils.addImport(tree, possibleImport.module, (_a = possibleImport.valueToImport) !== null && _a !== void 0 ? _a : possibleImport.value);
            const sortText = i < 10 ? `0${i}` : i;
            const completionOptions = {
                markdownDocumentation,
                label: possibleImport.value,
                range,
                sortPrefix: `f${sortText}`,
                detail,
                additionalTextEdits: importTextEdit ? [importTextEdit] : undefined,
            };
            if (possibleImport.type === "Function") {
                result.push(this.createFunctionCompletion(completionOptions));
            }
            else if (possibleImport.type === "TypeAlias") {
                result.push(this.createTypeAliasCompletion(completionOptions));
            }
            else if (possibleImport.type === "Type") {
                result.push(this.createTypeCompletion(completionOptions));
            }
            else if (possibleImport.type === "UnionConstructor") {
                result.push(this.createUnionConstructorCompletion({
                    label: possibleImport.value,
                    range,
                    sortPrefix: `f${i}`,
                    detail,
                    additionalTextEdits: importTextEdit ? [importTextEdit] : undefined,
                }));
            }
        });
        return { list: result, isIncomplete };
    }
    getSubmodulesOrValues(node, uri, tree, elmWorkspace, range, targetModule) {
        const result = [];
        const forest = elmWorkspace.getForest();
        // Handle possible submodules
        result.push(...this.getImportableModules(tree, forest, range, targetModule));
        // If we are in an import completion, don't return any values
        if (treeUtils_1.TreeUtils.isImport(node)) {
            return result;
        }
        let alreadyImported = true;
        // Try to find the module definition that is already imported
        const definitionNode = treeUtils_1.TreeUtils.findDefinitionNodeByReferencingNode(node, uri, tree, elmWorkspace);
        let moduleTree;
        if (definitionNode && definitionNode.nodeType === "Module") {
            moduleTree = forest.getByUri(definitionNode.uri);
        }
        else {
            // Try to find this module in the forest to import
            moduleTree = forest.getByModuleName(targetModule);
            alreadyImported = false;
        }
        if (moduleTree && moduleTree.isExposed) {
            // Get exposed values
            const imports = importUtils_1.ImportUtils.getPossibleImportsOfTree(moduleTree);
            imports.forEach((value) => {
                const markdownDocumentation = hintHelper_1.HintHelper.createHint(value.node);
                let additionalTextEdits;
                let detail;
                // Add the import text edit if not imported
                if (!alreadyImported) {
                    const importEdit = refactorEditUtils_1.RefactorEditUtils.addImport(tree, targetModule);
                    if (importEdit) {
                        additionalTextEdits = [importEdit];
                        detail = `Auto import module '${targetModule}'`;
                    }
                }
                const completionOptions = {
                    label: value.value,
                    sortPrefix: "a",
                    range,
                    markdownDocumentation,
                    additionalTextEdits,
                    detail,
                };
                switch (value.type) {
                    case "Function":
                        result.push(this.createFunctionCompletion(completionOptions));
                        break;
                    case "Type":
                        result.push(this.createTypeCompletion(completionOptions));
                        break;
                    case "TypeAlias":
                        result.push(this.createTypeAliasCompletion(completionOptions));
                        break;
                    case "UnionConstructor":
                        result.push(this.createUnionConstructorCompletion(completionOptions));
                        break;
                }
            });
        }
        return result;
    }
    createSnippet(label, snippetText, markdownDocumentation, kind) {
        return {
            documentation: markdownDocumentation
                ? {
                    kind: vscode_languageserver_1.MarkupKind.Markdown,
                    value: markdownDocumentation !== null && markdownDocumentation !== void 0 ? markdownDocumentation : "",
                }
                : undefined,
            insertText: Array.isArray(snippetText)
                ? snippetText.join("\n")
                : snippetText,
            insertTextFormat: vscode_languageserver_1.InsertTextFormat.Snippet,
            kind: kind !== null && kind !== void 0 ? kind : vscode_languageserver_1.CompletionItemKind.Snippet,
            label,
            sortText: `s_${label}`,
        };
    }
    createSnippetsInline() {
        return [
            this.createSnippet("of", ["of", "   $0"], "The of keyword", vscode_languageserver_1.CompletionItemKind.Keyword),
            this.createSnippet("case of", ["case ${1:expression} of$0"], "Case of expression ready to extend (you need to save first)"),
            this.createSnippet("if", [" if ${1:expression} then", "    ${2}", " else", "    ${3}"], "If-Else statement"),
            this.createSnippet("record update", ["{ ${1:recordName} | ${2:key} = ${3} }"], "Update record"),
            this.createSnippet("anonymous", ["\\ ${1:argument} -> ${1:argument}"], "Anonymous function"),
            this.createSnippet("let in", ["let", "    ${1}", "in", "${0}"], "Let expression"),
        ];
    }
    createSnippetsStartOfLine() {
        return [
            this.createSnippet("module", "module ${1:Name} exposing (${2:..})", "Module definition"),
            this.createSnippet("import", "import ${1:Name} exposing (${2:..})", "Unqualified import"),
            this.createSnippet("comment", ["{-", "${0}", "-}"], "Multi-line comment"),
            this.createSnippet("record", [
                "${1:recordName} =",
                "    { ${2:key1} = ${3:value1}",
                "    , ${4:key2} = ${5:value2}",
                "    }",
            ], "Record"),
            this.createSnippet("type alias", [
                "type alias ${1:recordName} =",
                "    { ${2:key1} : ${3:ValueType1}",
                "    , ${4:key2} : ${5:ValueType2}",
                "    }",
            ], "Type alias"),
            this.createSnippet("type", ["type ${1:Typename}", "    = ${2:Value1}", "    | ${3:Value2}"], "Custom type"),
            this.createSnippet("msg", ["type Msg", "    = ${1:Message}", "    | ${2:Message}"], "Default message custom type"),
            this.createSnippet("func", [
                "${1:functionName} : ${2:ArgumentType} -> ${3:ReturnType}",
                "${1:functionName} ${4:arguments} =",
                "    ${5}",
            ], "Function with type annotation"),
            this.createSnippet("update", [
                "update : Msg -> Model -> ${1|Model, ( Model\\, Cmd Msg )|}",
                "update msg model =",
                "    case msg of",
                "        ${2:option1} ->",
                "            ${1|Model, ( Model\\, Cmd Msg )|}",
                "",
                "        ${3:option2} ->",
                "            ${1|Model, ( Model\\, Cmd Msg )|}",
            ], "Default update function"),
            this.createSnippet("view", ["view : Model -> Html Msg", "view model =", "    ${0}"], "Default view function"),
            this.createSnippet("port in", ["port ${1:portName} : (${2:Typename} -> msg) -> Sub msg"], "Incoming port"),
            this.createSnippet("port out", ["port ${1:portName} : ${2:Typename} -> Cmd msg"], "Outgoing port"),
            this.createSnippet("main sandbox", [
                "main : Program () Model Msg",
                "main =",
                "    Browser.sandbox",
                "        { init = init",
                "        , view = view",
                "        , update = update",
                "        }",
            ], "Main Browser Sandbox"),
            this.createSnippet("main element", [
                "main : Program () Model Msg",
                "main =",
                "    Browser.element",
                "        { init = init",
                "        , view = view",
                "        , update = update",
                "        , subscriptions = subscriptions",
                "        }",
            ], "Main Browser Element"),
            this.createSnippet("main document", [
                "main : Program () Model Msg",
                "main =",
                "    Browser.document",
                "        { init = init",
                "        , view = view",
                "        , update = update",
                "        , subscriptions = subscriptions",
                "        }",
            ], "Main Browser Document"),
            this.createSnippet("main application", [
                "main : Program () Model Msg",
                "main =",
                "    Browser.application",
                "        { init = init",
                "        , view = view",
                "        , update = update",
                "        , subscriptions = subscriptions",
                "        , onUrlChange = onUrlChange",
                "        , onUrlRequest = onUrlRequest",
                "        }",
            ], "Main Browser Application"),
            this.createSnippet("subscriptions", [
                "subscriptions : Model -> Sub Msg",
                "subscriptions model =",
                "    Sub.none",
            ], "Subscriptions"),
            this.createSnippet("default model", [
                "type alias Model =",
                "    { statusText : String",
                "    }",
                "",
                "",
                "model : Model",
                "model =",
                '    { statusText = "Ready"',
                "    }",
            ], "A default model with type declaration"),
            this.createSnippet("Browser.sandbox", [
                "module Main exposing (Model, Msg, update, view, init)",
                "",
                "import Html exposing (..)",
                "import Browser",
                "",
                "",
                "main : Program () Model Msg",
                "main =",
                "    Browser.sandbox",
                "        { init = init",
                "        , view = view",
                "        , update = update",
                "    }",
                "",
                "",
                "type alias Model =",
                "    { ${1:property} : ${2:propertyType}",
                "    }",
                "",
                "",
                "init : Model",
                "init =",
                "    Model ${3:modelInitialValue}",
                "",
                "",
                "type Msg",
                "    = ${4:Msg1}",
                "    | ${5:Msg2}",
                "",
                "",
                "update : Msg -> Model -> Model",
                "update msg model =",
                "    case msg of",
                "        ${6:Msg1} ->",
                "            model",
                "",
                "        ${7:Msg2} ->",
                "            model",
                "",
                "",
                "view : Model -> Html Msg",
                "view model =",
                "    div []",
                '        [ text "New Sandbox" ]',
                "",
                "",
                "${0}",
            ], "Browser Sandbox"),
            this.createSnippet("Browser.element", [
                "module Main exposing (Model, Msg, update, view, subscriptions, init)",
                "",
                "import Html exposing (..)",
                "import Browser",
                "",
                "",
                "main : Program flags Model Msg",
                "main =",
                "    Browser.element",
                "        { init = init",
                "        , view = view",
                "        , update = update",
                "        , subscriptions = subscriptions",
                "    }",
                "",
                "",
                "type alias Model =",
                "    { key : Nav.Key",
                "    , url : Url.Url",
                "    , property : propertyType",
                "    }",
                "",
                "",
                "init : flags -> (Model, Cmd Msg)",
                "init flags =",
                "    (Model modelInitialValue, Cmd.none)",
                "",
                "",
                "type Msg",
                "    = ${1:Msg1}",
                "    | ${2:Msg2}",
                "",
                "",
                "update : Msg -> Model -> (Model, Cmd Msg)",
                "update msg model =",
                "    case msg of",
                "        ${1:Msg1} ->",
                "            (model, Cmd.none)",
                "",
                "        ${2:Msg2} ->",
                "            (model, Cmd.none)",
                "",
                "",
                "subscriptions : Model -> Sub Msg",
                "subscriptions model =",
                "    Sub.none",
                "",
                "",
                "view : Model -> Html Msg",
                "view model =",
                "    div []",
                '        [ text "New Element" ]',
                "",
                "",
                "${0}",
            ], "Browser Element"),
            this.createSnippet("Browser.document", [
                "module Main exposing (Model, Msg, update, view, subscriptions, init)",
                "",
                "import Html exposing (..)",
                "import Browser",
                "",
                "",
                "main : Program flags Model Msg",
                "main =",
                "    Browser.document",
                "        { init = init",
                "        , view = view",
                "        , update = update",
                "        , subscriptions = subscriptions",
                "    }",
                "",
                "",
                "type alias Model =",
                "    { property : propertyType",
                "    }",
                "",
                "",
                "init : flags -> (Model, Cmd Msg)",
                "init flags =",
                "    (Model modelInitialValue, Cmd.none)",
                "",
                "",
                "type Msg",
                "    = ${1:Msg1}",
                "    | ${2:Msg2}",
                "",
                "",
                "update : Msg -> Model -> (Model, Cmd Msg)",
                "update msg model =",
                "    case msg of",
                "        ${1:Msg1} ->",
                "            (model, Cmd.none)",
                "",
                "        ${2:Msg2} ->",
                "            (model, Cmd.none)",
                "",
                "",
                "subscriptions : Model -> Sub Msg",
                "subscriptions model =",
                "    Sub.none",
                "",
                "",
                "view : Model -> Browser.Document Msg",
                "view model =",
                '    { title = "Document Title"',
                "    , body =",
                "        [ div []",
                '            [ text "New Document" ]',
                "      ]",
                "    }",
                "",
                "",
                "${0}",
            ], "Browser Document"),
            this.createSnippet("Browser.application", [
                "module Main exposing (Model, init, Msg, update, view, subscriptions)",
                "",
                "import Html exposing (..)",
                "import Browser",
                "import Browser.Navigation as Nav",
                "import Url",
                "",
                "",
                "main : Program flags Model Msg",
                "main =",
                "    Browser.application",
                "        { init = init",
                "        , view = view",
                "        , update = update",
                "        , subscriptions = subscriptions",
                "        , onUrlRequest = UrlRequested",
                "        , onUrlChange = UrlChanged",
                "    }",
                "",
                "",
                "type alias Model =",
                "    { key : Nav.Key",
                "    , url : Url.Url",
                "    , property : propertyType",
                "    }",
                "",
                "",
                "init : flags -> Url.Url -> Nav.Key -> (Model, Cmd Msg)",
                "init flags url key =",
                "    (Model modelInitialValue, Cmd.none)",
                "",
                "",
                "type Msg",
                "    = ${1:Msg1}",
                "    | ${2:Msg2}",
                "    | UrlRequested Browser.UrlRequest",
                "    | UrlChanged Url.Url",
                "",
                "",
                "update : Msg -> Model -> (Model, Cmd Msg)",
                "update msg model =",
                "    case msg of",
                "        ${1:Msg1} ->",
                "            (model, Cmd.none)",
                "",
                "        ${2:Msg2} ->",
                "            (model, Cmd.none)",
                "",
                "        UrlRequested urlRequest ->",
                "            case urlRequest of",
                "                Browser.Internal url ->",
                "                    ( model, Nav.pushUrl model.key (Url.toString url) )",
                "",
                "                Browser.External href ->",
                "                    ( model, Nav.load href )",
                "",
                "        UrlChanged url ->",
                "            ( { model | url = url }",
                "            , Cmd.none",
                "            )",
                "",
                "",
                "subscriptions : Model -> Sub Msg",
                "subscriptions model =",
                "    Sub.none",
                "",
                "",
                "view : Model -> Browser.Document Msg",
                "view model =",
                '    { title = "Application Title"',
                "    , body =",
                "        [ div []",
                '            [ text "New Application" ]',
                "      ]",
                "    }",
                "",
                "",
                "${0}",
            ], "Browser Application"),
            this.createSnippet("describe", ['describe "${1:name}"', "    [ ${0}", "    ]"], "Describe block in Elm-test"),
            this.createSnippet("test", ['test "${1:name}" <|', "    \\_ ->", "        ${0}"], "Test block in Elm-test"),
            this.createSnippet("todo", "-- TODO: ${0}", "TODO comment"),
        ];
    }
    createKeywordCompletion(label) {
        return {
            label,
            kind: vscode_languageserver_1.CompletionItemKind.Keyword,
            sortText: `a_${label}`,
        };
    }
    getKeywordsInline() {
        return [
            this.createKeywordCompletion("if"),
            this.createKeywordCompletion("then"),
            this.createKeywordCompletion("else"),
            this.createKeywordCompletion("let"),
            this.createKeywordCompletion("in"),
            this.createKeywordCompletion("case"),
            this.createKeywordCompletion("alias"),
            this.createKeywordCompletion("exposing"),
        ];
    }
    getKeywordsStartOfLine() {
        return [
            this.createKeywordCompletion("type"),
            this.createKeywordCompletion("import"),
            this.createKeywordCompletion("module"),
            this.createKeywordCompletion("port"),
        ];
    }
}
exports.CompletionProvider = CompletionProvider;
//# sourceMappingURL=completionProvider.js.map