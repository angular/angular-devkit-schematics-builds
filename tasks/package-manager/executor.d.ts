/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { TaskExecutor } from '../../src';
import { NodePackageTaskFactoryOptions, NodePackageTaskOptions } from './options';
export default function (factoryOptions?: NodePackageTaskFactoryOptions): TaskExecutor<NodePackageTaskOptions>;
