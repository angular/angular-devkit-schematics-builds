"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const exception_1 = require("../exception/exception");
const action_1 = require("./action");
const entry_1 = require("./entry");
const interface_1 = require("./interface");
const recorder_1 = require("./recorder");
class VirtualDirEntry {
    constructor(_tree, _path = core_1.normalize('/')) {
        this._tree = _tree;
        this._path = _path;
        this._subdirs = new Map();
    }
    _createDir(name) {
        return new VirtualDirEntry(this._tree, core_1.join(this._path, name));
    }
    get parent() {
        return this._path == '/' ? null : this._tree.getDir(core_1.dirname(this._path));
    }
    get path() { return this._path; }
    get subdirs() {
        const directChildPartsCount = core_1.split(core_1.normalize(this._path)).length + 1;
        const directories = this._tree.files
            // make sure entries belong to proper subbranch
            .filter(path => path.startsWith(this._path))
            // get all existing directories & prune to direct children
            .map(path => core_1.split(core_1.normalize(path)).slice(0, -1).slice(0, directChildPartsCount))
            // exclude current directory
            .filter(parts => parts.length === directChildPartsCount)
            // get directory name only
            .map(parts => parts[parts.length - 1]);
        // make sure to have a unique set (directories contain multiple files so appear multiple times)
        return Array.from(new Set(directories));
    }
    get subfiles() {
        return this._tree.files
            .filter(path => core_1.dirname(path) === this._path)
            .map(path => core_1.basename(path));
    }
    dir(name) {
        let maybe = this._subdirs.get(name);
        if (!maybe) {
            this._subdirs.set(name, maybe = this._createDir(name));
        }
        return maybe;
    }
    file(name) {
        return this._tree.get(core_1.join(this._path, name));
    }
    visit(visitor) {
        function _recurse(entry) {
            entry.subfiles.forEach(path => {
                visitor(core_1.join(entry._path, path), entry.file(path));
            });
            entry.subdirs.forEach(path => {
                _recurse(entry.dir(path));
            });
        }
        try {
            _recurse(this);
        }
        catch (e) {
            if (e !== interface_1.FileVisitorCancelToken) {
                throw e;
            }
        }
    }
}
exports.VirtualDirEntry = VirtualDirEntry;
/**
 * The root class of most trees.
 */
