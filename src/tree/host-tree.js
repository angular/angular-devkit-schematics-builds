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
        function _recurse(entry) {
            entry.subfiles.forEach(path => {
                visitor(core_1.join(entry.path, path), entry.file(path));
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
        const allFiles = [];
        this.root.visit((path, entry) => {
            allFiles.push([path, entry]);
        });
        allFiles.forEach(([path, entry]) => visitor(path, entry));
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
                    return rxjs_1.of();
                }
                let content = null;
                originalBackend.read(path).subscribe(val => content = val);
                if (!content) {
                    return rxjs_1.of();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdC10cmVlLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy90cmVlL2hvc3QtdHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQVU4QjtBQUM5QiwrQkFBc0M7QUFDdEMsOENBQTBEO0FBQzFELHNEQU9nQztBQVFoQyxtQ0FBd0M7QUFDeEMsMkNBVXFCO0FBQ3JCLHlDQUFnRDtBQUdoRCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFHbEI7SUFDRSxZQUNXLE1BQXVCLEVBQ3ZCLElBQVUsRUFDVCxLQUFpQyxFQUNqQyxLQUFXO1FBSFosV0FBTSxHQUFOLE1BQU0sQ0FBaUI7UUFDdkIsU0FBSSxHQUFKLElBQUksQ0FBTTtRQUNULFVBQUssR0FBTCxLQUFLLENBQTRCO1FBQ2pDLFVBQUssR0FBTCxLQUFLLENBQU07SUFDcEIsQ0FBQztJQUVKLElBQUksT0FBTztRQUNULE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQzlCLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFdBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBQ0QsSUFBSSxRQUFRO1FBQ1YsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDOUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFFRCxHQUFHLENBQUMsSUFBa0I7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LENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekIsUUFBUSxDQUFDO1lBQ1gsQ0FBQztZQUVELE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixLQUFLLEdBQUc7b0JBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDekMsS0FBSyxDQUFDO2dCQUNSLEtBQUssR0FBRztvQkFDTixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDekIsS0FBSyxDQUFDO2dCQUNSLEtBQUssR0FBRztvQkFDTixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUM1QyxLQUFLLENBQUM7Z0JBQ1IsS0FBSyxHQUFHO29CQUNOLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3BDLEtBQUssQ0FBQztZQUNWLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBNURELHdDQTREQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7XG4gIFBhdGgsXG4gIFBhdGhGcmFnbWVudCxcbiAgUGF0aElzRGlyZWN0b3J5RXhjZXB0aW9uLFxuICBQYXRoSXNGaWxlRXhjZXB0aW9uLFxuICBjbGVhbixcbiAgZGlybmFtZSxcbiAgam9pbixcbiAgbm9ybWFsaXplLFxuICB2aXJ0dWFsRnMsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIG9mIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjb25jYXRNYXAsIG1hcCwgbWVyZ2VNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1xuICBDb250ZW50SGFzTXV0YXRlZEV4Y2VwdGlvbixcbiAgRmlsZUFscmVhZHlFeGlzdEV4Y2VwdGlvbixcbiAgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbixcbiAgSW52YWxpZFVwZGF0ZVJlY29yZEV4Y2VwdGlvbixcbiAgTWVyZ2VDb25mbGljdEV4Y2VwdGlvbixcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbn0gZnJvbSAnLi4vZXhjZXB0aW9uL2V4Y2VwdGlvbic7XG5pbXBvcnQge1xuICBBY3Rpb24sXG4gIENyZWF0ZUZpbGVBY3Rpb24sXG4gIERlbGV0ZUZpbGVBY3Rpb24sXG4gIE92ZXJ3cml0ZUZpbGVBY3Rpb24sXG4gIFJlbmFtZUZpbGVBY3Rpb24sXG59IGZyb20gJy4vYWN0aW9uJztcbmltcG9ydCB7IExhenlGaWxlRW50cnkgfSBmcm9tICcuL2VudHJ5JztcbmltcG9ydCB7XG4gIERpckVudHJ5LFxuICBGaWxlRW50cnksXG4gIEZpbGVQcmVkaWNhdGUsXG4gIEZpbGVWaXNpdG9yLFxuICBGaWxlVmlzaXRvckNhbmNlbFRva2VuLFxuICBNZXJnZVN0cmF0ZWd5LFxuICBUcmVlLFxuICBUcmVlU3ltYm9sLFxuICBVcGRhdGVSZWNvcmRlcixcbn0gZnJvbSAnLi9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgVXBkYXRlUmVjb3JkZXJCYXNlIH0gZnJvbSAnLi9yZWNvcmRlcic7XG5cblxubGV0IF91bmlxdWVJZCA9IDA7XG5cblxuZXhwb3J0IGNsYXNzIEhvc3REaXJFbnRyeSBpbXBsZW1lbnRzIERpckVudHJ5IHtcbiAgY29uc3RydWN0b3IoXG4gICAgcmVhZG9ubHkgcGFyZW50OiBEaXJFbnRyeSB8IG51bGwsXG4gICAgcmVhZG9ubHkgcGF0aDogUGF0aCxcbiAgICBwcm90ZWN0ZWQgX2hvc3Q6IHZpcnR1YWxGcy5TeW5jRGVsZWdhdGVIb3N0LFxuICAgIHByb3RlY3RlZCBfdHJlZTogVHJlZSxcbiAgKSB7fVxuXG4gIGdldCBzdWJkaXJzKCk6IFBhdGhGcmFnbWVudFtdIHtcbiAgICByZXR1cm4gdGhpcy5faG9zdC5saXN0KHRoaXMucGF0aClcbiAgICAgIC5maWx0ZXIoZnJhZ21lbnQgPT4gdGhpcy5faG9zdC5pc0RpcmVjdG9yeShqb2luKHRoaXMucGF0aCwgZnJhZ21lbnQpKSk7XG4gIH1cbiAgZ2V0IHN1YmZpbGVzKCk6IFBhdGhGcmFnbWVudFtdIHtcbiAgICByZXR1cm4gdGhpcy5faG9zdC5saXN0KHRoaXMucGF0aClcbiAgICAgIC5maWx0ZXIoZnJhZ21lbnQgPT4gdGhpcy5faG9zdC5pc0ZpbGUoam9pbih0aGlzLnBhdGgsIGZyYWdtZW50KSkpO1xuICB9XG5cbiAgZGlyKG5hbWU6IFBhdGhGcmFnbWVudCk6IERpckVudHJ5IHtcbiAgICByZXR1cm4gdGhpcy5fdHJlZS5nZXREaXIoam9pbih0aGlzLnBhdGgsIG5hbWUpKTtcbiAgfVxuICBmaWxlKG5hbWU6IFBhdGhGcmFnbWVudCk6IEZpbGVFbnRyeSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl90cmVlLmdldChqb2luKHRoaXMucGF0aCwgbmFtZSkpO1xuICB9XG5cbiAgdmlzaXQodmlzaXRvcjogRmlsZVZpc2l0b3IpOiB2b2lkIHtcbiAgICBmdW5jdGlvbiBfcmVjdXJzZShlbnRyeTogRGlyRW50cnkpIHtcbiAgICAgIGVudHJ5LnN1YmZpbGVzLmZvckVhY2gocGF0aCA9PiB7XG4gICAgICAgIHZpc2l0b3Ioam9pbihlbnRyeS5wYXRoLCBwYXRoKSwgZW50cnkuZmlsZShwYXRoKSk7XG4gICAgICB9KTtcbiAgICAgIGVudHJ5LnN1YmRpcnMuZm9yRWFjaChwYXRoID0+IHtcbiAgICAgICAgX3JlY3Vyc2UoZW50cnkuZGlyKHBhdGgpKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBfcmVjdXJzZSh0aGlzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSAhPT0gRmlsZVZpc2l0b3JDYW5jZWxUb2tlbikge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBIb3N0VHJlZSBpbXBsZW1lbnRzIFRyZWUge1xuICBwcml2YXRlIHJlYWRvbmx5IF9pZCA9IC0tX3VuaXF1ZUlkO1xuICBwcml2YXRlIF9yZWNvcmQ6IHZpcnR1YWxGcy5Db3JkSG9zdDtcbiAgcHJpdmF0ZSBfcmVjb3JkU3luYzogdmlydHVhbEZzLlN5bmNEZWxlZ2F0ZUhvc3Q7XG4gIHByaXZhdGUgX2FuY2VzdHJ5ID0gbmV3IFNldDxudW1iZXI+KCk7XG5cbiAgcHJpdmF0ZSBfZGlyQ2FjaGUgPSBuZXcgTWFwPFBhdGgsIEhvc3REaXJFbnRyeT4oKTtcblxuXG4gIFtUcmVlU3ltYm9sXSgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBfYmFja2VuZDogdmlydHVhbEZzLlJlYWRvbmx5SG9zdDx7fT4gPSBuZXcgdmlydHVhbEZzLkVtcHR5KCkpIHtcbiAgICB0aGlzLl9yZWNvcmQgPSBuZXcgdmlydHVhbEZzLkNvcmRIb3N0KG5ldyB2aXJ0dWFsRnMuU2FmZVJlYWRvbmx5SG9zdChfYmFja2VuZCkpO1xuICAgIHRoaXMuX3JlY29yZFN5bmMgPSBuZXcgdmlydHVhbEZzLlN5bmNEZWxlZ2F0ZUhvc3QodGhpcy5fcmVjb3JkKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfbm9ybWFsaXplUGF0aChwYXRoOiBzdHJpbmcpOiBQYXRoIHtcbiAgICByZXR1cm4gbm9ybWFsaXplKCcvJyArIHBhdGgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF93aWxsQ3JlYXRlKHBhdGg6IFBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVjb3JkLndpbGxDcmVhdGUocGF0aCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3dpbGxPdmVyd3JpdGUocGF0aDogUGF0aCkge1xuICAgIHJldHVybiB0aGlzLl9yZWNvcmQud2lsbE92ZXJ3cml0ZShwYXRoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfd2lsbERlbGV0ZShwYXRoOiBQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlY29yZC53aWxsRGVsZXRlKHBhdGgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF93aWxsUmVuYW1lKHBhdGg6IFBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVjb3JkLndpbGxSZW5hbWUocGF0aCk7XG4gIH1cblxuICBicmFuY2goKTogVHJlZSB7XG4gICAgY29uc3QgYnJhbmNoZWRUcmVlID0gbmV3IEhvc3RUcmVlKHRoaXMuX2JhY2tlbmQpO1xuICAgIGJyYW5jaGVkVHJlZS5fcmVjb3JkID0gdGhpcy5fcmVjb3JkLmNsb25lKCk7XG4gICAgYnJhbmNoZWRUcmVlLl9yZWNvcmRTeW5jID0gbmV3IHZpcnR1YWxGcy5TeW5jRGVsZWdhdGVIb3N0KGJyYW5jaGVkVHJlZS5fcmVjb3JkKTtcbiAgICBicmFuY2hlZFRyZWUuX2FuY2VzdHJ5ID0gbmV3IFNldCh0aGlzLl9hbmNlc3RyeSkuYWRkKHRoaXMuX2lkKTtcblxuICAgIHJldHVybiBicmFuY2hlZFRyZWU7XG4gIH1cblxuICBtZXJnZShvdGhlcjogVHJlZSwgc3RyYXRlZ3k6IE1lcmdlU3RyYXRlZ3kgPSBNZXJnZVN0cmF0ZWd5LkRlZmF1bHQpOiB2b2lkIHtcbiAgICBpZiAob3RoZXIgPT09IHRoaXMpIHtcbiAgICAgIC8vIE1lcmdpbmcgd2l0aCB5b3Vyc2VsZj8gVHNrIHRzay4gTm90aGluZyB0byBkbyBhdCBsZWFzdC5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAob3RoZXIgaW5zdGFuY2VvZiBIb3N0VHJlZSAmJiBvdGhlci5fYW5jZXN0cnkuaGFzKHRoaXMuX2lkKSkge1xuICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgbWVyZ2luZyBhIGJyYW5jaCBiYWNrIGludG8gb25lIG9mIGl0cyBhbmNlc3RvcnNcbiAgICAgIC8vIE1vcmUgY29tcGxldGUgYnJhbmNoIHBvaW50IHRyYWNraW5nIGlzIHJlcXVpcmVkIHRvIGF2b2lkXG4gICAgICBzdHJhdGVneSB8PSBNZXJnZVN0cmF0ZWd5Lk92ZXJ3cml0ZTtcbiAgICB9XG5cbiAgICBjb25zdCBjcmVhdGlvbkNvbmZsaWN0QWxsb3dlZCA9XG4gICAgICAoc3RyYXRlZ3kgJiBNZXJnZVN0cmF0ZWd5LkFsbG93Q3JlYXRpb25Db25mbGljdCkgPT0gTWVyZ2VTdHJhdGVneS5BbGxvd0NyZWF0aW9uQ29uZmxpY3Q7XG4gICAgY29uc3Qgb3ZlcndyaXRlQ29uZmxpY3RBbGxvd2VkID1cbiAgICAgIChzdHJhdGVneSAmIE1lcmdlU3RyYXRlZ3kuQWxsb3dPdmVyd3JpdGVDb25mbGljdCkgPT0gTWVyZ2VTdHJhdGVneS5BbGxvd092ZXJ3cml0ZUNvbmZsaWN0O1xuICAgIGNvbnN0IGRlbGV0ZUNvbmZsaWN0QWxsb3dlZCA9XG4gICAgICAoc3RyYXRlZ3kgJiBNZXJnZVN0cmF0ZWd5LkFsbG93T3ZlcndyaXRlQ29uZmxpY3QpID09IE1lcmdlU3RyYXRlZ3kuQWxsb3dEZWxldGVDb25mbGljdDtcblxuICAgIG90aGVyLmFjdGlvbnMuZm9yRWFjaChhY3Rpb24gPT4ge1xuICAgICAgc3dpdGNoIChhY3Rpb24ua2luZCkge1xuICAgICAgICBjYXNlICdjJzoge1xuICAgICAgICAgIGNvbnN0IHsgcGF0aCwgY29udGVudCB9ID0gYWN0aW9uO1xuXG4gICAgICAgICAgaWYgKCh0aGlzLl93aWxsQ3JlYXRlKHBhdGgpIHx8IHRoaXMuX3dpbGxPdmVyd3JpdGUocGF0aCkpKSB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ0NvbnRlbnQgPSB0aGlzLnJlYWQocGF0aCk7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdDb250ZW50ICYmIGNvbnRlbnQuZXF1YWxzKGV4aXN0aW5nQ29udGVudCkpIHtcbiAgICAgICAgICAgICAgLy8gSWRlbnRpY2FsIG91dGNvbWU7IG5vIGFjdGlvbiByZXF1aXJlZFxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghY3JlYXRpb25Db25mbGljdEFsbG93ZWQpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IE1lcmdlQ29uZmxpY3RFeGNlcHRpb24ocGF0aCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX3JlY29yZC5vdmVyd3JpdGUocGF0aCwgY29udGVudCBhcyB7fSBhcyB2aXJ0dWFsRnMuRmlsZUJ1ZmZlcikuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlY29yZC5jcmVhdGUocGF0aCwgY29udGVudCBhcyB7fSBhcyB2aXJ0dWFsRnMuRmlsZUJ1ZmZlcikuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSAnbyc6IHtcbiAgICAgICAgICBjb25zdCB7IHBhdGgsIGNvbnRlbnQgfSA9IGFjdGlvbjtcbiAgICAgICAgICBpZiAodGhpcy5fd2lsbERlbGV0ZShwYXRoKSAmJiAhb3ZlcndyaXRlQ29uZmxpY3RBbGxvd2VkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWVyZ2VDb25mbGljdEV4Y2VwdGlvbihwYXRoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBJZ25vcmUgaWYgY29udGVudCBpcyB0aGUgc2FtZSAoY29uc2lkZXJlZCB0aGUgc2FtZSBjaGFuZ2UpLlxuICAgICAgICAgIGlmICh0aGlzLl93aWxsT3ZlcndyaXRlKHBhdGgpKSB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ0NvbnRlbnQgPSB0aGlzLnJlYWQocGF0aCk7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdDb250ZW50ICYmIGNvbnRlbnQuZXF1YWxzKGV4aXN0aW5nQ29udGVudCkpIHtcbiAgICAgICAgICAgICAgLy8gSWRlbnRpY2FsIG91dGNvbWU7IG5vIGFjdGlvbiByZXF1aXJlZFxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghb3ZlcndyaXRlQ29uZmxpY3RBbGxvd2VkKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uKHBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBXZSB1c2Ugd3JpdGUgaGVyZSBhcyBtZXJnZSB2YWxpZGF0aW9uIGhhcyBhbHJlYWR5IGJlZW4gZG9uZSwgYW5kIHdlIHdhbnQgdG8gbGV0XG4gICAgICAgICAgLy8gdGhlIENvcmRIb3N0IGRvIGl0cyBqb2IuXG4gICAgICAgICAgdGhpcy5fcmVjb3JkLndyaXRlKHBhdGgsIGNvbnRlbnQgYXMge30gYXMgdmlydHVhbEZzLkZpbGVCdWZmZXIpLnN1YnNjcmliZSgpO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSAncic6IHtcbiAgICAgICAgICBjb25zdCB7IHBhdGgsIHRvIH0gPSBhY3Rpb247XG4gICAgICAgICAgaWYgKHRoaXMuX3dpbGxEZWxldGUocGF0aCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uKHBhdGgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLl93aWxsUmVuYW1lKHBhdGgpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fcmVjb3JkLndpbGxSZW5hbWVUbyhwYXRoLCB0bykpIHtcbiAgICAgICAgICAgICAgLy8gSWRlbnRpY2FsIG91dGNvbWU7IG5vIGFjdGlvbiByZXF1aXJlZFxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE5vIG92ZXJyaWRlIHBvc3NpYmxlIGZvciByZW5hbWluZy5cbiAgICAgICAgICAgIHRocm93IG5ldyBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uKHBhdGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlbmFtZShwYXRoLCB0byk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjYXNlICdkJzoge1xuICAgICAgICAgIGNvbnN0IHsgcGF0aCB9ID0gYWN0aW9uO1xuICAgICAgICAgIGlmICh0aGlzLl93aWxsRGVsZXRlKHBhdGgpKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBUaGlzIHNob3VsZCB0ZWNobmljYWxseSBjaGVjayB0aGUgY29udGVudCAoZS5nLiwgaGFzaCBvbiBkZWxldGUpXG4gICAgICAgICAgICAvLyBJZGVudGljYWwgb3V0Y29tZTsgbm8gYWN0aW9uIHJlcXVpcmVkXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCF0aGlzLmV4aXN0cyhwYXRoKSAmJiAhZGVsZXRlQ29uZmxpY3RBbGxvd2VkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWVyZ2VDb25mbGljdEV4Y2VwdGlvbihwYXRoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLl9yZWNvcmRTeW5jLmRlbGV0ZShwYXRoKTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0IHJvb3QoKTogRGlyRW50cnkge1xuICAgIHJldHVybiB0aGlzLmdldERpcignLycpO1xuICB9XG5cbiAgLy8gUmVhZG9ubHkuXG4gIHJlYWQocGF0aDogc3RyaW5nKTogQnVmZmVyIHwgbnVsbCB7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmdldChwYXRoKTtcblxuICAgIHJldHVybiBlbnRyeSA/IGVudHJ5LmNvbnRlbnQgOiBudWxsO1xuICB9XG4gIGV4aXN0cyhwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fcmVjb3JkU3luYy5pc0ZpbGUodGhpcy5fbm9ybWFsaXplUGF0aChwYXRoKSk7XG4gIH1cblxuICBnZXQocGF0aDogc3RyaW5nKTogRmlsZUVudHJ5IHwgbnVsbCB7XG4gICAgY29uc3QgcCA9IHRoaXMuX25vcm1hbGl6ZVBhdGgocGF0aCk7XG4gICAgaWYgKHRoaXMuX3JlY29yZFN5bmMuaXNEaXJlY3RvcnkocCkpIHtcbiAgICAgIHRocm93IG5ldyBQYXRoSXNEaXJlY3RvcnlFeGNlcHRpb24ocCk7XG4gICAgfVxuICAgIGlmICghdGhpcy5fcmVjb3JkU3luYy5leGlzdHMocCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgTGF6eUZpbGVFbnRyeShwLCAoKSA9PiBCdWZmZXIuZnJvbSh0aGlzLl9yZWNvcmRTeW5jLnJlYWQocCkpKTtcbiAgfVxuXG4gIGdldERpcihwYXRoOiBzdHJpbmcpOiBEaXJFbnRyeSB7XG4gICAgY29uc3QgcCA9IHRoaXMuX25vcm1hbGl6ZVBhdGgocGF0aCk7XG4gICAgaWYgKHRoaXMuX3JlY29yZFN5bmMuaXNGaWxlKHApKSB7XG4gICAgICB0aHJvdyBuZXcgUGF0aElzRmlsZUV4Y2VwdGlvbihwKTtcbiAgICB9XG5cbiAgICBsZXQgbWF5YmVDYWNoZSA9IHRoaXMuX2RpckNhY2hlLmdldChwKTtcbiAgICBpZiAoIW1heWJlQ2FjaGUpIHtcbiAgICAgIGxldCBwYXJlbnQ6IFBhdGggfCBudWxsID0gZGlybmFtZShwKTtcbiAgICAgIGlmIChwID09PSBwYXJlbnQpIHtcbiAgICAgICAgcGFyZW50ID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgbWF5YmVDYWNoZSA9IG5ldyBIb3N0RGlyRW50cnkocGFyZW50ICYmIHRoaXMuZ2V0RGlyKHBhcmVudCksIHAsIHRoaXMuX3JlY29yZFN5bmMsIHRoaXMpO1xuICAgICAgdGhpcy5fZGlyQ2FjaGUuc2V0KHAsIG1heWJlQ2FjaGUpO1xuICAgIH1cblxuICAgIHJldHVybiBtYXliZUNhY2hlO1xuICB9XG4gIHZpc2l0KHZpc2l0b3I6IEZpbGVWaXNpdG9yKTogdm9pZCB7XG4gICAgY29uc3QgYWxsRmlsZXM6IFtQYXRoLCBGaWxlRW50cnkgfCBudWxsIHwgdW5kZWZpbmVkXVtdID0gW107XG4gICAgdGhpcy5yb290LnZpc2l0KChwYXRoLCBlbnRyeSkgPT4ge1xuICAgICAgYWxsRmlsZXMucHVzaChbcGF0aCwgZW50cnldKTtcbiAgICB9KTtcblxuICAgIGFsbEZpbGVzLmZvckVhY2goKFtwYXRoLCBlbnRyeV0pID0+IHZpc2l0b3IocGF0aCwgZW50cnkpKTtcbiAgfVxuXG4gIC8vIENoYW5nZSBjb250ZW50IG9mIGhvc3QgZmlsZXMuXG4gIG92ZXJ3cml0ZShwYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IEJ1ZmZlciB8IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpO1xuICAgIGlmICghdGhpcy5fcmVjb3JkU3luYy5leGlzdHMocCkpIHtcbiAgICAgIHRocm93IG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKHApO1xuICAgIH1cbiAgICBjb25zdCBjID0gdHlwZW9mIGNvbnRlbnQgPT0gJ3N0cmluZycgPyBCdWZmZXIuZnJvbShjb250ZW50KSA6IGNvbnRlbnQ7XG4gICAgdGhpcy5fcmVjb3JkLm92ZXJ3cml0ZShwLCBjIGFzIHt9IGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKS5zdWJzY3JpYmUoKTtcbiAgfVxuICBiZWdpblVwZGF0ZShwYXRoOiBzdHJpbmcpOiBVcGRhdGVSZWNvcmRlciB7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmdldChwYXRoKTtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICB0aHJvdyBuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gVXBkYXRlUmVjb3JkZXJCYXNlLmNyZWF0ZUZyb21GaWxlRW50cnkoZW50cnkpO1xuICB9XG4gIGNvbW1pdFVwZGF0ZShyZWNvcmQ6IFVwZGF0ZVJlY29yZGVyKTogdm9pZCB7XG4gICAgaWYgKHJlY29yZCBpbnN0YW5jZW9mIFVwZGF0ZVJlY29yZGVyQmFzZSkge1xuICAgICAgY29uc3QgcGF0aCA9IHJlY29yZC5wYXRoO1xuICAgICAgY29uc3QgZW50cnkgPSB0aGlzLmdldChwYXRoKTtcbiAgICAgIGlmICghZW50cnkpIHtcbiAgICAgICAgdGhyb3cgbmV3IENvbnRlbnRIYXNNdXRhdGVkRXhjZXB0aW9uKHBhdGgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbmV3Q29udGVudCA9IHJlY29yZC5hcHBseShlbnRyeS5jb250ZW50KTtcbiAgICAgICAgdGhpcy5vdmVyd3JpdGUocGF0aCwgbmV3Q29udGVudCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkVXBkYXRlUmVjb3JkRXhjZXB0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gU3RydWN0dXJhbCBtZXRob2RzLlxuICBjcmVhdGUocGF0aDogc3RyaW5nLCBjb250ZW50OiBCdWZmZXIgfCBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBwID0gdGhpcy5fbm9ybWFsaXplUGF0aChwYXRoKTtcbiAgICBpZiAodGhpcy5fcmVjb3JkU3luYy5leGlzdHMocCkpIHtcbiAgICAgIHRocm93IG5ldyBGaWxlQWxyZWFkeUV4aXN0RXhjZXB0aW9uKHApO1xuICAgIH1cbiAgICBjb25zdCBjID0gdHlwZW9mIGNvbnRlbnQgPT0gJ3N0cmluZycgPyBCdWZmZXIuZnJvbShjb250ZW50KSA6IGNvbnRlbnQ7XG4gICAgdGhpcy5fcmVjb3JkLmNyZWF0ZShwLCBjIGFzIHt9IGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKS5zdWJzY3JpYmUoKTtcbiAgfVxuICBkZWxldGUocGF0aDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5fcmVjb3JkU3luYy5kZWxldGUodGhpcy5fbm9ybWFsaXplUGF0aChwYXRoKSk7XG4gIH1cbiAgcmVuYW1lKGZyb206IHN0cmluZywgdG86IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuX3JlY29yZFN5bmMucmVuYW1lKHRoaXMuX25vcm1hbGl6ZVBhdGgoZnJvbSksIHRoaXMuX25vcm1hbGl6ZVBhdGgodG8pKTtcbiAgfVxuXG4gIGFwcGx5KGFjdGlvbjogQWN0aW9uLCBzdHJhdGVneT86IE1lcmdlU3RyYXRlZ3kpOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignQXBwbHkgbm90IGltcGxlbWVudGVkIG9uIGhvc3QgdHJlZXMuJyk7XG4gIH1cbiAgZ2V0IGFjdGlvbnMoKTogQWN0aW9uW10ge1xuICAgIC8vIENyZWF0ZSBhIGxpc3Qgb2YgYWxsIHJlY29yZHMgdW50aWwgd2UgaGl0IG91ciBvcmlnaW5hbCBiYWNrZW5kLiBUaGlzIGlzIHRvIHN1cHBvcnQgYnJhbmNoZXNcbiAgICAvLyB0aGF0IGRpdmVyZ2UgZnJvbSBlYWNoIG90aGVycy5cbiAgICBjb25zdCBhbGxSZWNvcmRzID0gWy4uLnRoaXMuX3JlY29yZC5yZWNvcmRzKCldO1xuXG4gICAgcmV0dXJuIGNsZWFuKFxuICAgICAgYWxsUmVjb3Jkc1xuICAgICAgICAubWFwKHJlY29yZCA9PiB7XG4gICAgICAgICAgc3dpdGNoIChyZWNvcmQua2luZCkge1xuICAgICAgICAgICAgY2FzZSAnY3JlYXRlJzpcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpZDogdGhpcy5faWQsXG4gICAgICAgICAgICAgICAgcGFyZW50OiAwLFxuICAgICAgICAgICAgICAgIGtpbmQ6ICdjJyxcbiAgICAgICAgICAgICAgICBwYXRoOiByZWNvcmQucGF0aCxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBCdWZmZXIuZnJvbShyZWNvcmQuY29udGVudCksXG4gICAgICAgICAgICAgIH0gYXMgQ3JlYXRlRmlsZUFjdGlvbjtcbiAgICAgICAgICAgIGNhc2UgJ292ZXJ3cml0ZSc6XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaWQ6IHRoaXMuX2lkLFxuICAgICAgICAgICAgICAgIHBhcmVudDogMCxcbiAgICAgICAgICAgICAgICBraW5kOiAnbycsXG4gICAgICAgICAgICAgICAgcGF0aDogcmVjb3JkLnBhdGgsXG4gICAgICAgICAgICAgICAgY29udGVudDogQnVmZmVyLmZyb20ocmVjb3JkLmNvbnRlbnQpLFxuICAgICAgICAgICAgICB9IGFzIE92ZXJ3cml0ZUZpbGVBY3Rpb247XG4gICAgICAgICAgICBjYXNlICdyZW5hbWUnOlxuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGlkOiB0aGlzLl9pZCxcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IDAsXG4gICAgICAgICAgICAgICAga2luZDogJ3InLFxuICAgICAgICAgICAgICAgIHBhdGg6IHJlY29yZC5mcm9tLFxuICAgICAgICAgICAgICAgIHRvOiByZWNvcmQudG8sXG4gICAgICAgICAgICAgIH0gYXMgUmVuYW1lRmlsZUFjdGlvbjtcbiAgICAgICAgICAgIGNhc2UgJ2RlbGV0ZSc6XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaWQ6IHRoaXMuX2lkLFxuICAgICAgICAgICAgICAgIHBhcmVudDogMCxcbiAgICAgICAgICAgICAgICBraW5kOiAnZCcsXG4gICAgICAgICAgICAgICAgcGF0aDogcmVjb3JkLnBhdGgsXG4gICAgICAgICAgICAgIH0gYXMgRGVsZXRlRmlsZUFjdGlvbjtcblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfSksXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSG9zdENyZWF0ZVRyZWUgZXh0ZW5kcyBIb3N0VHJlZSB7XG4gIGNvbnN0cnVjdG9yKGhvc3Q6IHZpcnR1YWxGcy5SZWFkb25seUhvc3QpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgY29uc3QgdGVtcEhvc3QgPSBuZXcgSG9zdFRyZWUoaG9zdCk7XG4gICAgdGVtcEhvc3QudmlzaXQocGF0aCA9PiB7XG4gICAgICBjb25zdCBjb250ZW50ID0gdGVtcEhvc3QucmVhZChwYXRoKTtcbiAgICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgIHRoaXMuY3JlYXRlKHBhdGgsIGNvbnRlbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBGaWx0ZXJIb3N0VHJlZSBleHRlbmRzIEhvc3RUcmVlIHtcbiAgY29uc3RydWN0b3IodHJlZTogSG9zdFRyZWUsIGZpbHRlcjogRmlsZVByZWRpY2F0ZTxib29sZWFuPiA9ICgpID0+IHRydWUpIHtcbiAgICBjb25zdCBuZXdCYWNrZW5kID0gbmV3IHZpcnR1YWxGcy5TaW1wbGVNZW1vcnlIb3N0KCk7XG4gICAgLy8gY2FzdCB0byBhbGxvdyBhY2Nlc3NcbiAgICBjb25zdCBvcmlnaW5hbEJhY2tlbmQgPSAodHJlZSBhcyBGaWx0ZXJIb3N0VHJlZSkuX2JhY2tlbmQ7XG5cbiAgICBjb25zdCByZWN1cnNlOiAoYmFzZTogUGF0aCkgPT4gT2JzZXJ2YWJsZTx2b2lkPiA9IGJhc2UgPT4ge1xuICAgICAgcmV0dXJuIG9yaWdpbmFsQmFja2VuZC5saXN0KGJhc2UpXG4gICAgICAgIC5waXBlKFxuICAgICAgICAgIG1lcmdlTWFwKHggPT4geCksXG4gICAgICAgICAgbWFwKHBhdGggPT4gam9pbihiYXNlLCBwYXRoKSksXG4gICAgICAgICAgY29uY2F0TWFwKHBhdGggPT4ge1xuICAgICAgICAgICAgbGV0IGlzRGlyZWN0b3J5ID0gZmFsc2U7XG4gICAgICAgICAgICBvcmlnaW5hbEJhY2tlbmQuaXNEaXJlY3RvcnkocGF0aCkuc3Vic2NyaWJlKHZhbCA9PiBpc0RpcmVjdG9yeSA9IHZhbCk7XG4gICAgICAgICAgICBpZiAoaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlY3Vyc2UocGF0aCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBpc0ZpbGUgPSBmYWxzZTtcbiAgICAgICAgICAgIG9yaWdpbmFsQmFja2VuZC5pc0ZpbGUocGF0aCkuc3Vic2NyaWJlKHZhbCA9PiBpc0ZpbGUgPSB2YWwpO1xuICAgICAgICAgICAgaWYgKCFpc0ZpbGUgfHwgIWZpbHRlcihwYXRoKSkge1xuICAgICAgICAgICAgICByZXR1cm4gb2YoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGNvbnRlbnQ6IEFycmF5QnVmZmVyIHwgbnVsbCA9IG51bGw7XG4gICAgICAgICAgICBvcmlnaW5hbEJhY2tlbmQucmVhZChwYXRoKS5zdWJzY3JpYmUodmFsID0+IGNvbnRlbnQgPSB2YWwpO1xuICAgICAgICAgICAgaWYgKCFjb250ZW50KSB7XG4gICAgICAgICAgICAgIHJldHVybiBvZigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbmV3QmFja2VuZC53cml0ZShwYXRoLCBjb250ZW50IGFzIHt9IGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKTtcbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICB9O1xuXG4gICAgcmVjdXJzZShub3JtYWxpemUoJy8nKSkuc3Vic2NyaWJlKCk7XG5cbiAgICBzdXBlcihuZXdCYWNrZW5kKTtcblxuICAgIGZvciAoY29uc3QgYWN0aW9uIG9mIHRyZWUuYWN0aW9ucykge1xuICAgICAgaWYgKCFmaWx0ZXIoYWN0aW9uLnBhdGgpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBzd2l0Y2ggKGFjdGlvbi5raW5kKSB7XG4gICAgICAgIGNhc2UgJ2MnOlxuICAgICAgICAgIHRoaXMuY3JlYXRlKGFjdGlvbi5wYXRoLCBhY3Rpb24uY29udGVudCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2QnOlxuICAgICAgICAgIHRoaXMuZGVsZXRlKGFjdGlvbi5wYXRoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbyc6XG4gICAgICAgICAgdGhpcy5vdmVyd3JpdGUoYWN0aW9uLnBhdGgsIGFjdGlvbi5jb250ZW50KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncic6XG4gICAgICAgICAgdGhpcy5yZW5hbWUoYWN0aW9uLnBhdGgsIGFjdGlvbi50byk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=