"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileDiagnostics = exports.diagnosticsEquals = void 0;
const utils_1 = require("../../util/utils");
function diagnosticsEquals(a, b) {
    var _a, _b, _c, _d;
    if (a === b) {
        return true;
    }
    return (a.code === b.code &&
        a.message === b.message &&
        a.severity === b.severity &&
        a.source === b.source &&
        utils_1.Utils.rangeEquals(a.range, b.range) &&
        utils_1.Utils.arrayEquals((_a = a.relatedInformation) !== null && _a !== void 0 ? _a : [], (_b = b.relatedInformation) !== null && _b !== void 0 ? _b : [], (a, b) => {
            return (a.message === b.message &&
                utils_1.Utils.rangeEquals(a.location.range, b.location.range) &&
                a.location.uri === b.location.uri);
        }) &&
        utils_1.Utils.arrayEquals((_c = a.tags) !== null && _c !== void 0 ? _c : [], (_d = b.tags) !== null && _d !== void 0 ? _d : []));
}
exports.diagnosticsEquals = diagnosticsEquals;
class FileDiagnostics {
    constructor(uri) {
        this.uri = uri;
        this.diagnostics = new Map();
    }
    get() {
        return [
            ...this.getForKind(0 /* ElmMake */),
            ...this.getForKind(1 /* ElmAnalyse */),
            ...this.getForKind(2 /* ElmTest */),
            ...this.getForKind(3 /* TypeInference */),
        ];
    }
    update(kind, diagnostics) {
        const existing = this.getForKind(kind);
        if (utils_1.Utils.arrayEquals(existing, diagnostics, diagnosticsEquals)) {
            return false;
        }
        this.diagnostics.set(kind, diagnostics);
        return true;
    }
    getForKind(kind) {
        var _a;
        return (_a = this.diagnostics.get(kind)) !== null && _a !== void 0 ? _a : [];
    }
}
exports.FileDiagnostics = FileDiagnostics;
//# sourceMappingURL=fileDiagnostics.js.map