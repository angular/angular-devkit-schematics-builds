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
        // We need two sinks if we want to output what will happen, and actually do the work.
        // Note that fsSink is technically not used if `--dry-run` is passed, but creating the Sink
        // does not have any side effect.
        const dryRunSink = new dryrun_1.DryRunSink(this._host, this._force);
        const fsSink = new host_1.HostSink(this._host, this._force);
        let error = false;
        const dryRunSubscriber = dryRunSink.reporter.subscribe(event => {
            this._reporter.next(event);
            error = error || (event.kind == 'error');
        });
        this._lifeCycle.next({ kind: 'workflow-start' });
        const context = Object.assign({}, options, { debug: options.debug || false, logger: options.logger || (parentContext && parentContext.logger) || new core_1.logging.NullLogger(), parentContext });
        this._context.push(context);
        return schematic.call(options.options, rxjs_1.of(new host_tree_1.HostTree(this._host)), { logger: context.logger }).pipe(operators_1.map(tree => static_1.optimize(tree)), operators_1.concatMap((tree) => {
            return rxjs_1.concat(dryRunSink.commit(tree).pipe(operators_1.ignoreElements()), rxjs_1.of(tree));
        }), operators_1.concatMap((tree) => {
            dryRunSubscriber.unsubscribe();
            if (error) {
                return rxjs_1.throwError(new exception_1.UnsuccessfulWorkflowExecution());
            }
            if (this._dryRun) {
                return rxjs_1.of();
            }
            return fsSink.commit(tree).pipe(operators_1.defaultIfEmpty(), operators_1.last());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvd29ya2Zsb3cvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQUFrRTtBQUNsRSwrQkFBbUU7QUFDbkUsOENBQTJGO0FBQzNGLHNDQUF3RDtBQUN4RCxzREFBdUU7QUFDdkUsd0NBQTZDO0FBQzdDLDJDQUF5RDtBQUN6RCx1Q0FBd0M7QUFDeEMsaURBQTZDO0FBRTdDLDJDQUEwQztBQWtCMUM7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQXNCLFlBQVk7SUFlaEMsWUFBWSxPQUE0QjtRQVI5QixjQUFTLEdBQXlCLElBQUksY0FBTyxFQUFFLENBQUM7UUFDaEQsZUFBVSxHQUE0QixJQUFJLGNBQU8sRUFBRSxDQUFDO1FBUTVELElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztRQUMxQixJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFFdEMsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO1lBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQztTQUNuQzthQUFNO1lBQ0wsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGFBQU0sQ0FBQyxrQkFBa0IsQ0FBQyx5QkFBZSxDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFNLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDekU7UUFFRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksd0JBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTNELElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBRW5CLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFB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VUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUN6RSwwQkFBYyxFQUFFLEVBQ2hCLGdCQUFJLEVBQUUsQ0FDUCxDQUFDO1FBQ04sQ0FBQyxDQUFDLEVBQ0YsZUFBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRTtnQkFDakIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFFcEIsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7b0JBQzdCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7aUJBQ3ZDO1lBQ0gsQ0FBQyxFQUFDLENBQUMsQ0FDTixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBMUlELG9DQTBJQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IGxvZ2dpbmcsIHNjaGVtYSwgdmlydHVhbEZzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCwgY29uY2F0LCBvZiwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY29uY2F0TWFwLCBkZWZhdWx0SWZFbXB0eSwgaWdub3JlRWxlbWVudHMsIGxhc3QsIG1hcCwgdGFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgRW5naW5lSG9zdCwgU2NoZW1hdGljRW5naW5lIH0gZnJvbSAnLi4vZW5naW5lJztcbmltcG9ydCB7IFVuc3VjY2Vzc2Z1bFdvcmtmbG93RXhlY3V0aW9uIH0gZnJvbSAnLi4vZXhjZXB0aW9uL2V4Y2VwdGlvbic7XG5pbXBvcnQgeyBzdGFuZGFyZEZvcm1hdHMgfSBmcm9tICcuLi9mb3JtYXRzJztcbmltcG9ydCB7IERyeVJ1bkV2ZW50LCBEcnlSdW5TaW5rIH0gZnJvbSAnLi4vc2luay9kcnlydW4nO1xuaW1wb3J0IHsgSG9zdFNpbmsgfSBmcm9tICcuLi9zaW5rL2hvc3QnO1xuaW1wb3J0IHsgSG9zdFRyZWUgfSBmcm9tICcuLi90cmVlL2hvc3QtdHJlZSc7XG5pbXBvcnQgeyBUcmVlIH0gZnJvbSAnLi4vdHJlZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgb3B0aW1pemUgfSBmcm9tICcuLi90cmVlL3N0YXRpYyc7XG5pbXBvcnQge1xuICBMaWZlQ3ljbGVFdmVudCxcbiAgUmVxdWlyZWRXb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHQsXG4gIFdvcmtmbG93LFxuICBXb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHQsXG59IGZyb20gJy4vaW50ZXJmYWNlJztcblxuXG5leHBvcnQgaW50ZXJmYWNlIEJhc2VXb3JrZmxvd09wdGlvbnMge1xuICBob3N0OiB2aXJ0dWFsRnMuSG9zdDtcbiAgZW5naW5lSG9zdDogRW5naW5lSG9zdDx7fSwge30+O1xuICByZWdpc3RyeT86IHNjaGVtYS5Db3JlU2NoZW1hUmVnaXN0cnk7XG5cbiAgZm9yY2U/OiBib29sZWFuO1xuICBkcnlSdW4/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIHdvcmtmbG93cy4gRXZlbiB3aXRob3V0IGFic3RyYWN0IG1ldGhvZHMsIHRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSB1c2VkIHdpdGhvdXRcbiAqIHN1cnJvdW5kaW5nIHNvbWUgaW5pdGlhbGl6YXRpb24gZm9yIHRoZSByZWdpc3RyeSBhbmQgaG9zdC4gVGhpcyBjbGFzcyBvbmx5IGFkZHMgbGlmZSBjeWNsZSBhbmRcbiAqIGRyeXJ1bi9mb3JjZSBzdXBwb3J0LiBZb3UgbmVlZCB0byBwcm92aWRlIGFueSByZWdpc3RyeSBhbmQgdGFzayBleGVjdXRvcnMgdGhhdCB5b3UgbmVlZCB0b1xuICogc3VwcG9ydC5cbiAqIFNlZSB7QHNlZSBOb2RlV29ya2Zsb3d9IGltcGxlbWVudGF0aW9uIGZvciBob3cgdG8gbWFrZSBhIHNwZWNpYWxpemVkIHN1YmNsYXNzIG9mIHRoaXMuXG4gKiBUT0RPOiBhZGQgZGVmYXVsdCBzZXQgb2YgQ29yZVNjaGVtYVJlZ2lzdHJ5IHRyYW5zZm9ybXMuIE9uY2UgdGhlIGpvYiByZWZhY3RvciBpcyBkb25lLCB1c2UgdGhhdFxuICogICAgICAgYXMgdGhlIHN1cHBvcnQgZm9yIHRhc2tzLlxuICpcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VXb3JrZmxvdyBpbXBsZW1lbnRzIFdvcmtmbG93IHtcbiAgcHJvdGVjdGVkIF9lbmdpbmU6IFNjaGVtYXRpY0VuZ2luZTx7fSwge30+O1xuICBwcm90ZWN0ZWQgX2VuZ2luZUhvc3Q6IEVuZ2luZUhvc3Q8e30sIHt9PjtcbiAgcHJvdGVjdGVkIF9yZWdpc3RyeTogc2NoZW1hLkNvcmVTY2hlbWFSZWdpc3RyeTtcblxuICBwcm90ZWN0ZWQgX2hvc3Q6IHZpcnR1YWxGcy5Ib3N0O1xuXG4gIHByb3RlY3RlZCBfcmVwb3J0ZXI6IFN1YmplY3Q8RHJ5UnVuRXZlbnQ+ID0gbmV3IFN1YmplY3QoKTtcbiAgcHJvdGVjdGVkIF9saWZlQ3ljbGU6IFN1YmplY3Q8TGlmZUN5Y2xlRXZlbnQ+ID0gbmV3IFN1YmplY3QoKTtcblxuICBwcm90ZWN0ZWQgX2NvbnRleHQ6IFdvcmtmbG93RXhlY3V0aW9uQ29udGV4dFtdO1xuXG4gIHByb3RlY3RlZCBfZm9yY2U6IGJvb2xlYW47XG4gIHByb3RlY3RlZCBfZHJ5UnVuOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IEJhc2VXb3JrZmxvd09wdGlvbnMpIHtcbiAgICB0aGlzLl9ob3N0ID0gb3B0aW9ucy5ob3N0O1xuICAgIHRoaXMuX2VuZ2luZUhvc3QgPSBvcHRpb25zLmVuZ2luZUhvc3Q7XG5cbiAgICBpZiAob3B0aW9ucy5yZWdpc3RyeSkge1xuICAgICAgdGhpcy5fcmVnaXN0cnkgPSBvcHRpb25zLnJlZ2lzdHJ5O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9yZWdpc3RyeSA9IG5ldyBzY2hlbWEuQ29yZVNjaGVtYVJlZ2lzdHJ5KHN0YW5kYXJkRm9ybWF0cyk7XG4gICAgICB0aGlzLl9yZWdpc3RyeS5hZGRQb3N0VHJhbnNmb3JtKHNjaGVtYS50cmFuc2Zvcm1zLmFkZFVuZGVmaW5lZERlZmF1bHRzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9lbmdpbmUgPSBuZXcgU2NoZW1hdGljRW5naW5lKHRoaXMuX2VuZ2luZUhvc3QsIHRoaXMpO1xuXG4gICAgdGhpcy5fY29udGV4dCA9IFtdO1xuXG4gICAgdGhpcy5fZm9yY2UgPSBvcHRpb25zLmZvcmNlIHx8IGZhbHNlO1xuICAgIHRoaXMuX2RyeVJ1biA9IG9wdGlvbnMuZHJ5UnVuIHx8IGZhbHNlO1xuICB9XG5cbiAgZ2V0IGNvbnRleHQoKTogUmVhZG9ubHk8V29ya2Zsb3dFeGVjdXRpb25Db250ZXh0PiB7XG4gICAgY29uc3QgbWF5YmVDb250ZXh0ID0gdGhpcy5fY29udGV4dFt0aGlzLl9jb250ZXh0Lmxlbmd0aCAtIDFdO1xuICAgIGlmICghbWF5YmVDb250ZXh0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBnZXQgY29udGV4dCB3aGVuIHdvcmtmbG93IGlzIG5vdCBleGVjdXRpbmcuLi4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWF5YmVDb250ZXh0O1xuICB9XG4gIGdldCByZWdpc3RyeSgpOiBzY2hlbWEuU2NoZW1hUmVnaXN0cnkge1xuICAgIHJldHVybiB0aGlzLl9yZWdpc3RyeTtcbiAgfVxuICBnZXQgcmVwb3J0ZXIoKTogT2JzZXJ2YWJsZTxEcnlSdW5FdmVudD4ge1xuICAgIHJldHVybiB0aGlzLl9yZXBvcnRlci5hc09ic2VydmFibGUoKTtcbiAgfVxuICBnZXQgbGlmZUN5Y2xlKCk6IE9ic2VydmFibGU8TGlmZUN5Y2xlRXZlbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5fbGlmZUN5Y2xlLmFzT2JzZXJ2YWJsZSgpO1xuICB9XG5cbiAgZXhlY3V0ZShcbiAgICBvcHRpb25zOiBQYXJ0aWFsPFdvcmtmbG93RXhlY3V0aW9uQ29udGV4dD4gJiBSZXF1aXJlZFdvcmtmbG93RXhlY3V0aW9uQ29udGV4dCxcbiAgKTogT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgY29uc3QgcGFyZW50Q29udGV4dCA9IHRoaXMuX2NvbnRleHRbdGhpcy5fY29udGV4dC5sZW5ndGggLSAxXTtcblxuICAgIGlmICghcGFyZW50Q29udGV4dCkge1xuICAgICAgdGhpcy5fbGlmZUN5Y2xlLm5leHQoeyBraW5kOiAnc3RhcnQnIH0pO1xuICAgIH1cblxuICAgIC8qKiBDcmVhdGUgdGhlIGNvbGxlY3Rpb24gYW5kIHRoZSBzY2hlbWF0aWMuICovXG4gICAgY29uc3QgY29sbGVjdGlvbiA9IHRoaXMuX2VuZ2luZS5jcmVhdGVDb2xsZWN0aW9uKG9wdGlvbnMuY29sbGVjdGlvbik7XG4gICAgLy8gT25seSBhbGxvdyBwcml2YXRlIHNjaGVtYXRpY3MgaWYgY2FsbGVkIGZyb20gdGhlIHNhbWUgY29sbGVjdGlvbi5cbiAgICBjb25zdCBhbGxvd1ByaXZhdGUgPSBvcHRpb25zLmFsbG93UHJpdmF0ZVxuICAgICAgfHwgKHBhcmVudENvbnRleHQgJiYgcGFyZW50Q29udGV4dC5jb2xsZWN0aW9uID09PSBvcHRpb25zLmNvbGxlY3Rpb24pO1xuICAgIGNvbnN0IHNjaGVtYXRpYyA9IGNvbGxlY3Rpb24uY3JlYXRlU2NoZW1hdGljKG9wdGlvbnMuc2NoZW1hdGljLCBhbGxvd1ByaXZhdGUpO1xuXG4gICAgLy8gV2UgbmVlZCB0d28gc2lua3MgaWYgd2Ugd2FudCB0byBvdXRwdXQgd2hhdCB3aWxsIGhhcHBlbiwgYW5kIGFjdHVhbGx5IGRvIHRoZSB3b3JrLlxuICAgIC8vIE5vdGUgdGhhdCBmc1NpbmsgaXMgdGVjaG5pY2FsbHkgbm90IHVzZWQgaWYgYC0tZHJ5LXJ1bmAgaXMgcGFzc2VkLCBidXQgY3JlYXRpbmcgdGhlIFNpbmtcbiAgICAvLyBkb2VzIG5vdCBoYXZlIGFueSBzaWRlIGVmZmVjdC5cbiAgICBjb25zdCBkcnlSdW5TaW5rID0gbmV3IERyeVJ1blNpbmsodGhpcy5faG9zdCwgdGhpcy5fZm9yY2UpO1xuICAgIGNvbnN0IGZzU2luayA9IG5ldyBIb3N0U2luayh0aGlzLl9ob3N0LCB0aGlzLl9mb3JjZSk7XG5cbiAgICBsZXQgZXJyb3IgPSBmYWxzZTtcbiAgICBjb25zdCBkcnlSdW5TdWJzY3JpYmVyID0gZHJ5UnVuU2luay5yZXBvcnRlci5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgdGhpcy5fcmVwb3J0ZXIubmV4dChldmVudCk7XG4gICAgICBlcnJvciA9IGVycm9yIHx8IChldmVudC5raW5kID09ICdlcnJvcicpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fbGlmZUN5Y2xlLm5leHQoeyBraW5kOiAnd29ya2Zsb3ctc3RhcnQnIH0pO1xuXG4gICAgY29uc3QgY29udGV4dCA9IHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBkZWJ1Zzogb3B0aW9ucy5kZWJ1ZyB8fCBmYWxzZSxcbiAgICAgIGxvZ2dlcjogb3B0aW9ucy5sb2dnZXIgfHwgKHBhcmVudENvbnRleHQgJiYgcGFyZW50Q29udGV4dC5sb2dnZXIpIHx8IG5ldyBsb2dnaW5nLk51bGxMb2dnZXIoKSxcbiAgICAgIHBhcmVudENvbnRleHQsXG4gICAgfTtcbiAgICB0aGlzLl9jb250ZXh0LnB1c2goY29udGV4dCk7XG5cbiAgICByZXR1cm4gc2NoZW1hdGljLmNhbGwoXG4gICAgICBvcHRpb25zLm9wdGlvbnMsXG4gICAgICBvZihuZXcgSG9zdFRyZWUodGhpcy5faG9zdCkpLFxuICAgICAgeyBsb2dnZXI6IGNvbnRleHQubG9nZ2VyIH0sXG4gICAgKS5waXBlKFxuICAgICAgbWFwKHRyZWUgPT4gb3B0aW1pemUodHJlZSkpLFxuICAgICAgY29uY2F0TWFwKCh0cmVlOiBUcmVlKSA9PiB7XG4gICAgICAgIHJldHVybiBjb25jYXQoXG4gICAgICAgICAgZHJ5UnVuU2luay5jb21taXQodHJlZSkucGlwZShpZ25vcmVFbGVtZW50cygpKSxcbiAgICAgICAgICBvZih0cmVlKSxcbiAgICAgICAgKTtcbiAgICAgIH0pLFxuICAgICAgY29uY2F0TWFwKCh0cmVlOiBUcmVlKSA9PiB7XG4gICAgICAgIGRyeVJ1blN1YnNjcmliZXIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgcmV0dXJuIHRocm93RXJyb3IobmV3IFVuc3VjY2Vzc2Z1bFdvcmtmbG93RXhlY3V0aW9uKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2RyeVJ1bikge1xuICAgICAgICAgIHJldHVybiBvZigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZzU2luay5jb21taXQodHJlZSkucGlwZShkZWZhdWx0SWZFbXB0eSgpLCBsYXN0KCkpO1xuICAgICAgfSksXG4gICAgICBjb25jYXRNYXAoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fZHJ5UnVuKSB7XG4gICAgICAgICAgcmV0dXJuIG9mKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9saWZlQ3ljbGUubmV4dCh7IGtpbmQ6ICdwb3N0LXRhc2tzLXN0YXJ0JyB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fZW5naW5lLmV4ZWN1dGVQb3N0VGFza3MoKVxuICAgICAgICAgIC5waXBlKFxuICAgICAgICAgICAgdGFwKHsgY29tcGxldGU6ICgpID0+IHRoaXMuX2xpZmVDeWNsZS5uZXh0KHsga2luZDogJ3Bvc3QtdGFza3MtZW5kJyB9KSB9KSxcbiAgICAgICAgICAgIGRlZmF1bHRJZkVtcHR5KCksXG4gICAgICAgICAgICBsYXN0KCksXG4gICAgICAgICAgKTtcbiAgICAgIH0pLFxuICAgICAgdGFwKHsgY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLl9saWZlQ3ljbGUubmV4dCh7IGtpbmQ6ICd3b3JrZmxvdy1lbmQnIH0pO1xuICAgICAgICAgIHRoaXMuX2NvbnRleHQucG9wKCk7XG5cbiAgICAgICAgICBpZiAodGhpcy5fY29udGV4dC5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgdGhpcy5fbGlmZUN5Y2xlLm5leHQoeyBraW5kOiAnZW5kJyB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH19KSxcbiAgICApO1xuICB9XG59XG4iXX0=