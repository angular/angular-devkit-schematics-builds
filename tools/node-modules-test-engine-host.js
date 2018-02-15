"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const node_module_engine_host_1 = require("./node-module-engine-host");
/**
 * An EngineHost that uses a registry to super seed locations of collection.json files, but
 * revert back to using node modules resolution. This is done for testing.
 */
class NodeModulesTestEngineHost extends node_module_engine_host_1.NodeModulesEngineHost {
    constructor() {
        super(...arguments);
        this._collections = new Map();
    }
    registerCollection(name, path) {
        this._collections.set(name, path);
    }
    _resolveCollectionPath(name) {
        const maybePath = this._collections.get(name);
        if (maybePath) {
            return maybePath;
        }
        return super._resolveCollectionPath(name);
    }
}
exports.NodeModulesTestEngineHost = NodeModulesTestEngineHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS1tb2R1bGVzLXRlc3QtZW5naW5lLWhvc3QuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvbm9kZS1tb2R1bGVzLXRlc3QtZW5naW5lLWhvc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCx1RUFBa0U7QUFHbEU7OztHQUdHO0FBQ0gsK0JBQXVDLFNBQVEsK0NBQXFCO0lBQXBFOztRQUNVLGlCQUFZLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7SUFjbkQsQ0FBQztJQVpDLGtCQUFrQixDQUFDLElBQVksRUFBRSxJQUFZO1FBQzNDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRVMsc0JBQXNCLENBQUMsSUFBWTtRQUMzQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ2QsTUFBTSxDQUFDLFNBQVMsQ0FBQztRQUNuQixDQUFDO1FBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDO0NBQ0Y7QUFmRCw4REFlQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IE5vZGVNb2R1bGVzRW5naW5lSG9zdCB9IGZyb20gJy4vbm9kZS1tb2R1bGUtZW5naW5lLWhvc3QnO1xuXG5cbi8qKlxuICogQW4gRW5naW5lSG9zdCB0aGF0IHVzZXMgYSByZWdpc3RyeSB0byBzdXBlciBzZWVkIGxvY2F0aW9ucyBvZiBjb2xsZWN0aW9uLmpzb24gZmlsZXMsIGJ1dFxuICogcmV2ZXJ0IGJhY2sgdG8gdXNpbmcgbm9kZSBtb2R1bGVzIHJlc29sdXRpb24uIFRoaXMgaXMgZG9uZSBmb3IgdGVzdGluZy5cbiAqL1xuZXhwb3J0IGNsYXNzIE5vZGVNb2R1bGVzVGVzdEVuZ2luZUhvc3QgZXh0ZW5kcyBOb2RlTW9kdWxlc0VuZ2luZUhvc3Qge1xuICBwcml2YXRlIF9jb2xsZWN0aW9ucyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG5cbiAgcmVnaXN0ZXJDb2xsZWN0aW9uKG5hbWU6IHN0cmluZywgcGF0aDogc3RyaW5nKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbnMuc2V0KG5hbWUsIHBhdGgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBtYXliZVBhdGggPSB0aGlzLl9jb2xsZWN0aW9ucy5nZXQobmFtZSk7XG4gICAgaWYgKG1heWJlUGF0aCkge1xuICAgICAgcmV0dXJuIG1heWJlUGF0aDtcbiAgICB9XG5cbiAgICByZXR1cm4gc3VwZXIuX3Jlc29sdmVDb2xsZWN0aW9uUGF0aChuYW1lKTtcbiAgfVxufVxuIl19