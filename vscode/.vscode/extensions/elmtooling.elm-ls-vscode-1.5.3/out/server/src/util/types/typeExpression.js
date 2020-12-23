"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeExpression = void 0;
const typeInference_1 = require("./typeInference");
const expressionTree_1 = require("./expressionTree");
const treeUtils_1 = require("../treeUtils");
const typeReplacement_1 = require("./typeReplacement");
const syntaxNodeMap_1 = require("./syntaxNodeMap");
const utils_1 = require("../utils");
const recordFieldReferenceTable_1 = require("./recordFieldReferenceTable");
class TypeExpression {
    constructor(root, uri, workspace, rigidVars, activeAliases = new Set()) {
        this.root = root;
        this.uri = uri;
        this.workspace = workspace;
        this.rigidVars = rigidVars;
        this.activeAliases = activeAliases;
        // All the type variables we've seen
        this.varsByExpression = new syntaxNodeMap_1.SyntaxNodeMap();
        this.expressionTypes = new syntaxNodeMap_1.SyntaxNodeMap();
        this.diagnostics = [];
    }
    static typeDeclarationInference(e, uri, workspace) {
        var _a;
        const setter = () => {
            const inferenceResult = new TypeExpression(e, uri, workspace, false).inferTypeDeclaration(e);
            typeReplacement_1.TypeReplacement.freeze(inferenceResult.type);
            return Object.assign(Object.assign({}, inferenceResult), { type: typeReplacement_1.TypeReplacement.freshenVars(inferenceResult.type) });
        };
        if (!((_a = workspace.getForest().getByUri(uri)) === null || _a === void 0 ? void 0 : _a.writeable)) {
            return workspace
                .getTypeCache()
                .getOrSet("PACKAGE_TYPE_AND_TYPE_ALIAS", e, setter);
        }
        else {
            return workspace
                .getTypeCache()
                .getOrSet("PROJECT_TYPE_AND_TYPE_ALIAS", e, setter);
        }
    }
    static typeAliasDeclarationInference(e, uri, workspace, activeAliases = new Set()) {
        var _a;
        const setter = () => {
            const inferenceResult = new TypeExpression(e, uri, workspace, false, activeAliases).inferTypeAliasDeclaration(e);
            typeReplacement_1.TypeReplacement.freeze(inferenceResult.type);
            return Object.assign(Object.assign({}, inferenceResult), { type: typeReplacement_1.TypeReplacement.freshenVars(inferenceResult.type) });
        };
        if (!((_a = workspace.getForest().getByUri(uri)) === null || _a === void 0 ? void 0 : _a.writeable)) {
            return workspace
                .getTypeCache()
                .getOrSet("PACKAGE_TYPE_AND_TYPE_ALIAS", e, setter);
        }
        else {
            return workspace
                .getTypeCache()
                .getOrSet("PROJECT_TYPE_AND_TYPE_ALIAS", e, setter);
        }
    }
    static typeAnnotationInference(e, uri, workspace, rigid = true) {
        var _a;
        if (!e.typeExpression) {
            return;
        }
        const setter = () => {
            const inferenceResult = new TypeExpression(e, uri, workspace, true).inferTypeExpression(e.typeExpression);
            const type = typeReplacement_1.TypeReplacement.replace(inferenceResult.type, new Map());
            typeReplacement_1.TypeReplacement.freeze(inferenceResult.type);
            return Object.assign(Object.assign({}, inferenceResult), { type });
        };
        const result = !((_a = workspace.getForest().getByUri(uri)) === null || _a === void 0 ? void 0 : _a.writeable)
            ? workspace
                .getTypeCache()
                .getOrSet("PACKAGE_TYPE_ANNOTATION", e.typeExpression, setter)
            : workspace
                .getTypeCache()
                .getOrSet("PROJECT_TYPE_ANNOTATION", e.typeExpression, setter);
        if (!rigid) {
            result.type = typeReplacement_1.TypeReplacement.flexify(result.type);
        }
        return result;
    }
    static unionVariantInference(e, uri, workspace) {
        const inferenceResult = new TypeExpression(e, uri, workspace, false).inferUnionConstructor(e);
        typeReplacement_1.TypeReplacement.freeze(inferenceResult.type);
        return Object.assign(Object.assign({}, inferenceResult), { type: typeReplacement_1.TypeReplacement.freshenVars(inferenceResult.type) });
    }
    static portAnnotationInference(e, uri, workspace) {
        const inferenceResult = new TypeExpression(e, uri, workspace, false).inferPortAnnotation(e);
        typeReplacement_1.TypeReplacement.freeze(inferenceResult.type);
        return Object.assign(Object.assign({}, inferenceResult), { type: typeReplacement_1.TypeReplacement.freshenVars(inferenceResult.type) });
    }
    inferTypeDeclaration(typeDeclaration) {
        return this.toResult(this.typeDeclarationType(typeDeclaration));
    }
    inferTypeExpression(typeExpr) {
        return this.toResult(this.typeExpressionType(typeExpr));
    }
    inferUnionConstructor(unionVariant) {
        const declaration = expressionTree_1.mapSyntaxNodeToExpression(treeUtils_1.TreeUtils.findParentOfType("type_declaration", unionVariant));
        const declarationType = declaration && declaration.nodeType === "TypeDeclaration"
            ? this.typeDeclarationType(declaration)
            : typeInference_1.TUnknown;
        const params = unionVariant.params.map((t) => this.typeSignatureSegmentType(t));
        const type = params.length > 0 ? typeInference_1.TFunction(params, declarationType) : declarationType;
        return this.toResult(type);
    }
    inferPortAnnotation(portAnnotation) {
        const type = this.typeExpressionType
            ? this.typeExpressionType(portAnnotation.typeExpression)
            : typeInference_1.TUnknown;
        return this.toResult(type);
    }
    inferTypeAliasDeclaration(declaration) {
        var _a, _b;
        if (this.activeAliases.has(declaration)) {
            this.diagnostics.push({
                node: declaration,
                endNode: declaration,
                message: "BadRecursionError",
            });
            return this.toResult(typeInference_1.TUnknown);
        }
        this.activeAliases.add(declaration);
        const type = declaration.typeExpression
            ? this.typeExpressionType(declaration.typeExpression)
            : typeInference_1.TUnknown;
        const params = declaration.typeVariables.map(this.getTypeVar.bind(this));
        const moduleName = (_b = (_a = treeUtils_1.TreeUtils.getModuleNameNode(declaration.tree)) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : "";
        const alias = {
            module: moduleName,
            name: declaration.name.text,
            parameters: params,
        };
        return this.toResult(Object.assign(Object.assign({}, type), { alias: alias }));
    }
    typeExpressionType(typeExpr) {
        const segmentTypes = typeExpr.segments.map((s) => this.typeSignatureSegmentType(s));
        if (segmentTypes.length === 1) {
            return segmentTypes[0];
        }
        else {
            return typeInference_1.uncurryFunction(typeInference_1.TFunction(segmentTypes.slice(0, segmentTypes.length - 1), segmentTypes[segmentTypes.length - 1]));
        }
    }
    toResult(type) {
        return {
            type,
            expressionTypes: this.expressionTypes,
            diagnostics: this.diagnostics,
            recordDiffs: new syntaxNodeMap_1.SyntaxNodeMap(),
        };
    }
    typeSignatureSegmentType(segment) {
        let type = typeInference_1.TUnknown;
        switch (segment.nodeType) {
            case "TypeRef":
                type = this.typeRefType(segment);
                break;
            case "TypeVariable":
                type = this.typeVariableType(segment);
                break;
            case "TypeExpression":
                type = this.typeExpressionType(segment);
                break;
            case "TupleType":
                type = segment.unitExpr
                    ? typeInference_1.TUnit
                    : typeInference_1.TTuple(segment.typeExpressions.map((t) => this.typeExpressionType(t)));
                break;
            case "RecordType":
                type = this.recordTypeDeclarationType(segment);
                break;
        }
        return type;
    }
    typeVariableType(typeVariable) {
        var _a, _b;
        const definition = expressionTree_1.findDefinition(typeVariable.firstNamedChild, this.uri, this.workspace);
        // The type variable doesn't reference anything
        if (!definition || definition.expr.id === typeVariable.id) {
            const type = this.getTypeVar(typeVariable);
            this.expressionTypes.set(typeVariable, type);
            return type;
        }
        const cached = this.varsByExpression.get(definition.expr);
        if (cached) {
            return cached;
        }
        const annotation = expressionTree_1.mapSyntaxNodeToExpression(treeUtils_1.TreeUtils.getAllAncestorsOfType("type_annotation", definition.expr)[0]);
        const expr = annotation
            ? treeUtils_1.TreeUtils.findFirstNamedChildOfType("type_expression", annotation)
            : undefined;
        // If the definition is not in a type annotation or it is to a
        // variable in the same annotation, use the type of the reference
        if (!annotation || !expr || annotation.id === this.root.id) {
            const type = this.getTypeVar(definition.expr);
            this.varsByExpression.set(typeVariable, type);
            this.expressionTypes.set(typeVariable, type);
            return type;
        }
        // If the definition is to a variable declared in a parent annotation,
        // use the type from that annotation's inference
        const type = (_b = (_a = TypeExpression.typeAnnotationInference(annotation, definition.uri, this.workspace, true)) === null || _a === void 0 ? void 0 : _a.expressionTypes.get(definition.expr)) !== null && _b !== void 0 ? _b : typeInference_1.TUnknown;
        if (type.nodeType === "Var") {
            this.varsByExpression.set(definition.expr, type);
        }
        this.expressionTypes.set(typeVariable, type);
        return type;
    }
    recordTypeDeclarationType(record) {
        var _a;
        const fieldExpressions = record.fieldTypes;
        if (!fieldExpressions || fieldExpressions.length === 0) {
            return typeInference_1.TRecord({});
        }
        const fieldTypes = {};
        fieldExpressions.forEach((field) => {
            fieldTypes[field.name] = this.typeExpressionType(field.typeExpression);
        });
        const fieldRefs = recordFieldReferenceTable_1.RecordFieldReferenceTable.fromExpressions(fieldExpressions);
        const baseTypeDefinition = (_a = expressionTree_1.findDefinition(record.baseType, this.uri, this.workspace)) === null || _a === void 0 ? void 0 : _a.expr;
        const baseType = baseTypeDefinition
            ? this.getTypeVar(baseTypeDefinition)
            : record.baseType
                ? typeInference_1.TVar(record.baseType.text)
                : undefined;
        const type = typeInference_1.TRecord(fieldTypes, baseType, undefined, fieldRefs);
        this.expressionTypes.set(record, type);
        return type;
    }
    typeRefType(typeRef) {
        var _a, _b, _c, _d, _e;
        const args = (_b = (_a = treeUtils_1.TreeUtils.findAllNamedChildrenOfType([
            "type_variable",
            "type_ref",
            "tuple_type",
            "record_type",
            "type_expression",
        ], typeRef)) === null || _a === void 0 ? void 0 : _a.map(expressionTree_1.mapSyntaxNodeToExpression).filter(utils_1.Utils.notUndefined.bind(this)).map((arg) => this.typeSignatureSegmentType(arg))) !== null && _b !== void 0 ? _b : [];
        const definition = expressionTree_1.findDefinition((_c = typeRef.firstNamedChild) === null || _c === void 0 ? void 0 : _c.lastNamedChild, this.uri, this.workspace);
        let declaredType = typeInference_1.TUnknown;
        if (definition) {
            switch (definition.expr.nodeType) {
                case "TypeDeclaration":
                    declaredType = TypeExpression.typeDeclarationInference(definition.expr, definition.uri, this.workspace).type;
                    break;
                case "TypeAliasDeclaration":
                    declaredType = TypeExpression.typeAliasDeclarationInference(definition.expr, definition.uri, this.workspace, new Set(this.activeAliases.values())).type;
                    break;
                default:
                    throw new Error("Unexpected type reference");
            }
        }
        else {
            if (((_e = (_d = typeRef.firstNamedChild) === null || _d === void 0 ? void 0 : _d.firstNamedChild) === null || _e === void 0 ? void 0 : _e.text) === "List") {
                declaredType = typeInference_1.TList(typeInference_1.TVar("a"));
            }
        }
        const params = (declaredType === null || declaredType === void 0 ? void 0 : declaredType.alias) ? declaredType.alias.parameters
            : (declaredType === null || declaredType === void 0 ? void 0 : declaredType.nodeType) === "Union"
                ? declaredType.params
                : [];
        if (declaredType.nodeType !== "Unknown" && params.length !== args.length) {
            this.diagnostics.push(typeInference_1.typeArgumentCountError(typeRef, args.length, params.length));
            return typeInference_1.TUnknown;
        }
        if (params.length === 0) {
            return declaredType;
        }
        // The param types are always TVars
        return typeReplacement_1.TypeReplacement.replace(declaredType, new Map(params
            .map((p, i) => [p, args[i]])
            .filter(([, type]) => !!type)));
    }
    typeDeclarationType(typeDeclaration) {
        const params = typeDeclaration.typeNames.map((name) => this.getTypeVar(name));
        return typeInference_1.TUnion(typeDeclaration.moduleName, typeDeclaration.name, params);
    }
    getTypeVar(e) {
        return this.varsByExpression.getOrSet(e, () => typeInference_1.TVar(e.text, this.rigidVars));
    }
}
exports.TypeExpression = TypeExpression;
//# sourceMappingURL=typeExpression.js.map