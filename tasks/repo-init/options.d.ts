/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
export declare const RepositoryInitializerName = "repo-init";
export interface RepositoryInitializerTaskFactoryOptions {
    rootDirectory?: string;
}
export interface RepositoryInitializerTaskOptions {
    workingDirectory?: string;
    commit?: boolean;
    message?: string;
    authorName?: string;
    authorEmail?: string;
}
