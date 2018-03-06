/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TaskConfiguration, TaskConfigurationGenerator } from '../../src';
import { RunSchematicTaskOptions } from './options';
export declare class RunSchematicTask implements TaskConfigurationGenerator<RunSchematicTaskOptions> {
    protected _collection: string;
    protected _schematic: string;
    protected _options: object;
    constructor(_collection: string, _schematic: string, _options: object);
    toConfiguration(): TaskConfiguration<RunSchematicTaskOptions>;
}
