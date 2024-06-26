/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { BaseException } from '@angular-devkit/core';
import { RuleFactory } from '../src';
import { FileSystemCollectionDesc, FileSystemSchematicDesc } from './description';
import { FileSystemEngineHostBase } from './file-system-engine-host-base';
export declare class NodePackageDoesNotSupportSchematics extends BaseException {
    constructor(name: string);
}
/**
 * A simple EngineHost that uses NodeModules to resolve collections.
 */
export declare class NodeModulesEngineHost extends FileSystemEngineHostBase {
    private readonly paths?;
    constructor(paths?: string[] | undefined);
    private resolve;
    protected _resolveCollectionPath(name: string, requester?: string): string;
    protected _resolveReferenceString(refString: string, parentPath: string, collectionDescription?: FileSystemCollectionDesc): {
        ref: RuleFactory<{}>;
        path: string;
    } | null;
    protected _transformCollectionDescription(name: string, desc: Partial<FileSystemCollectionDesc>): FileSystemCollectionDesc;
    protected _transformSchematicDescription(name: string, _collection: FileSystemCollectionDesc, desc: Partial<FileSystemSchematicDesc>): FileSystemSchematicDesc;
}
