/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { BaseException, JsonValue, Path, PathFragment } from '@angular-devkit/core';
import { Action } from './action';
import { DirEntry, MergeStrategy, Tree, TreeSymbol, UpdateRecorder } from './interface';
export declare class CannotCreateFileException extends BaseException {
    constructor(path: string);
}
export declare class NullTreeDirEntry implements DirEntry {
    readonly path: Path;
    get parent(): DirEntry | null;
    constructor(path: Path);
    readonly subdirs: PathFragment[];
    readonly subfiles: PathFragment[];
    dir(name: PathFragment): DirEntry;
    file(_name: PathFragment): null;
    visit(): void;
}
export declare class NullTree implements Tree {
    [TreeSymbol]: () => this;
    branch(): Tree;
    merge(_other: Tree, _strategy?: MergeStrategy): void;
    readonly root: DirEntry;
    exists(_path: string): boolean;
    read(_path: string): null;
    readText(path: string): string;
    readJson(path: string): JsonValue;
    get(_path: string): null;
    getDir(path: string): NullTreeDirEntry;
    visit(): void;
    beginUpdate(path: string): never;
    commitUpdate(record: UpdateRecorder): never;
    copy(path: string, _to: string): never;
    delete(path: string): never;
    create(path: string, _content: Buffer | string): never;
    rename(path: string, _to: string): never;
    overwrite(path: string, _content: Buffer | string): never;
    apply(_action: Action, _strategy?: MergeStrategy): void;
    get actions(): Action[];
}
