/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { strings } from '@angular-devkit/core';
import * as formats from './formats/index';
import { FilePredicate, MergeStrategy, Tree as TreeInterface } from './tree/interface';
import * as workflow from './workflow/index';
export { SchematicsException } from './exception/exception';
export * from './tree/action';
export * from './engine/index';
export * from './exception/exception';
export * from './tree/interface';
export * from './rules/base';
export * from './rules/call';
export * from './rules/move';
export * from './rules/random';
export * from './rules/schematic';
export * from './rules/template';
export * from './rules/url';
export * from './tree/delegate';
export * from './tree/empty';
export * from './tree/host-tree';
export type { UpdateRecorder } from './tree/interface';
export * from './engine/schematic';
export * from './sink/dryrun';
export * from './sink/host';
export * from './sink/sink';
export { formats, strings, workflow };
export interface TreeConstructor {
    empty(): TreeInterface;
    branch(tree: TreeInterface): TreeInterface;
    merge(tree: TreeInterface, other: TreeInterface, strategy?: MergeStrategy): TreeInterface;
    partition(tree: TreeInterface, predicate: FilePredicate<boolean>): [TreeInterface, TreeInterface];
    optimize(tree: TreeInterface): TreeInterface;
}
export type Tree = TreeInterface;
export declare const Tree: TreeConstructor;
