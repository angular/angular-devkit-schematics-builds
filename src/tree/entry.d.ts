/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { Path } from '@angular-devkit/core';
import { FileEntry } from './interface';
export declare class SimpleFileEntry implements FileEntry {
    private _path;
    private _content;
    constructor(_path: Path, _content: Buffer);
    get path(): Path;
    get content(): Buffer<ArrayBufferLike>;
}
export declare class LazyFileEntry implements FileEntry {
    private _path;
    private _load;
    private _content;
    constructor(_path: Path, _load: (path?: Path) => Buffer);
    get path(): Path;
    get content(): Buffer<ArrayBufferLike>;
}