class VirtualTree {
    constructor() {
        this._actions = new action_1.ActionList();
        this._cacheMap = new Map();
        this._root = new VirtualDirEntry(this);
        this._tree = new Map();
    }
    /**
     * Normalize the path. Made available to subclasses to overload.
     * @param path The path to normalize.
     * @returns {string} A path that is resolved and normalized.
     */
    _normalizePath(path) {
        return core_1.normalize('/' + path);
    }
    get tree() { return this._tree; }
    get staging() { return this._cacheMap; }
    [interface_1.TreeSymbol]() {
        return this;
    }
    /**
     * A list of file names contained by this Tree.
     * @returns {[string]} File paths.
     */
    get files() {
        return [...new Set([...this.tree.keys(), ...this._cacheMap.keys()]).values()];
    }
    get root() { return this._root; }
    get(path) {
        const normalizedPath = this._normalizePath(path);
        return this._cacheMap.get(normalizedPath) || this.tree.get(normalizedPath) || null;
    }
    has(path) {
        return this.get(path) != null;
    }
    set(entry) {
        return this._cacheMap.set(entry.path, entry);
    }
    exists(path) {
        return this.has(path);
    }
    read(path) {
        const entry = this.get(path);
        return entry ? entry.content : null;
    }
    getDir(path) {
        let dir = this.root;
        core_1.split(this._normalizePath(path)).slice(1).forEach(fragment => {
            dir = dir.dir(fragment);
        });
        return dir;
    }
    visit(visitor) {
        try {
            this.files.forEach(path => visitor(path, this.get(path)));
        }
        catch (e) {
            if (e !== interface_1.FileVisitorCancelToken) {
                throw e;
            }
        }
    }
    beginUpdate(path) {
        const entry = this.get(path);
        if (!entry) {
            throw new exception_1.FileDoesNotExistException(path);
        }
        return recorder_1.UpdateRecorderBase.createFromFileEntry(entry);
    }
    commitUpdate(record) {
        if (record instanceof recorder_1.UpdateRecorderBase) {
            const path = record.path;
            const entry = this.get(path);
            if (!entry) {
                throw new exception_1.ContentHasMutatedException(path);
            }
            else {
                const newContent = record.apply(entry.content);
                this.overwrite(path, newContent);
            }
        }
        else {
            throw new exception_1.InvalidUpdateRecordException();
        }
    }
    overwrite(path, content) {
        const normalizedTo = this._normalizePath(path);
        if (typeof content == 'string') {
            content = Buffer.from(content, 'utf-8');
        }
        const maybeEntry = this.get(normalizedTo);
        if (maybeEntry && maybeEntry.content.equals(content)) {
            return;
        }
        this._overwrite(normalizedTo, content);
    }
    create(path, content) {
        const normalizedTo = this._normalizePath(path);
        if (typeof content == 'string') {
            content = Buffer.from(content);
        }
        this._create(normalizedTo, content);
    }
    rename(path, to) {
        const normalizedPath = this._normalizePath(path);
        const normalizedTo = this._normalizePath(to);
        if (normalizedPath === normalizedTo) {
            // Nothing to do.
            return;
        }
        this._rename(normalizedPath, normalizedTo);
    }
    delete(path) {
        this._delete(this._normalizePath(path));
    }
    _overwrite(path, content, action) {
        if (!this.has(path)) {
            throw new exception_1.FileDoesNotExistException(path);
        }
        // Update the action buffer.
        if (action) {
            this._actions.push(action);
        }
        else {
            this._actions.overwrite(path, content);
        }
        this.set(new entry_1.SimpleFileEntry(path, content));
    }
    _create(path, content, action) {
        if (this._cacheMap.has(path)) {
            throw new exception_1.FileAlreadyExistException(path);
        }
        if (action) {
            this._actions.push(action);
        }
        else {
            this._actions.create(path, content);
        }
        this.set(new entry_1.SimpleFileEntry(path, content));
    }
    _rename(path, to, action, force = false) {
        const entry = this.get(path);
        if (!entry) {
            throw new exception_1.FileDoesNotExistException(path);
        }
        if (this._cacheMap.has(to) && !force) {
            throw new exception_1.FileAlreadyExistException(to);
        }
        if (action) {
            this._actions.push(action);
        }
        else {
            this._actions.rename(path, to);
        }
        this.set(new entry_1.SimpleFileEntry(to, entry.content));
        this._cacheMap.delete(path);
    }
    _delete(path, action) {
        if (!this.has(path)) {
            throw new exception_1.FileDoesNotExistException(path);
        }
        if (action) {
            this._actions.push(action);
        }
        else {
            this._actions.delete(path);
        }
        this._cacheMap.delete(path);
    }
    apply(action, strategy) {
        if (this._actions.has(action)) {
            return;
        }
        switch (action.kind) {
            case 'o':
                // Update the action buffer.
                this._overwrite(action.path, action.content, action);
                break;
            case 'c':
                if (this._cacheMap.has(action.path)) {
                    switch (strategy) {
                        case interface_1.MergeStrategy.Error: throw new exception_1.MergeConflictException(action.path);
                        case interface_1.MergeStrategy.Overwrite:
                            this._overwrite(action.path, action.content, action);
                            break;
                    }
                }
                else {
                    this._create(action.path, action.content, action);
                }
                break;
            case 'r':
                const force = (strategy & interface_1.MergeStrategy.AllowOverwriteConflict) != 0;
                this._rename(action.path, action.to, action, force);
                break;
            case 'd':
                this._delete(action.path, action);
                break;
            default: throw new action_1.UnknownActionException(action);
        }
    }
    // Returns an ordered list of Action to get this host.
    get actions() {
        return [...this._actions];
    }
    /**
     * Allow subclasses to copy to a tree their own properties.
     * @return {Tree}
     * @private
     */
    _copyTo(tree) {
        tree._tree = new Map(this.tree);
        this._actions.forEach(action => tree._actions.push(action));
        [...this._cacheMap.entries()].forEach(([path, entry]) => {
            tree._cacheMap.set(path, entry);
        });
    }
    branch() {
        const newTree = new VirtualTree();
        this._copyTo(newTree);
        return newTree;
    }
    // Creates a new host from 2 hosts.
    merge(other, strategy = interface_1.MergeStrategy.Default) {
        other.actions.forEach(action => this.apply(action, strategy));
    }
    optimize() {
        // This destroys the history. Hope you know what you're doing.
        this._actions.optimize();
    }
    static branch(tree) {
        return tree.branch();
    }
    static merge(tree, other, strategy = interface_1.MergeStrategy.Default) {
        const newTree = tree.branch();
        newTree.merge(other, strategy);
        return newTree;
    }
    static optimize(tree) {
        const newTree = tree.branch();
        newTree.optimize();
        return newTree;
    }
}
exports.VirtualTree = VirtualTree;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvdHJlZS92aXJ0dWFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBUThCO0FBQzlCLHNEQU1nQztBQUNoQyxxQ0FBc0U7QUFDdEUsbUNBQTBDO0FBQzFDLDJDQVNxQjtBQUNyQix5Q0FBZ0Q7QUFHaEQ7SUFHRSxZQUFzQixLQUFrQixFQUFZLFFBQWMsZ0JBQVMsQ0FBQyxHQUFHLENBQUM7UUFBMUQsVUFBSyxHQUFMLEtBQUssQ0FBYTtRQUFZLFVBQUssR0FBTCxLQUFLLENBQXVCO1FBRnRFLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBMEIsQ0FBQztJQUU0QixDQUFDO0lBRTFFLFVBQVUsQ0FBQyxJQUFrQjtRQUNyQyxPQUFPLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsV0FBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBRUQsSUFBSSxNQUFNO1FBQ1IsT0FBTyxJQUFJLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxjQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUNELElBQUksSUFBSSxLQUFLLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFFakMsSUFBSSxPQUFPO1FBQ1QsTUFBTSxxQkFBcUIsR0FBRyxZQUFLLENBQUMsZ0JBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBRXRFLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSztZQUNwQywrQ0FBK0M7YUFDOUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUMsMERBQTBEO2FBQ3pELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQUssQ0FBQyxnQkFBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUscUJBQXFCLENBQUMsQ0FBQztZQUNqRiw0QkFBNEI7YUFDM0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxxQkFBcUIsQ0FBQztZQUN4RCwwQkFBMEI7YUFDekIsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV2QywrRkFBK0Y7UUFDL0YsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUNELElBQUksUUFBUTtRQUNWLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLO2FBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDO2FBQzVDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGVBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRCxHQUFHLENBQUMsSUFBa0I7UUFDcEIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNWLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQ3hEO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBQ0QsSUFBSSxDQUFDLElBQWtCO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsV0FBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQW9CO1FBQ3hCLGtCQUFrQixLQUFzQjtZQUN0QyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDNUIsT0FBTyxDQUFDLFdBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNyRCxDQUFDLENBQUMsQ0FBQztZQUNILEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUMzQixRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQW9CLENBQUMsQ0FBQztZQUMvQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJO1lBQ0YsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2hCO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixJQUFJLENBQUMsS0FBSyxrQ0FBc0IsRUFBRTtnQkFDaEMsTUFBTSxDQUFDLENBQUM7YUFDVDtTQUNGO0lBQ0gsQ0FBQztDQUNGO0FBbEVELDBDQWtFQztBQUdEOztHQUVHO0FBQ0g7SUFBQTtRQUNZLGFBQVEsR0FBRyxJQUFJLG1CQUFVLEVBQUUsQ0FBQztRQUM1QixjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQW1CLENBQUM7UUFDdkMsVUFBSyxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLFVBQUssR0FBRyxJQUFJLEdBQUcsRUFBbUIsQ0FBQztJQTBRL0MsQ0FBQztJQXhRQzs7OztPQUlHO0lBQ08sY0FBYyxDQUFDLElBQVk7UUFDbkMsT0FBTyxnQkFBUyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBQ0QsSUFBYyxJQUFJLEtBQW1DLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDekUsSUFBSSxPQUFPLEtBQW1DLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFFdEUsQ0FBQyxzQkFBVSxDQUFDO1FBQ1YsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBSSxLQUFLO1FBQ1AsT0FBTyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ3RGLENBQUM7SUFFRCxJQUFJLElBQUksS0FBZSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBRTNDLEdBQUcsQ0FBQyxJQUFZO1FBQ2QsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVqRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLElBQUksQ0FBQztJQUNyRixDQUFDO0lBQ0QsR0FBRyxDQUFDLElBQVk7UUFDZCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDO0lBQ2hDLENBQUM7SUFDRCxHQUFHLENBQUMsS0FBZ0I7UUFDbEIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRCxNQUFNLENBQUMsSUFBWTtRQUNqQixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFZO1FBQ2YsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU3QixPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3RDLENBQUM7SUFFRCxNQUFNLENBQUMsSUFBWTtRQUNqQixJQUFJLEdBQUcsR0FBYSxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQzlCLFlBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUMzRCxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFvQjtRQUN4QixJQUFJO1lBQ0YsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzNEO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixJQUFJLENBQUMsS0FBSyxrQ0FBc0IsRUFBRTtnQkFDaEMsTUFBTSxDQUFDLENBQUM7YUFDVDtTQUNGO0lBQ0gsQ0FBQztJQUVELFdBQVcsQ0FBQyxJQUFZO1FBQ3RCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNWLE1BQU0sSUFBSSxxQ0FBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzQztRQUVELE9BQU8sNkJBQWtCLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVELFlBQVksQ0FBQyxNQUFzQjtRQUNqQyxJQUFJLE1BQU0sWUFBWSw2QkFBa0IsRUFBRTtZQUN4QyxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ3pCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDVixNQUFNLElBQUksc0NBQTBCLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDNUM7aUJBQU07Z0JBQ0wsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2FBQ2xDO1NBQ0Y7YUFBTTtZQUNMLE1BQU0sSUFBSSx3Q0FBNEIsRUFBRSxDQUFDO1NBQzFDO0lBQ0gsQ0FBQztJQUVELFNBQVMsQ0FBQyxJQUFZLEVBQUUsT0FBd0I7UUFDOUMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQyxJQUFJLE9BQU8sT0FBTyxJQUFJLFFBQVEsRUFBRTtZQUM5QixPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDekM7UUFDRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzFDLElBQUksVUFBVSxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3BELE9BQU87U0FDUjtRQUNELElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFDRCxNQUFNLENBQUMsSUFBWSxFQUFFLE9BQXdCO1FBQzNDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0MsSUFBSSxPQUFPLE9BQU8sSUFBSSxRQUFRLEVBQUU7WUFDOUIsT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDaEM7UUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBQ0QsTUFBTSxDQUFDLElBQVksRUFBRSxFQUFVO1FBQzdCLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM3QyxJQUFJLGNBQWMsS0FBSyxZQUFZLEVBQUU7WUFDbkMsaUJBQWlCO1lBQ2pCLE9BQU87U0FDUjtRQUNELElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRCxNQUFNLENBQUMsSUFBWTtRQUNqQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRVMsVUFBVSxDQUFDLElBQVUsRUFBRSxPQUFlLEVBQUUsTUFBZTtRQUMvRCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNuQixNQUFNLElBQUkscUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDM0M7UUFDRCw0QkFBNEI7UUFDNUIsSUFBSSxNQUFNLEVBQUU7WUFDVixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUM1QjthQUFNO1lBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ3hDO1FBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVCQUFlLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUNTLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBZSxFQUFFLE1BQWU7UUFDNUQsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM1QixNQUFNLElBQUkscUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDM0M7UUFFRCxJQUFJLE1BQU0sRUFBRTtZQUNWLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzVCO2FBQU07WUFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDckM7UUFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksdUJBQWUsQ0FBQyxJQUFJLEVBQUUsT0FBaUIsQ0FBQyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUNTLE9BQU8sQ0FBQyxJQUFVLEVBQUUsRUFBUSxFQUFFLE1BQWUsRUFBRSxLQUFLLEdBQUcsS0FBSztRQUNwRSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdCLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDVixNQUFNLElBQUkscUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDM0M7UUFDRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ3BDLE1BQU0sSUFBSSxxQ0FBeUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUN6QztRQUVELElBQUksTUFBTSxFQUFFO1lBQ1YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDNUI7YUFBTTtZQUNMLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNoQztRQUVELElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSx1QkFBZSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBQ1MsT0FBTyxDQUFDLElBQVUsRUFBRSxNQUFlO1FBQzNDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ25CLE1BQU0sSUFBSSxxQ0FBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzQztRQUVELElBQUksTUFBTSxFQUFFO1lBQ1YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDNUI7YUFBTTtZQUNMLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzVCO1FBQ0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUdELEtBQUssQ0FBQyxNQUFjLEVBQUUsUUFBdUI7UUFDM0MsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUM3QixPQUFPO1NBQ1I7UUFDRCxRQUFRLE1BQU0sQ0FBQyxJQUFJLEVBQUU7WUFDbkIsS0FBSyxHQUFHO2dCQUNOLDRCQUE0QjtnQkFDNUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3JELE1BQU07WUFFUixLQUFLLEdBQUc7Z0JBQ04sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ25DLFFBQVEsUUFBUSxFQUFFO3dCQUNoQixLQUFLLHlCQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxJQUFJLGtDQUFzQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDeEUsS0FBSyx5QkFBYSxDQUFDLFNBQVM7NEJBQzFCLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDOzRCQUNyRCxNQUFNO3FCQUNUO2lCQUNGO3FCQUFNO29CQUNMLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2lCQUNuRDtnQkFDRCxNQUFNO1lBRVIsS0FBSyxHQUFHO2dCQUNOLE1BQU0sS0FBSyxHQUFHLENBQUMsUUFBUSxHQUFHLHlCQUFhLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3JFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDcEQsTUFBTTtZQUVSLEtBQUssR0FBRztnQkFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUVuRCxPQUFPLENBQUMsQ0FBQyxNQUFNLElBQUksK0JBQXNCLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDbkQ7SUFDSCxDQUFDO0lBRUQsc0RBQXNEO0lBQ3RELElBQUksT0FBTztRQUNULE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNPLE9BQU8sQ0FBd0IsSUFBTztRQUM5QyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDNUQsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFO1lBQ3RELElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxNQUFNO1FBQ0osTUFBTSxPQUFPLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztRQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRXRCLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxtQ0FBbUM7SUFDbkMsS0FBSyxDQUFDLEtBQVcsRUFBRSxXQUEwQix5QkFBYSxDQUFDLE9BQU87UUFDaEUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7SUFFRCxRQUFRO1FBQ04sOERBQThEO1FBQzlELElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDM0IsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBVTtRQUN0QixPQUFPLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUN2QixDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFVLEVBQUUsS0FBVyxFQUFFLFdBQTBCLHlCQUFhLENBQUMsT0FBTztRQUNuRixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDOUIsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFL0IsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBVTtRQUN4QixNQUFNLE9BQU8sR0FBSSxJQUFvQixDQUFDLE1BQU0sRUFBaUIsQ0FBQztRQUM5RCxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7UUFFbkIsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztDQUNGO0FBOVFELGtDQThRQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7XG4gIFBhdGgsXG4gIFBhdGhGcmFnbWVudCxcbiAgYmFzZW5hbWUsXG4gIGRpcm5hbWUsXG4gIGpvaW4sXG4gIG5vcm1hbGl6ZSxcbiAgc3BsaXQsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7XG4gIENvbnRlbnRIYXNNdXRhdGVkRXhjZXB0aW9uLFxuICBGaWxlQWxyZWFkeUV4aXN0RXhjZXB0aW9uLFxuICBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uLFxuICBJbnZhbGlkVXBkYXRlUmVjb3JkRXhjZXB0aW9uLFxuICBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uLFxufSBmcm9tICcuLi9leGNlcHRpb24vZXhjZXB0aW9uJztcbmltcG9ydCB7IEFjdGlvbiwgQWN0aW9uTGlzdCwgVW5rbm93bkFjdGlvbkV4Y2VwdGlvbiB9IGZyb20gJy4vYWN0aW9uJztcbmltcG9ydCB7IFNpbXBsZUZpbGVFbnRyeSB9IGZyb20gJy4vZW50cnknO1xuaW1wb3J0IHtcbiAgRGlyRW50cnksXG4gIEZpbGVFbnRyeSxcbiAgRmlsZVZpc2l0b3IsXG4gIEZpbGVWaXNpdG9yQ2FuY2VsVG9rZW4sXG4gIE1lcmdlU3RyYXRlZ3ksXG4gIFRyZWUsXG4gIFRyZWVTeW1ib2wsXG4gIFVwZGF0ZVJlY29yZGVyLFxufSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBVcGRhdGVSZWNvcmRlckJhc2UgfSBmcm9tICcuL3JlY29yZGVyJztcblxuXG5leHBvcnQgY2xhc3MgVmlydHVhbERpckVudHJ5IGltcGxlbWVudHMgRGlyRW50cnkge1xuICBwcm90ZWN0ZWQgX3N1YmRpcnMgPSBuZXcgTWFwPFBhdGhGcmFnbWVudCwgRGlyRW50cnk+KCk7XG5cbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIF90cmVlOiBWaXJ0dWFsVHJlZSwgcHJvdGVjdGVkIF9wYXRoOiBQYXRoID0gbm9ybWFsaXplKCcvJykpIHt9XG5cbiAgcHJvdGVjdGVkIF9jcmVhdGVEaXIobmFtZTogUGF0aEZyYWdtZW50KTogRGlyRW50cnkge1xuICAgIHJldHVybiBuZXcgVmlydHVhbERpckVudHJ5KHRoaXMuX3RyZWUsIGpvaW4odGhpcy5fcGF0aCwgbmFtZSkpO1xuICB9XG5cbiAgZ2V0IHBhcmVudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fcGF0aCA9PSAnLycgPyBudWxsIDogdGhpcy5fdHJlZS5nZXREaXIoZGlybmFtZSh0aGlzLl9wYXRoKSk7XG4gIH1cbiAgZ2V0IHBhdGgoKSB7IHJldHVybiB0aGlzLl9wYXRoOyB9XG5cbiAgZ2V0IHN1YmRpcnMoKSB7XG4gICAgY29uc3QgZGlyZWN0Q2hpbGRQYXJ0c0NvdW50ID0gc3BsaXQobm9ybWFsaXplKHRoaXMuX3BhdGgpKS5sZW5ndGggKyAxO1xuXG4gICAgY29uc3QgZGlyZWN0b3JpZXMgPSB0aGlzLl90cmVlLmZpbGVzXG4gICAgLy8gbWFrZSBzdXJlIGVudHJpZXMgYmVsb25nIHRvIHByb3BlciBzdWJicmFuY2hcbiAgICAuZmlsdGVyKHBhdGggPT4gcGF0aC5zdGFydHNXaXRoKHRoaXMuX3BhdGgpKVxuICAgIC8vIGdldCBhbGwgZXhpc3RpbmcgZGlyZWN0b3JpZXMgJiBwcnVuZSB0byBkaXJlY3QgY2hpbGRyZW5cbiAgICAubWFwKHBhdGggPT4gc3BsaXQobm9ybWFsaXplKHBhdGgpKS5zbGljZSgwLCAtMSkuc2xpY2UoMCwgZGlyZWN0Q2hpbGRQYXJ0c0NvdW50KSlcbiAgICAvLyBleGNsdWRlIGN1cnJlbnQgZGlyZWN0b3J5XG4gICAgLmZpbHRlcihwYXJ0cyA9PiBwYXJ0cy5sZW5ndGggPT09IGRpcmVjdENoaWxkUGFydHNDb3VudClcbiAgICAvLyBnZXQgZGlyZWN0b3J5IG5hbWUgb25seVxuICAgIC5tYXAocGFydHMgPT4gcGFydHNbcGFydHMubGVuZ3RoIC0gMV0pO1xuXG4gICAgLy8gbWFrZSBzdXJlIHRvIGhhdmUgYSB1bmlxdWUgc2V0IChkaXJlY3RvcmllcyBjb250YWluIG11bHRpcGxlIGZpbGVzIHNvIGFwcGVhciBtdWx0aXBsZSB0aW1lcylcbiAgICByZXR1cm4gQXJyYXkuZnJvbShuZXcgU2V0KGRpcmVjdG9yaWVzKSk7XG4gIH1cbiAgZ2V0IHN1YmZpbGVzKCkge1xuICAgIHJldHVybiB0aGlzLl90cmVlLmZpbGVzXG4gICAgICAuZmlsdGVyKHBhdGggPT4gZGlybmFtZShwYXRoKSA9PT0gdGhpcy5fcGF0aClcbiAgICAgIC5tYXAocGF0aCA9PiBiYXNlbmFtZShwYXRoKSk7XG4gIH1cblxuICBkaXIobmFtZTogUGF0aEZyYWdtZW50KSB7XG4gICAgbGV0IG1heWJlID0gdGhpcy5fc3ViZGlycy5nZXQobmFtZSk7XG4gICAgaWYgKCFtYXliZSkge1xuICAgICAgdGhpcy5fc3ViZGlycy5zZXQobmFtZSwgbWF5YmUgPSB0aGlzLl9jcmVhdGVEaXIobmFtZSkpO1xuICAgIH1cblxuICAgIHJldHVybiBtYXliZTtcbiAgfVxuICBmaWxlKG5hbWU6IFBhdGhGcmFnbWVudCkge1xuICAgIHJldHVybiB0aGlzLl90cmVlLmdldChqb2luKHRoaXMuX3BhdGgsIG5hbWUpKTtcbiAgfVxuXG4gIHZpc2l0KHZpc2l0b3I6IEZpbGVWaXNpdG9yKSB7XG4gICAgZnVuY3Rpb24gX3JlY3Vyc2UoZW50cnk6IFZpcnR1YWxEaXJFbnRyeSkge1xuICAgICAgZW50cnkuc3ViZmlsZXMuZm9yRWFjaChwYXRoID0+IHtcbiAgICAgICAgdmlzaXRvcihqb2luKGVudHJ5Ll9wYXRoLCBwYXRoKSwgZW50cnkuZmlsZShwYXRoKSk7XG4gICAgICB9KTtcbiAgICAgIGVudHJ5LnN1YmRpcnMuZm9yRWFjaChwYXRoID0+IHtcbiAgICAgICAgX3JlY3Vyc2UoZW50cnkuZGlyKHBhdGgpIGFzIFZpcnR1YWxEaXJFbnRyeSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgX3JlY3Vyc2UodGhpcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgIT09IEZpbGVWaXNpdG9yQ2FuY2VsVG9rZW4pIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIFRoZSByb290IGNsYXNzIG9mIG1vc3QgdHJlZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBWaXJ0dWFsVHJlZSBpbXBsZW1lbnRzIFRyZWUge1xuICBwcm90ZWN0ZWQgX2FjdGlvbnMgPSBuZXcgQWN0aW9uTGlzdCgpO1xuICBwcm90ZWN0ZWQgX2NhY2hlTWFwID0gbmV3IE1hcDxQYXRoLCBGaWxlRW50cnk+KCk7XG4gIHByb3RlY3RlZCBfcm9vdCA9IG5ldyBWaXJ0dWFsRGlyRW50cnkodGhpcyk7XG4gIHByb3RlY3RlZCBfdHJlZSA9IG5ldyBNYXA8UGF0aCwgRmlsZUVudHJ5PigpO1xuXG4gIC8qKlxuICAgKiBOb3JtYWxpemUgdGhlIHBhdGguIE1hZGUgYXZhaWxhYmxlIHRvIHN1YmNsYXNzZXMgdG8gb3ZlcmxvYWQuXG4gICAqIEBwYXJhbSBwYXRoIFRoZSBwYXRoIHRvIG5vcm1hbGl6ZS5cbiAgICogQHJldHVybnMge3N0cmluZ30gQSBwYXRoIHRoYXQgaXMgcmVzb2x2ZWQgYW5kIG5vcm1hbGl6ZWQuXG4gICAqL1xuICBwcm90ZWN0ZWQgX25vcm1hbGl6ZVBhdGgocGF0aDogc3RyaW5nKTogUGF0aCB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZSgnLycgKyBwYXRoKTtcbiAgfVxuICBwcm90ZWN0ZWQgZ2V0IHRyZWUoKTogUmVhZG9ubHlNYXA8UGF0aCwgRmlsZUVudHJ5PiB7IHJldHVybiB0aGlzLl90cmVlOyB9XG4gIGdldCBzdGFnaW5nKCk6IFJlYWRvbmx5TWFwPFBhdGgsIEZpbGVFbnRyeT4geyByZXR1cm4gdGhpcy5fY2FjaGVNYXA7IH1cblxuICBbVHJlZVN5bWJvbF0oKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQSBsaXN0IG9mIGZpbGUgbmFtZXMgY29udGFpbmVkIGJ5IHRoaXMgVHJlZS5cbiAgICogQHJldHVybnMge1tzdHJpbmddfSBGaWxlIHBhdGhzLlxuICAgKi9cbiAgZ2V0IGZpbGVzKCk6IFBhdGhbXSB7XG4gICAgcmV0dXJuIFsuLi5uZXcgU2V0PFBhdGg+KFsuLi50aGlzLnRyZWUua2V5cygpLCAuLi50aGlzLl9jYWNoZU1hcC5rZXlzKCldKS52YWx1ZXMoKV07XG4gIH1cblxuICBnZXQgcm9vdCgpOiBEaXJFbnRyeSB7IHJldHVybiB0aGlzLl9yb290OyB9XG5cbiAgZ2V0KHBhdGg6IHN0cmluZyk6IEZpbGVFbnRyeSB8IG51bGwge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRQYXRoID0gdGhpcy5fbm9ybWFsaXplUGF0aChwYXRoKTtcblxuICAgIHJldHVybiB0aGlzLl9jYWNoZU1hcC5nZXQobm9ybWFsaXplZFBhdGgpIHx8IHRoaXMudHJlZS5nZXQobm9ybWFsaXplZFBhdGgpIHx8IG51bGw7XG4gIH1cbiAgaGFzKHBhdGg6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmdldChwYXRoKSAhPSBudWxsO1xuICB9XG4gIHNldChlbnRyeTogRmlsZUVudHJ5KSB7XG4gICAgcmV0dXJuIHRoaXMuX2NhY2hlTWFwLnNldChlbnRyeS5wYXRoLCBlbnRyeSk7XG4gIH1cblxuICBleGlzdHMocGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaGFzKHBhdGgpO1xuICB9XG5cbiAgcmVhZChwYXRoOiBzdHJpbmcpOiBCdWZmZXIgfCBudWxsIHtcbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZ2V0KHBhdGgpO1xuXG4gICAgcmV0dXJuIGVudHJ5ID8gZW50cnkuY29udGVudCA6IG51bGw7XG4gIH1cblxuICBnZXREaXIocGF0aDogc3RyaW5nKTogRGlyRW50cnkge1xuICAgIGxldCBkaXI6IERpckVudHJ5ID0gdGhpcy5yb290O1xuICAgIHNwbGl0KHRoaXMuX25vcm1hbGl6ZVBhdGgocGF0aCkpLnNsaWNlKDEpLmZvckVhY2goZnJhZ21lbnQgPT4ge1xuICAgICAgZGlyID0gZGlyLmRpcihmcmFnbWVudCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGlyO1xuICB9XG5cbiAgdmlzaXQodmlzaXRvcjogRmlsZVZpc2l0b3IpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5maWxlcy5mb3JFYWNoKHBhdGggPT4gdmlzaXRvcihwYXRoLCB0aGlzLmdldChwYXRoKSkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlICE9PSBGaWxlVmlzaXRvckNhbmNlbFRva2VuKSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYmVnaW5VcGRhdGUocGF0aDogc3RyaW5nKTogVXBkYXRlUmVjb3JkZXIge1xuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5nZXQocGF0aCk7XG4gICAgaWYgKCFlbnRyeSkge1xuICAgICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocGF0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFVwZGF0ZVJlY29yZGVyQmFzZS5jcmVhdGVGcm9tRmlsZUVudHJ5KGVudHJ5KTtcbiAgfVxuXG4gIGNvbW1pdFVwZGF0ZShyZWNvcmQ6IFVwZGF0ZVJlY29yZGVyKSB7XG4gICAgaWYgKHJlY29yZCBpbnN0YW5jZW9mIFVwZGF0ZVJlY29yZGVyQmFzZSkge1xuICAgICAgY29uc3QgcGF0aCA9IHJlY29yZC5wYXRoO1xuICAgICAgY29uc3QgZW50cnkgPSB0aGlzLmdldChwYXRoKTtcbiAgICAgIGlmICghZW50cnkpIHtcbiAgICAgICAgdGhyb3cgbmV3IENvbnRlbnRIYXNNdXRhdGVkRXhjZXB0aW9uKHBhdGgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbmV3Q29udGVudCA9IHJlY29yZC5hcHBseShlbnRyeS5jb250ZW50KTtcbiAgICAgICAgdGhpcy5vdmVyd3JpdGUocGF0aCwgbmV3Q29udGVudCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkVXBkYXRlUmVjb3JkRXhjZXB0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcndyaXRlKHBhdGg6IHN0cmluZywgY29udGVudDogQnVmZmVyIHwgc3RyaW5nKSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZFRvID0gdGhpcy5fbm9ybWFsaXplUGF0aChwYXRoKTtcbiAgICBpZiAodHlwZW9mIGNvbnRlbnQgPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnRlbnQgPSBCdWZmZXIuZnJvbShjb250ZW50LCAndXRmLTgnKTtcbiAgICB9XG4gICAgY29uc3QgbWF5YmVFbnRyeSA9IHRoaXMuZ2V0KG5vcm1hbGl6ZWRUbyk7XG4gICAgaWYgKG1heWJlRW50cnkgJiYgbWF5YmVFbnRyeS5jb250ZW50LmVxdWFscyhjb250ZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9vdmVyd3JpdGUobm9ybWFsaXplZFRvLCBjb250ZW50KTtcbiAgfVxuICBjcmVhdGUocGF0aDogc3RyaW5nLCBjb250ZW50OiBCdWZmZXIgfCBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBub3JtYWxpemVkVG8gPSB0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpO1xuICAgIGlmICh0eXBlb2YgY29udGVudCA9PSAnc3RyaW5nJykge1xuICAgICAgY29udGVudCA9IEJ1ZmZlci5mcm9tKGNvbnRlbnQpO1xuICAgIH1cbiAgICB0aGlzLl9jcmVhdGUobm9ybWFsaXplZFRvLCBjb250ZW50KTtcbiAgfVxuICByZW5hbWUocGF0aDogc3RyaW5nLCB0bzogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3Qgbm9ybWFsaXplZFBhdGggPSB0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRUbyA9IHRoaXMuX25vcm1hbGl6ZVBhdGgodG8pO1xuICAgIGlmIChub3JtYWxpemVkUGF0aCA9PT0gbm9ybWFsaXplZFRvKSB7XG4gICAgICAvLyBOb3RoaW5nIHRvIGRvLlxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9yZW5hbWUobm9ybWFsaXplZFBhdGgsIG5vcm1hbGl6ZWRUbyk7XG4gIH1cblxuICBkZWxldGUocGF0aDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5fZGVsZXRlKHRoaXMuX25vcm1hbGl6ZVBhdGgocGF0aCkpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9vdmVyd3JpdGUocGF0aDogUGF0aCwgY29udGVudDogQnVmZmVyLCBhY3Rpb24/OiBBY3Rpb24pIHtcbiAgICBpZiAoIXRoaXMuaGFzKHBhdGgpKSB7XG4gICAgICB0aHJvdyBuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgICB9XG4gICAgLy8gVXBkYXRlIHRoZSBhY3Rpb24gYnVmZmVyLlxuICAgIGlmIChhY3Rpb24pIHtcbiAgICAgIHRoaXMuX2FjdGlvbnMucHVzaChhY3Rpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9hY3Rpb25zLm92ZXJ3cml0ZShwYXRoLCBjb250ZW50KTtcbiAgICB9XG4gICAgdGhpcy5zZXQobmV3IFNpbXBsZUZpbGVFbnRyeShwYXRoLCBjb250ZW50KSk7XG4gIH1cbiAgcHJvdGVjdGVkIF9jcmVhdGUocGF0aDogUGF0aCwgY29udGVudDogQnVmZmVyLCBhY3Rpb24/OiBBY3Rpb24pIHtcbiAgICBpZiAodGhpcy5fY2FjaGVNYXAuaGFzKHBhdGgpKSB7XG4gICAgICB0aHJvdyBuZXcgRmlsZUFscmVhZHlFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgICB9XG5cbiAgICBpZiAoYWN0aW9uKSB7XG4gICAgICB0aGlzLl9hY3Rpb25zLnB1c2goYWN0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYWN0aW9ucy5jcmVhdGUocGF0aCwgY29udGVudCk7XG4gICAgfVxuICAgIHRoaXMuc2V0KG5ldyBTaW1wbGVGaWxlRW50cnkocGF0aCwgY29udGVudCBhcyBCdWZmZXIpKTtcbiAgfVxuICBwcm90ZWN0ZWQgX3JlbmFtZShwYXRoOiBQYXRoLCB0bzogUGF0aCwgYWN0aW9uPzogQWN0aW9uLCBmb3JjZSA9IGZhbHNlKSB7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmdldChwYXRoKTtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICB0aHJvdyBuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2NhY2hlTWFwLmhhcyh0bykgJiYgIWZvcmNlKSB7XG4gICAgICB0aHJvdyBuZXcgRmlsZUFscmVhZHlFeGlzdEV4Y2VwdGlvbih0byk7XG4gICAgfVxuXG4gICAgaWYgKGFjdGlvbikge1xuICAgICAgdGhpcy5fYWN0aW9ucy5wdXNoKGFjdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2FjdGlvbnMucmVuYW1lKHBhdGgsIHRvKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldChuZXcgU2ltcGxlRmlsZUVudHJ5KHRvLCBlbnRyeS5jb250ZW50KSk7XG4gICAgdGhpcy5fY2FjaGVNYXAuZGVsZXRlKHBhdGgpO1xuICB9XG4gIHByb3RlY3RlZCBfZGVsZXRlKHBhdGg6IFBhdGgsIGFjdGlvbj86IEFjdGlvbikge1xuICAgIGlmICghdGhpcy5oYXMocGF0aCkpIHtcbiAgICAgIHRocm93IG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKHBhdGgpO1xuICAgIH1cblxuICAgIGlmIChhY3Rpb24pIHtcbiAgICAgIHRoaXMuX2FjdGlvbnMucHVzaChhY3Rpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9hY3Rpb25zLmRlbGV0ZShwYXRoKTtcbiAgICB9XG4gICAgdGhpcy5fY2FjaGVNYXAuZGVsZXRlKHBhdGgpO1xuICB9XG5cblxuICBhcHBseShhY3Rpb246IEFjdGlvbiwgc3RyYXRlZ3k6IE1lcmdlU3RyYXRlZ3kpIHtcbiAgICBpZiAodGhpcy5fYWN0aW9ucy5oYXMoYWN0aW9uKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzd2l0Y2ggKGFjdGlvbi5raW5kKSB7XG4gICAgICBjYXNlICdvJzpcbiAgICAgICAgLy8gVXBkYXRlIHRoZSBhY3Rpb24gYnVmZmVyLlxuICAgICAgICB0aGlzLl9vdmVyd3JpdGUoYWN0aW9uLnBhdGgsIGFjdGlvbi5jb250ZW50LCBhY3Rpb24pO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYyc6XG4gICAgICAgIGlmICh0aGlzLl9jYWNoZU1hcC5oYXMoYWN0aW9uLnBhdGgpKSB7XG4gICAgICAgICAgc3dpdGNoIChzdHJhdGVneSkge1xuICAgICAgICAgICAgY2FzZSBNZXJnZVN0cmF0ZWd5LkVycm9yOiB0aHJvdyBuZXcgTWVyZ2VDb25mbGljdEV4Y2VwdGlvbihhY3Rpb24ucGF0aCk7XG4gICAgICAgICAgICBjYXNlIE1lcmdlU3RyYXRlZ3kuT3ZlcndyaXRlOlxuICAgICAgICAgICAgICB0aGlzLl9vdmVyd3JpdGUoYWN0aW9uLnBhdGgsIGFjdGlvbi5jb250ZW50LCBhY3Rpb24pO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fY3JlYXRlKGFjdGlvbi5wYXRoLCBhY3Rpb24uY29udGVudCwgYWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAncic6XG4gICAgICAgIGNvbnN0IGZvcmNlID0gKHN0cmF0ZWd5ICYgTWVyZ2VTdHJhdGVneS5BbGxvd092ZXJ3cml0ZUNvbmZsaWN0KSAhPSAwO1xuICAgICAgICB0aGlzLl9yZW5hbWUoYWN0aW9uLnBhdGgsIGFjdGlvbi50bywgYWN0aW9uLCBmb3JjZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdkJzogdGhpcy5fZGVsZXRlKGFjdGlvbi5wYXRoLCBhY3Rpb24pOyBicmVhaztcblxuICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IFVua25vd25BY3Rpb25FeGNlcHRpb24oYWN0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvLyBSZXR1cm5zIGFuIG9yZGVyZWQgbGlzdCBvZiBBY3Rpb24gdG8gZ2V0IHRoaXMgaG9zdC5cbiAgZ2V0IGFjdGlvbnMoKTogQWN0aW9uW10ge1xuICAgIHJldHVybiBbLi4udGhpcy5fYWN0aW9uc107XG4gIH1cblxuICAvKipcbiAgICogQWxsb3cgc3ViY2xhc3NlcyB0byBjb3B5IHRvIGEgdHJlZSB0aGVpciBvd24gcHJvcGVydGllcy5cbiAgICogQHJldHVybiB7VHJlZX1cbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByb3RlY3RlZCBfY29weVRvPFQgZXh0ZW5kcyBWaXJ0dWFsVHJlZT4odHJlZTogVCk6IHZvaWQge1xuICAgIHRyZWUuX3RyZWUgPSBuZXcgTWFwKHRoaXMudHJlZSk7XG4gICAgdGhpcy5fYWN0aW9ucy5mb3JFYWNoKGFjdGlvbiA9PiB0cmVlLl9hY3Rpb25zLnB1c2goYWN0aW9uKSk7XG4gICAgWy4uLnRoaXMuX2NhY2hlTWFwLmVudHJpZXMoKV0uZm9yRWFjaCgoW3BhdGgsIGVudHJ5XSkgPT4ge1xuICAgICAgdHJlZS5fY2FjaGVNYXAuc2V0KHBhdGgsIGVudHJ5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGJyYW5jaCgpOiBUcmVlIHtcbiAgICBjb25zdCBuZXdUcmVlID0gbmV3IFZpcnR1YWxUcmVlKCk7XG4gICAgdGhpcy5fY29weVRvKG5ld1RyZWUpO1xuXG4gICAgcmV0dXJuIG5ld1RyZWU7XG4gIH1cblxuICAvLyBDcmVhdGVzIGEgbmV3IGhvc3QgZnJvbSAyIGhvc3RzLlxuICBtZXJnZShvdGhlcjogVHJlZSwgc3RyYXRlZ3k6IE1lcmdlU3RyYXRlZ3kgPSBNZXJnZVN0cmF0ZWd5LkRlZmF1bHQpIHtcbiAgICBvdGhlci5hY3Rpb25zLmZvckVhY2goYWN0aW9uID0+IHRoaXMuYXBwbHkoYWN0aW9uLCBzdHJhdGVneSkpO1xuICB9XG5cbiAgb3B0aW1pemUoKSB7XG4gICAgLy8gVGhpcyBkZXN0cm95cyB0aGUgaGlzdG9yeS4gSG9wZSB5b3Uga25vdyB3aGF0IHlvdSdyZSBkb2luZy5cbiAgICB0aGlzLl9hY3Rpb25zLm9wdGltaXplKCk7XG4gIH1cblxuICBzdGF0aWMgYnJhbmNoKHRyZWU6IFRyZWUpIHtcbiAgICByZXR1cm4gdHJlZS5icmFuY2goKTtcbiAgfVxuXG4gIHN0YXRpYyBtZXJnZSh0cmVlOiBUcmVlLCBvdGhlcjogVHJlZSwgc3RyYXRlZ3k6IE1lcmdlU3RyYXRlZ3kgPSBNZXJnZVN0cmF0ZWd5LkRlZmF1bHQpOiBUcmVlIHtcbiAgICBjb25zdCBuZXdUcmVlID0gdHJlZS5icmFuY2goKTtcbiAgICBuZXdUcmVlLm1lcmdlKG90aGVyLCBzdHJhdGVneSk7XG5cbiAgICByZXR1cm4gbmV3VHJlZTtcbiAgfVxuXG4gIHN0YXRpYyBvcHRpbWl6ZSh0cmVlOiBUcmVlKSB7XG4gICAgY29uc3QgbmV3VHJlZSA9ICh0cmVlIGFzIFZpcnR1YWxUcmVlKS5icmFuY2goKSBhcyBWaXJ0dWFsVHJlZTtcbiAgICBuZXdUcmVlLm9wdGltaXplKCk7XG5cbiAgICByZXR1cm4gbmV3VHJlZTtcbiAgfVxufVxuIl19