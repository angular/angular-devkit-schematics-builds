"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tree = exports.TreeSymbol = exports.FileVisitorCancelToken = exports.MergeStrategy = void 0;
var MergeStrategy;
(function (MergeStrategy) {
    MergeStrategy[MergeStrategy["AllowOverwriteConflict"] = 2] = "AllowOverwriteConflict";
    MergeStrategy[MergeStrategy["AllowCreationConflict"] = 4] = "AllowCreationConflict";
    MergeStrategy[MergeStrategy["AllowDeleteConflict"] = 8] = "AllowDeleteConflict";
    // Uses the default strategy.
    MergeStrategy[MergeStrategy["Default"] = 0] = "Default";
    // Error out if 2 files have the same path. It is useful to have a different value than
    // Default in this case as the tooling Default might differ.
    MergeStrategy[MergeStrategy["Error"] = 1] = "Error";
    // Only content conflicts are overwritten.
    MergeStrategy[MergeStrategy["ContentOnly"] = 2] = "ContentOnly";
    // Overwrite everything with the latest change.
    MergeStrategy[MergeStrategy["Overwrite"] = 14] = "Overwrite";
})(MergeStrategy || (exports.MergeStrategy = MergeStrategy = {}));
// eslint-disable-next-line @typescript-eslint/no-inferrable-types
exports.FileVisitorCancelToken = Symbol();
exports.TreeSymbol = (function () {
    const globalSymbol = (typeof window == 'object' && window.window === window && window.Symbol) ||
        (typeof self == 'object' && self.self === self && self.Symbol) ||
        (typeof global == 'object' && global.global === global && global.Symbol);
    if (!globalSymbol) {
        return Symbol('schematic-tree');
    }
    if (!globalSymbol.schematicTree) {
        globalSymbol.schematicTree = Symbol('schematic-tree');
    }
    return globalSymbol.schematicTree;
})();
exports.Tree = Object.freeze({
    isTree(maybeTree) {
        return exports.TreeSymbol in maybeTree;
    },
});
