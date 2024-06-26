/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { schema } from '@angular-devkit/core';
import { Observable } from 'rxjs';
import { FileSystemSchematicContext, FileSystemSchematicDescription } from './description';
export declare class InvalidInputOptions<T = {}> extends schema.SchemaValidationException {
    constructor(options: T, errors: schema.SchemaValidatorError[]);
}
export declare function validateOptionsWithSchema(registry: schema.SchemaRegistry): <T extends {} | null>(schematic: FileSystemSchematicDescription, options: T, context?: FileSystemSchematicContext) => Observable<T>;
