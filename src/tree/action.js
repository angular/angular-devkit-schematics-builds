"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionList = exports.UnknownActionException = void 0;
exports.isContentAction = isContentAction;
const core_1 = require("@angular-devkit/core");
class UnknownActionException extends core_1.BaseException {
    constructor(action) {
        super(`Unknown action: "${action.kind}".`);
    }
}
exports.UnknownActionException = UnknownActionException;
let _id = 1;
class ActionList {
    _actions = [];
    _action(action) {
        this._actions.push({
            ...action,
            id: _id++,
            parent: this._actions[this._actions.length - 1]?.id ?? 0,
        });
    }
    create(path, content) {
        this._action({ kind: 'c', path, content });
    }
    overwrite(path, content) {
        this._action({ kind: 'o', path, content });
    }
    rename(path, to) {
        this._action({ kind: 'r', path, to });
    }
    delete(path) {
        this._action({ kind: 'd', path });
    }
    optimize() {
        const toCreate = new Map();
        const toRename = new Map();
        const toOverwrite = new Map();
        const toDelete = new Set();
        for (const action of this._actions) {
            switch (action.kind) {
                case 'c':
                    toCreate.set(action.path, action.content);
                    break;
                case 'o':
                    if (toCreate.has(action.path)) {
                        toCreate.set(action.path, action.content);
                    }
                    else {
                        toOverwrite.set(action.path, action.content);
                    }
                    break;
                case 'd':
                    toDelete.add(action.path);
                    break;
                case 'r': {
                    const maybeCreate = toCreate.get(action.path);
                    const maybeOverwrite = toOverwrite.get(action.path);
                    if (maybeCreate) {
                        toCreate.delete(action.path);
                        toCreate.set(action.to, maybeCreate);
                    }
                    if (maybeOverwrite) {
                        toOverwrite.delete(action.path);
                        toOverwrite.set(action.to, maybeOverwrite);
                    }
                    let maybeRename = undefined;
                    for (const [from, to] of toRename.entries()) {
                        if (to == action.path) {
                            maybeRename = from;
                            break;
                        }
                    }
                    if (maybeRename) {
                        toRename.set(maybeRename, action.to);
                    }
                    if (!maybeCreate && !maybeOverwrite && !maybeRename) {
                        toRename.set(action.path, action.to);
                    }
                    break;
                }
            }
        }
        this._actions = [];
        toDelete.forEach((x) => {
            this.delete(x);
        });
        toRename.forEach((to, from) => {
            this.rename(from, to);
        });
        toCreate.forEach((content, path) => {
            this.create(path, content);
        });
        toOverwrite.forEach((content, path) => {
            this.overwrite(path, content);
        });
    }
    push(action) {
        this._actions.push(action);
    }
    get(i) {
        return this._actions[i];
    }
    has(action) {
        for (let i = 0; i < this._actions.length; i++) {
            const a = this._actions[i];
            if (a.id == action.id) {
                return true;
            }
            if (a.id > action.id) {
                return false;
            }
        }
        return false;
    }
    find(predicate) {
        return this._actions.find(predicate) || null;
    }
    forEach(fn, thisArg) {
        this._actions.forEach(fn, thisArg);
    }
    get length() {
        return this._actions.length;
    }
    [Symbol.iterator]() {
        return this._actions[Symbol.iterator]();
    }
}
exports.ActionList = ActionList;
function isContentAction(action) {
    return action.kind == 'c' || action.kind == 'o';
}
