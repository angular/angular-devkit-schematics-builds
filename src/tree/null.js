"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullTree = exports.NullTreeDirEntry = exports.CannotCreateFileException = void 0;
const core_1 = require("@angular-devkit/core");
const exception_1 = require("../exception/exception");
const interface_1 = require("./interface");
const recorder_1 = require("./recorder");
class CannotCreateFileException extends core_1.BaseException {
    constructor(path) {
        super(`Cannot create file "${path}".`);
    }
}
exports.CannotCreateFileException = CannotCreateFileException;
class NullTreeDirEntry {
    constructor(path) {
        this.path = path;
        this.subdirs = [];
        this.subfiles = [];
    }
    get parent() {
        return this.path == '/' ? null : new NullTreeDirEntry((0, core_1.dirname)(this.path));
    }
    dir(name) {
        return new NullTreeDirEntry((0, core_1.join)(this.path, name));
    }
    file(_name) {
        return null;
    }
    visit() { }
}
exports.NullTreeDirEntry = NullTreeDirEntry;
class NullTree {
    constructor() {
        this.root = new NullTreeDirEntry((0, core_1.normalize)('/'));
    }
    [interface_1.TreeSymbol]() {
        return this;
    }
    branch() {
        return new NullTree();
    }
    merge(_other, _strategy) { }
    // Simple readonly file system operations.
    exists(_path) {
        return false;
    }
    read(_path) {
        return null;
    }
    get(_path) {
        return null;
    }
    getDir(path) {
        return new NullTreeDirEntry((0, core_1.normalize)('/' + path));
    }
    visit() { }
    // Change content of host files.
    beginUpdate(path) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    commitUpdate(record) {
        throw new exception_1.FileDoesNotExistException(record instanceof recorder_1.UpdateRecorderBase ? record.path : '<unknown>');
    }
    // Change structure of the host.
    copy(path, _to) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    delete(path) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    create(path, _content) {
        throw new CannotCreateFileException(path);
    }
    rename(path, _to) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    overwrite(path, _content) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    apply(_action, _strategy) { }
    get actions() {
        return [];
    }
}
exports.NullTree = NullTree;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3RyZWUvbnVsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBbUc7QUFDbkcsc0RBQW1FO0FBRW5FLDJDQUF3RjtBQUN4Rix5Q0FBZ0Q7QUFFaEQsTUFBYSx5QkFBMEIsU0FBUSxvQkFBYTtJQUMxRCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLHVCQUF1QixJQUFJLElBQUksQ0FBQyxDQUFDO0lBQ3pDLENBQUM7Q0FDRjtBQUpELDhEQUlDO0FBRUQsTUFBYSxnQkFBZ0I7SUFLM0IsWUFBNEIsSUFBVTtRQUFWLFNBQUksR0FBSixJQUFJLENBQU07UUFFN0IsWUFBTyxHQUFtQixFQUFFLENBQUM7UUFDN0IsYUFBUSxHQUFtQixFQUFFLENBQUM7SUFIRSxDQUFDO0lBSjFDLElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFBLGNBQU8sRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBT0QsR0FBRyxDQUFDLElBQWtCO1FBQ3BCLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxJQUFBLFdBQUksRUFBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUNELElBQUksQ0FBQyxLQUFtQjtRQUN0QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxLQUFLLEtBQUksQ0FBQztDQUNYO0FBbEJELDRDQWtCQztBQUVELE1BQWEsUUFBUTtJQUFyQjtRQVVXLFNBQUksR0FBYSxJQUFJLGdCQUFnQixDQUFDLElBQUEsZ0JBQVMsRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBZ0RqRSxDQUFDO0lBekRDLENBQUMsc0JBQVUsQ0FBQztRQUNWLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQU07UUFDSixPQUFPLElBQUksUUFBUSxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUNELEtBQUssQ0FBQyxNQUFZLEVBQUUsU0FBeUIsSUFBUyxDQUFDO0lBSXZELDBDQUEwQztJQUMxQyxNQUFNLENBQUMsS0FBYTtRQUNsQixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFDRCxJQUFJLENBQUMsS0FBYTtRQUNoQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDRCxHQUFHLENBQUMsS0FBYTtRQUNmLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFZO1FBQ2pCLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxJQUFBLGdCQUFTLEVBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUNELEtBQUssS0FBSSxDQUFDO0lBRVYsZ0NBQWdDO0lBQ2hDLFdBQVcsQ0FBQyxJQUFZO1FBQ3RCLE1BQU0sSUFBSSxxQ0FBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ0QsWUFBWSxDQUFDLE1BQXNCO1FBQ2pDLE1BQU0sSUFBSSxxQ0FBeUIsQ0FDakMsTUFBTSxZQUFZLDZCQUFrQixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQ2pFLENBQUM7SUFDSixDQUFDO0lBRUQsZ0NBQWdDO0lBQ2hDLElBQUksQ0FBQyxJQUFZLEVBQUUsR0FBVztRQUM1QixNQUFNLElBQUkscUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFZO1FBQ2pCLE1BQU0sSUFBSSxxQ0FBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ0QsTUFBTSxDQUFDLElBQVksRUFBRSxRQUF5QjtRQUM1QyxNQUFNLElBQUkseUJBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFZLEVBQUUsR0FBVztRQUM5QixNQUFNLElBQUkscUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUNELFNBQVMsQ0FBQyxJQUFZLEVBQUUsUUFBeUI7UUFDL0MsTUFBTSxJQUFJLHFDQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRCxLQUFLLENBQUMsT0FBZSxFQUFFLFNBQXlCLElBQVMsQ0FBQztJQUMxRCxJQUFJLE9BQU87UUFDVCxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7Q0FDRjtBQTFERCw0QkEwREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiwgUGF0aCwgUGF0aEZyYWdtZW50LCBkaXJuYW1lLCBqb2luLCBub3JtYWxpemUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uIH0gZnJvbSAnLi4vZXhjZXB0aW9uL2V4Y2VwdGlvbic7XG5pbXBvcnQgeyBBY3Rpb24gfSBmcm9tICcuL2FjdGlvbic7XG5pbXBvcnQgeyBEaXJFbnRyeSwgTWVyZ2VTdHJhdGVneSwgVHJlZSwgVHJlZVN5bWJvbCwgVXBkYXRlUmVjb3JkZXIgfSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBVcGRhdGVSZWNvcmRlckJhc2UgfSBmcm9tICcuL3JlY29yZGVyJztcblxuZXhwb3J0IGNsYXNzIENhbm5vdENyZWF0ZUZpbGVFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IocGF0aDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENhbm5vdCBjcmVhdGUgZmlsZSBcIiR7cGF0aH1cIi5gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTnVsbFRyZWVEaXJFbnRyeSBpbXBsZW1lbnRzIERpckVudHJ5IHtcbiAgZ2V0IHBhcmVudCgpOiBEaXJFbnRyeSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLnBhdGggPT0gJy8nID8gbnVsbCA6IG5ldyBOdWxsVHJlZURpckVudHJ5KGRpcm5hbWUodGhpcy5wYXRoKSk7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgcGF0aDogUGF0aCkge31cblxuICByZWFkb25seSBzdWJkaXJzOiBQYXRoRnJhZ21lbnRbXSA9IFtdO1xuICByZWFkb25seSBzdWJmaWxlczogUGF0aEZyYWdtZW50W10gPSBbXTtcblxuICBkaXIobmFtZTogUGF0aEZyYWdtZW50KTogRGlyRW50cnkge1xuICAgIHJldHVybiBuZXcgTnVsbFRyZWVEaXJFbnRyeShqb2luKHRoaXMucGF0aCwgbmFtZSkpO1xuICB9XG4gIGZpbGUoX25hbWU6IFBhdGhGcmFnbWVudCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdmlzaXQoKSB7fVxufVxuXG5leHBvcnQgY2xhc3MgTnVsbFRyZWUgaW1wbGVtZW50cyBUcmVlIHtcbiAgW1RyZWVTeW1ib2xdKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYnJhbmNoKCk6IFRyZWUge1xuICAgIHJldHVybiBuZXcgTnVsbFRyZWUoKTtcbiAgfVxuICBtZXJnZShfb3RoZXI6IFRyZWUsIF9zdHJhdGVneT86IE1lcmdlU3RyYXRlZ3kpOiB2b2lkIHt9XG5cbiAgcmVhZG9ubHkgcm9vdDogRGlyRW50cnkgPSBuZXcgTnVsbFRyZWVEaXJFbnRyeShub3JtYWxpemUoJy8nKSk7XG5cbiAgLy8gU2ltcGxlIHJlYWRvbmx5IGZpbGUgc3lzdGVtIG9wZXJhdGlvbnMuXG4gIGV4aXN0cyhfcGF0aDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJlYWQoX3BhdGg6IHN0cmluZykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGdldChfcGF0aDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgZ2V0RGlyKHBhdGg6IHN0cmluZykge1xuICAgIHJldHVybiBuZXcgTnVsbFRyZWVEaXJFbnRyeShub3JtYWxpemUoJy8nICsgcGF0aCkpO1xuICB9XG4gIHZpc2l0KCkge31cblxuICAvLyBDaGFuZ2UgY29udGVudCBvZiBob3N0IGZpbGVzLlxuICBiZWdpblVwZGF0ZShwYXRoOiBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocGF0aCk7XG4gIH1cbiAgY29tbWl0VXBkYXRlKHJlY29yZDogVXBkYXRlUmVjb3JkZXIpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24oXG4gICAgICByZWNvcmQgaW5zdGFuY2VvZiBVcGRhdGVSZWNvcmRlckJhc2UgPyByZWNvcmQucGF0aCA6ICc8dW5rbm93bj4nLFxuICAgICk7XG4gIH1cblxuICAvLyBDaGFuZ2Ugc3RydWN0dXJlIG9mIHRoZSBob3N0LlxuICBjb3B5KHBhdGg6IHN0cmluZywgX3RvOiBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocGF0aCk7XG4gIH1cbiAgZGVsZXRlKHBhdGg6IHN0cmluZyk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgfVxuICBjcmVhdGUocGF0aDogc3RyaW5nLCBfY29udGVudDogQnVmZmVyIHwgc3RyaW5nKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBDYW5ub3RDcmVhdGVGaWxlRXhjZXB0aW9uKHBhdGgpO1xuICB9XG4gIHJlbmFtZShwYXRoOiBzdHJpbmcsIF90bzogc3RyaW5nKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKHBhdGgpO1xuICB9XG4gIG92ZXJ3cml0ZShwYXRoOiBzdHJpbmcsIF9jb250ZW50OiBCdWZmZXIgfCBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocGF0aCk7XG4gIH1cblxuICBhcHBseShfYWN0aW9uOiBBY3Rpb24sIF9zdHJhdGVneT86IE1lcmdlU3RyYXRlZ3kpOiB2b2lkIHt9XG4gIGdldCBhY3Rpb25zKCk6IEFjdGlvbltdIHtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cbiJdfQ==