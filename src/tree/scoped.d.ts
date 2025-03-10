/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { JsonValue, Path, PathFragment } from '@angular-devkit/core';
import { Action } from './action';
import { DirEntry, FileEntry, FileVisitor, MergeStrategy, Tree, TreeSymbol, UpdateRecorder } from './interface';
declare class ScopedDirEntry implements DirEntry {
    private _base;
    readonly scope: Path;
    constructor(_base: DirEntry, scope: Path);
    get parent(): DirEntry | null;
    get path(): Path;
    get subdirs(): PathFragment[];
    get subfiles(): PathFragment[];
    dir(name: PathFragment): DirEntry;
    file(name: PathFragment): FileEntry | null;
    visit(visitor: FileVisitor): void;
}
export declare class ScopedTree implements Tree {
    [TreeSymbol]: () => this;
    private _base;
    readonly _root: ScopedDirEntry;
    constructor(_base: Tree, scope: string);
    get root(): DirEntry;
    branch(): Tree;
    merge(other: Tree, strategy?: MergeStrategy): void;
    read(path: string): Buffer | null;
    readText(path: string): string;
    readJson(path: string): JsonValue;
    exists(path: string): boolean;
    get(path: string): FileEntry | null;
    getDir(path: string): DirEntry;
    visit(visitor: FileVisitor): void;
    overwrite(path: string, content: Buffer | string): void;
    beginUpdate(path: string): UpdateRecorder;
    commitUpdate(record: UpdateRecorder): void;
    create(path: string, content: Buffer | string): void;
    delete(path: string): void;
    rename(from: string, to: string): void;
    apply(action: Action, strategy?: MergeStrategy): void;
    get actions(): Action[];
    private _fullPath;
    private _fullPathAction;
}
export {};
