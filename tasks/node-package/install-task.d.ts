/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TaskConfiguration, TaskConfigurationGenerator } from '../../src';
import { NodePackageTaskOptions } from './options';
export declare class NodePackageInstallTaskOptions {
    packageManager: string;
    workingDirectory: string;
    quiet: boolean;
}
export declare class NodePackageInstallTask implements TaskConfigurationGenerator<NodePackageTaskOptions> {
    quiet: boolean;
    workingDirectory?: string;
    packageManager?: string;
    constructor(workingDirectory?: string);
    constructor(options: Partial<NodePackageInstallTaskOptions>);
    toConfiguration(): TaskConfiguration<NodePackageTaskOptions>;
}
