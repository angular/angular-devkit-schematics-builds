/// <reference types="node" />
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BaseException } from '@angular-devkit/core';
import { Observable } from 'rxjs/Observable';
import { Url } from 'url';
import { MergeStrategy } from '../tree/interface';
import { Workflow } from '../workflow';
import { Collection, CollectionDescription, Engine, EngineHost, Schematic, SchematicDescription, Source, TypedSchematicContext } from './interface';
export declare class UnknownUrlSourceProtocol extends BaseException {
    constructor(url: string);
}
export declare class UnknownCollectionException extends BaseException {
    constructor(name: string);
}
export declare class CircularCollectionException extends BaseException {
    constructor(name: string);
}
export declare class UnknownSchematicException extends BaseException {
    constructor(name: string, collection: CollectionDescription<{}>);
}
export declare class PrivateSchematicException extends BaseException {
    constructor(name: string, collection: CollectionDescription<{}>);
}
export declare class SchematicEngineConflictingException extends BaseException {
    constructor();
}
export declare class UnregisteredTaskException extends BaseException {
    constructor(name: string, schematic?: SchematicDescription<{}, {}>);
}
export declare class SchematicEngine<CollectionT extends object, SchematicT extends object> implements Engine<CollectionT, SchematicT> {
    private _host;
    protected _workflow: Workflow | undefined;
    private _collectionCache;
    private _schematicCache;
    private _taskSchedulers;
    constructor(_host: EngineHost<CollectionT, SchematicT>, _workflow?: Workflow | undefined);
    readonly workflow: Workflow | null;
    readonly defaultMergeStrategy: MergeStrategy;
    createCollection(name: string): Collection<CollectionT, SchematicT>;
    private _createCollectionDescription(name, parentNames?);
    createContext(schematic: Schematic<CollectionT, SchematicT>, parent?: Partial<TypedSchematicContext<CollectionT, SchematicT>>): TypedSchematicContext<CollectionT, SchematicT>;
    createSchematic(name: string, collection: Collection<CollectionT, SchematicT>, allowPrivate?: boolean): Schematic<CollectionT, SchematicT>;
    listSchematicNames(collection: Collection<CollectionT, SchematicT>): string[];
    transformOptions<OptionT extends object, ResultT extends object>(schematic: Schematic<CollectionT, SchematicT>, options: OptionT): Observable<ResultT>;
    createSourceFromUrl(url: Url, context: TypedSchematicContext<CollectionT, SchematicT>): Source;
    executePostTasks(): Observable<void>;
}
