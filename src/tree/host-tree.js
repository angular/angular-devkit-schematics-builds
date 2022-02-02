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
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdC10cmVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvdHJlZS9ob3N0LXRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0NBUzhCO0FBQzlCLCtCQUF5QztBQUN6Qyw4Q0FBMEQ7QUFDMUQsc0RBT2dDO0FBUWhDLHlDQUEwQztBQUMxQyxtQ0FBd0M7QUFDeEMsMkNBVXFCO0FBQ3JCLHlDQUFnRDtBQUNoRCxxQ0FBc0M7QUFFdEMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0FBRWxCLE1BQWEsWUFBWTtJQUN2QixZQUNXLE1BQXVCLEVBQ3ZCLElBQVUsRUFDVCxLQUFpQyxFQUNqQyxLQUFXO1FBSFosV0FBTSxHQUFOLE1BQU0sQ0FBaUI7UUFDdkIsU0FBSSxHQUFKLElBQUksQ0FBTTtRQUNULFVBQUssR0FBTCxLQUFLLENBQTRCO1FBQ2pDLFVBQUssR0FBTCxLQUFLLENBQU07SUFDcEIsQ0FBQztJQUVKLElBQUksT0FBTztRQUNULE9BQU8sSUFBSSxDQUFDLEtBQUs7YUFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzthQUNmLE1BQU0sQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBQSxXQUFJLEVBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0UsQ0FBQztJQUNELElBQUksUUFBUTtRQUNWLE9BQU8sSUFBSSxDQUFDLEtBQUs7YUFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzthQUNmLE1BQU0sQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBQSxXQUFJLEVBQUMsSUFBSSxDQUFD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LENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDNUMsTUFBTTtnQkFDUixLQUFLLEdBQUc7b0JBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDcEMsTUFBTTthQUNUO1NBQ0Y7SUFDSCxDQUFDO0NBQ0Y7QUEzREQsd0NBMkRDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIFBhdGgsXG4gIFBhdGhGcmFnbWVudCxcbiAgUGF0aElzRGlyZWN0b3J5RXhjZXB0aW9uLFxuICBQYXRoSXNGaWxlRXhjZXB0aW9uLFxuICBkaXJuYW1lLFxuICBqb2luLFxuICBub3JtYWxpemUsXG4gIHZpcnR1YWxGcyxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgRU1QVFksIE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGNvbmNhdE1hcCwgbWFwLCBtZXJnZU1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7XG4gIENvbnRlbnRIYXNNdXRhdGVkRXhjZXB0aW9uLFxuICBGaWxlQWxyZWFkeUV4aXN0RXhjZXB0aW9uLFxuICBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uLFxuICBJbnZhbGlkVXBkYXRlUmVjb3JkRXhjZXB0aW9uLFxuICBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uLFxuICBTY2hlbWF0aWNzRXhjZXB0aW9uLFxufSBmcm9tICcuLi9leGNlcHRpb24vZXhjZXB0aW9uJztcbmltcG9ydCB7XG4gIEFjdGlvbixcbiAgQ3JlYXRlRmlsZUFjdGlvbixcbiAgRGVsZXRlRmlsZUFjdGlvbixcbiAgT3ZlcndyaXRlRmlsZUFjdGlvbixcbiAgUmVuYW1lRmlsZUFjdGlvbixcbn0gZnJvbSAnLi9hY3Rpb24nO1xuaW1wb3J0IHsgRGVsZWdhdGVUcmVlIH0gZnJvbSAnLi9kZWxlZ2F0ZSc7XG5pbXBvcnQgeyBMYXp5RmlsZUVudHJ5IH0gZnJvbSAnLi9lbnRyeSc7XG5pbXBvcnQge1xuICBEaXJFbnRyeSxcbiAgRmlsZUVudHJ5LFxuICBGaWxlUHJlZGljYXRlLFxuICBGaWxlVmlzaXRvcixcbiAgRmlsZVZpc2l0b3JDYW5jZWxUb2tlbixcbiAgTWVyZ2VTdHJhdGVneSxcbiAgVHJlZSxcbiAgVHJlZVN5bWJvbCxcbiAgVXBkYXRlUmVjb3JkZXIsXG59IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7IFVwZGF0ZVJlY29yZGVyQmFzZSB9IGZyb20gJy4vcmVjb3JkZXInO1xuaW1wb3J0IHsgU2NvcGVkVHJlZSB9IGZyb20gJy4vc2NvcGVkJztcblxubGV0IF91bmlxdWVJZCA9IDA7XG5cbmV4cG9ydCBjbGFzcyBIb3N0RGlyRW50cnkgaW1wbGVtZW50cyBEaXJFbnRyeSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHJlYWRvbmx5IHBhcmVudDogRGlyRW50cnkgfCBudWxsLFxuICAgIHJlYWRvbmx5IHBhdGg6IFBhdGgsXG4gICAgcHJvdGVjdGVkIF9ob3N0OiB2aXJ0dWFsRnMuU3luY0RlbGVnYXRlSG9zdCxcbiAgICBwcm90ZWN0ZWQgX3RyZWU6IFRyZWUsXG4gICkge31cblxuICBnZXQgc3ViZGlycygpOiBQYXRoRnJhZ21lbnRbXSB7XG4gICAgcmV0dXJuIHRoaXMuX2hvc3RcbiAgICAgIC5saXN0KHRoaXMucGF0aClcbiAgICAgIC5maWx0ZXIoKGZyYWdtZW50KSA9PiB0aGlzLl9ob3N0LmlzRGlyZWN0b3J5KGpvaW4odGhpcy5wYXRoLCBmcmFnbWVudCkpKTtcbiAgfVxuICBnZXQgc3ViZmlsZXMoKTogUGF0aEZyYWdtZW50W10ge1xuICAgIHJldHVybiB0aGlzLl9ob3N0XG4gICAgICAubGlzdCh0aGlzLnBhdGgpXG4gICAgICAuZmlsdGVyKChmcmFnbWVudCkgPT4gdGhpcy5faG9zdC5pc0ZpbGUoam9pbih0aGlzLnBhdGgsIGZyYWdtZW50KSkpO1xuICB9XG5cbiAgZGlyKG5hbWU6IFBhdGhGcmFnbWVudCk6IERpckVudHJ5IHtcbiAgICByZXR1cm4gdGhpcy5fdHJlZS5nZXREaXIoam9pbih0aGlzLnBhdGgsIG5hbWUpKTtcbiAgfVxuICBmaWxlKG5hbWU6IFBhdGhGcmFnbWVudCk6IEZpbGVFbnRyeSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl90cmVlLmdldChqb2luKHRoaXMucGF0aCwgbmFtZSkpO1xuICB9XG5cbiAgdmlzaXQodmlzaXRvcjogRmlsZVZpc2l0b3IpOiB2b2lkIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5nZXRTdWJmaWxlc1JlY3Vyc2l2ZWx5KCkuZm9yRWFjaCgoZmlsZSkgPT4gdmlzaXRvcihmaWxlLnBhdGgsIGZpbGUpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSAhPT0gRmlsZVZpc2l0b3JDYW5jZWxUb2tlbikge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0U3ViZmlsZXNSZWN1cnNpdmVseSgpIHtcbiAgICBmdW5jdGlvbiBfcmVjdXJzZShlbnRyeTogRGlyRW50cnkpOiBGaWxlRW50cnlbXSB7XG4gICAgICByZXR1cm4gZW50cnkuc3ViZGlycy5yZWR1Y2UoXG4gICAgICAgIChmaWxlcywgc3ViZGlyKSA9PiBbLi4uZmlsZXMsIC4uLl9yZWN1cnNlKGVudHJ5LmRpcihzdWJkaXIpKV0sXG4gICAgICAgIGVudHJ5LnN1YmZpbGVzLm1hcCgoc3ViZmlsZSkgPT4gZW50cnkuZmlsZShzdWJmaWxlKSBhcyBGaWxlRW50cnkpLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gX3JlY3Vyc2UodGhpcyk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEhvc3RUcmVlIGltcGxlbWVudHMgVHJlZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2lkID0gLS1fdW5pcXVlSWQ7XG4gIHByaXZhdGUgX3JlY29yZDogdmlydHVhbEZzLkNvcmRIb3N0O1xuICBwcml2YXRlIF9yZWNvcmRTeW5jOiB2aXJ0dWFsRnMuU3luY0RlbGVnYXRlSG9zdDtcbiAgcHJpdmF0ZSBfYW5jZXN0cnkgPSBuZXcgU2V0PG51bWJlcj4oKTtcblxuICBwcml2YXRlIF9kaXJDYWNoZSA9IG5ldyBNYXA8UGF0aCwgSG9zdERpckVudHJ5PigpO1xuXG4gIFtUcmVlU3ltYm9sXSgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHN0YXRpYyBpc0hvc3RUcmVlKHRyZWU6IFRyZWUpOiB0cmVlIGlzIEhvc3RUcmVlIHtcbiAgICBpZiAodHJlZSBpbnN0YW5jZW9mIEhvc3RUcmVlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRyZWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiAodHJlZSBhcyBIb3N0VHJlZSkuX2FuY2VzdHJ5ID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIF9iYWNrZW5kOiB2aXJ0dWFsRnMuUmVhZG9ubHlIb3N0PHt9PiA9IG5ldyB2aXJ0dWFsRnMuRW1wdHkoKSkge1xuICAgIHRoaXMuX3JlY29yZCA9IG5ldyB2aXJ0dWFsRnMuQ29yZEhvc3QobmV3IHZpcnR1YWxGcy5TYWZlUmVhZG9ubHlIb3N0KF9iYWNrZW5kKSk7XG4gICAgdGhpcy5fcmVjb3JkU3luYyA9IG5ldyB2aXJ0dWFsRnMuU3luY0RlbGVnYXRlSG9zdCh0aGlzLl9yZWNvcmQpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9ub3JtYWxpemVQYXRoKHBhdGg6IHN0cmluZyk6IFBhdGgge1xuICAgIHJldHVybiBub3JtYWxpemUoJy8nICsgcGF0aCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3dpbGxDcmVhdGUocGF0aDogUGF0aCkge1xuICAgIHJldHVybiB0aGlzLl9yZWNvcmQud2lsbENyZWF0ZShwYXRoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfd2lsbE92ZXJ3cml0ZShwYXRoOiBQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlY29yZC53aWxsT3ZlcndyaXRlKHBhdGgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF93aWxsRGVsZXRlKHBhdGg6IFBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVjb3JkLndpbGxEZWxldGUocGF0aCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3dpbGxSZW5hbWUocGF0aDogUGF0aCkge1xuICAgIHJldHVybiB0aGlzLl9yZWNvcmQud2lsbFJlbmFtZShwYXRoKTtcbiAgfVxuXG4gIGJyYW5jaCgpOiBUcmVlIHtcbiAgICBjb25zdCBicmFuY2hlZFRyZWUgPSBuZXcgSG9zdFRyZWUodGhpcy5fYmFja2VuZCk7XG4gICAgYnJhbmNoZWRUcmVlLl9yZWNvcmQgPSB0aGlzLl9yZWNvcmQuY2xvbmUoKTtcbiAgICBicmFuY2hlZFRyZWUuX3JlY29yZFN5bmMgPSBuZXcgdmlydHVhbEZzLlN5bmNEZWxlZ2F0ZUhvc3QoYnJhbmNoZWRUcmVlLl9yZWNvcmQpO1xuICAgIGJyYW5jaGVkVHJlZS5fYW5jZXN0cnkgPSBuZXcgU2V0KHRoaXMuX2FuY2VzdHJ5KS5hZGQodGhpcy5faWQpO1xuXG4gICAgcmV0dXJuIGJyYW5jaGVkVHJlZTtcbiAgfVxuXG4gIHByaXZhdGUgaXNBbmNlc3Rvck9mKHRyZWU6IFRyZWUpOiBib29sZWFuIHtcbiAgICBpZiAodHJlZSBpbnN0YW5jZW9mIEhvc3RUcmVlKSB7XG4gICAgICByZXR1cm4gdHJlZS5fYW5jZXN0cnkuaGFzKHRoaXMuX2lkKTtcbiAgICB9XG4gICAgaWYgKHRyZWUgaW5zdGFuY2VvZiBEZWxlZ2F0ZVRyZWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmlzQW5jZXN0b3JPZigoKHRyZWUgYXMgdW5rbm93bikgYXMgeyBfb3RoZXI6IFRyZWUgfSkuX290aGVyKTtcbiAgICB9XG4gICAgaWYgKHRyZWUgaW5zdGFuY2VvZiBTY29wZWRUcmVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5pc0FuY2VzdG9yT2YoKCh0cmVlIGFzIHVua25vd24pIGFzIHsgX2Jhc2U6IFRyZWUgfSkuX2Jhc2UpO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIG1lcmdlKG90aGVyOiBUcmVlLCBzdHJhdGVneTogTWVyZ2VTdHJhdGVneSA9IE1lcmdlU3RyYXRlZ3kuRGVmYXVsdCk6IHZvaWQge1xuICAgIGlmIChvdGhlciA9PT0gdGhpcykge1xuICAgICAgLy8gTWVyZ2luZyB3aXRoIHlvdXJzZWxmPyBUc2sgdHNrLiBOb3RoaW5nIHRvIGRvIGF0IGxlYXN0LlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmlzQW5jZXN0b3JPZihvdGhlcikpIHtcbiAgICAgIC8vIFdvcmthcm91bmQgZm9yIG1lcmdpbmcgYSBicmFuY2ggYmFjayBpbnRvIG9uZSBvZiBpdHMgYW5jZXN0b3JzXG4gICAgICAvLyBNb3JlIGNvbXBsZXRlIGJyYW5jaCBwb2ludCB0cmFja2luZyBpcyByZXF1aXJlZCB0byBhdm9pZFxuICAgICAgc3RyYXRlZ3kgfD0gTWVyZ2VTdHJhdGVneS5PdmVyd3JpdGU7XG4gICAgfVxuXG4gICAgY29uc3QgY3JlYXRpb25Db25mbGljdEFsbG93ZWQgPVxuICAgICAgKHN0cmF0ZWd5ICYgTWVyZ2VTdHJhdGVneS5BbGxvd0NyZWF0aW9uQ29uZmxpY3QpID09IE1lcmdlU3RyYXRlZ3kuQWxsb3dDcmVhdGlvbkNvbmZsaWN0O1xuICAgIGNvbnN0IG92ZXJ3cml0ZUNvbmZsaWN0QWxsb3dlZCA9XG4gICAgICAoc3RyYXRlZ3kgJiBNZXJnZVN0cmF0ZWd5LkFsbG93T3ZlcndyaXRlQ29uZmxpY3QpID09IE1lcmdlU3RyYXRlZ3kuQWxsb3dPdmVyd3JpdGVDb25mbGljdDtcbiAgICBjb25zdCBkZWxldGVDb25mbGljdEFsbG93ZWQgPVxuICAgICAgKHN0cmF0ZWd5ICYgTWVyZ2VTdHJhdGVneS5BbGxvd0RlbGV0ZUNvbmZsaWN0KSA9PSBNZXJnZVN0cmF0ZWd5LkFsbG93RGVsZXRlQ29uZmxpY3Q7XG5cbiAgICBvdGhlci5hY3Rpb25zLmZvckVhY2goKGFjdGlvbikgPT4ge1xuICAgICAgc3dpdGNoIChhY3Rpb24ua2luZCkge1xuICAgICAgICBjYXNlICdjJzoge1xuICAgICAgICAgIGNvbnN0IHsgcGF0aCwgY29udGVudCB9ID0gYWN0aW9uO1xuXG4gICAgICAgICAgaWYgKHRoaXMuX3dpbGxDcmVhdGUocGF0aCkgfHwgdGhpcy5fd2lsbE92ZXJ3cml0ZShwYXRoKSB8fCB0aGlzLmV4aXN0cyhwYXRoKSkge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdDb250ZW50ID0gdGhpcy5yZWFkKHBhdGgpO1xuICAgICAgICAgICAgaWYgKGV4aXN0aW5nQ29udGVudCAmJiBjb250ZW50LmVxdWFscyhleGlzdGluZ0NvbnRlbnQpKSB7XG4gICAgICAgICAgICAgIC8vIElkZW50aWNhbCBvdXRjb21lOyBubyBhY3Rpb24gcmVxdWlyZWRcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWNyZWF0aW9uQ29uZmxpY3RBbGxvd2VkKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uKHBhdGgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9yZWNvcmQub3ZlcndyaXRlKHBhdGgsIChjb250ZW50IGFzIHt9KSBhcyB2aXJ0dWFsRnMuRmlsZUJ1ZmZlcikuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlY29yZC5jcmVhdGUocGF0aCwgKGNvbnRlbnQgYXMge30pIGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKS5zdWJzY3JpYmUoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjYXNlICdvJzoge1xuICAgICAgICAgIGNvbnN0IHsgcGF0aCwgY29udGVudCB9ID0gYWN0aW9uO1xuICAgICAgICAgIGlmICh0aGlzLl93aWxsRGVsZXRlKHBhdGgpICYmICFvdmVyd3JpdGVDb25mbGljdEFsbG93ZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uKHBhdGgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIElnbm9yZSBpZiBjb250ZW50IGlzIHRoZSBzYW1lIChjb25zaWRlcmVkIHRoZSBzYW1lIGNoYW5nZSkuXG4gICAgICAgICAgaWYgKHRoaXMuX3dpbGxPdmVyd3JpdGUocGF0aCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nQ29udGVudCA9IHRoaXMucmVhZChwYXRoKTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ0NvbnRlbnQgJiYgY29udGVudC5lcXVhbHMoZXhpc3RpbmdDb250ZW50KSkge1xuICAgICAgICAgICAgICAvLyBJZGVudGljYWwgb3V0Y29tZTsgbm8gYWN0aW9uIHJlcXVpcmVkXG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFvdmVyd3JpdGVDb25mbGljdEFsbG93ZWQpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IE1lcmdlQ29uZmxpY3RFeGNlcHRpb24ocGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFdlIHVzZSB3cml0ZSBoZXJlIGFzIG1lcmdlIHZhbGlkYXRpb24gaGFzIGFscmVhZHkgYmVlbiBkb25lLCBhbmQgd2Ugd2FudCB0byBsZXRcbiAgICAgICAgICAvLyB0aGUgQ29yZEhvc3QgZG8gaXRzIGpvYi5cbiAgICAgICAgICB0aGlzLl9yZWNvcmQud3JpdGUocGF0aCwgKGNvbnRlbnQgYXMge30pIGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKS5zdWJzY3JpYmUoKTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhc2UgJ3InOiB7XG4gICAgICAgICAgY29uc3QgeyBwYXRoLCB0byB9ID0gYWN0aW9uO1xuICAgICAgICAgIGlmICh0aGlzLl93aWxsRGVsZXRlKHBhdGgpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWVyZ2VDb25mbGljdEV4Y2VwdGlvbihwYXRoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodGhpcy5fd2lsbFJlbmFtZShwYXRoKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3JlY29yZC53aWxsUmVuYW1lVG8ocGF0aCwgdG8pKSB7XG4gICAgICAgICAgICAgIC8vIElkZW50aWNhbCBvdXRjb21lOyBubyBhY3Rpb24gcmVxdWlyZWRcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBObyBvdmVycmlkZSBwb3NzaWJsZSBmb3IgcmVuYW1pbmcuXG4gICAgICAgICAgICB0aHJvdyBuZXcgTWVyZ2VDb25mbGljdEV4Y2VwdGlvbihwYXRoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZW5hbWUocGF0aCwgdG8pO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSAnZCc6IHtcbiAgICAgICAgICBjb25zdCB7IHBhdGggfSA9IGFjdGlvbjtcbiAgICAgICAgICBpZiAodGhpcy5fd2lsbERlbGV0ZShwYXRoKSkge1xuICAgICAgICAgICAgLy8gVE9ETzogVGhpcyBzaG91bGQgdGVjaG5pY2FsbHkgY2hlY2sgdGhlIGNvbnRlbnQgKGUuZy4sIGhhc2ggb24gZGVsZXRlKVxuICAgICAgICAgICAgLy8gSWRlbnRpY2FsIG91dGNvbWU7IG5vIGFjdGlvbiByZXF1aXJlZFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghdGhpcy5leGlzdHMocGF0aCkgJiYgIWRlbGV0ZUNvbmZsaWN0QWxsb3dlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1lcmdlQ29uZmxpY3RFeGNlcHRpb24ocGF0aCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5fcmVjb3JkU3luYy5kZWxldGUocGF0aCk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGdldCByb290KCk6IERpckVudHJ5IHtcbiAgICByZXR1cm4gdGhpcy5nZXREaXIoJy8nKTtcbiAgfVxuXG4gIC8vIFJlYWRvbmx5LlxuICByZWFkKHBhdGg6IHN0cmluZyk6IEJ1ZmZlciB8IG51bGwge1xuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5nZXQocGF0aCk7XG5cbiAgICByZXR1cm4gZW50cnkgPyBlbnRyeS5jb250ZW50IDogbnVsbDtcbiAgfVxuICBleGlzdHMocGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3JlY29yZFN5bmMuaXNGaWxlKHRoaXMuX25vcm1hbGl6ZVBhdGgocGF0aCkpO1xuICB9XG5cbiAgZ2V0KHBhdGg6IHN0cmluZyk6IEZpbGVFbnRyeSB8IG51bGwge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpO1xuICAgIGlmICh0aGlzLl9yZWNvcmRTeW5jLmlzRGlyZWN0b3J5KHApKSB7XG4gICAgICB0aHJvdyBuZXcgUGF0aElzRGlyZWN0b3J5RXhjZXB0aW9uKHApO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX3JlY29yZFN5bmMuZXhpc3RzKHApKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IExhenlGaWxlRW50cnkocCwgKCkgPT4gQnVmZmVyLmZyb20odGhpcy5fcmVjb3JkU3luYy5yZWFkKHApKSk7XG4gIH1cblxuICBnZXREaXIocGF0aDogc3RyaW5nKTogRGlyRW50cnkge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpO1xuICAgIGlmICh0aGlzLl9yZWNvcmRTeW5jLmlzRmlsZShwKSkge1xuICAgICAgdGhyb3cgbmV3IFBhdGhJc0ZpbGVFeGNlcHRpb24ocCk7XG4gICAgfVxuXG4gICAgbGV0IG1heWJlQ2FjaGUgPSB0aGlzLl9kaXJDYWNoZS5nZXQocCk7XG4gICAgaWYgKCFtYXliZUNhY2hlKSB7XG4gICAgICBsZXQgcGFyZW50OiBQYXRoIHwgbnVsbCA9IGRpcm5hbWUocCk7XG4gICAgICBpZiAocCA9PT0gcGFyZW50KSB7XG4gICAgICAgIHBhcmVudCA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIG1heWJlQ2FjaGUgPSBuZXcgSG9zdERpckVudHJ5KHBhcmVudCAmJiB0aGlzLmdldERpcihwYXJlbnQpLCBwLCB0aGlzLl9yZWNvcmRTeW5jLCB0aGlzKTtcbiAgICAgIHRoaXMuX2RpckNhY2hlLnNldChwLCBtYXliZUNhY2hlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWF5YmVDYWNoZTtcbiAgfVxuICB2aXNpdCh2aXNpdG9yOiBGaWxlVmlzaXRvcik6IHZvaWQge1xuICAgIHRoaXMucm9vdC52aXNpdCgocGF0aCwgZW50cnkpID0+IHtcbiAgICAgIHZpc2l0b3IocGF0aCwgZW50cnkpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gQ2hhbmdlIGNvbnRlbnQgb2YgaG9zdCBmaWxlcy5cbiAgb3ZlcndyaXRlKHBhdGg6IHN0cmluZywgY29udGVudDogQnVmZmVyIHwgc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgcCA9IHRoaXMuX25vcm1hbGl6ZVBhdGgocGF0aCk7XG4gICAgaWYgKCF0aGlzLl9yZWNvcmRTeW5jLmV4aXN0cyhwKSkge1xuICAgICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocCk7XG4gICAgfVxuICAgIGNvbnN0IGMgPSB0eXBlb2YgY29udGVudCA9PSAnc3RyaW5nJyA/IEJ1ZmZlci5mcm9tKGNvbnRlbnQpIDogY29udGVudDtcbiAgICB0aGlzLl9yZWNvcmQub3ZlcndyaXRlKHAsIChjIGFzIHt9KSBhcyB2aXJ0dWFsRnMuRmlsZUJ1ZmZlcikuc3Vic2NyaWJlKCk7XG4gIH1cbiAgYmVnaW5VcGRhdGUocGF0aDogc3RyaW5nKTogVXBkYXRlUmVjb3JkZXIge1xuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5nZXQocGF0aCk7XG4gICAgaWYgKCFlbnRyeSkge1xuICAgICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocGF0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFVwZGF0ZVJlY29yZGVyQmFzZS5jcmVhdGVGcm9tRmlsZUVudHJ5KGVudHJ5KTtcbiAgfVxuICBjb21taXRVcGRhdGUocmVjb3JkOiBVcGRhdGVSZWNvcmRlcik6IHZvaWQge1xuICAgIGlmIChyZWNvcmQgaW5zdGFuY2VvZiBVcGRhdGVSZWNvcmRlckJhc2UpIHtcbiAgICAgIGNvbnN0IHBhdGggPSByZWNvcmQucGF0aDtcbiAgICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5nZXQocGF0aCk7XG4gICAgICBpZiAoIWVudHJ5KSB7XG4gICAgICAgIHRocm93IG5ldyBDb250ZW50SGFzTXV0YXRlZEV4Y2VwdGlvbihwYXRoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG5ld0NvbnRlbnQgPSByZWNvcmQuYXBwbHkoZW50cnkuY29udGVudCk7XG4gICAgICAgIGlmICghbmV3Q29udGVudC5lcXVhbHMoZW50cnkuY29udGVudCkpIHtcbiAgICAgICAgICB0aGlzLm92ZXJ3cml0ZShwYXRoLCBuZXdDb250ZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZFVwZGF0ZVJlY29yZEV4Y2VwdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFN0cnVjdHVyYWwgbWV0aG9kcy5cbiAgY3JlYXRlKHBhdGg6IHN0cmluZywgY29udGVudDogQnVmZmVyIHwgc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgcCA9IHRoaXMuX25vcm1hbGl6ZVBhdGgocGF0aCk7XG4gICAgaWYgKHRoaXMuX3JlY29yZFN5bmMuZXhpc3RzKHApKSB7XG4gICAgICB0aHJvdyBuZXcgRmlsZUFscmVhZHlFeGlzdEV4Y2VwdGlvbihwKTtcbiAgICB9XG4gICAgY29uc3QgYyA9IHR5cGVvZiBjb250ZW50ID09ICdzdHJpbmcnID8gQnVmZmVyLmZyb20oY29udGVudCkgOiBjb250ZW50O1xuICAgIHRoaXMuX3JlY29yZC5jcmVhdGUocCwgKGMgYXMge30pIGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKS5zdWJzY3JpYmUoKTtcbiAgfVxuICBkZWxldGUocGF0aDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5fcmVjb3JkU3luYy5kZWxldGUodGhpcy5fbm9ybWFsaXplUGF0aChwYXRoKSk7XG4gIH1cbiAgcmVuYW1lKGZyb206IHN0cmluZywgdG86IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuX3JlY29yZFN5bmMucmVuYW1lKHRoaXMuX25vcm1hbGl6ZVBhdGgoZnJvbSksIHRoaXMuX25vcm1hbGl6ZVBhdGgodG8pKTtcbiAgfVxuXG4gIGFwcGx5KGFjdGlvbjogQWN0aW9uLCBzdHJhdGVneT86IE1lcmdlU3RyYXRlZ3kpOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignQXBwbHkgbm90IGltcGxlbWVudGVkIG9uIGhvc3QgdHJlZXMuJyk7XG4gIH1cblxuICBwcml2YXRlICpnZW5lcmF0ZUFjdGlvbnMoKTogSXRlcmFibGU8QWN0aW9uPiB7XG4gICAgZm9yIChjb25zdCByZWNvcmQgb2YgdGhpcy5fcmVjb3JkLnJlY29yZHMoKSkge1xuICAgICAgc3dpdGNoIChyZWNvcmQua2luZCkge1xuICAgICAgICBjYXNlICdjcmVhdGUnOlxuICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgIGlkOiB0aGlzLl9pZCxcbiAgICAgICAgICAgIHBhcmVudDogMCxcbiAgICAgICAgICAgIGtpbmQ6ICdjJyxcbiAgICAgICAgICAgIHBhdGg6IHJlY29yZC5wYXRoLFxuICAgICAgICAgICAgY29udGVudDogQnVmZmVyLmZyb20ocmVjb3JkLmNvbnRlbnQpLFxuICAgICAgICAgIH0gYXMgQ3JlYXRlRmlsZUFjdGlvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnb3ZlcndyaXRlJzpcbiAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICBpZDogdGhpcy5faWQsXG4gICAgICAgICAgICBwYXJlbnQ6IDAsXG4gICAgICAgICAgICBraW5kOiAnbycsXG4gICAgICAgICAgICBwYXRoOiByZWNvcmQucGF0aCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IEJ1ZmZlci5mcm9tKHJlY29yZC5jb250ZW50KSxcbiAgICAgICAgICB9IGFzIE92ZXJ3cml0ZUZpbGVBY3Rpb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JlbmFtZSc6XG4gICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgaWQ6IHRoaXMuX2lkLFxuICAgICAgICAgICAgcGFyZW50OiAwLFxuICAgICAgICAgICAga2luZDogJ3InLFxuICAgICAgICAgICAgcGF0aDogcmVjb3JkLmZyb20sXG4gICAgICAgICAgICB0bzogcmVjb3JkLnRvLFxuICAgICAgICAgIH0gYXMgUmVuYW1lRmlsZUFjdGlvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZGVsZXRlJzpcbiAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICBpZDogdGhpcy5faWQsXG4gICAgICAgICAgICBwYXJlbnQ6IDAsXG4gICAgICAgICAgICBraW5kOiAnZCcsXG4gICAgICAgICAgICBwYXRoOiByZWNvcmQucGF0aCxcbiAgICAgICAgICB9IGFzIERlbGV0ZUZpbGVBY3Rpb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IGFjdGlvbnMoKTogQWN0aW9uW10ge1xuICAgIC8vIENyZWF0ZSBhIGxpc3Qgb2YgYWxsIHJlY29yZHMgdW50aWwgd2UgaGl0IG91ciBvcmlnaW5hbCBiYWNrZW5kLiBUaGlzIGlzIHRvIHN1cHBvcnQgYnJhbmNoZXNcbiAgICAvLyB0aGF0IGRpdmVyZ2UgZnJvbSBlYWNoIG90aGVycy5cbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLmdlbmVyYXRlQWN0aW9ucygpKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSG9zdENyZWF0ZVRyZWUgZXh0ZW5kcyBIb3N0VHJlZSB7XG4gIGNvbnN0cnVjdG9yKGhvc3Q6IHZpcnR1YWxGcy5SZWFkb25seUhvc3QpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgY29uc3QgdGVtcEhvc3QgPSBuZXcgSG9zdFRyZWUoaG9zdCk7XG4gICAgdGVtcEhvc3QudmlzaXQoKHBhdGgpID0+IHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSB0ZW1wSG9zdC5yZWFkKHBhdGgpO1xuICAgICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgdGhpcy5jcmVhdGUocGF0aCwgY29udGVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZpbHRlckhvc3RUcmVlIGV4dGVuZHMgSG9zdFRyZWUge1xuICBjb25zdHJ1Y3Rvcih0cmVlOiBIb3N0VHJlZSwgZmlsdGVyOiBGaWxlUHJlZGljYXRlPGJvb2xlYW4+ID0gKCkgPT4gdHJ1ZSkge1xuICAgIGNvbnN0IG5ld0JhY2tlbmQgPSBuZXcgdmlydHVhbEZzLlNpbXBsZU1lbW9yeUhvc3QoKTtcbiAgICAvLyBjYXN0IHRvIGFsbG93IGFjY2Vzc1xuICAgIGNvbnN0IG9yaWdpbmFsQmFja2VuZCA9ICh0cmVlIGFzIEZpbHRlckhvc3RUcmVlKS5fYmFja2VuZDtcblxuICAgIGNvbnN0IHJlY3Vyc2U6IChiYXNlOiBQYXRoKSA9PiBPYnNlcnZhYmxlPHZvaWQ+ID0gKGJhc2UpID0+IHtcbiAgICAgIHJldHVybiBvcmlnaW5hbEJhY2tlbmQubGlzdChiYXNlKS5waXBlKFxuICAgICAgICBtZXJnZU1hcCgoeCkgPT4geCksXG4gICAgICAgIG1hcCgocGF0aCkgPT4gam9pbihiYXNlLCBwYXRoKSksXG4gICAgICAgIGNvbmNhdE1hcCgocGF0aCkgPT4ge1xuICAgICAgICAgIGxldCBpc0RpcmVjdG9yeSA9IGZhbHNlO1xuICAgICAgICAgIG9yaWdpbmFsQmFja2VuZC5pc0RpcmVjdG9yeShwYXRoKS5zdWJzY3JpYmUoKHZhbCkgPT4gKGlzRGlyZWN0b3J5ID0gdmFsKSk7XG4gICAgICAgICAgaWYgKGlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICByZXR1cm4gcmVjdXJzZShwYXRoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgaXNGaWxlID0gZmFsc2U7XG4gICAgICAgICAgb3JpZ2luYWxCYWNrZW5kLmlzRmlsZShwYXRoKS5zdWJzY3JpYmUoKHZhbCkgPT4gKGlzRmlsZSA9IHZhbCkpO1xuICAgICAgICAgIGlmICghaXNGaWxlIHx8ICFmaWx0ZXIocGF0aCkpIHtcbiAgICAgICAgICAgIHJldHVybiBFTVBUWTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgY29udGVudDogQXJyYXlCdWZmZXIgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICBvcmlnaW5hbEJhY2tlbmQucmVhZChwYXRoKS5zdWJzY3JpYmUoKHZhbCkgPT4gKGNvbnRlbnQgPSB2YWwpKTtcbiAgICAgICAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBFTVBUWTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gbmV3QmFja2VuZC53cml0ZShwYXRoLCAoY29udGVudCBhcyB7fSkgYXMgdmlydHVhbEZzLkZpbGVCdWZmZXIpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfTtcblxuICAgIHJlY3Vyc2Uobm9ybWFsaXplKCcvJykpLnN1YnNjcmliZSgpO1xuXG4gICAgc3VwZXIobmV3QmFja2VuZCk7XG5cbiAgICBmb3IgKGNvbnN0IGFjdGlvbiBvZiB0cmVlLmFjdGlvbnMpIHtcbiAgICAgIGlmICghZmlsdGVyKGFjdGlvbi5wYXRoKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoIChhY3Rpb24ua2luZCkge1xuICAgICAgICBjYXNlICdjJzpcbiAgICAgICAgICB0aGlzLmNyZWF0ZShhY3Rpb24ucGF0aCwgYWN0aW9uLmNvbnRlbnQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdkJzpcbiAgICAgICAgICB0aGlzLmRlbGV0ZShhY3Rpb24ucGF0aCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ28nOlxuICAgICAgICAgIHRoaXMub3ZlcndyaXRlKGFjdGlvbi5wYXRoLCBhY3Rpb24uY29udGVudCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3InOlxuICAgICAgICAgIHRoaXMucmVuYW1lKGFjdGlvbi5wYXRoLCBhY3Rpb24udG8pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19