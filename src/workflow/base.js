"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const engine_1 = require("../engine");
const exception_1 = require("../exception/exception");
const formats_1 = require("../formats");
const dryrun_1 = require("../sink/dryrun");
const host_1 = require("../sink/host");
const host_tree_1 = require("../tree/host-tree");
const static_1 = require("../tree/static");
/**
 * Base class for workflows. Even without abstract methods, this class should not be used without
 * surrounding some initialization for the registry and host. This class only adds life cycle and
 * dryrun/force support. You need to provide any registry and task executors that you need to
 * support.
 * See {@see NodeWorkflow} implementation for how to make a specialized subclass of this.
 * TODO: add default set of CoreSchemaRegistry transforms. Once the job refactor is done, use that
 *       as the support for tasks.
 *
 * @public
 */
class BaseWorkflow {
    constructor(options) {
        this._reporter = new rxjs_1.Subject();
        this._lifeCycle = new rxjs_1.Subject();
        this._host = options.host;
        this._engineHost = options.engineHost;
        if (options.registry) {
            this._registry = options.registry;
        }
        else {
            this._registry = new core_1.schema.CoreSchemaRegistry(formats_1.standardFormats);
            this._registry.addPostTransform(core_1.schema.transforms.addUndefinedDefaults);
        }
        this._engine = new engine_1.SchematicEngine(this._engineHost, this);
        this._context = [];
        this._force = options.force || false;
        this._dryRun = options.dryRun || false;
    }
    get context() {
        const maybeContext = this._context[this._context.length - 1];
        if (!maybeContext) {
            throw new Error('Cannot get context when workflow is not executing...');
        }
        return maybeContext;
    }
    get registry() {
        return this._registry;
    }
    get reporter() {
        return this._reporter.asObservable();
    }
    get lifeCycle() {
        return this._lifeCycle.asObservable();
    }
    _createSinks() {
        let error = false;
        const dryRunSink = new dryrun_1.DryRunSink(this._host, this._force);
        const dryRunSubscriber = dryRunSink.reporter.subscribe(event => {
            this._reporter.next(event);
            error = error || (event.kind == 'error');
        });
        // We need two sinks if we want to output what will happen, and actually do the work.
        return [
            dryRunSink,
            // Add a custom sink that clean ourselves and throws an error if an error happened.
            {
                commit() {
                    dryRunSubscriber.unsubscribe();
                    if (error) {
                        return rxjs_1.throwError(new exception_1.UnsuccessfulWorkflowExecution());
                    }
                    return rxjs_1.of();
                },
            },
            // Only add a HostSink if this is not a dryRun.
            ...(!this._dryRun ? [new host_1.HostSink(this._host, this._force)] : []),
        ];
    }
    execute(options) {
        const parentContext = this._context[this._context.length - 1];
        if (!parentContext) {
            this._lifeCycle.next({ kind: 'start' });
        }
        /** Create the collection and the schematic. */
        const collection = this._engine.createCollection(options.collection);
        // Only allow private schematics if called from the same collection.
        const allowPrivate = options.allowPrivate
            || (parentContext && parentContext.collection === options.collection);
        const schematic = collection.createSchematic(options.schematic, allowPrivate);
        const sinks = this._createSinks();
        this._lifeCycle.next({ kind: 'workflow-start' });
        const context = Object.assign({}, options, { debug: options.debug || false, logger: options.logger || (parentContext && parentContext.logger) || new core_1.logging.NullLogger(), parentContext });
        this._context.push(context);
        return schematic.call(options.options, rxjs_1.of(new host_tree_1.HostTree(this._host)), { logger: context.logger }).pipe(operators_1.map(tree => static_1.optimize(tree)), operators_1.concatMap((tree) => {
            // Process all sinks.
            return rxjs_1.of(tree).pipe(...sinks.map(sink => {
                return operators_1.concatMap((tree) => {
                    return rxjs_1.concat(sink.commit(tree).pipe(operators_1.ignoreElements()), rxjs_1.of(tree));
                });
            }));
        }), operators_1.concatMap(() => {
            if (this._dryRun) {
                return rxjs_1.of();
            }
            this._lifeCycle.next({ kind: 'post-tasks-start' });
            return this._engine.executePostTasks()
                .pipe(operators_1.tap({ complete: () => this._lifeCycle.next({ kind: 'post-tasks-end' }) }), operators_1.defaultIfEmpty(), operators_1.last());
        }), operators_1.tap({ complete: () => {
                this._lifeCycle.next({ kind: 'workflow-end' });
                this._context.pop();
                if (this._context.length == 0) {
                    this._lifeCycle.next({ kind: 'end' });
                }
            } }));
    }
}
exports.BaseWorkflow = BaseWorkflow;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvd29ya2Zsb3cvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQUFrRTtBQUNsRSwrQkFBbUU7QUFDbkUsOENBQTJGO0FBQzNGLHNDQUF3RDtBQUN4RCxzREFBdUU7QUFDdkUsd0NBQTZDO0FBQzdDLDJDQUF5RDtBQUN6RCx1Q0FBd0M7QUFFeEMsaURBQTZDO0FBRTdDLDJDQUEwQztBQWtCMUM7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQXNCLFlBQVk7SUFlaEMsWUFBWSxPQUE0QjtRQVI5QixjQUFTLEdBQXlCLElBQUksY0FBTyxFQUFFLENBQUM7UUFDaEQsZUFBVSxHQUE0QixJQUFJLGNBQU8sRUFBRSxDQUFDO1FBUTVELElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztRQUMxQixJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFFdEMsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO1lBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQztTQUNuQzthQUFNO1lBQ0wsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGFBQU0sQ0FBQyxrQkFBa0IsQ0FBQyx5QkFBZSxDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFNLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDekU7UUFFRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksd0JBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTNELElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBRW5CLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFB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QUFFLEVBQUUsQ0FBQzthQUNiO1lBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO1lBRW5ELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRTtpQkFDbkMsSUFBSSxDQUNILGVBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUN6RSwwQkFBYyxFQUFFLEVBQ2hCLGdCQUFJLEVBQUUsQ0FDUCxDQUFDO1FBQ04sQ0FBQyxDQUFDLEVBQ0YsZUFBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRTtnQkFDakIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFFcEIsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7b0JBQzdCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7aUJBQ3ZDO1lBQ0gsQ0FBQyxFQUFDLENBQUMsQ0FDTixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBeEpELG9DQXdKQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IGxvZ2dpbmcsIHNjaGVtYSwgdmlydHVhbEZzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCwgY29uY2F0LCBvZiwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY29uY2F0TWFwLCBkZWZhdWx0SWZFbXB0eSwgaWdub3JlRWxlbWVudHMsIGxhc3QsIG1hcCwgdGFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgRW5naW5lSG9zdCwgU2NoZW1hdGljRW5naW5lIH0gZnJvbSAnLi4vZW5naW5lJztcbmltcG9ydCB7IFVuc3VjY2Vzc2Z1bFdvcmtmbG93RXhlY3V0aW9uIH0gZnJvbSAnLi4vZXhjZXB0aW9uL2V4Y2VwdGlvbic7XG5pbXBvcnQgeyBzdGFuZGFyZEZvcm1hdHMgfSBmcm9tICcuLi9mb3JtYXRzJztcbmltcG9ydCB7IERyeVJ1bkV2ZW50LCBEcnlSdW5TaW5rIH0gZnJvbSAnLi4vc2luay9kcnlydW4nO1xuaW1wb3J0IHsgSG9zdFNpbmsgfSBmcm9tICcuLi9zaW5rL2hvc3QnO1xuaW1wb3J0IHsgU2luayB9IGZyb20gJy4uL3Npbmsvc2luayc7XG5pbXBvcnQgeyBIb3N0VHJlZSB9IGZyb20gJy4uL3RyZWUvaG9zdC10cmVlJztcbmltcG9ydCB7IFRyZWUgfSBmcm9tICcuLi90cmVlL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBvcHRpbWl6ZSB9IGZyb20gJy4uL3RyZWUvc3RhdGljJztcbmltcG9ydCB7XG4gIExpZmVDeWNsZUV2ZW50LFxuICBSZXF1aXJlZFdvcmtmbG93RXhlY3V0aW9uQ29udGV4dCxcbiAgV29ya2Zsb3csXG4gIFdvcmtmbG93RXhlY3V0aW9uQ29udGV4dCxcbn0gZnJvbSAnLi9pbnRlcmZhY2UnO1xuXG5cbmV4cG9ydCBpbnRlcmZhY2UgQmFzZVdvcmtmbG93T3B0aW9ucyB7XG4gIGhvc3Q6IHZpcnR1YWxGcy5Ib3N0O1xuICBlbmdpbmVIb3N0OiBFbmdpbmVIb3N0PHt9LCB7fT47XG4gIHJlZ2lzdHJ5Pzogc2NoZW1hLkNvcmVTY2hlbWFSZWdpc3RyeTtcblxuICBmb3JjZT86IGJvb2xlYW47XG4gIGRyeVJ1bj86IGJvb2xlYW47XG59XG5cbi8qKlxuICogQmFzZSBjbGFzcyBmb3Igd29ya2Zsb3dzLiBFdmVuIHdpdGhvdXQgYWJzdHJhY3QgbWV0aG9kcywgdGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIHVzZWQgd2l0aG91dFxuICogc3Vycm91bmRpbmcgc29tZSBpbml0aWFsaXphdGlvbiBmb3IgdGhlIHJlZ2lzdHJ5IGFuZCBob3N0LiBUaGlzIGNsYXNzIG9ubHkgYWRkcyBsaWZlIGN5Y2xlIGFuZFxuICogZHJ5cnVuL2ZvcmNlIHN1cHBvcnQuIFlvdSBuZWVkIHRvIHByb3ZpZGUgYW55IHJlZ2lzdHJ5IGFuZCB0YXNrIGV4ZWN1dG9ycyB0aGF0IHlvdSBuZWVkIHRvXG4gKiBzdXBwb3J0LlxuICogU2VlIHtAc2VlIE5vZGVXb3JrZmxvd30gaW1wbGVtZW50YXRpb24gZm9yIGhvdyB0byBtYWtlIGEgc3BlY2lhbGl6ZWQgc3ViY2xhc3Mgb2YgdGhpcy5cbiAqIFRPRE86IGFkZCBkZWZhdWx0IHNldCBvZiBDb3JlU2NoZW1hUmVnaXN0cnkgdHJhbnNmb3Jtcy4gT25jZSB0aGUgam9iIHJlZmFjdG9yIGlzIGRvbmUsIHVzZSB0aGF0XG4gKiAgICAgICBhcyB0aGUgc3VwcG9ydCBmb3IgdGFza3MuXG4gKlxuICogQHB1YmxpY1xuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZVdvcmtmbG93IGltcGxlbWVudHMgV29ya2Zsb3cge1xuICBwcm90ZWN0ZWQgX2VuZ2luZTogU2NoZW1hdGljRW5naW5lPHt9LCB7fT47XG4gIHByb3RlY3RlZCBfZW5naW5lSG9zdDogRW5naW5lSG9zdDx7fSwge30+O1xuICBwcm90ZWN0ZWQgX3JlZ2lzdHJ5OiBzY2hlbWEuQ29yZVNjaGVtYVJlZ2lzdHJ5O1xuXG4gIHByb3RlY3RlZCBfaG9zdDogdmlydHVhbEZzLkhvc3Q7XG5cbiAgcHJvdGVjdGVkIF9yZXBvcnRlcjogU3ViamVjdDxEcnlSdW5FdmVudD4gPSBuZXcgU3ViamVjdCgpO1xuICBwcm90ZWN0ZWQgX2xpZmVDeWNsZTogU3ViamVjdDxMaWZlQ3ljbGVFdmVudD4gPSBuZXcgU3ViamVjdCgpO1xuXG4gIHByb3RlY3RlZCBfY29udGV4dDogV29ya2Zsb3dFeGVjdXRpb25Db250ZXh0W107XG5cbiAgcHJvdGVjdGVkIF9mb3JjZTogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIF9kcnlSdW46IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogQmFzZVdvcmtmbG93T3B0aW9ucykge1xuICAgIHRoaXMuX2hvc3QgPSBvcHRpb25zLmhvc3Q7XG4gICAgdGhpcy5fZW5naW5lSG9zdCA9IG9wdGlvbnMuZW5naW5lSG9zdDtcblxuICAgIGlmIChvcHRpb25zLnJlZ2lzdHJ5KSB7XG4gICAgICB0aGlzLl9yZWdpc3RyeSA9IG9wdGlvbnMucmVnaXN0cnk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3JlZ2lzdHJ5ID0gbmV3IHNjaGVtYS5Db3JlU2NoZW1hUmVnaXN0cnkoc3RhbmRhcmRGb3JtYXRzKTtcbiAgICAgIHRoaXMuX3JlZ2lzdHJ5LmFkZFBvc3RUcmFuc2Zvcm0oc2NoZW1hLnRyYW5zZm9ybXMuYWRkVW5kZWZpbmVkRGVmYXVsdHMpO1xuICAgIH1cblxuICAgIHRoaXMuX2VuZ2luZSA9IG5ldyBTY2hlbWF0aWNFbmdpbmUodGhpcy5fZW5naW5lSG9zdCwgdGhpcyk7XG5cbiAgICB0aGlzLl9jb250ZXh0ID0gW107XG5cbiAgICB0aGlzLl9mb3JjZSA9IG9wdGlvbnMuZm9yY2UgfHwgZmFsc2U7XG4gICAgdGhpcy5fZHJ5UnVuID0gb3B0aW9ucy5kcnlSdW4gfHwgZmFsc2U7XG4gIH1cblxuICBnZXQgY29udGV4dCgpOiBSZWFkb25seTxXb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHQ+IHtcbiAgICBjb25zdCBtYXliZUNvbnRleHQgPSB0aGlzLl9jb250ZXh0W3RoaXMuX2NvbnRleHQubGVuZ3RoIC0gMV07XG4gICAgaWYgKCFtYXliZUNvbnRleHQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGdldCBjb250ZXh0IHdoZW4gd29ya2Zsb3cgaXMgbm90IGV4ZWN1dGluZy4uLicpO1xuICAgIH1cblxuICAgIHJldHVybiBtYXliZUNvbnRleHQ7XG4gIH1cbiAgZ2V0IHJlZ2lzdHJ5KCk6IHNjaGVtYS5TY2hlbWFSZWdpc3RyeSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlZ2lzdHJ5O1xuICB9XG4gIGdldCByZXBvcnRlcigpOiBPYnNlcnZhYmxlPERyeVJ1bkV2ZW50PiB7XG4gICAgcmV0dXJuIHRoaXMuX3JlcG9ydGVyLmFzT2JzZXJ2YWJsZSgpO1xuICB9XG4gIGdldCBsaWZlQ3ljbGUoKTogT2JzZXJ2YWJsZTxMaWZlQ3ljbGVFdmVudD4ge1xuICAgIHJldHVybiB0aGlzLl9saWZlQ3ljbGUuYXNPYnNlcnZhYmxlKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX2NyZWF0ZVNpbmtzKCk6IFNpbmtbXSB7XG4gICAgbGV0IGVycm9yID0gZmFsc2U7XG5cbiAgICBjb25zdCBkcnlSdW5TaW5rID0gbmV3IERyeVJ1blNpbmsodGhpcy5faG9zdCwgdGhpcy5fZm9yY2UpO1xuICAgIGNvbnN0IGRyeVJ1blN1YnNjcmliZXIgPSBkcnlSdW5TaW5rLnJlcG9ydGVyLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICB0aGlzLl9yZXBvcnRlci5uZXh0KGV2ZW50KTtcbiAgICAgIGVycm9yID0gZXJyb3IgfHwgKGV2ZW50LmtpbmQgPT0gJ2Vycm9yJyk7XG4gICAgfSk7XG5cbiAgICAvLyBXZSBuZWVkIHR3byBzaW5rcyBpZiB3ZSB3YW50IHRvIG91dHB1dCB3aGF0IHdpbGwgaGFwcGVuLCBhbmQgYWN0dWFsbHkgZG8gdGhlIHdvcmsuXG4gICAgcmV0dXJuIFtcbiAgICAgIGRyeVJ1blNpbmssXG4gICAgICAvLyBBZGQgYSBjdXN0b20gc2luayB0aGF0IGNsZWFuIG91cnNlbHZlcyBhbmQgdGhyb3dzIGFuIGVycm9yIGlmIGFuIGVycm9yIGhhcHBlbmVkLlxuICAgICAge1xuICAgICAgICBjb21taXQoKSB7XG4gICAgICAgICAgZHJ5UnVuU3Vic2NyaWJlci51bnN1YnNjcmliZSgpO1xuICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHRocm93RXJyb3IobmV3IFVuc3VjY2Vzc2Z1bFdvcmtmbG93RXhlY3V0aW9uKCkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBvZigpO1xuICAgICAgICB9LFxuICAgICAgfSxcblxuICAgICAgLy8gT25seSBhZGQgYSBIb3N0U2luayBpZiB0aGlzIGlzIG5vdCBhIGRyeVJ1bi5cbiAgICAgIC4uLighdGhpcy5fZHJ5UnVuID8gW25ldyBIb3N0U2luayh0aGlzLl9ob3N0LCB0aGlzLl9mb3JjZSldIDogW10pLFxuICAgIF07XG4gIH1cblxuICBleGVjdXRlKFxuICAgIG9wdGlvbnM6IFBhcnRpYWw8V29ya2Zsb3dFeGVjdXRpb25Db250ZXh0PiAmIFJlcXVpcmVkV29ya2Zsb3dFeGVjdXRpb25Db250ZXh0LFxuICApOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICBjb25zdCBwYXJlbnRDb250ZXh0ID0gdGhpcy5fY29udGV4dFt0aGlzLl9jb250ZXh0Lmxlbmd0aCAtIDFdO1xuXG4gICAgaWYgKCFwYXJlbnRDb250ZXh0KSB7XG4gICAgICB0aGlzLl9saWZlQ3ljbGUubmV4dCh7IGtpbmQ6ICdzdGFydCcgfSk7XG4gICAgfVxuXG4gICAgLyoqIENyZWF0ZSB0aGUgY29sbGVjdGlvbiBhbmQgdGhlIHNjaGVtYXRpYy4gKi9cbiAgICBjb25zdCBjb2xsZWN0aW9uID0gdGhpcy5fZW5naW5lLmNyZWF0ZUNvbGxlY3Rpb24ob3B0aW9ucy5jb2xsZWN0aW9uKTtcbiAgICAvLyBPbmx5IGFsbG93IHByaXZhdGUgc2NoZW1hdGljcyBpZiBjYWxsZWQgZnJvbSB0aGUgc2FtZSBjb2xsZWN0aW9uLlxuICAgIGNvbnN0IGFsbG93UHJpdmF0ZSA9IG9wdGlvbnMuYWxsb3dQcml2YXRlXG4gICAgICB8fCAocGFyZW50Q29udGV4dCAmJiBwYXJlbnRDb250ZXh0LmNvbGxlY3Rpb24gPT09IG9wdGlvbnMuY29sbGVjdGlvbik7XG4gICAgY29uc3Qgc2NoZW1hdGljID0gY29sbGVjdGlvbi5jcmVhdGVTY2hlbWF0aWMob3B0aW9ucy5zY2hlbWF0aWMsIGFsbG93UHJpdmF0ZSk7XG5cbiAgICBjb25zdCBzaW5rcyA9IHRoaXMuX2NyZWF0ZVNpbmtzKCk7XG5cbiAgICB0aGlzLl9saWZlQ3ljbGUubmV4dCh7IGtpbmQ6ICd3b3JrZmxvdy1zdGFydCcgfSk7XG5cbiAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIGRlYnVnOiBvcHRpb25zLmRlYnVnIHx8IGZhbHNlLFxuICAgICAgbG9nZ2VyOiBvcHRpb25zLmxvZ2dlciB8fCAocGFyZW50Q29udGV4dCAmJiBwYXJlbnRDb250ZXh0LmxvZ2dlcikgfHwgbmV3IGxvZ2dpbmcuTnVsbExvZ2dlcigpLFxuICAgICAgcGFyZW50Q29udGV4dCxcbiAgICB9O1xuICAgIHRoaXMuX2NvbnRleHQucHVzaChjb250ZXh0KTtcblxuICAgIHJldHVybiBzY2hlbWF0aWMuY2FsbChcbiAgICAgIG9wdGlvbnMub3B0aW9ucyxcbiAgICAgIG9mKG5ldyBIb3N0VHJlZSh0aGlzLl9ob3N0KSksXG4gICAgICB7IGxvZ2dlcjogY29udGV4dC5sb2dnZXIgfSxcbiAgICApLnBpcGUoXG4gICAgICBtYXAodHJlZSA9PiBvcHRpbWl6ZSh0cmVlKSksXG4gICAgICBjb25jYXRNYXAoKHRyZWU6IFRyZWUpID0+IHtcbiAgICAgICAgLy8gUHJvY2VzcyBhbGwgc2lua3MuXG4gICAgICAgIHJldHVybiBvZih0cmVlKS5waXBlKFxuICAgICAgICAgIC4uLnNpbmtzLm1hcChzaW5rID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjb25jYXRNYXAoKHRyZWU6IFRyZWUpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNvbmNhdChcbiAgICAgICAgICAgICAgICBzaW5rLmNvbW1pdCh0cmVlKS5waXBlKGlnbm9yZUVsZW1lbnRzKCkpLFxuICAgICAgICAgICAgICAgIG9mKHRyZWUpLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgICB9KSxcbiAgICAgIGNvbmNhdE1hcCgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9kcnlSdW4pIHtcbiAgICAgICAgICByZXR1cm4gb2YoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2xpZmVDeWNsZS5uZXh0KHsga2luZDogJ3Bvc3QtdGFza3Mtc3RhcnQnIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9lbmdpbmUuZXhlY3V0ZVBvc3RUYXNrcygpXG4gICAgICAgICAgLnBpcGUoXG4gICAgICAgICAgICB0YXAoeyBjb21wbGV0ZTogKCkgPT4gdGhpcy5fbGlmZUN5Y2xlLm5leHQoeyBraW5kOiAncG9zdC10YXNrcy1lbmQnIH0pIH0pLFxuICAgICAgICAgICAgZGVmYXVsdElmRW1wdHkoKSxcbiAgICAgICAgICAgIGxhc3QoKSxcbiAgICAgICAgICApO1xuICAgICAgfSksXG4gICAgICB0YXAoeyBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX2xpZmVDeWNsZS5uZXh0KHsga2luZDogJ3dvcmtmbG93LWVuZCcgfSk7XG4gICAgICAgICAgdGhpcy5fY29udGV4dC5wb3AoKTtcblxuICAgICAgICAgIGlmICh0aGlzLl9jb250ZXh0Lmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICB0aGlzLl9saWZlQ3ljbGUubmV4dCh7IGtpbmQ6ICdlbmQnIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfX0pLFxuICAgICk7XG4gIH1cbn1cbiJdfQ==