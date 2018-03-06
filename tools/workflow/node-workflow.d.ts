/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { virtualFs } from '@angular-devkit/core';
import { DryRunSink, SchematicEngine, Sink, workflow } from '@angular-devkit/schematics';
import { Observable } from 'rxjs/Observable';
import { NodeModulesEngineHost } from '..';
import { DryRunEvent } from '../../src/sink/dryrun';
export declare class NodeWorkflow implements workflow.Workflow {
    protected _host: virtualFs.Host;
    protected _options: {
        force?: boolean;
        dryRun?: boolean;
    };
    protected _engine: SchematicEngine<{}, {}>;
    protected _engineHost: NodeModulesEngineHost;
    protected _dryRunSink: DryRunSink;
    protected _fsSink: Sink;
    protected _context: workflow.WorkflowExecutionContext[];
    constructor(_host: virtualFs.Host, _options: {
        force?: boolean;
        dryRun?: boolean;
    });
    readonly context: Readonly<workflow.WorkflowExecutionContext>;
    readonly reporter: Observable<DryRunEvent>;
    execute(options: Partial<workflow.WorkflowExecutionContext> & workflow.RequiredWorkflowExecutionContext): Observable<void>;
}
