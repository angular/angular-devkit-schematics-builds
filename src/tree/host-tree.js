"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterHostTree = exports.HostCreateTree = exports.HostTree = exports.HostDirEntry = void 0;
const core_1 = require("@angular-devkit/core");
const jsonc_parser_1 = require("jsonc-parser");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const util_1 = require("util");
const exception_1 = require("../exception/exception");
const delegate_1 = require("./delegate");
const entry_1 = require("./entry");
const interface_1 = require("./interface");
const recorder_1 = require("./recorder");
const scoped_1 = require("./scoped");
let _uniqueId = 0;
class HostDirEntry {
    constructor(parent, path, _host, _tree) {
        this.parent = parent;
        this.path = path;
        this._host = _host;
        this._tree = _tree;
    }
    get subdirs() {
        return this._host
            .list(this.path)
            .filter((fragment) => this._host.isDirectory((0, core_1.join)(this.path, fragment)));
    }
    get subfiles() {
        return this._host
            .list(this.path)
            .filter((fragment) => this._host.isFile((0, core_1.join)(this.path, fragment)));
    }
    dir(name) {
        return this._tree.getDir((0, core_1.join)(this.path, name));
    }
    file(name) {
        return this._tree.get((0, core_1.join)(this.path, name));
    }
    visit(visitor) {
        try {
            this.getSubfilesRecursively().forEach((file) => visitor(file.path, file));
        }
        catch (e) {
            if (e !== interface_1.FileVisitorCancelToken) {
                throw e;
            }
        }
    }
    getSubfilesRecursively() {
        function _recurse(entry) {
            return entry.subdirs.reduce((files, subdir) => [...files, ..._recurse(entry.dir(subdir))], entry.subfiles.map((subfile) => entry.file(subfile)));
        }
        return _recurse(this);
    }
}
exports.HostDirEntry = HostDirEntry;
class HostTree {
    constructor(_backend = new core_1.virtualFs.Empty()) {
        this._backend = _backend;
        this._id = --_uniqueId;
        this._ancestry = new Set();
        this._dirCache = new Map();
        this._record = new core_1.virtualFs.CordHost(new core_1.virtualFs.SafeReadonlyHost(_backend));
        this._recordSync = new core_1.virtualFs.SyncDelegateHost(this._record);
    }
    [interface_1.TreeSymbol]() {
        return this;
    }
    static isHostTree(tree) {
        if (tree instanceof HostTree) {
            return true;
        }
        if (typeof tree === 'object' && typeof tree._ancestry === 'object') {
            return true;
        }
        return false;
    }
    _normalizePath(path) {
        return (0, core_1.normalize)('/' + path);
    }
    _willCreate(path) {
        return this._record.willCreate(path);
    }
    _willOverwrite(path) {
        return this._record.willOverwrite(path);
    }
    _willDelete(path) {
        return this._record.willDelete(path);
    }
    _willRename(path) {
        return this._record.willRename(path);
    }
    branch() {
        const branchedTree = new HostTree(this._backend);
        branchedTree._record = this._record.clone();
        branchedTree._recordSync = new core_1.virtualFs.SyncDelegateHost(branchedTree._record);
        branchedTree._ancestry = new Set(this._ancestry).add(this._id);
        return branchedTree;
    }
    isAncestorOf(tree) {
        if (tree instanceof HostTree) {
            return tree._ancestry.has(this._id);
        }
        if (tree instanceof delegate_1.DelegateTree) {
            return this.isAncestorOf(tree._other);
        }
        if (tree instanceof scoped_1.ScopedTree) {
            return this.isAncestorOf(tree._base);
        }
        return false;
    }
    merge(other, strategy = interface_1.MergeStrategy.Default) {
        if (other === this) {
            // Merging with yourself? Tsk tsk. Nothing to do at least.
            return;
        }
        if (this.isAncestorOf(other)) {
            // Workaround for merging a branch back into one of its ancestors
            // More complete branch point tracking is required to avoid
            strategy |= interface_1.MergeStrategy.Overwrite;
        }
        const creationConflictAllowed = (strategy & interface_1.MergeStrategy.AllowCreationConflict) == interface_1.MergeStrategy.AllowCreationConflict;
        const overwriteConflictAllowed = (strategy & interface_1.MergeStrategy.AllowOverwriteConflict) == interface_1.MergeStrategy.AllowOverwriteConflict;
        const deleteConflictAllowed = (strategy & interface_1.MergeStrategy.AllowDeleteConflict) == interface_1.MergeStrategy.AllowDeleteConflict;
        other.actions.forEach((action) => {
            switch (action.kind) {
                case 'c': {
                    const { path, content } = action;
                    if (this._willCreate(path) || this._willOverwrite(path) || this.exists(path)) {
                        const existingContent = this.read(path);
                        if (existingContent && content.equals(existingContent)) {
                            // Identical outcome; no action required
                            return;
                        }
                        if (!creationConflictAllowed) {
                            throw new exception_1.MergeConflictException(path);
                        }
                        this._record.overwrite(path, content).subscribe();
                    }
                    else {
                        this._record.create(path, content).subscribe();
                    }
                    return;
                }
                case 'o': {
                    const { path, content } = action;
                    if (this._willDelete(path) && !overwriteConflictAllowed) {
                        throw new exception_1.MergeConflictException(path);
                    }
                    // Ignore if content is the same (considered the same change).
                    if (this._willOverwrite(path)) {
                        const existingContent = this.read(path);
                        if (existingContent && content.equals(existingContent)) {
                            // Identical outcome; no action required
                            return;
                        }
                        if (!overwriteConflictAllowed) {
                            throw new exception_1.MergeConflictException(path);
                        }
                    }
                    // We use write here as merge validation has already been done, and we want to let
                    // the CordHost do its job.
                    this._record.write(path, content).subscribe();
                    return;
                }
                case 'r': {
                    const { path, to } = action;
                    if (this._willDelete(path)) {
                        throw new exception_1.MergeConflictException(path);
                    }
                    if (this._willRename(path)) {
                        if (this._record.willRenameTo(path, to)) {
                            // Identical outcome; no action required
                            return;
                        }
                        // No override possible for renaming.
                        throw new exception_1.MergeConflictException(path);
                    }
                    this.rename(path, to);
                    return;
                }
                case 'd': {
                    const { path } = action;
                    if (this._willDelete(path)) {
                        // TODO: This should technically check the content (e.g., hash on delete)
                        // Identical outcome; no action required
                        return;
                    }
                    if (!this.exists(path) && !deleteConflictAllowed) {
                        throw new exception_1.MergeConflictException(path);
                    }
                    this._recordSync.delete(path);
                    return;
                }
            }
        });
    }
    get root() {
        return this.getDir('/');
    }
    // Readonly.
    read(path) {
        const entry = this.get(path);
        return entry ? entry.content : null;
    }
    readText(path) {
        const data = this.read(path);
        if (data === null) {
            throw new exception_1.FileDoesNotExistException(path);
        }
        const decoder = new util_1.TextDecoder('utf-8', { fatal: true });
        try {
            // With the `fatal` option enabled, invalid data will throw a TypeError
            return decoder.decode(data);
        }
        catch (e) {
            if (e instanceof TypeError) {
                throw new Error(`Failed to decode "${path}" as UTF-8 text.`);
            }
            throw e;
        }
    }
    readJson(path) {
        const content = this.readText(path);
        const errors = [];
        const result = (0, jsonc_parser_1.parse)(content, errors, { allowTrailingComma: true });
        // If there is a parse error throw with the error information
        if (errors[0]) {
            const { error, offset } = errors[0];
            throw new Error(`Failed to parse "${path}" as JSON. ${(0, jsonc_parser_1.printParseErrorCode)(error)} at offset: ${offset}.`);
        }
        return result;
    }
    exists(path) {
        return this._recordSync.isFile(this._normalizePath(path));
    }
    get(path) {
        const p = this._normalizePath(path);
        if (this._recordSync.isDirectory(p)) {
            throw new core_1.PathIsDirectoryException(p);
        }
        if (!this._recordSync.exists(p)) {
            return null;
        }
        return new entry_1.LazyFileEntry(p, () => Buffer.from(this._recordSync.read(p)));
    }
    getDir(path) {
        const p = this._normalizePath(path);
        if (this._recordSync.isFile(p)) {
            throw new core_1.PathIsFileException(p);
        }
        let maybeCache = this._dirCache.get(p);
        if (!maybeCache) {
            let parent = (0, core_1.dirname)(p);
            if (p === parent) {
                parent = null;
            }
            maybeCache = new HostDirEntry(parent && this.getDir(parent), p, this._recordSync, this);
            this._dirCache.set(p, maybeCache);
        }
        return maybeCache;
    }
    visit(visitor) {
        this.root.visit((path, entry) => {
            visitor(path, entry);
        });
    }
    // Change content of host files.
    overwrite(path, content) {
        const p = this._normalizePath(path);
        if (!this._recordSync.exists(p)) {
            throw new exception_1.FileDoesNotExistException(p);
        }
        const c = typeof content == 'string' ? Buffer.from(content) : content;
        this._record.overwrite(p, c).subscribe();
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
                if (!newContent.equals(entry.content)) {
                    this.overwrite(path, newContent);
                }
            }
        }
        else {
            throw new exception_1.InvalidUpdateRecordException();
        }
    }
    // Structural methods.
    create(path, content) {
        const p = this._normalizePath(path);
        if (this._recordSync.exists(p)) {
            throw new exception_1.FileAlreadyExistException(p);
        }
        const c = typeof content == 'string' ? Buffer.from(content) : content;
        this._record.create(p, c).subscribe();
    }
    delete(path) {
        this._recordSync.delete(this._normalizePath(path));
    }
    rename(from, to) {
        this._recordSync.rename(this._normalizePath(from), this._normalizePath(to));
    }
    apply(action, strategy) {
        throw new exception_1.SchematicsException('Apply not implemented on host trees.');
    }
    *generateActions() {
        for (const record of this._record.records()) {
            switch (record.kind) {
                case 'create':
                    yield {
                        id: this._id,
                        parent: 0,
                        kind: 'c',
                        path: record.path,
                        content: Buffer.from(record.content),
                    };
                    break;
                case 'overwrite':
                    yield {
                        id: this._id,
                        parent: 0,
                        kind: 'o',
                        path: record.path,
                        content: Buffer.from(record.content),
                    };
                    break;
                case 'rename':
                    yield {
                        id: this._id,
                        parent: 0,
                        kind: 'r',
                        path: record.from,
                        to: record.to,
                    };
                    break;
                case 'delete':
                    yield {
                        id: this._id,
                        parent: 0,
                        kind: 'd',
                        path: record.path,
                    };
                    break;
            }
        }
    }
    get actions() {
        // Create a list of all records until we hit our original backend. This is to support branches
        // that diverge from each others.
        return Array.from(this.generateActions());
    }
}
exports.HostTree = HostTree;
class HostCreateTree extends HostTree {
    constructor(host) {
        super();
        const tempHost = new HostTree(host);
        tempHost.visit((path) => {
            const content = tempHost.read(path);
            if (content) {
                this.create(path, content);
            }
        });
    }
}
exports.HostCreateTree = HostCreateTree;
class FilterHostTree extends HostTree {
    constructor(tree, filter = () => true) {
        const newBackend = new core_1.virtualFs.SimpleMemoryHost();
        // cast to allow access
        const originalBackend = tree._backend;
        const recurse = (base) => {
            return originalBackend.list(base).pipe((0, operators_1.mergeMap)((x) => x), (0, operators_1.map)((path) => (0, core_1.join)(base, path)), (0, operators_1.concatMap)((path) => {
                let isDirectory = false;
                originalBackend.isDirectory(path).subscribe((val) => (isDirectory = val));
                if (isDirectory) {
                    return recurse(path);
                }
                let isFile = false;
                originalBackend.isFile(path).subscribe((val) => (isFile = val));
                if (!isFile || !filter(path)) {
                    return rxjs_1.EMPTY;
                }
                let content = null;
                originalBackend.read(path).subscribe((val) => (content = val));
                if (!content) {
                    return rxjs_1.EMPTY;
                }
                return newBackend.write(path, content);
            }));
        };
        recurse((0, core_1.normalize)('/')).subscribe();
        super(newBackend);
        for (const action of tree.actions) {
            if (!filter(action.path)) {
                continue;
            }
            switch (action.kind) {
                case 'c':
                    this.create(action.path, action.content);
                    break;
                case 'd':
                    this.delete(action.path);
                    break;
                case 'o':
                    this.overwrite(action.path, action.content);
                    break;
                case 'r':
                    this.rename(action.path, action.to);
                    break;
            }
        }
    }
}
exports.FilterHostTree = FilterHostTree;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdC10cmVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvdHJlZS9ob3N0LXRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0NBVThCO0FBQzlCLCtDQUFvRjtBQUNwRiwrQkFBeUM7QUFDekMsOENBQTBEO0FBQzFELCtCQUFtQztBQUNuQyxzREFPZ0M7QUFRaEMseUNBQTBDO0FBQzFDLG1DQUF3QztBQUN4QywyQ0FVcUI7QUFDckIseUNBQWdEO0FBQ2hELHFDQUFzQztBQUV0QyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFFbEIsTUFBYSxZQUFZO0lBQ3ZCLFlBQ1csTUFBdUIsRUFDdkIsSUFBVSxFQUNULEtBQWlDLEVBQ2pDLEtBQVc7UUFIWixXQUFNLEdBQU4sTUFBTSxDQUFpQjtRQUN2QixTQUFJLEdBQUosSUFBSSxDQUFNO1FBQ1QsVUFBSyxHQUFMLEtBQUssQ0FBNEI7UUFDakMsVUFBSyxHQUFMLEtBQUssQ0FBTTtJQUNwQixDQUFDO0lBRUosSUFBSSxPQUFPO1FBQ1QsT0FBTyxJQUFJLENBQUMsS0FBSzthQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQ2YsTUFBTSxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFBLFdBQUksRUFBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3RSxDQUFDO0lBQ0QsSUFBSSxRQUFRO1FBQ1YsT0FBTyxJQUFJLENBQUMsS0FBSzthQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQ2YsTUFBTSxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FB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QUc7b0JBQ04sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDNUMsTUFBTTtnQkFDUixLQUFLLEdBQUc7b0JBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDcEMsTUFBTTthQUNUO1NBQ0Y7SUFDSCxDQUFDO0NBQ0Y7QUEzREQsd0NBMkRDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEpzb25WYWx1ZSxcbiAgUGF0aCxcbiAgUGF0aEZyYWdtZW50LFxuICBQYXRoSXNEaXJlY3RvcnlFeGNlcHRpb24sXG4gIFBhdGhJc0ZpbGVFeGNlcHRpb24sXG4gIGRpcm5hbWUsXG4gIGpvaW4sXG4gIG5vcm1hbGl6ZSxcbiAgdmlydHVhbEZzLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBQYXJzZUVycm9yLCBwYXJzZSBhcyBqc29uY1BhcnNlLCBwcmludFBhcnNlRXJyb3JDb2RlIH0gZnJvbSAnanNvbmMtcGFyc2VyJztcbmltcG9ydCB7IEVNUFRZLCBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjb25jYXRNYXAsIG1hcCwgbWVyZ2VNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBUZXh0RGVjb2RlciB9IGZyb20gJ3V0aWwnO1xuaW1wb3J0IHtcbiAgQ29udGVudEhhc011dGF0ZWRFeGNlcHRpb24sXG4gIEZpbGVBbHJlYWR5RXhpc3RFeGNlcHRpb24sXG4gIEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24sXG4gIEludmFsaWRVcGRhdGVSZWNvcmRFeGNlcHRpb24sXG4gIE1lcmdlQ29uZmxpY3RFeGNlcHRpb24sXG4gIFNjaGVtYXRpY3NFeGNlcHRpb24sXG59IGZyb20gJy4uL2V4Y2VwdGlvbi9leGNlcHRpb24nO1xuaW1wb3J0IHtcbiAgQWN0aW9uLFxuICBDcmVhdGVGaWxlQWN0aW9uLFxuICBEZWxldGVGaWxlQWN0aW9uLFxuICBPdmVyd3JpdGVGaWxlQWN0aW9uLFxuICBSZW5hbWVGaWxlQWN0aW9uLFxufSBmcm9tICcuL2FjdGlvbic7XG5pbXBvcnQgeyBEZWxlZ2F0ZVRyZWUgfSBmcm9tICcuL2RlbGVnYXRlJztcbmltcG9ydCB7IExhenlGaWxlRW50cnkgfSBmcm9tICcuL2VudHJ5JztcbmltcG9ydCB7XG4gIERpckVudHJ5LFxuICBGaWxlRW50cnksXG4gIEZpbGVQcmVkaWNhdGUsXG4gIEZpbGVWaXNpdG9yLFxuICBGaWxlVmlzaXRvckNhbmNlbFRva2VuLFxuICBNZXJnZVN0cmF0ZWd5LFxuICBUcmVlLFxuICBUcmVlU3ltYm9sLFxuICBVcGRhdGVSZWNvcmRlcixcbn0gZnJvbSAnLi9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgVXBkYXRlUmVjb3JkZXJCYXNlIH0gZnJvbSAnLi9yZWNvcmRlcic7XG5pbXBvcnQgeyBTY29wZWRUcmVlIH0gZnJvbSAnLi9zY29wZWQnO1xuXG5sZXQgX3VuaXF1ZUlkID0gMDtcblxuZXhwb3J0IGNsYXNzIEhvc3REaXJFbnRyeSBpbXBsZW1lbnRzIERpckVudHJ5IHtcbiAgY29uc3RydWN0b3IoXG4gICAgcmVhZG9ubHkgcGFyZW50OiBEaXJFbnRyeSB8IG51bGwsXG4gICAgcmVhZG9ubHkgcGF0aDogUGF0aCxcbiAgICBwcm90ZWN0ZWQgX2hvc3Q6IHZpcnR1YWxGcy5TeW5jRGVsZWdhdGVIb3N0LFxuICAgIHByb3RlY3RlZCBfdHJlZTogVHJlZSxcbiAgKSB7fVxuXG4gIGdldCBzdWJkaXJzKCk6IFBhdGhGcmFnbWVudFtdIHtcbiAgICByZXR1cm4gdGhpcy5faG9zdFxuICAgICAgLmxpc3QodGhpcy5wYXRoKVxuICAgICAgLmZpbHRlcigoZnJhZ21lbnQpID0+IHRoaXMuX2hvc3QuaXNEaXJlY3Rvcnkoam9pbih0aGlzLnBhdGgsIGZyYWdtZW50KSkpO1xuICB9XG4gIGdldCBzdWJmaWxlcygpOiBQYXRoRnJhZ21lbnRbXSB7XG4gICAgcmV0dXJuIHRoaXMuX2hvc3RcbiAgICAgIC5saXN0KHRoaXMucGF0aClcbiAgICAgIC5maWx0ZXIoKGZyYWdtZW50KSA9PiB0aGlzLl9ob3N0LmlzRmlsZShqb2luKHRoaXMucGF0aCwgZnJhZ21lbnQpKSk7XG4gIH1cblxuICBkaXIobmFtZTogUGF0aEZyYWdtZW50KTogRGlyRW50cnkge1xuICAgIHJldHVybiB0aGlzLl90cmVlLmdldERpcihqb2luKHRoaXMucGF0aCwgbmFtZSkpO1xuICB9XG4gIGZpbGUobmFtZTogUGF0aEZyYWdtZW50KTogRmlsZUVudHJ5IHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX3RyZWUuZ2V0KGpvaW4odGhpcy5wYXRoLCBuYW1lKSk7XG4gIH1cblxuICB2aXNpdCh2aXNpdG9yOiBGaWxlVmlzaXRvcik6IHZvaWQge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmdldFN1YmZpbGVzUmVjdXJzaXZlbHkoKS5mb3JFYWNoKChmaWxlKSA9PiB2aXNpdG9yKGZpbGUucGF0aCwgZmlsZSkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlICE9PSBGaWxlVmlzaXRvckNhbmNlbFRva2VuKSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRTdWJmaWxlc1JlY3Vyc2l2ZWx5KCkge1xuICAgIGZ1bmN0aW9uIF9yZWN1cnNlKGVudHJ5OiBEaXJFbnRyeSk6IEZpbGVFbnRyeVtdIHtcbiAgICAgIHJldHVybiBlbnRyeS5zdWJkaXJzLnJlZHVjZShcbiAgICAgICAgKGZpbGVzLCBzdWJkaXIpID0+IFsuLi5maWxlcywgLi4uX3JlY3Vyc2UoZW50cnkuZGlyKHN1YmRpcikpXSxcbiAgICAgICAgZW50cnkuc3ViZmlsZXMubWFwKChzdWJmaWxlKSA9PiBlbnRyeS5maWxlKHN1YmZpbGUpIGFzIEZpbGVFbnRyeSksXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBfcmVjdXJzZSh0aGlzKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSG9zdFRyZWUgaW1wbGVtZW50cyBUcmVlIHtcbiAgcHJpdmF0ZSByZWFkb25seSBfaWQgPSAtLV91bmlxdWVJZDtcbiAgcHJpdmF0ZSBfcmVjb3JkOiB2aXJ0dWFsRnMuQ29yZEhvc3Q7XG4gIHByaXZhdGUgX3JlY29yZFN5bmM6IHZpcnR1YWxGcy5TeW5jRGVsZWdhdGVIb3N0O1xuICBwcml2YXRlIF9hbmNlc3RyeSA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuXG4gIHByaXZhdGUgX2RpckNhY2hlID0gbmV3IE1hcDxQYXRoLCBIb3N0RGlyRW50cnk+KCk7XG5cbiAgW1RyZWVTeW1ib2xdKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc3RhdGljIGlzSG9zdFRyZWUodHJlZTogVHJlZSk6IHRyZWUgaXMgSG9zdFRyZWUge1xuICAgIGlmICh0cmVlIGluc3RhbmNlb2YgSG9zdFRyZWUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdHJlZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mICh0cmVlIGFzIEhvc3RUcmVlKS5fYW5jZXN0cnkgPT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgX2JhY2tlbmQ6IHZpcnR1YWxGcy5SZWFkb25seUhvc3Q8e30+ID0gbmV3IHZpcnR1YWxGcy5FbXB0eSgpKSB7XG4gICAgdGhpcy5fcmVjb3JkID0gbmV3IHZpcnR1YWxGcy5Db3JkSG9zdChuZXcgdmlydHVhbEZzLlNhZmVSZWFkb25seUhvc3QoX2JhY2tlbmQpKTtcbiAgICB0aGlzLl9yZWNvcmRTeW5jID0gbmV3IHZpcnR1YWxGcy5TeW5jRGVsZWdhdGVIb3N0KHRoaXMuX3JlY29yZCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX25vcm1hbGl6ZVBhdGgocGF0aDogc3RyaW5nKTogUGF0aCB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZSgnLycgKyBwYXRoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfd2lsbENyZWF0ZShwYXRoOiBQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlY29yZC53aWxsQ3JlYXRlKHBhdGgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF93aWxsT3ZlcndyaXRlKHBhdGg6IFBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVjb3JkLndpbGxPdmVyd3JpdGUocGF0aCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3dpbGxEZWxldGUocGF0aDogUGF0aCkge1xuICAgIHJldHVybiB0aGlzLl9yZWNvcmQud2lsbERlbGV0ZShwYXRoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfd2lsbFJlbmFtZShwYXRoOiBQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlY29yZC53aWxsUmVuYW1lKHBhdGgpO1xuICB9XG5cbiAgYnJhbmNoKCk6IFRyZWUge1xuICAgIGNvbnN0IGJyYW5jaGVkVHJlZSA9IG5ldyBIb3N0VHJlZSh0aGlzLl9iYWNrZW5kKTtcbiAgICBicmFuY2hlZFRyZWUuX3JlY29yZCA9IHRoaXMuX3JlY29yZC5jbG9uZSgpO1xuICAgIGJyYW5jaGVkVHJlZS5fcmVjb3JkU3luYyA9IG5ldyB2aXJ0dWFsRnMuU3luY0RlbGVnYXRlSG9zdChicmFuY2hlZFRyZWUuX3JlY29yZCk7XG4gICAgYnJhbmNoZWRUcmVlLl9hbmNlc3RyeSA9IG5ldyBTZXQodGhpcy5fYW5jZXN0cnkpLmFkZCh0aGlzLl9pZCk7XG5cbiAgICByZXR1cm4gYnJhbmNoZWRUcmVlO1xuICB9XG5cbiAgcHJpdmF0ZSBpc0FuY2VzdG9yT2YodHJlZTogVHJlZSk6IGJvb2xlYW4ge1xuICAgIGlmICh0cmVlIGluc3RhbmNlb2YgSG9zdFRyZWUpIHtcbiAgICAgIHJldHVybiB0cmVlLl9hbmNlc3RyeS5oYXModGhpcy5faWQpO1xuICAgIH1cbiAgICBpZiAodHJlZSBpbnN0YW5jZW9mIERlbGVnYXRlVHJlZSkge1xuICAgICAgcmV0dXJuIHRoaXMuaXNBbmNlc3Rvck9mKCh0cmVlIGFzIHVua25vd24gYXMgeyBfb3RoZXI6IFRyZWUgfSkuX290aGVyKTtcbiAgICB9XG4gICAgaWYgKHRyZWUgaW5zdGFuY2VvZiBTY29wZWRUcmVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5pc0FuY2VzdG9yT2YoKHRyZWUgYXMgdW5rbm93biBhcyB7IF9iYXNlOiBUcmVlIH0pLl9iYXNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBtZXJnZShvdGhlcjogVHJlZSwgc3RyYXRlZ3k6IE1lcmdlU3RyYXRlZ3kgPSBNZXJnZVN0cmF0ZWd5LkRlZmF1bHQpOiB2b2lkIHtcbiAgICBpZiAob3RoZXIgPT09IHRoaXMpIHtcbiAgICAgIC8vIE1lcmdpbmcgd2l0aCB5b3Vyc2VsZj8gVHNrIHRzay4gTm90aGluZyB0byBkbyBhdCBsZWFzdC5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0FuY2VzdG9yT2Yob3RoZXIpKSB7XG4gICAgICAvLyBXb3JrYXJvdW5kIGZvciBtZXJnaW5nIGEgYnJhbmNoIGJhY2sgaW50byBvbmUgb2YgaXRzIGFuY2VzdG9yc1xuICAgICAgLy8gTW9yZSBjb21wbGV0ZSBicmFuY2ggcG9pbnQgdHJhY2tpbmcgaXMgcmVxdWlyZWQgdG8gYXZvaWRcbiAgICAgIHN0cmF0ZWd5IHw9IE1lcmdlU3RyYXRlZ3kuT3ZlcndyaXRlO1xuICAgIH1cblxuICAgIGNvbnN0IGNyZWF0aW9uQ29uZmxpY3RBbGxvd2VkID1cbiAgICAgIChzdHJhdGVneSAmIE1lcmdlU3RyYXRlZ3kuQWxsb3dDcmVhdGlvbkNvbmZsaWN0KSA9PSBNZXJnZVN0cmF0ZWd5LkFsbG93Q3JlYXRpb25Db25mbGljdDtcbiAgICBjb25zdCBvdmVyd3JpdGVDb25mbGljdEFsbG93ZWQgPVxuICAgICAgKHN0cmF0ZWd5ICYgTWVyZ2VTdHJhdGVneS5BbGxvd092ZXJ3cml0ZUNvbmZsaWN0KSA9PSBNZXJnZVN0cmF0ZWd5LkFsbG93T3ZlcndyaXRlQ29uZmxpY3Q7XG4gICAgY29uc3QgZGVsZXRlQ29uZmxpY3RBbGxvd2VkID1cbiAgICAgIChzdHJhdGVneSAmIE1lcmdlU3RyYXRlZ3kuQWxsb3dEZWxldGVDb25mbGljdCkgPT0gTWVyZ2VTdHJhdGVneS5BbGxvd0RlbGV0ZUNvbmZsaWN0O1xuXG4gICAgb3RoZXIuYWN0aW9ucy5mb3JFYWNoKChhY3Rpb24pID0+IHtcbiAgICAgIHN3aXRjaCAoYWN0aW9uLmtpbmQpIHtcbiAgICAgICAgY2FzZSAnYyc6IHtcbiAgICAgICAgICBjb25zdCB7IHBhdGgsIGNvbnRlbnQgfSA9IGFjdGlvbjtcblxuICAgICAgICAgIGlmICh0aGlzLl93aWxsQ3JlYXRlKHBhdGgpIHx8IHRoaXMuX3dpbGxPdmVyd3JpdGUocGF0aCkgfHwgdGhpcy5leGlzdHMocGF0aCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nQ29udGVudCA9IHRoaXMucmVhZChwYXRoKTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ0NvbnRlbnQgJiYgY29udGVudC5lcXVhbHMoZXhpc3RpbmdDb250ZW50KSkge1xuICAgICAgICAgICAgICAvLyBJZGVudGljYWwgb3V0Y29tZTsgbm8gYWN0aW9uIHJlcXVpcmVkXG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFjcmVhdGlvbkNvbmZsaWN0QWxsb3dlZCkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgTWVyZ2VDb25mbGljdEV4Y2VwdGlvbihwYXRoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fcmVjb3JkLm92ZXJ3cml0ZShwYXRoLCBjb250ZW50IGFzIHt9IGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKS5zdWJzY3JpYmUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVjb3JkLmNyZWF0ZShwYXRoLCBjb250ZW50IGFzIHt9IGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKS5zdWJzY3JpYmUoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjYXNlICdvJzoge1xuICAgICAgICAgIGNvbnN0IHsgcGF0aCwgY29udGVudCB9ID0gYWN0aW9uO1xuICAgICAgICAgIGlmICh0aGlzLl93aWxsRGVsZXRlKHBhdGgpICYmICFvdmVyd3JpdGVDb25mbGljdEFsbG93ZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uKHBhdGgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIElnbm9yZSBpZiBjb250ZW50IGlzIHRoZSBzYW1lIChjb25zaWRlcmVkIHRoZSBzYW1lIGNoYW5nZSkuXG4gICAgICAgICAgaWYgKHRoaXMuX3dpbGxPdmVyd3JpdGUocGF0aCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nQ29udGVudCA9IHRoaXMucmVhZChwYXRoKTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ0NvbnRlbnQgJiYgY29udGVudC5lcXVhbHMoZXhpc3RpbmdDb250ZW50KSkge1xuICAgICAgICAgICAgICAvLyBJZGVudGljYWwgb3V0Y29tZTsgbm8gYWN0aW9uIHJlcXVpcmVkXG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFvdmVyd3JpdGVDb25mbGljdEFsbG93ZWQpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IE1lcmdlQ29uZmxpY3RFeGNlcHRpb24ocGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFdlIHVzZSB3cml0ZSBoZXJlIGFzIG1lcmdlIHZhbGlkYXRpb24gaGFzIGFscmVhZHkgYmVlbiBkb25lLCBhbmQgd2Ugd2FudCB0byBsZXRcbiAgICAgICAgICAvLyB0aGUgQ29yZEhvc3QgZG8gaXRzIGpvYi5cbiAgICAgICAgICB0aGlzLl9yZWNvcmQud3JpdGUocGF0aCwgY29udGVudCBhcyB7fSBhcyB2aXJ0dWFsRnMuRmlsZUJ1ZmZlcikuc3Vic2NyaWJlKCk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjYXNlICdyJzoge1xuICAgICAgICAgIGNvbnN0IHsgcGF0aCwgdG8gfSA9IGFjdGlvbjtcbiAgICAgICAgICBpZiAodGhpcy5fd2lsbERlbGV0ZShwYXRoKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1lcmdlQ29uZmxpY3RFeGNlcHRpb24ocGF0aCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMuX3dpbGxSZW5hbWUocGF0aCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9yZWNvcmQud2lsbFJlbmFtZVRvKHBhdGgsIHRvKSkge1xuICAgICAgICAgICAgICAvLyBJZGVudGljYWwgb3V0Y29tZTsgbm8gYWN0aW9uIHJlcXVpcmVkXG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTm8gb3ZlcnJpZGUgcG9zc2libGUgZm9yIHJlbmFtaW5nLlxuICAgICAgICAgICAgdGhyb3cgbmV3IE1lcmdlQ29uZmxpY3RFeGNlcHRpb24ocGF0aCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVuYW1lKHBhdGgsIHRvKTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhc2UgJ2QnOiB7XG4gICAgICAgICAgY29uc3QgeyBwYXRoIH0gPSBhY3Rpb247XG4gICAgICAgICAgaWYgKHRoaXMuX3dpbGxEZWxldGUocGF0aCkpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFRoaXMgc2hvdWxkIHRlY2huaWNhbGx5IGNoZWNrIHRoZSBjb250ZW50IChlLmcuLCBoYXNoIG9uIGRlbGV0ZSlcbiAgICAgICAgICAgIC8vIElkZW50aWNhbCBvdXRjb21lOyBubyBhY3Rpb24gcmVxdWlyZWRcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIXRoaXMuZXhpc3RzKHBhdGgpICYmICFkZWxldGVDb25mbGljdEFsbG93ZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uKHBhdGgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuX3JlY29yZFN5bmMuZGVsZXRlKHBhdGgpO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBnZXQgcm9vdCgpOiBEaXJFbnRyeSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RGlyKCcvJyk7XG4gIH1cblxuICAvLyBSZWFkb25seS5cbiAgcmVhZChwYXRoOiBzdHJpbmcpOiBCdWZmZXIgfCBudWxsIHtcbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZ2V0KHBhdGgpO1xuXG4gICAgcmV0dXJuIGVudHJ5ID8gZW50cnkuY29udGVudCA6IG51bGw7XG4gIH1cblxuICByZWFkVGV4dChwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRhdGEgPSB0aGlzLnJlYWQocGF0aCk7XG4gICAgaWYgKGRhdGEgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKHBhdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoJ3V0Zi04JywgeyBmYXRhbDogdHJ1ZSB9KTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBXaXRoIHRoZSBgZmF0YWxgIG9wdGlvbiBlbmFibGVkLCBpbnZhbGlkIGRhdGEgd2lsbCB0aHJvdyBhIFR5cGVFcnJvclxuICAgICAgcmV0dXJuIGRlY29kZXIuZGVjb2RlKGRhdGEpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgVHlwZUVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGRlY29kZSBcIiR7cGF0aH1cIiBhcyBVVEYtOCB0ZXh0LmApO1xuICAgICAgfVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cblxuICByZWFkSnNvbihwYXRoOiBzdHJpbmcpOiBKc29uVmFsdWUge1xuICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLnJlYWRUZXh0KHBhdGgpO1xuICAgIGNvbnN0IGVycm9yczogUGFyc2VFcnJvcltdID0gW107XG4gICAgY29uc3QgcmVzdWx0ID0ganNvbmNQYXJzZShjb250ZW50LCBlcnJvcnMsIHsgYWxsb3dUcmFpbGluZ0NvbW1hOiB0cnVlIH0pO1xuXG4gICAgLy8gSWYgdGhlcmUgaXMgYSBwYXJzZSBlcnJvciB0aHJvdyB3aXRoIHRoZSBlcnJvciBpbmZvcm1hdGlvblxuICAgIGlmIChlcnJvcnNbMF0pIHtcbiAgICAgIGNvbnN0IHsgZXJyb3IsIG9mZnNldCB9ID0gZXJyb3JzWzBdO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRmFpbGVkIHRvIHBhcnNlIFwiJHtwYXRofVwiIGFzIEpTT04uICR7cHJpbnRQYXJzZUVycm9yQ29kZShlcnJvcil9IGF0IG9mZnNldDogJHtvZmZzZXR9LmAsXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBleGlzdHMocGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3JlY29yZFN5bmMuaXNGaWxlKHRoaXMuX25vcm1hbGl6ZVBhdGgocGF0aCkpO1xuICB9XG5cbiAgZ2V0KHBhdGg6IHN0cmluZyk6IEZpbGVFbnRyeSB8IG51bGwge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpO1xuICAgIGlmICh0aGlzLl9yZWNvcmRTeW5jLmlzRGlyZWN0b3J5KHApKSB7XG4gICAgICB0aHJvdyBuZXcgUGF0aElzRGlyZWN0b3J5RXhjZXB0aW9uKHApO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX3JlY29yZFN5bmMuZXhpc3RzKHApKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IExhenlGaWxlRW50cnkocCwgKCkgPT4gQnVmZmVyLmZyb20odGhpcy5fcmVjb3JkU3luYy5yZWFkKHApKSk7XG4gIH1cblxuICBnZXREaXIocGF0aDogc3RyaW5nKTogRGlyRW50cnkge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpO1xuICAgIGlmICh0aGlzLl9yZWNvcmRTeW5jLmlzRmlsZShwKSkge1xuICAgICAgdGhyb3cgbmV3IFBhdGhJc0ZpbGVFeGNlcHRpb24ocCk7XG4gICAgfVxuXG4gICAgbGV0IG1heWJlQ2FjaGUgPSB0aGlzLl9kaXJDYWNoZS5nZXQocCk7XG4gICAgaWYgKCFtYXliZUNhY2hlKSB7XG4gICAgICBsZXQgcGFyZW50OiBQYXRoIHwgbnVsbCA9IGRpcm5hbWUocCk7XG4gICAgICBpZiAocCA9PT0gcGFyZW50KSB7XG4gICAgICAgIHBhcmVudCA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIG1heWJlQ2FjaGUgPSBuZXcgSG9zdERpckVudHJ5KHBhcmVudCAmJiB0aGlzLmdldERpcihwYXJlbnQpLCBwLCB0aGlzLl9yZWNvcmRTeW5jLCB0aGlzKTtcbiAgICAgIHRoaXMuX2RpckNhY2hlLnNldChwLCBtYXliZUNhY2hlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWF5YmVDYWNoZTtcbiAgfVxuICB2aXNpdCh2aXNpdG9yOiBGaWxlVmlzaXRvcik6IHZvaWQge1xuICAgIHRoaXMucm9vdC52aXNpdCgocGF0aCwgZW50cnkpID0+IHtcbiAgICAgIHZpc2l0b3IocGF0aCwgZW50cnkpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gQ2hhbmdlIGNvbnRlbnQgb2YgaG9zdCBmaWxlcy5cbiAgb3ZlcndyaXRlKHBhdGg6IHN0cmluZywgY29udGVudDogQnVmZmVyIHwgc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgcCA9IHRoaXMuX25vcm1hbGl6ZVBhdGgocGF0aCk7XG4gICAgaWYgKCF0aGlzLl9yZWNvcmRTeW5jLmV4aXN0cyhwKSkge1xuICAgICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocCk7XG4gICAgfVxuICAgIGNvbnN0IGMgPSB0eXBlb2YgY29udGVudCA9PSAnc3RyaW5nJyA/IEJ1ZmZlci5mcm9tKGNvbnRlbnQpIDogY29udGVudDtcbiAgICB0aGlzLl9yZWNvcmQub3ZlcndyaXRlKHAsIGMgYXMge30gYXMgdmlydHVhbEZzLkZpbGVCdWZmZXIpLnN1YnNjcmliZSgpO1xuICB9XG4gIGJlZ2luVXBkYXRlKHBhdGg6IHN0cmluZyk6IFVwZGF0ZVJlY29yZGVyIHtcbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZ2V0KHBhdGgpO1xuICAgIGlmICghZW50cnkpIHtcbiAgICAgIHRocm93IG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKHBhdGgpO1xuICAgIH1cblxuICAgIHJldHVybiBVcGRhdGVSZWNvcmRlckJhc2UuY3JlYXRlRnJvbUZpbGVFbnRyeShlbnRyeSk7XG4gIH1cbiAgY29tbWl0VXBkYXRlKHJlY29yZDogVXBkYXRlUmVjb3JkZXIpOiB2b2lkIHtcbiAgICBpZiAocmVjb3JkIGluc3RhbmNlb2YgVXBkYXRlUmVjb3JkZXJCYXNlKSB7XG4gICAgICBjb25zdCBwYXRoID0gcmVjb3JkLnBhdGg7XG4gICAgICBjb25zdCBlbnRyeSA9IHRoaXMuZ2V0KHBhdGgpO1xuICAgICAgaWYgKCFlbnRyeSkge1xuICAgICAgICB0aHJvdyBuZXcgQ29udGVudEhhc011dGF0ZWRFeGNlcHRpb24ocGF0aCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBuZXdDb250ZW50ID0gcmVjb3JkLmFwcGx5KGVudHJ5LmNvbnRlbnQpO1xuICAgICAgICBpZiAoIW5ld0NvbnRlbnQuZXF1YWxzKGVudHJ5LmNvbnRlbnQpKSB7XG4gICAgICAgICAgdGhpcy5vdmVyd3JpdGUocGF0aCwgbmV3Q29udGVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRVcGRhdGVSZWNvcmRFeGNlcHRpb24oKTtcbiAgICB9XG4gIH1cblxuICAvLyBTdHJ1Y3R1cmFsIG1ldGhvZHMuXG4gIGNyZWF0ZShwYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IEJ1ZmZlciB8IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpO1xuICAgIGlmICh0aGlzLl9yZWNvcmRTeW5jLmV4aXN0cyhwKSkge1xuICAgICAgdGhyb3cgbmV3IEZpbGVBbHJlYWR5RXhpc3RFeGNlcHRpb24ocCk7XG4gICAgfVxuICAgIGNvbnN0IGMgPSB0eXBlb2YgY29udGVudCA9PSAnc3RyaW5nJyA/IEJ1ZmZlci5mcm9tKGNvbnRlbnQpIDogY29udGVudDtcbiAgICB0aGlzLl9yZWNvcmQuY3JlYXRlKHAsIGMgYXMge30gYXMgdmlydHVhbEZzLkZpbGVCdWZmZXIpLnN1YnNjcmliZSgpO1xuICB9XG4gIGRlbGV0ZShwYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLl9yZWNvcmRTeW5jLmRlbGV0ZSh0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpKTtcbiAgfVxuICByZW5hbWUoZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5fcmVjb3JkU3luYy5yZW5hbWUodGhpcy5fbm9ybWFsaXplUGF0aChmcm9tKSwgdGhpcy5fbm9ybWFsaXplUGF0aCh0bykpO1xuICB9XG5cbiAgYXBwbHkoYWN0aW9uOiBBY3Rpb24sIHN0cmF0ZWd5PzogTWVyZ2VTdHJhdGVneSk6IHZvaWQge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdBcHBseSBub3QgaW1wbGVtZW50ZWQgb24gaG9zdCB0cmVlcy4nKTtcbiAgfVxuXG4gIHByaXZhdGUgKmdlbmVyYXRlQWN0aW9ucygpOiBJdGVyYWJsZTxBY3Rpb24+IHtcbiAgICBmb3IgKGNvbnN0IHJlY29yZCBvZiB0aGlzLl9yZWNvcmQucmVjb3JkcygpKSB7XG4gICAgICBzd2l0Y2ggKHJlY29yZC5raW5kKSB7XG4gICAgICAgIGNhc2UgJ2NyZWF0ZSc6XG4gICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgaWQ6IHRoaXMuX2lkLFxuICAgICAgICAgICAgcGFyZW50OiAwLFxuICAgICAgICAgICAga2luZDogJ2MnLFxuICAgICAgICAgICAgcGF0aDogcmVjb3JkLnBhdGgsXG4gICAgICAgICAgICBjb250ZW50OiBCdWZmZXIuZnJvbShyZWNvcmQuY29udGVudCksXG4gICAgICAgICAgfSBhcyBDcmVhdGVGaWxlQWN0aW9uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdvdmVyd3JpdGUnOlxuICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgIGlkOiB0aGlzLl9pZCxcbiAgICAgICAgICAgIHBhcmVudDogMCxcbiAgICAgICAgICAgIGtpbmQ6ICdvJyxcbiAgICAgICAgICAgIHBhdGg6IHJlY29yZC5wYXRoLFxuICAgICAgICAgICAgY29udGVudDogQnVmZmVyLmZyb20ocmVjb3JkLmNvbnRlbnQpLFxuICAgICAgICAgIH0gYXMgT3ZlcndyaXRlRmlsZUFjdGlvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmVuYW1lJzpcbiAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICBpZDogdGhpcy5faWQsXG4gICAgICAgICAgICBwYXJlbnQ6IDAsXG4gICAgICAgICAgICBraW5kOiAncicsXG4gICAgICAgICAgICBwYXRoOiByZWNvcmQuZnJvbSxcbiAgICAgICAgICAgIHRvOiByZWNvcmQudG8sXG4gICAgICAgICAgfSBhcyBSZW5hbWVGaWxlQWN0aW9uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdkZWxldGUnOlxuICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgIGlkOiB0aGlzLl9pZCxcbiAgICAgICAgICAgIHBhcmVudDogMCxcbiAgICAgICAgICAgIGtpbmQ6ICdkJyxcbiAgICAgICAgICAgIHBhdGg6IHJlY29yZC5wYXRoLFxuICAgICAgICAgIH0gYXMgRGVsZXRlRmlsZUFjdGlvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXQgYWN0aW9ucygpOiBBY3Rpb25bXSB7XG4gICAgLy8gQ3JlYXRlIGEgbGlzdCBvZiBhbGwgcmVjb3JkcyB1bnRpbCB3ZSBoaXQgb3VyIG9yaWdpbmFsIGJhY2tlbmQuIFRoaXMgaXMgdG8gc3VwcG9ydCBicmFuY2hlc1xuICAgIC8vIHRoYXQgZGl2ZXJnZSBmcm9tIGVhY2ggb3RoZXJzLlxuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuZ2VuZXJhdGVBY3Rpb25zKCkpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBIb3N0Q3JlYXRlVHJlZSBleHRlbmRzIEhvc3RUcmVlIHtcbiAgY29uc3RydWN0b3IoaG9zdDogdmlydHVhbEZzLlJlYWRvbmx5SG9zdCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICBjb25zdCB0ZW1wSG9zdCA9IG5ldyBIb3N0VHJlZShob3N0KTtcbiAgICB0ZW1wSG9zdC52aXNpdCgocGF0aCkgPT4ge1xuICAgICAgY29uc3QgY29udGVudCA9IHRlbXBIb3N0LnJlYWQocGF0aCk7XG4gICAgICBpZiAoY29udGVudCkge1xuICAgICAgICB0aGlzLmNyZWF0ZShwYXRoLCBjb250ZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRmlsdGVySG9zdFRyZWUgZXh0ZW5kcyBIb3N0VHJlZSB7XG4gIGNvbnN0cnVjdG9yKHRyZWU6IEhvc3RUcmVlLCBmaWx0ZXI6IEZpbGVQcmVkaWNhdGU8Ym9vbGVhbj4gPSAoKSA9PiB0cnVlKSB7XG4gICAgY29uc3QgbmV3QmFja2VuZCA9IG5ldyB2aXJ0dWFsRnMuU2ltcGxlTWVtb3J5SG9zdCgpO1xuICAgIC8vIGNhc3QgdG8gYWxsb3cgYWNjZXNzXG4gICAgY29uc3Qgb3JpZ2luYWxCYWNrZW5kID0gKHRyZWUgYXMgRmlsdGVySG9zdFRyZWUpLl9iYWNrZW5kO1xuXG4gICAgY29uc3QgcmVjdXJzZTogKGJhc2U6IFBhdGgpID0+IE9ic2VydmFibGU8dm9pZD4gPSAoYmFzZSkgPT4ge1xuICAgICAgcmV0dXJuIG9yaWdpbmFsQmFja2VuZC5saXN0KGJhc2UpLnBpcGUoXG4gICAgICAgIG1lcmdlTWFwKCh4KSA9PiB4KSxcbiAgICAgICAgbWFwKChwYXRoKSA9PiBqb2luKGJhc2UsIHBhdGgpKSxcbiAgICAgICAgY29uY2F0TWFwKChwYXRoKSA9PiB7XG4gICAgICAgICAgbGV0IGlzRGlyZWN0b3J5ID0gZmFsc2U7XG4gICAgICAgICAgb3JpZ2luYWxCYWNrZW5kLmlzRGlyZWN0b3J5KHBhdGgpLnN1YnNjcmliZSgodmFsKSA9PiAoaXNEaXJlY3RvcnkgPSB2YWwpKTtcbiAgICAgICAgICBpZiAoaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiByZWN1cnNlKHBhdGgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBpc0ZpbGUgPSBmYWxzZTtcbiAgICAgICAgICBvcmlnaW5hbEJhY2tlbmQuaXNGaWxlKHBhdGgpLnN1YnNjcmliZSgodmFsKSA9PiAoaXNGaWxlID0gdmFsKSk7XG4gICAgICAgICAgaWYgKCFpc0ZpbGUgfHwgIWZpbHRlcihwYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuIEVNUFRZO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBjb250ZW50OiBBcnJheUJ1ZmZlciB8IG51bGwgPSBudWxsO1xuICAgICAgICAgIG9yaWdpbmFsQmFja2VuZC5yZWFkKHBhdGgpLnN1YnNjcmliZSgodmFsKSA9PiAoY29udGVudCA9IHZhbCkpO1xuICAgICAgICAgIGlmICghY29udGVudCkge1xuICAgICAgICAgICAgcmV0dXJuIEVNUFRZO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBuZXdCYWNrZW5kLndyaXRlKHBhdGgsIGNvbnRlbnQgYXMge30gYXMgdmlydHVhbEZzLkZpbGVCdWZmZXIpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfTtcblxuICAgIHJlY3Vyc2Uobm9ybWFsaXplKCcvJykpLnN1YnNjcmliZSgpO1xuXG4gICAgc3VwZXIobmV3QmFja2VuZCk7XG5cbiAgICBmb3IgKGNvbnN0IGFjdGlvbiBvZiB0cmVlLmFjdGlvbnMpIHtcbiAgICAgIGlmICghZmlsdGVyKGFjdGlvbi5wYXRoKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoIChhY3Rpb24ua2luZCkge1xuICAgICAgICBjYXNlICdjJzpcbiAgICAgICAgICB0aGlzLmNyZWF0ZShhY3Rpb24ucGF0aCwgYWN0aW9uLmNvbnRlbnQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdkJzpcbiAgICAgICAgICB0aGlzLmRlbGV0ZShhY3Rpb24ucGF0aCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ28nOlxuICAgICAgICAgIHRoaXMub3ZlcndyaXRlKGFjdGlvbi5wYXRoLCBhY3Rpb24uY29udGVudCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3InOlxuICAgICAgICAgIHRoaXMucmVuYW1lKGFjdGlvbi5wYXRoLCBhY3Rpb24udG8pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19