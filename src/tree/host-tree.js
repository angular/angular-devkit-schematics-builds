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
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const exception_1 = require("../exception/exception");
const entry_1 = require("./entry");
const interface_1 = require("./interface");
const recorder_1 = require("./recorder");
let _uniqueId = 0;
class HostDirEntry {
    constructor(parent, path, _host, _tree) {
        this.parent = parent;
        this.path = path;
        this._host = _host;
        this._tree = _tree;
    }
    get subdirs() {
        return this._host.list(this.path)
            .filter(fragment => this._host.isDirectory(core_1.join(this.path, fragment)));
    }
    get subfiles() {
        return this._host.list(this.path)
            .filter(fragment => this._host.isFile(core_1.join(this.path, fragment)));
    }
    dir(name) {
        return this._tree.getDir(core_1.join(this.path, name));
    }
    file(name) {
        return this._tree.get(core_1.join(this.path, name));
    }
    visit(visitor) {
        try {
            this.getSubfilesRecursively().forEach(file => visitor(file.path, file));
        }
        catch (e) {
            if (e !== interface_1.FileVisitorCancelToken) {
                throw e;
            }
        }
    }
    getSubfilesRecursively() {
        function _recurse(entry) {
            return entry.subdirs.reduce((files, subdir) => [
                ...files,
                ..._recurse(entry.dir(subdir)),
            ], entry.subfiles.map(subfile => entry.file(subfile)));
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
        return core_1.normalize('/' + path);
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
    // This can be used by old Schematics library with new Trees in some corner cases.
    // TODO: remove this for 7.0
    optimize() {
        return this;
    }
    branch() {
        const branchedTree = new HostTree(this._backend);
        branchedTree._record = this._record.clone();
        branchedTree._recordSync = new core_1.virtualFs.SyncDelegateHost(branchedTree._record);
        branchedTree._ancestry = new Set(this._ancestry).add(this._id);
        return branchedTree;
    }
    merge(other, strategy = interface_1.MergeStrategy.Default) {
        if (other === this) {
            // Merging with yourself? Tsk tsk. Nothing to do at least.
            return;
        }
        if (other instanceof HostTree && other._ancestry.has(this._id)) {
            // Workaround for merging a branch back into one of its ancestors
            // More complete branch point tracking is required to avoid
            strategy |= interface_1.MergeStrategy.Overwrite;
        }
        const creationConflictAllowed = (strategy & interface_1.MergeStrategy.AllowCreationConflict) == interface_1.MergeStrategy.AllowCreationConflict;
        const overwriteConflictAllowed = (strategy & interface_1.MergeStrategy.AllowOverwriteConflict) == interface_1.MergeStrategy.AllowOverwriteConflict;
        const deleteConflictAllowed = (strategy & interface_1.MergeStrategy.AllowOverwriteConflict) == interface_1.MergeStrategy.AllowDeleteConflict;
        other.actions.forEach(action => {
            switch (action.kind) {
                case 'c': {
                    const { path, content } = action;
                    if ((this._willCreate(path) || this._willOverwrite(path))) {
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
            let parent = core_1.dirname(p);
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
                this.overwrite(path, newContent);
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
    get actions() {
        // Create a list of all records until we hit our original backend. This is to support branches
        // that diverge from each others.
        const allRecords = [...this._record.records()];
        return core_1.clean(allRecords
            .map(record => {
            switch (record.kind) {
                case 'create':
                    return {
                        id: this._id,
                        parent: 0,
                        kind: 'c',
                        path: record.path,
                        content: Buffer.from(record.content),
                    };
                case 'overwrite':
                    return {
                        id: this._id,
                        parent: 0,
                        kind: 'o',
                        path: record.path,
                        content: Buffer.from(record.content),
                    };
                case 'rename':
                    return {
                        id: this._id,
                        parent: 0,
                        kind: 'r',
                        path: record.from,
                        to: record.to,
                    };
                case 'delete':
                    return {
                        id: this._id,
                        parent: 0,
                        kind: 'd',
                        path: record.path,
                    };
                default:
                    return;
            }
        }));
    }
}
exports.HostTree = HostTree;
class HostCreateTree extends HostTree {
    constructor(host) {
        super();
        const tempHost = new HostTree(host);
        tempHost.visit(path => {
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
        const recurse = base => {
            return originalBackend.list(base)
                .pipe(operators_1.mergeMap(x => x), operators_1.map(path => core_1.join(base, path)), operators_1.concatMap(path => {
                let isDirectory = false;
                originalBackend.isDirectory(path).subscribe(val => isDirectory = val);
                if (isDirectory) {
                    return recurse(path);
                }
                let isFile = false;
                originalBackend.isFile(path).subscribe(val => isFile = val);
                if (!isFile || !filter(path)) {
                    return rxjs_1.EMPTY;
                }
                let content = null;
                originalBackend.read(path).subscribe(val => content = val);
                if (!content) {
                    return rxjs_1.EMPTY;
                }
                return newBackend.write(path, content);
            }));
        };
        recurse(core_1.normalize('/')).subscribe();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdC10cmVlLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy90cmVlL2hvc3QtdHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQVU4QjtBQUM5QiwrQkFBeUM7QUFDekMsOENBQTBEO0FBQzFELHNEQU9nQztBQVFoQyxtQ0FBd0M7QUFDeEMsMkNBVXFCO0FBQ3JCLHlDQUFnRDtBQUdoRCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFHbEIsTUFBYSxZQUFZO0lBQ3ZCLFlBQ1csTUFBdUIsRUFDdkIsSUFBVSxFQUNULEtBQWlDLEVBQ2pDLEtBQVc7UUFIWixXQUFNLEdBQU4sTUFBTSxDQUFpQjtRQUN2QixTQUFJLEdBQUosSUFBSSxDQUFNO1FBQ1QsVUFBSyxHQUFMLEtBQUssQ0FBNEI7UUFDakMsVUFBSyxHQUFMLEtBQUssQ0FBTTtJQUNwQixDQUFDO0lBRUosSUFBSSxPQUFPO1FBQ1QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQzlCLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFdBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBQ0QsSUFBSSxRQUFRO1FBQ1YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQzlCLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFdBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBRUQsR0FBRyxDQUFDLElBQWtCO1FBQ3BCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBQ0QsSUFBSSxDQUFDLElBQWtCO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsV0FBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQW9CO1FBQ3hCLElBQUk7WUFDRixJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQ3pFO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixJQUFJLENBQUMsS0FBSyxrQ0FBc0IsRUFBRTtnQkFDaEMsTUFBTSxDQUFDLENBQUM7YUFDVDtTQUNGO0lBQ0gsQ0FBQztJQUVPLHNCQUFzQjtRQUM1QixTQUFTLFFBQVEsQ0FBQyxLQUFlO1lBQy9CLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDN0MsR0FBRyxLQUFLO2dCQUNSLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDL0IsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFjLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLENBQUM7UUFFRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4QixDQUFDO0NBQ0Y7QUE1Q0Qsb0NBNENDO0FBR0QsTUFBYSxRQUFRO0lBeUJuQixZQUFzQixXQUF1QyxJQUFJLGdCQUFTLENBQUMsS0FBSyxFQUFFO1FBQTVELGFBQVEsR0FBUixRQUFRLENBQW9EO1FBeEJqRSxRQUFHLEdBQUcsRUFBRSxTQUFTLENBQUM7UUFHM0IsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFFOUIsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFzQixDQUFDO1FBb0JoRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksZ0JBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxnQkFBUyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDaEYsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLGdCQUFTLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFuQkQsQ0FBQyxzQkFBVSxDQUFDO1FBQ1YsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFVO1FBQzFCLElBQUksSUFBSSxZQUFZLFFBQVEsRUFBRTtZQUM1QixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksT0FBUSxJQUFpQixDQUFDLFNBQVMsS0FBSyxRQUFRLEVBQUU7WUFDaEYsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQU9TLGNBQWMsQ0FBQyxJQUFZO1FBQ25DLE9BQU8sZ0JBQVMsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVTLFdBQVcsQ0FBQyxJQUFVO1FBQzlCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVTLGNBQWMsQ0FBQyxJQUFVO1FBQ2pDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVTLFdBQVcsQ0FBQyxJQUFVO1FBQzlCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVTLFdBQVcsQ0FBQyxJQUFVO1FBQzlCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELGtGQUFrRjtJQUNsRiw0QkFBNEI7SUFDNUIsUUFBUTtRQUNOLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQU07UUFDSixNQUFNLFlBQVksR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDakQsWUFBWSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzVDLFlBQVksQ0FBQyxXQUFXLEdBQUcsSUFBSSxnQkFBUyxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoRixZQUFZLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRS9ELE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxLQUFLLENBQUMsS0FBVyxFQUFFLFdBQTBCLHlCQUFhLENBQUMsT0FBTztRQUNoRSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7WUFDbEIsMERBQTBEO1lBQzFELE9BQU87U0FDUjtRQUVELElBQUksS0FBSyxZQUFZLFFBQVEsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDOUQsaUVBQWlFO1lBQ2pFLDJEQUEyRDtZQUMzRCxRQUFRLElBQUkseUJBQWEsQ0FBQyxTQUFTLENBQUM7U0FDckM7UUFFRCxNQUFNLHVCQUF1QixHQUMzQixDQUFDLFFBQVEsR0FBRyx5QkFBYSxDQUFDLHFCQUFxQixDQUFDLElBQUkseUJBQWEsQ0FBQyxxQkFBcUIsQ0FBQztRQUMxRixNQUFNLHdCQUF3QixHQUM1QixDQUFDLFFBQVEsR0FBRyx5QkFBYSxDQUFDLHNCQUFzQixDQUFDLElBQUkseUJBQWEsQ0FBQyxzQkFBc0IsQ0FBQztRQUM1RixNQUFNLHFCQUFxQixHQUN6QixDQUFDLFFBQVEsR0FBRyx5QkFBYSxDQUFDLHNCQUFzQixDQUFDLElBQUkseUJBQWEsQ0FBQyxtQkFBbUIsQ0FBQztRQUV6RixLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUM3QixRQUFRLE1BQU0sQ0FBQyxJQUFJLEVBQUU7Z0JBQ25CLEtBQUssR0FBRyxDQUFDLENBQUM7b0JBQ1IsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFNLENBQUM7b0JBRWpDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTt3QkFDekQsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDeEMsSUFBSSxlQUFlLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsRUFBRTs0QkFDdEQsd0NBQXdDOzRCQUN4QyxPQUFPO3lCQUNSO3dCQUVELElBQUksQ0FBQyx1QkFBdUIsRUFBRTs0QkFDNUIsTUFBTSxJQUFJLGtDQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO3lCQUN4Qzt3QkFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBcUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO3FCQUNqRjt5QkFBTTt3QkFDTCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsT0FBcUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO3FCQUM5RTtvQkFFRCxPQUFPO2lCQUNSO2dCQUVELEtBQUssR0FBRyxDQUFDLENBQUM7b0JBQ1IsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFNLENBQUM7b0JBQ2pDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFO3dCQUN2RCxNQUFNLElBQUksa0NBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQ3hDO29CQUVELDhEQUE4RDtvQkFDOUQsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFO3dCQUM3QixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUN4QyxJQUFJLGVBQWUsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxFQUFFOzRCQUN0RCx3Q0FBd0M7NEJBQ3hDLE9BQU87eUJBQ1I7d0JBRUQsSUFBSSxDQUFDLHdCQUF3QixFQUFFOzRCQUM3QixNQUFNLElBQUksa0NBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7eUJBQ3hDO3FCQUNGO29CQUNELGtGQUFrRjtvQkFDbEYsMkJBQTJCO29CQUMzQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBcUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUU1RSxPQUFPO2lCQUNSO2dCQUVELEtBQUssR0FBRyxDQUFDLENBQUM7b0JBQ1IsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsR0FBRyxNQUFNLENBQUM7b0JBQzVCLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRTt3QkFDMUIsTUFBTSxJQUFJLGtDQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO3FCQUN4QztvQkFFRCxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUU7d0JBQzFCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUFFOzRCQUN2Qyx3Q0FBd0M7NEJBQ3hDLE9BQU87eUJBQ1I7d0JBRUQscUNBQXFDO3dCQUNyQyxNQUFNLElBQUksa0NBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQ3hDO29CQUNELElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUV0QixPQUFPO2lCQUNSO2dCQUVELEtBQUssR0FBRyxDQUFDLENBQUM7b0JBQ1IsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQztvQkFDeEIsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFO3dCQUMxQix5RUFBeUU7d0JBQ3pFLHdDQUF3Qzt3QkFDeEMsT0FBTztxQkFDUjtvQkFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFO3dCQUNoRCxNQUFNLElBQUksa0NBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQ3hDO29CQUVELElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUU5QixPQUFPO2lCQUNSO2FBQ0Y7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxJQUFJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVELFlBQVk7SUFDWixJQUFJLENBQUMsSUFBWTtRQUNmLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFN0IsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUN0QyxDQUFDO0lBQ0QsTUFBTSxDQUFDLElBQVk7UUFDakIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUVELEdBQUcsQ0FBQyxJQUFZO1FBQ2QsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ25DLE1BQU0sSUFBSSwrQkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN2QztRQUNELElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUMvQixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsT0FBTyxJQUFJLHFCQUFhLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNFLENBQUM7SUFFRCxNQUFNLENBQUMsSUFBWTtRQUNqQixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDOUIsTUFBTSxJQUFJLDBCQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2xDO1FBRUQsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNmLElBQUksTUFBTSxHQUFnQixjQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLEtBQUssTUFBTSxFQUFFO2dCQUNoQixNQUFNLEdBQUcsSUFBSSxDQUFDO2FBQ2Y7WUFFRCxVQUFVLEdBQUcsSUFBSSxZQUFZLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ25DO1FBRUQsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUNELEtBQUssQ0FBQyxPQUFvQjtRQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUM5QixPQUFPLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELGdDQUFnQztJQUNoQyxTQUFTLENBQUMsSUFBWSxFQUFFLE9BQXdCO1FBQzlDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQy9CLE1BQU0sSUFBSSxxQ0FBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN4QztRQUNELE1BQU0sQ0FBQyxHQUFHLE9BQU8sT0FBTyxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ3RFLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUErQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDekUsQ0FBQztJQUNELFdBQVcsQ0FBQyxJQUFZO1FBQ3RCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNWLE1BQU0sSUFBSSxxQ0FBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzQztRQUVELE9BQU8sNkJBQWtCLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUNELFlBQVksQ0FBQyxNQUFzQjtRQUNqQyxJQUFJLE1BQU0sWUFBWSw2QkFBa0IsRUFBRTtZQUN4QyxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ3pCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDVixNQUFNLElBQUksc0NBQTBCLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDNUM7aUJBQU07Z0JBQ0wsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2FBQ2xDO1NBQ0Y7YUFBTTtZQUNMLE1BQU0sSUFBSSx3Q0FBNEIsRUFBRSxDQUFDO1NBQzFDO0lBQ0gsQ0FBQztJQUVELHNCQUFzQjtJQUN0QixNQUFNLENBQUMsSUFBWSxFQUFFLE9BQXdCO1FBQzNDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUM5QixNQUFNLElBQUkscUNBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDeEM7UUFDRCxNQUFNLENBQUMsR0FBRyxPQUFPLE9BQU8sSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUN0RSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBK0IsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ3RFLENBQUM7SUFDRCxNQUFNLENBQUMsSUFBWTtRQUNqQixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFZLEVBQUUsRUFBVTtRQUM3QixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQWMsRUFBRSxRQUF3QjtRQUM1QyxNQUFNLElBQUksK0JBQW1CLENBQUMsc0NBQXNDLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBQ0QsSUFBSSxPQUFPO1FBQ1QsOEZBQThGO1FBQzlGLGlDQUFpQztRQUNqQyxNQUFNLFVBQVUsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBRS9DLE9BQU8sWUFBSyxDQUNWLFVBQVU7YUFDUCxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDWixRQUFRLE1BQU0sQ0FBQyxJQUFJLEVBQUU7Z0JBQ25CLEtBQUssUUFBUTtvQkFDWCxPQUFPO3dCQUNMLEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRzt3QkFDWixNQUFNLEVBQUUsQ0FBQzt3QkFDVCxJQUFJLEVBQUUsR0FBRzt3QkFDVCxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7d0JBQ2pCLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7cUJBQ2pCLENBQUM7Z0JBQ3hCLEtBQUssV0FBVztvQkFDZCxPQUFPO3dCQUNMLEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRzt3QkFDWixNQUFNLEVBQUUsQ0FBQzt3QkFDVCxJQUFJLEVBQUUsR0FBRzt3QkFDVCxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7d0JBQ2pCLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7cUJBQ2QsQ0FBQztnQkFDM0IsS0FBSyxRQUFRO29CQUNYLE9BQU87d0JBQ0wsRUFBRSxFQUFFLElBQUksQ0FBQyxHQUFHO3dCQUNaLE1BQU0sRUFBRSxDQUFDO3dCQUNULElBQUksRUFBRSxHQUFHO3dCQUNULElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTt3QkFDakIsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFO3FCQUNNLENBQUM7Z0JBQ3hCLEtBQUssUUFBUTtvQkFDWCxPQUFPO3dCQUNMLEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRzt3QkFDWixNQUFNLEVBQUUsQ0FBQzt3QkFDVCxJQUFJLEVBQUUsR0FBRzt3QkFDVCxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7cUJBQ0UsQ0FBQztnQkFFeEI7b0JBQ0UsT0FBTzthQUNWO1FBQ0gsQ0FBQyxDQUFDLENBQ0wsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQWxVRCw0QkFrVUM7QUFFRCxNQUFhLGNBQWUsU0FBUSxRQUFRO0lBQzFDLFlBQVksSUFBNEI7UUFDdEMsS0FBSyxFQUFFLENBQUM7UUFFUixNQUFNLFFBQVEsR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3BCLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEMsSUFBSSxPQUFPLEVBQUU7Z0JBQ1gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDNUI7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQVpELHdDQVlDO0FBRUQsTUFBYSxjQUFlLFNBQVEsUUFBUTtJQUMxQyxZQUFZLElBQWMsRUFBRSxTQUFpQyxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ3JFLE1BQU0sVUFBVSxHQUFHLElBQUksZ0JBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3BELHVCQUF1QjtRQUN2QixNQUFNLGVBQWUsR0FBSSxJQUF1QixDQUFDLFFBQVEsQ0FBQztRQUUxRCxNQUFNLE9BQU8sR0FBcUMsSUFBSSxDQUFDLEVBQUU7WUFDdkQsT0FBTyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztpQkFDOUIsSUFBSSxDQUNILG9CQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFDaEIsZUFBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUM3QixxQkFBUyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNmLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztnQkFDeEIsZUFBZSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBQ3RFLElBQUksV0FBVyxFQUFFO29CQUNmLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUN0QjtnQkFFRCxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7Z0JBQ25CLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDO2dCQUM1RCxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUM1QixPQUFPLFlBQUssQ0FBQztpQkFDZDtnQkFFRCxJQUFJLE9BQU8sR0FBdUIsSUFBSSxDQUFDO2dCQUN2QyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDWixPQUFPLFlBQUssQ0FBQztpQkFDZDtnQkFFRCxPQUFPLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQXFDLENBQUMsQ0FBQztZQUN2RSxDQUFDLENBQUMsQ0FDSCxDQUFDO1FBQ04sQ0FBQyxDQUFDO1FBRUYsT0FBTyxDQUFDLGdCQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUVwQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFbEIsS0FBSyxNQUFNLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2pDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN4QixTQUFTO2FBQ1Y7WUFFRCxRQUFRLE1BQU0sQ0FBQyxJQUFJLEVBQUU7Z0JBQ25CLEtBQUssR0FBRztvQkFDTixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUN6QyxNQUFNO2dCQUNSLEtBQUssR0FBRztvQkFDTixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDekIsTUFBTTtnQkFDUixLQUFLLEdBQUc7b0JBQ04sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDNUMsTUFBTTtnQkFDUixLQUFLLEdBQUc7b0JBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDcEMsTUFBTTthQUNUO1NBQ0Y7SUFDSCxDQUFDO0NBQ0Y7QUE1REQsd0NBNERDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgUGF0aCxcbiAgUGF0aEZyYWdtZW50LFxuICBQYXRoSXNEaXJlY3RvcnlFeGNlcHRpb24sXG4gIFBhdGhJc0ZpbGVFeGNlcHRpb24sXG4gIGNsZWFuLFxuICBkaXJuYW1lLFxuICBqb2luLFxuICBub3JtYWxpemUsXG4gIHZpcnR1YWxGcyxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgRU1QVFksIE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGNvbmNhdE1hcCwgbWFwLCBtZXJnZU1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7XG4gIENvbnRlbnRIYXNNdXRhdGVkRXhjZXB0aW9uLFxuICBGaWxlQWxyZWFkeUV4aXN0RXhjZXB0aW9uLFxuICBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uLFxuICBJbnZhbGlkVXBkYXRlUmVjb3JkRXhjZXB0aW9uLFxuICBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uLFxuICBTY2hlbWF0aWNzRXhjZXB0aW9uLFxufSBmcm9tICcuLi9leGNlcHRpb24vZXhjZXB0aW9uJztcbmltcG9ydCB7XG4gIEFjdGlvbixcbiAgQ3JlYXRlRmlsZUFjdGlvbixcbiAgRGVsZXRlRmlsZUFjdGlvbixcbiAgT3ZlcndyaXRlRmlsZUFjdGlvbixcbiAgUmVuYW1lRmlsZUFjdGlvbixcbn0gZnJvbSAnLi9hY3Rpb24nO1xuaW1wb3J0IHsgTGF6eUZpbGVFbnRyeSB9IGZyb20gJy4vZW50cnknO1xuaW1wb3J0IHtcbiAgRGlyRW50cnksXG4gIEZpbGVFbnRyeSxcbiAgRmlsZVByZWRpY2F0ZSxcbiAgRmlsZVZpc2l0b3IsXG4gIEZpbGVWaXNpdG9yQ2FuY2VsVG9rZW4sXG4gIE1lcmdlU3RyYXRlZ3ksXG4gIFRyZWUsXG4gIFRyZWVTeW1ib2wsXG4gIFVwZGF0ZVJlY29yZGVyLFxufSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBVcGRhdGVSZWNvcmRlckJhc2UgfSBmcm9tICcuL3JlY29yZGVyJztcblxuXG5sZXQgX3VuaXF1ZUlkID0gMDtcblxuXG5leHBvcnQgY2xhc3MgSG9zdERpckVudHJ5IGltcGxlbWVudHMgRGlyRW50cnkge1xuICBjb25zdHJ1Y3RvcihcbiAgICByZWFkb25seSBwYXJlbnQ6IERpckVudHJ5IHwgbnVsbCxcbiAgICByZWFkb25seSBwYXRoOiBQYXRoLFxuICAgIHByb3RlY3RlZCBfaG9zdDogdmlydHVhbEZzLlN5bmNEZWxlZ2F0ZUhvc3QsXG4gICAgcHJvdGVjdGVkIF90cmVlOiBUcmVlLFxuICApIHt9XG5cbiAgZ2V0IHN1YmRpcnMoKTogUGF0aEZyYWdtZW50W10ge1xuICAgIHJldHVybiB0aGlzLl9ob3N0Lmxpc3QodGhpcy5wYXRoKVxuICAgICAgLmZpbHRlcihmcmFnbWVudCA9PiB0aGlzLl9ob3N0LmlzRGlyZWN0b3J5KGpvaW4odGhpcy5wYXRoLCBmcmFnbWVudCkpKTtcbiAgfVxuICBnZXQgc3ViZmlsZXMoKTogUGF0aEZyYWdtZW50W10ge1xuICAgIHJldHVybiB0aGlzLl9ob3N0Lmxpc3QodGhpcy5wYXRoKVxuICAgICAgLmZpbHRlcihmcmFnbWVudCA9PiB0aGlzLl9ob3N0LmlzRmlsZShqb2luKHRoaXMucGF0aCwgZnJhZ21lbnQpKSk7XG4gIH1cblxuICBkaXIobmFtZTogUGF0aEZyYWdtZW50KTogRGlyRW50cnkge1xuICAgIHJldHVybiB0aGlzLl90cmVlLmdldERpcihqb2luKHRoaXMucGF0aCwgbmFtZSkpO1xuICB9XG4gIGZpbGUobmFtZTogUGF0aEZyYWdtZW50KTogRmlsZUVudHJ5IHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX3RyZWUuZ2V0KGpvaW4odGhpcy5wYXRoLCBuYW1lKSk7XG4gIH1cblxuICB2aXNpdCh2aXNpdG9yOiBGaWxlVmlzaXRvcik6IHZvaWQge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmdldFN1YmZpbGVzUmVjdXJzaXZlbHkoKS5mb3JFYWNoKGZpbGUgPT4gdmlzaXRvcihmaWxlLnBhdGgsIGZpbGUpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSAhPT0gRmlsZVZpc2l0b3JDYW5jZWxUb2tlbikge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0U3ViZmlsZXNSZWN1cnNpdmVseSgpIHtcbiAgICBmdW5jdGlvbiBfcmVjdXJzZShlbnRyeTogRGlyRW50cnkpOiBGaWxlRW50cnlbXSB7XG4gICAgICByZXR1cm4gZW50cnkuc3ViZGlycy5yZWR1Y2UoKGZpbGVzLCBzdWJkaXIpID0+IFtcbiAgICAgICAgLi4uZmlsZXMsXG4gICAgICAgIC4uLl9yZWN1cnNlKGVudHJ5LmRpcihzdWJkaXIpKSxcbiAgICAgIF0sIGVudHJ5LnN1YmZpbGVzLm1hcChzdWJmaWxlID0+IGVudHJ5LmZpbGUoc3ViZmlsZSkgYXMgRmlsZUVudHJ5KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9yZWN1cnNlKHRoaXMpO1xuICB9XG59XG5cblxuZXhwb3J0IGNsYXNzIEhvc3RUcmVlIGltcGxlbWVudHMgVHJlZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2lkID0gLS1fdW5pcXVlSWQ7XG4gIHByaXZhdGUgX3JlY29yZDogdmlydHVhbEZzLkNvcmRIb3N0O1xuICBwcml2YXRlIF9yZWNvcmRTeW5jOiB2aXJ0dWFsRnMuU3luY0RlbGVnYXRlSG9zdDtcbiAgcHJpdmF0ZSBfYW5jZXN0cnkgPSBuZXcgU2V0PG51bWJlcj4oKTtcblxuICBwcml2YXRlIF9kaXJDYWNoZSA9IG5ldyBNYXA8UGF0aCwgSG9zdERpckVudHJ5PigpO1xuXG5cbiAgW1RyZWVTeW1ib2xdKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc3RhdGljIGlzSG9zdFRyZWUodHJlZTogVHJlZSk6IHRyZWUgaXMgSG9zdFRyZWUge1xuICAgIGlmICh0cmVlIGluc3RhbmNlb2YgSG9zdFRyZWUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdHJlZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mICh0cmVlIGFzIEhvc3RUcmVlKS5fYW5jZXN0cnkgPT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgX2JhY2tlbmQ6IHZpcnR1YWxGcy5SZWFkb25seUhvc3Q8e30+ID0gbmV3IHZpcnR1YWxGcy5FbXB0eSgpKSB7XG4gICAgdGhpcy5fcmVjb3JkID0gbmV3IHZpcnR1YWxGcy5Db3JkSG9zdChuZXcgdmlydHVhbEZzLlNhZmVSZWFkb25seUhvc3QoX2JhY2tlbmQpKTtcbiAgICB0aGlzLl9yZWNvcmRTeW5jID0gbmV3IHZpcnR1YWxGcy5TeW5jRGVsZWdhdGVIb3N0KHRoaXMuX3JlY29yZCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX25vcm1hbGl6ZVBhdGgocGF0aDogc3RyaW5nKTogUGF0aCB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZSgnLycgKyBwYXRoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfd2lsbENyZWF0ZShwYXRoOiBQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlY29yZC53aWxsQ3JlYXRlKHBhdGgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF93aWxsT3ZlcndyaXRlKHBhdGg6IFBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVjb3JkLndpbGxPdmVyd3JpdGUocGF0aCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3dpbGxEZWxldGUocGF0aDogUGF0aCkge1xuICAgIHJldHVybiB0aGlzLl9yZWNvcmQud2lsbERlbGV0ZShwYXRoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfd2lsbFJlbmFtZShwYXRoOiBQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlY29yZC53aWxsUmVuYW1lKHBhdGgpO1xuICB9XG5cbiAgLy8gVGhpcyBjYW4gYmUgdXNlZCBieSBvbGQgU2NoZW1hdGljcyBsaWJyYXJ5IHdpdGggbmV3IFRyZWVzIGluIHNvbWUgY29ybmVyIGNhc2VzLlxuICAvLyBUT0RPOiByZW1vdmUgdGhpcyBmb3IgNy4wXG4gIG9wdGltaXplKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYnJhbmNoKCk6IFRyZWUge1xuICAgIGNvbnN0IGJyYW5jaGVkVHJlZSA9IG5ldyBIb3N0VHJlZSh0aGlzLl9iYWNrZW5kKTtcbiAgICBicmFuY2hlZFRyZWUuX3JlY29yZCA9IHRoaXMuX3JlY29yZC5jbG9uZSgpO1xuICAgIGJyYW5jaGVkVHJlZS5fcmVjb3JkU3luYyA9IG5ldyB2aXJ0dWFsRnMuU3luY0RlbGVnYXRlSG9zdChicmFuY2hlZFRyZWUuX3JlY29yZCk7XG4gICAgYnJhbmNoZWRUcmVlLl9hbmNlc3RyeSA9IG5ldyBTZXQodGhpcy5fYW5jZXN0cnkpLmFkZCh0aGlzLl9pZCk7XG5cbiAgICByZXR1cm4gYnJhbmNoZWRUcmVlO1xuICB9XG5cbiAgbWVyZ2Uob3RoZXI6IFRyZWUsIHN0cmF0ZWd5OiBNZXJnZVN0cmF0ZWd5ID0gTWVyZ2VTdHJhdGVneS5EZWZhdWx0KTogdm9pZCB7XG4gICAgaWYgKG90aGVyID09PSB0aGlzKSB7XG4gICAgICAvLyBNZXJnaW5nIHdpdGggeW91cnNlbGY/IFRzayB0c2suIE5vdGhpbmcgdG8gZG8gYXQgbGVhc3QuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG90aGVyIGluc3RhbmNlb2YgSG9zdFRyZWUgJiYgb3RoZXIuX2FuY2VzdHJ5Lmhhcyh0aGlzLl9pZCkpIHtcbiAgICAgIC8vIFdvcmthcm91bmQgZm9yIG1lcmdpbmcgYSBicmFuY2ggYmFjayBpbnRvIG9uZSBvZiBpdHMgYW5jZXN0b3JzXG4gICAgICAvLyBNb3JlIGNvbXBsZXRlIGJyYW5jaCBwb2ludCB0cmFja2luZyBpcyByZXF1aXJlZCB0byBhdm9pZFxuICAgICAgc3RyYXRlZ3kgfD0gTWVyZ2VTdHJhdGVneS5PdmVyd3JpdGU7XG4gICAgfVxuXG4gICAgY29uc3QgY3JlYXRpb25Db25mbGljdEFsbG93ZWQgPVxuICAgICAgKHN0cmF0ZWd5ICYgTWVyZ2VTdHJhdGVneS5BbGxvd0NyZWF0aW9uQ29uZmxpY3QpID09IE1lcmdlU3RyYXRlZ3kuQWxsb3dDcmVhdGlvbkNvbmZsaWN0O1xuICAgIGNvbnN0IG92ZXJ3cml0ZUNvbmZsaWN0QWxsb3dlZCA9XG4gICAgICAoc3RyYXRlZ3kgJiBNZXJnZVN0cmF0ZWd5LkFsbG93T3ZlcndyaXRlQ29uZmxpY3QpID09IE1lcmdlU3RyYXRlZ3kuQWxsb3dPdmVyd3JpdGVDb25mbGljdDtcbiAgICBjb25zdCBkZWxldGVDb25mbGljdEFsbG93ZWQgPVxuICAgICAgKHN0cmF0ZWd5ICYgTWVyZ2VTdHJhdGVneS5BbGxvd092ZXJ3cml0ZUNvbmZsaWN0KSA9PSBNZXJnZVN0cmF0ZWd5LkFsbG93RGVsZXRlQ29uZmxpY3Q7XG5cbiAgICBvdGhlci5hY3Rpb25zLmZvckVhY2goYWN0aW9uID0+IHtcbiAgICAgIHN3aXRjaCAoYWN0aW9uLmtpbmQpIHtcbiAgICAgICAgY2FzZSAnYyc6IHtcbiAgICAgICAgICBjb25zdCB7IHBhdGgsIGNvbnRlbnQgfSA9IGFjdGlvbjtcblxuICAgICAgICAgIGlmICgodGhpcy5fd2lsbENyZWF0ZShwYXRoKSB8fCB0aGlzLl93aWxsT3ZlcndyaXRlKHBhdGgpKSkge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdDb250ZW50ID0gdGhpcy5yZWFkKHBhdGgpO1xuICAgICAgICAgICAgaWYgKGV4aXN0aW5nQ29udGVudCAmJiBjb250ZW50LmVxdWFscyhleGlzdGluZ0NvbnRlbnQpKSB7XG4gICAgICAgICAgICAgIC8vIElkZW50aWNhbCBvdXRjb21lOyBubyBhY3Rpb24gcmVxdWlyZWRcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWNyZWF0aW9uQ29uZmxpY3RBbGxvd2VkKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uKHBhdGgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9yZWNvcmQub3ZlcndyaXRlKHBhdGgsIGNvbnRlbnQgYXMge30gYXMgdmlydHVhbEZzLkZpbGVCdWZmZXIpLnN1YnNjcmliZSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZWNvcmQuY3JlYXRlKHBhdGgsIGNvbnRlbnQgYXMge30gYXMgdmlydHVhbEZzLkZpbGVCdWZmZXIpLnN1YnNjcmliZSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhc2UgJ28nOiB7XG4gICAgICAgICAgY29uc3QgeyBwYXRoLCBjb250ZW50IH0gPSBhY3Rpb247XG4gICAgICAgICAgaWYgKHRoaXMuX3dpbGxEZWxldGUocGF0aCkgJiYgIW92ZXJ3cml0ZUNvbmZsaWN0QWxsb3dlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1lcmdlQ29uZmxpY3RFeGNlcHRpb24ocGF0aCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSWdub3JlIGlmIGNvbnRlbnQgaXMgdGhlIHNhbWUgKGNvbnNpZGVyZWQgdGhlIHNhbWUgY2hhbmdlKS5cbiAgICAgICAgICBpZiAodGhpcy5fd2lsbE92ZXJ3cml0ZShwYXRoKSkge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdDb250ZW50ID0gdGhpcy5yZWFkKHBhdGgpO1xuICAgICAgICAgICAgaWYgKGV4aXN0aW5nQ29udGVudCAmJiBjb250ZW50LmVxdWFscyhleGlzdGluZ0NvbnRlbnQpKSB7XG4gICAgICAgICAgICAgIC8vIElkZW50aWNhbCBvdXRjb21lOyBubyBhY3Rpb24gcmVxdWlyZWRcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIW92ZXJ3cml0ZUNvbmZsaWN0QWxsb3dlZCkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgTWVyZ2VDb25mbGljdEV4Y2VwdGlvbihwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gV2UgdXNlIHdyaXRlIGhlcmUgYXMgbWVyZ2UgdmFsaWRhdGlvbiBoYXMgYWxyZWFkeSBiZWVuIGRvbmUsIGFuZCB3ZSB3YW50IHRvIGxldFxuICAgICAgICAgIC8vIHRoZSBDb3JkSG9zdCBkbyBpdHMgam9iLlxuICAgICAgICAgIHRoaXMuX3JlY29yZC53cml0ZShwYXRoLCBjb250ZW50IGFzIHt9IGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKS5zdWJzY3JpYmUoKTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhc2UgJ3InOiB7XG4gICAgICAgICAgY29uc3QgeyBwYXRoLCB0byB9ID0gYWN0aW9uO1xuICAgICAgICAgIGlmICh0aGlzLl93aWxsRGVsZXRlKHBhdGgpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWVyZ2VDb25mbGljdEV4Y2VwdGlvbihwYXRoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodGhpcy5fd2lsbFJlbmFtZShwYXRoKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3JlY29yZC53aWxsUmVuYW1lVG8ocGF0aCwgdG8pKSB7XG4gICAgICAgICAgICAgIC8vIElkZW50aWNhbCBvdXRjb21lOyBubyBhY3Rpb24gcmVxdWlyZWRcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBObyBvdmVycmlkZSBwb3NzaWJsZSBmb3IgcmVuYW1pbmcuXG4gICAgICAgICAgICB0aHJvdyBuZXcgTWVyZ2VDb25mbGljdEV4Y2VwdGlvbihwYXRoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZW5hbWUocGF0aCwgdG8pO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSAnZCc6IHtcbiAgICAgICAgICBjb25zdCB7IHBhdGggfSA9IGFjdGlvbjtcbiAgICAgICAgICBpZiAodGhpcy5fd2lsbERlbGV0ZShwYXRoKSkge1xuICAgICAgICAgICAgLy8gVE9ETzogVGhpcyBzaG91bGQgdGVjaG5pY2FsbHkgY2hlY2sgdGhlIGNvbnRlbnQgKGUuZy4sIGhhc2ggb24gZGVsZXRlKVxuICAgICAgICAgICAgLy8gSWRlbnRpY2FsIG91dGNvbWU7IG5vIGFjdGlvbiByZXF1aXJlZFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghdGhpcy5leGlzdHMocGF0aCkgJiYgIWRlbGV0ZUNvbmZsaWN0QWxsb3dlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1lcmdlQ29uZmxpY3RFeGNlcHRpb24ocGF0aCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5fcmVjb3JkU3luYy5kZWxldGUocGF0aCk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGdldCByb290KCk6IERpckVudHJ5IHtcbiAgICByZXR1cm4gdGhpcy5nZXREaXIoJy8nKTtcbiAgfVxuXG4gIC8vIFJlYWRvbmx5LlxuICByZWFkKHBhdGg6IHN0cmluZyk6IEJ1ZmZlciB8IG51bGwge1xuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5nZXQocGF0aCk7XG5cbiAgICByZXR1cm4gZW50cnkgPyBlbnRyeS5jb250ZW50IDogbnVsbDtcbiAgfVxuICBleGlzdHMocGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3JlY29yZFN5bmMuaXNGaWxlKHRoaXMuX25vcm1hbGl6ZVBhdGgocGF0aCkpO1xuICB9XG5cbiAgZ2V0KHBhdGg6IHN0cmluZyk6IEZpbGVFbnRyeSB8IG51bGwge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpO1xuICAgIGlmICh0aGlzLl9yZWNvcmRTeW5jLmlzRGlyZWN0b3J5KHApKSB7XG4gICAgICB0aHJvdyBuZXcgUGF0aElzRGlyZWN0b3J5RXhjZXB0aW9uKHApO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX3JlY29yZFN5bmMuZXhpc3RzKHApKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IExhenlGaWxlRW50cnkocCwgKCkgPT4gQnVmZmVyLmZyb20odGhpcy5fcmVjb3JkU3luYy5yZWFkKHApKSk7XG4gIH1cblxuICBnZXREaXIocGF0aDogc3RyaW5nKTogRGlyRW50cnkge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpO1xuICAgIGlmICh0aGlzLl9yZWNvcmRTeW5jLmlzRmlsZShwKSkge1xuICAgICAgdGhyb3cgbmV3IFBhdGhJc0ZpbGVFeGNlcHRpb24ocCk7XG4gICAgfVxuXG4gICAgbGV0IG1heWJlQ2FjaGUgPSB0aGlzLl9kaXJDYWNoZS5nZXQocCk7XG4gICAgaWYgKCFtYXliZUNhY2hlKSB7XG4gICAgICBsZXQgcGFyZW50OiBQYXRoIHwgbnVsbCA9IGRpcm5hbWUocCk7XG4gICAgICBpZiAocCA9PT0gcGFyZW50KSB7XG4gICAgICAgIHBhcmVudCA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIG1heWJlQ2FjaGUgPSBuZXcgSG9zdERpckVudHJ5KHBhcmVudCAmJiB0aGlzLmdldERpcihwYXJlbnQpLCBwLCB0aGlzLl9yZWNvcmRTeW5jLCB0aGlzKTtcbiAgICAgIHRoaXMuX2RpckNhY2hlLnNldChwLCBtYXliZUNhY2hlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWF5YmVDYWNoZTtcbiAgfVxuICB2aXNpdCh2aXNpdG9yOiBGaWxlVmlzaXRvcik6IHZvaWQge1xuICAgIHRoaXMucm9vdC52aXNpdCgocGF0aCwgZW50cnkpID0+IHtcbiAgICAgIHZpc2l0b3IocGF0aCwgZW50cnkpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gQ2hhbmdlIGNvbnRlbnQgb2YgaG9zdCBmaWxlcy5cbiAgb3ZlcndyaXRlKHBhdGg6IHN0cmluZywgY29udGVudDogQnVmZmVyIHwgc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgcCA9IHRoaXMuX25vcm1hbGl6ZVBhdGgocGF0aCk7XG4gICAgaWYgKCF0aGlzLl9yZWNvcmRTeW5jLmV4aXN0cyhwKSkge1xuICAgICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocCk7XG4gICAgfVxuICAgIGNvbnN0IGMgPSB0eXBlb2YgY29udGVudCA9PSAnc3RyaW5nJyA/IEJ1ZmZlci5mcm9tKGNvbnRlbnQpIDogY29udGVudDtcbiAgICB0aGlzLl9yZWNvcmQub3ZlcndyaXRlKHAsIGMgYXMge30gYXMgdmlydHVhbEZzLkZpbGVCdWZmZXIpLnN1YnNjcmliZSgpO1xuICB9XG4gIGJlZ2luVXBkYXRlKHBhdGg6IHN0cmluZyk6IFVwZGF0ZVJlY29yZGVyIHtcbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZ2V0KHBhdGgpO1xuICAgIGlmICghZW50cnkpIHtcbiAgICAgIHRocm93IG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKHBhdGgpO1xuICAgIH1cblxuICAgIHJldHVybiBVcGRhdGVSZWNvcmRlckJhc2UuY3JlYXRlRnJvbUZpbGVFbnRyeShlbnRyeSk7XG4gIH1cbiAgY29tbWl0VXBkYXRlKHJlY29yZDogVXBkYXRlUmVjb3JkZXIpOiB2b2lkIHtcbiAgICBpZiAocmVjb3JkIGluc3RhbmNlb2YgVXBkYXRlUmVjb3JkZXJCYXNlKSB7XG4gICAgICBjb25zdCBwYXRoID0gcmVjb3JkLnBhdGg7XG4gICAgICBjb25zdCBlbnRyeSA9IHRoaXMuZ2V0KHBhdGgpO1xuICAgICAgaWYgKCFlbnRyeSkge1xuICAgICAgICB0aHJvdyBuZXcgQ29udGVudEhhc011dGF0ZWRFeGNlcHRpb24ocGF0aCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBuZXdDb250ZW50ID0gcmVjb3JkLmFwcGx5KGVudHJ5LmNvbnRlbnQpO1xuICAgICAgICB0aGlzLm92ZXJ3cml0ZShwYXRoLCBuZXdDb250ZW50KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRVcGRhdGVSZWNvcmRFeGNlcHRpb24oKTtcbiAgICB9XG4gIH1cblxuICAvLyBTdHJ1Y3R1cmFsIG1ldGhvZHMuXG4gIGNyZWF0ZShwYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IEJ1ZmZlciB8IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpO1xuICAgIGlmICh0aGlzLl9yZWNvcmRTeW5jLmV4aXN0cyhwKSkge1xuICAgICAgdGhyb3cgbmV3IEZpbGVBbHJlYWR5RXhpc3RFeGNlcHRpb24ocCk7XG4gICAgfVxuICAgIGNvbnN0IGMgPSB0eXBlb2YgY29udGVudCA9PSAnc3RyaW5nJyA/IEJ1ZmZlci5mcm9tKGNvbnRlbnQpIDogY29udGVudDtcbiAgICB0aGlzLl9yZWNvcmQuY3JlYXRlKHAsIGMgYXMge30gYXMgdmlydHVhbEZzLkZpbGVCdWZmZXIpLnN1YnNjcmliZSgpO1xuICB9XG4gIGRlbGV0ZShwYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLl9yZWNvcmRTeW5jLmRlbGV0ZSh0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpKTtcbiAgfVxuICByZW5hbWUoZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5fcmVjb3JkU3luYy5yZW5hbWUodGhpcy5fbm9ybWFsaXplUGF0aChmcm9tKSwgdGhpcy5fbm9ybWFsaXplUGF0aCh0bykpO1xuICB9XG5cbiAgYXBwbHkoYWN0aW9uOiBBY3Rpb24sIHN0cmF0ZWd5PzogTWVyZ2VTdHJhdGVneSk6IHZvaWQge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdBcHBseSBub3QgaW1wbGVtZW50ZWQgb24gaG9zdCB0cmVlcy4nKTtcbiAgfVxuICBnZXQgYWN0aW9ucygpOiBBY3Rpb25bXSB7XG4gICAgLy8gQ3JlYXRlIGEgbGlzdCBvZiBhbGwgcmVjb3JkcyB1bnRpbCB3ZSBoaXQgb3VyIG9yaWdpbmFsIGJhY2tlbmQuIFRoaXMgaXMgdG8gc3VwcG9ydCBicmFuY2hlc1xuICAgIC8vIHRoYXQgZGl2ZXJnZSBmcm9tIGVhY2ggb3RoZXJzLlxuICAgIGNvbnN0IGFsbFJlY29yZHMgPSBbLi4udGhpcy5fcmVjb3JkLnJlY29yZHMoKV07XG5cbiAgICByZXR1cm4gY2xlYW4oXG4gICAgICBhbGxSZWNvcmRzXG4gICAgICAgIC5tYXAocmVjb3JkID0+IHtcbiAgICAgICAgICBzd2l0Y2ggKHJlY29yZC5raW5kKSB7XG4gICAgICAgICAgICBjYXNlICdjcmVhdGUnOlxuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGlkOiB0aGlzLl9pZCxcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IDAsXG4gICAgICAgICAgICAgICAga2luZDogJ2MnLFxuICAgICAgICAgICAgICAgIHBhdGg6IHJlY29yZC5wYXRoLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEJ1ZmZlci5mcm9tKHJlY29yZC5jb250ZW50KSxcbiAgICAgICAgICAgICAgfSBhcyBDcmVhdGVGaWxlQWN0aW9uO1xuICAgICAgICAgICAgY2FzZSAnb3ZlcndyaXRlJzpcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpZDogdGhpcy5faWQsXG4gICAgICAgICAgICAgICAgcGFyZW50OiAwLFxuICAgICAgICAgICAgICAgIGtpbmQ6ICdvJyxcbiAgICAgICAgICAgICAgICBwYXRoOiByZWNvcmQucGF0aCxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBCdWZmZXIuZnJvbShyZWNvcmQuY29udGVudCksXG4gICAgICAgICAgICAgIH0gYXMgT3ZlcndyaXRlRmlsZUFjdGlvbjtcbiAgICAgICAgICAgIGNhc2UgJ3JlbmFtZSc6XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaWQ6IHRoaXMuX2lkLFxuICAgICAgICAgICAgICAgIHBhcmVudDogMCxcbiAgICAgICAgICAgICAgICBraW5kOiAncicsXG4gICAgICAgICAgICAgICAgcGF0aDogcmVjb3JkLmZyb20sXG4gICAgICAgICAgICAgICAgdG86IHJlY29yZC50byxcbiAgICAgICAgICAgICAgfSBhcyBSZW5hbWVGaWxlQWN0aW9uO1xuICAgICAgICAgICAgY2FzZSAnZGVsZXRlJzpcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpZDogdGhpcy5faWQsXG4gICAgICAgICAgICAgICAgcGFyZW50OiAwLFxuICAgICAgICAgICAgICAgIGtpbmQ6ICdkJyxcbiAgICAgICAgICAgICAgICBwYXRoOiByZWNvcmQucGF0aCxcbiAgICAgICAgICAgICAgfSBhcyBEZWxldGVGaWxlQWN0aW9uO1xuXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBIb3N0Q3JlYXRlVHJlZSBleHRlbmRzIEhvc3RUcmVlIHtcbiAgY29uc3RydWN0b3IoaG9zdDogdmlydHVhbEZzLlJlYWRvbmx5SG9zdCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICBjb25zdCB0ZW1wSG9zdCA9IG5ldyBIb3N0VHJlZShob3N0KTtcbiAgICB0ZW1wSG9zdC52aXNpdChwYXRoID0+IHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSB0ZW1wSG9zdC5yZWFkKHBhdGgpO1xuICAgICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgdGhpcy5jcmVhdGUocGF0aCwgY29udGVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZpbHRlckhvc3RUcmVlIGV4dGVuZHMgSG9zdFRyZWUge1xuICBjb25zdHJ1Y3Rvcih0cmVlOiBIb3N0VHJlZSwgZmlsdGVyOiBGaWxlUHJlZGljYXRlPGJvb2xlYW4+ID0gKCkgPT4gdHJ1ZSkge1xuICAgIGNvbnN0IG5ld0JhY2tlbmQgPSBuZXcgdmlydHVhbEZzLlNpbXBsZU1lbW9yeUhvc3QoKTtcbiAgICAvLyBjYXN0IHRvIGFsbG93IGFjY2Vzc1xuICAgIGNvbnN0IG9yaWdpbmFsQmFja2VuZCA9ICh0cmVlIGFzIEZpbHRlckhvc3RUcmVlKS5fYmFja2VuZDtcblxuICAgIGNvbnN0IHJlY3Vyc2U6IChiYXNlOiBQYXRoKSA9PiBPYnNlcnZhYmxlPHZvaWQ+ID0gYmFzZSA9PiB7XG4gICAgICByZXR1cm4gb3JpZ2luYWxCYWNrZW5kLmxpc3QoYmFzZSlcbiAgICAgICAgLnBpcGUoXG4gICAgICAgICAgbWVyZ2VNYXAoeCA9PiB4KSxcbiAgICAgICAgICBtYXAocGF0aCA9PiBqb2luKGJhc2UsIHBhdGgpKSxcbiAgICAgICAgICBjb25jYXRNYXAocGF0aCA9PiB7XG4gICAgICAgICAgICBsZXQgaXNEaXJlY3RvcnkgPSBmYWxzZTtcbiAgICAgICAgICAgIG9yaWdpbmFsQmFja2VuZC5pc0RpcmVjdG9yeShwYXRoKS5zdWJzY3JpYmUodmFsID0+IGlzRGlyZWN0b3J5ID0gdmFsKTtcbiAgICAgICAgICAgIGlmIChpc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICByZXR1cm4gcmVjdXJzZShwYXRoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGlzRmlsZSA9IGZhbHNlO1xuICAgICAgICAgICAgb3JpZ2luYWxCYWNrZW5kLmlzRmlsZShwYXRoKS5zdWJzY3JpYmUodmFsID0+IGlzRmlsZSA9IHZhbCk7XG4gICAgICAgICAgICBpZiAoIWlzRmlsZSB8fCAhZmlsdGVyKHBhdGgpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBFTVBUWTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGNvbnRlbnQ6IEFycmF5QnVmZmVyIHwgbnVsbCA9IG51bGw7XG4gICAgICAgICAgICBvcmlnaW5hbEJhY2tlbmQucmVhZChwYXRoKS5zdWJzY3JpYmUodmFsID0+IGNvbnRlbnQgPSB2YWwpO1xuICAgICAgICAgICAgaWYgKCFjb250ZW50KSB7XG4gICAgICAgICAgICAgIHJldHVybiBFTVBUWTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG5ld0JhY2tlbmQud3JpdGUocGF0aCwgY29udGVudCBhcyB7fSBhcyB2aXJ0dWFsRnMuRmlsZUJ1ZmZlcik7XG4gICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgfTtcblxuICAgIHJlY3Vyc2Uobm9ybWFsaXplKCcvJykpLnN1YnNjcmliZSgpO1xuXG4gICAgc3VwZXIobmV3QmFja2VuZCk7XG5cbiAgICBmb3IgKGNvbnN0IGFjdGlvbiBvZiB0cmVlLmFjdGlvbnMpIHtcbiAgICAgIGlmICghZmlsdGVyKGFjdGlvbi5wYXRoKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoIChhY3Rpb24ua2luZCkge1xuICAgICAgICBjYXNlICdjJzpcbiAgICAgICAgICB0aGlzLmNyZWF0ZShhY3Rpb24ucGF0aCwgYWN0aW9uLmNvbnRlbnQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdkJzpcbiAgICAgICAgICB0aGlzLmRlbGV0ZShhY3Rpb24ucGF0aCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ28nOlxuICAgICAgICAgIHRoaXMub3ZlcndyaXRlKGFjdGlvbi5wYXRoLCBhY3Rpb24uY29udGVudCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3InOlxuICAgICAgICAgIHRoaXMucmVuYW1lKGFjdGlvbi5wYXRoLCBhY3Rpb24udG8pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19