/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { logging } from '@angular-devkit/core';
import { Observable } from 'rxjs';
import { DelegateTree, Rule, SchematicContext, SchematicEngine, TaskConfiguration, Tree } from '../src';
export declare class UnitTestTree extends DelegateTree {
    get files(): string[];
    readContent(path: string): string;
}
export declare class SchematicTestRunner {
    private _collectionName;
    private _engineHost;
    private _engine;
    private _collection;
    private _logger;
    constructor(_collectionName: string, collectionPath: string);
    get engine(): SchematicEngine<{}, {}>;
    get logger(): logging.Logger;
    get tasks(): TaskConfiguration[];
    registerCollection(collectionName: string, collectionPath: string): void;
    runSchematic<SchematicSchemaT extends object>(schematicName: string, opts?: SchematicSchemaT, tree?: Tree): Promise<UnitTestTree>;
    runExternalSchematic<SchematicSchemaT extends object>(collectionName: string, schematicName: string, opts?: SchematicSchemaT, tree?: Tree): Promise<UnitTestTree>;
    callRule(rule: Rule, tree: Tree, parentContext?: Partial<SchematicContext>): Observable<Tree>;
}
