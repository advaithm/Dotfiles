"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePosition = exports.PositionUtil = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
class PositionUtil {
    constructor(row, col) {
        this.row = row;
        this.col = col;
    }
    static FROM_VS_POSITION(position) {
        return new PositionUtil(position.line, position.character);
    }
    static FROM_TS_POSITION(position) {
        return new PositionUtil(position.row, position.column);
    }
    toVSPosition() {
        return vscode_languageserver_1.Position.create(this.row, this.col);
    }
    toTSPosition() {
        return {
            column: this.col,
            row: this.row,
        };
    }
}
exports.PositionUtil = PositionUtil;
function comparePosition(pos1, pos2) {
    if (pos1.line === pos2.row && pos1.character === pos2.column) {
        return 0;
    }
    if (pos1.line < pos2.row ||
        (pos1.line === pos2.row && pos1.character < pos2.column)) {
        return -1;
    }
    return 1;
}
exports.comparePosition = comparePosition;
//# sourceMappingURL=positionUtil.js.map