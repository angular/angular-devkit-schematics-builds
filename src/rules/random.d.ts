/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { Source } from '../engine/interface';
export interface RandomOptions {
    root?: string;
    multi?: boolean | number;
    multiFiles?: boolean | number;
}
export default function (options: RandomOptions): Source;
