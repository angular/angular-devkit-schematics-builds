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
    get engine() {
        return this._engine;
    }
    get engineHost() {
        return this._engineHost;
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
            return rxjs_1.concat(rxjs_1.from(sinks).pipe(operators_1.concatMap(sink => sink.commit(tree)), operators_1.ignoreElements()), rxjs_1.of(tree));
        }), operators_1.concatMap(() => {
            if (this._dryRun) {
                return rxjs_1.EMPTY;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvd29ya2Zsb3cvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQUFrRTtBQUNsRSwrQkFBZ0Y7QUFDaEYsOENBQTJGO0FBQzNGLHNDQUFnRTtBQUNoRSxzREFBdUU7QUFDdkUsd0NBQTZDO0FBQzdDLDJDQUF5RDtBQUN6RCx1Q0FBd0M7QUFFeEMsaURBQTZDO0FBRTdDLDJDQUEwQztBQWtCMUM7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQXNCLFlBQVk7SUFlaEMsWUFBWSxPQUE0QjtRQVI5QixjQUFTLEdBQXlCLElBQUksY0FBTyxFQUFFLENBQUM7UUFDaEQsZUFBVSxHQUE0QixJQUFJLGNBQU8sRUFBRSxDQUFDO1FBUTVELElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztRQUMxQixJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFFdEMsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO1lBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQztTQUNuQzthQUFNO1lBQ0wsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGFBQU0sQ0FBQyxrQkFBa0IsQ0FBQyx5QkFBZSxDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFNLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDekU7UUFFRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksd0JBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTNELElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBRW5CLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFB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LENBQUM7YUFDZDtZQUVELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQztZQUVuRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUU7aUJBQ25DLElBQUksQ0FDSCxlQUFHLENBQUMsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDekUsMEJBQWMsRUFBRSxFQUNoQixnQkFBSSxFQUFFLENBQ1AsQ0FBQztRQUNOLENBQUMsQ0FBQyxFQUNGLGVBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUU7Z0JBQ2pCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBRXBCLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO29CQUM3QixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2lCQUN2QztZQUNILENBQUMsRUFBQyxDQUFDLENBQ04sQ0FBQztJQUNKLENBQUM7Q0FDRjtBQTNKRCxvQ0EySkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBsb2dnaW5nLCBzY2hlbWEsIHZpcnR1YWxGcyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IEVNUFRZLCBPYnNlcnZhYmxlLCBTdWJqZWN0LCBjb25jYXQsIGZyb20sIG9mLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjb25jYXRNYXAsIGRlZmF1bHRJZkVtcHR5LCBpZ25vcmVFbGVtZW50cywgbGFzdCwgbWFwLCB0YXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBFbmdpbmUsIEVuZ2luZUhvc3QsIFNjaGVtYXRpY0VuZ2luZSB9IGZyb20gJy4uL2VuZ2luZSc7XG5pbXBvcnQgeyBVbnN1Y2Nlc3NmdWxXb3JrZmxvd0V4ZWN1dGlvbiB9IGZyb20gJy4uL2V4Y2VwdGlvbi9leGNlcHRpb24nO1xuaW1wb3J0IHsgc3RhbmRhcmRGb3JtYXRzIH0gZnJvbSAnLi4vZm9ybWF0cyc7XG5pbXBvcnQgeyBEcnlSdW5FdmVudCwgRHJ5UnVuU2luayB9IGZyb20gJy4uL3NpbmsvZHJ5cnVuJztcbmltcG9ydCB7IEhvc3RTaW5rIH0gZnJvbSAnLi4vc2luay9ob3N0JztcbmltcG9ydCB7IFNpbmsgfSBmcm9tICcuLi9zaW5rL3NpbmsnO1xuaW1wb3J0IHsgSG9zdFRyZWUgfSBmcm9tICcuLi90cmVlL2hvc3QtdHJlZSc7XG5pbXBvcnQgeyBUcmVlIH0gZnJvbSAnLi4vdHJlZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgb3B0aW1pemUgfSBmcm9tICcuLi90cmVlL3N0YXRpYyc7XG5pbXBvcnQge1xuICBMaWZlQ3ljbGVFdmVudCxcbiAgUmVxdWlyZWRXb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHQsXG4gIFdvcmtmbG93LFxuICBXb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHQsXG59IGZyb20gJy4vaW50ZXJmYWNlJztcblxuXG5leHBvcnQgaW50ZXJmYWNlIEJhc2VXb3JrZmxvd09wdGlvbnMge1xuICBob3N0OiB2aXJ0dWFsRnMuSG9zdDtcbiAgZW5naW5lSG9zdDogRW5naW5lSG9zdDx7fSwge30+O1xuICByZWdpc3RyeT86IHNjaGVtYS5Db3JlU2NoZW1hUmVnaXN0cnk7XG5cbiAgZm9yY2U/OiBib29sZWFuO1xuICBkcnlSdW4/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIHdvcmtmbG93cy4gRXZlbiB3aXRob3V0IGFic3RyYWN0IG1ldGhvZHMsIHRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSB1c2VkIHdpdGhvdXRcbiAqIHN1cnJvdW5kaW5nIHNvbWUgaW5pdGlhbGl6YXRpb24gZm9yIHRoZSByZWdpc3RyeSBhbmQgaG9zdC4gVGhpcyBjbGFzcyBvbmx5IGFkZHMgbGlmZSBjeWNsZSBhbmRcbiAqIGRyeXJ1bi9mb3JjZSBzdXBwb3J0LiBZb3UgbmVlZCB0byBwcm92aWRlIGFueSByZWdpc3RyeSBhbmQgdGFzayBleGVjdXRvcnMgdGhhdCB5b3UgbmVlZCB0b1xuICogc3VwcG9ydC5cbiAqIFNlZSB7QHNlZSBOb2RlV29ya2Zsb3d9IGltcGxlbWVudGF0aW9uIGZvciBob3cgdG8gbWFrZSBhIHNwZWNpYWxpemVkIHN1YmNsYXNzIG9mIHRoaXMuXG4gKiBUT0RPOiBhZGQgZGVmYXVsdCBzZXQgb2YgQ29yZVNjaGVtYVJlZ2lzdHJ5IHRyYW5zZm9ybXMuIE9uY2UgdGhlIGpvYiByZWZhY3RvciBpcyBkb25lLCB1c2UgdGhhdFxuICogICAgICAgYXMgdGhlIHN1cHBvcnQgZm9yIHRhc2tzLlxuICpcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VXb3JrZmxvdyBpbXBsZW1lbnRzIFdvcmtmbG93IHtcbiAgcHJvdGVjdGVkIF9lbmdpbmU6IEVuZ2luZTx7fSwge30+O1xuICBwcm90ZWN0ZWQgX2VuZ2luZUhvc3Q6IEVuZ2luZUhvc3Q8e30sIHt9PjtcbiAgcHJvdGVjdGVkIF9yZWdpc3RyeTogc2NoZW1hLkNvcmVTY2hlbWFSZWdpc3RyeTtcblxuICBwcm90ZWN0ZWQgX2hvc3Q6IHZpcnR1YWxGcy5Ib3N0O1xuXG4gIHByb3RlY3RlZCBfcmVwb3J0ZXI6IFN1YmplY3Q8RHJ5UnVuRXZlbnQ+ID0gbmV3IFN1YmplY3QoKTtcbiAgcHJvdGVjdGVkIF9saWZlQ3ljbGU6IFN1YmplY3Q8TGlmZUN5Y2xlRXZlbnQ+ID0gbmV3IFN1YmplY3QoKTtcblxuICBwcm90ZWN0ZWQgX2NvbnRleHQ6IFdvcmtmbG93RXhlY3V0aW9uQ29udGV4dFtdO1xuXG4gIHByb3RlY3RlZCBfZm9yY2U6IGJvb2xlYW47XG4gIHByb3RlY3RlZCBfZHJ5UnVuOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IEJhc2VXb3JrZmxvd09wdGlvbnMpIHtcbiAgICB0aGlzLl9ob3N0ID0gb3B0aW9ucy5ob3N0O1xuICAgIHRoaXMuX2VuZ2luZUhvc3QgPSBvcHRpb25zLmVuZ2luZUhvc3Q7XG5cbiAgICBpZiAob3B0aW9ucy5yZWdpc3RyeSkge1xuICAgICAgdGhpcy5fcmVnaXN0cnkgPSBvcHRpb25zLnJlZ2lzdHJ5O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9yZWdpc3RyeSA9IG5ldyBzY2hlbWEuQ29yZVNjaGVtYVJlZ2lzdHJ5KHN0YW5kYXJkRm9ybWF0cyk7XG4gICAgICB0aGlzLl9yZWdpc3RyeS5hZGRQb3N0VHJhbnNmb3JtKHNjaGVtYS50cmFuc2Zvcm1zLmFkZFVuZGVmaW5lZERlZmF1bHRzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9lbmdpbmUgPSBuZXcgU2NoZW1hdGljRW5naW5lKHRoaXMuX2VuZ2luZUhvc3QsIHRoaXMpO1xuXG4gICAgdGhpcy5fY29udGV4dCA9IFtdO1xuXG4gICAgdGhpcy5fZm9yY2UgPSBvcHRpb25zLmZvcmNlIHx8IGZhbHNlO1xuICAgIHRoaXMuX2RyeVJ1biA9IG9wdGlvbnMuZHJ5UnVuIHx8IGZhbHNlO1xuICB9XG5cbiAgZ2V0IGNvbnRleHQoKTogUmVhZG9ubHk8V29ya2Zsb3dFeGVjdXRpb25Db250ZXh0PiB7XG4gICAgY29uc3QgbWF5YmVDb250ZXh0ID0gdGhpcy5fY29udGV4dFt0aGlzLl9jb250ZXh0Lmxlbmd0aCAtIDFdO1xuICAgIGlmICghbWF5YmVDb250ZXh0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBnZXQgY29udGV4dCB3aGVuIHdvcmtmbG93IGlzIG5vdCBleGVjdXRpbmcuLi4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWF5YmVDb250ZXh0O1xuICB9XG4gIGdldCBlbmdpbmUoKTogRW5naW5lPHt9LCB7fT4ge1xuICAgIHJldHVybiB0aGlzLl9lbmdpbmU7XG4gIH1cbiAgZ2V0IGVuZ2luZUhvc3QoKTogRW5naW5lSG9zdDx7fSwge30+IHtcbiAgICByZXR1cm4gdGhpcy5fZW5naW5lSG9zdDtcbiAgfVxuICBnZXQgcmVnaXN0cnkoKTogc2NoZW1hLlNjaGVtYVJlZ2lzdHJ5IHtcbiAgICByZXR1cm4gdGhpcy5fcmVnaXN0cnk7XG4gIH1cbiAgZ2V0IHJlcG9ydGVyKCk6IE9ic2VydmFibGU8RHJ5UnVuRXZlbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5fcmVwb3J0ZXIuYXNPYnNlcnZhYmxlKCk7XG4gIH1cbiAgZ2V0IGxpZmVDeWNsZSgpOiBPYnNlcnZhYmxlPExpZmVDeWNsZUV2ZW50PiB7XG4gICAgcmV0dXJuIHRoaXMuX2xpZmVDeWNsZS5hc09ic2VydmFibGUoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfY3JlYXRlU2lua3MoKTogU2lua1tdIHtcbiAgICBsZXQgZXJyb3IgPSBmYWxzZTtcblxuICAgIGNvbnN0IGRyeVJ1blNpbmsgPSBuZXcgRHJ5UnVuU2luayh0aGlzLl9ob3N0LCB0aGlzLl9mb3JjZSk7XG4gICAgY29uc3QgZHJ5UnVuU3Vic2NyaWJlciA9IGRyeVJ1blNpbmsucmVwb3J0ZXIuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuX3JlcG9ydGVyLm5leHQoZXZlbnQpO1xuICAgICAgZXJyb3IgPSBlcnJvciB8fCAoZXZlbnQua2luZCA9PSAnZXJyb3InKTtcbiAgICB9KTtcblxuICAgIC8vIFdlIG5lZWQgdHdvIHNpbmtzIGlmIHdlIHdhbnQgdG8gb3V0cHV0IHdoYXQgd2lsbCBoYXBwZW4sIGFuZCBhY3R1YWxseSBkbyB0aGUgd29yay5cbiAgICByZXR1cm4gW1xuICAgICAgZHJ5UnVuU2luayxcbiAgICAgIC8vIEFkZCBhIGN1c3RvbSBzaW5rIHRoYXQgY2xlYW4gb3Vyc2VsdmVzIGFuZCB0aHJvd3MgYW4gZXJyb3IgaWYgYW4gZXJyb3IgaGFwcGVuZWQuXG4gICAgICB7XG4gICAgICAgIGNvbW1pdCgpIHtcbiAgICAgICAgICBkcnlSdW5TdWJzY3JpYmVyLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihuZXcgVW5zdWNjZXNzZnVsV29ya2Zsb3dFeGVjdXRpb24oKSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIG9mKCk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuXG4gICAgICAvLyBPbmx5IGFkZCBhIEhvc3RTaW5rIGlmIHRoaXMgaXMgbm90IGEgZHJ5UnVuLlxuICAgICAgLi4uKCF0aGlzLl9kcnlSdW4gPyBbbmV3IEhvc3RTaW5rKHRoaXMuX2hvc3QsIHRoaXMuX2ZvcmNlKV0gOiBbXSksXG4gICAgXTtcbiAgfVxuXG4gIGV4ZWN1dGUoXG4gICAgb3B0aW9uczogUGFydGlhbDxXb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHQ+ICYgUmVxdWlyZWRXb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHQsXG4gICk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIGNvbnN0IHBhcmVudENvbnRleHQgPSB0aGlzLl9jb250ZXh0W3RoaXMuX2NvbnRleHQubGVuZ3RoIC0gMV07XG5cbiAgICBpZiAoIXBhcmVudENvbnRleHQpIHtcbiAgICAgIHRoaXMuX2xpZmVDeWNsZS5uZXh0KHsga2luZDogJ3N0YXJ0JyB9KTtcbiAgICB9XG5cbiAgICAvKiogQ3JlYXRlIHRoZSBjb2xsZWN0aW9uIGFuZCB0aGUgc2NoZW1hdGljLiAqL1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSB0aGlzLl9lbmdpbmUuY3JlYXRlQ29sbGVjdGlvbihvcHRpb25zLmNvbGxlY3Rpb24pO1xuICAgIC8vIE9ubHkgYWxsb3cgcHJpdmF0ZSBzY2hlbWF0aWNzIGlmIGNhbGxlZCBmcm9tIHRoZSBzYW1lIGNvbGxlY3Rpb24uXG4gICAgY29uc3QgYWxsb3dQcml2YXRlID0gb3B0aW9ucy5hbGxvd1ByaXZhdGVcbiAgICAgIHx8IChwYXJlbnRDb250ZXh0ICYmIHBhcmVudENvbnRleHQuY29sbGVjdGlvbiA9PT0gb3B0aW9ucy5jb2xsZWN0aW9uKTtcbiAgICBjb25zdCBzY2hlbWF0aWMgPSBjb2xsZWN0aW9uLmNyZWF0ZVNjaGVtYXRpYyhvcHRpb25zLnNjaGVtYXRpYywgYWxsb3dQcml2YXRlKTtcblxuICAgIGNvbnN0IHNpbmtzID0gdGhpcy5fY3JlYXRlU2lua3MoKTtcblxuICAgIHRoaXMuX2xpZmVDeWNsZS5uZXh0KHsga2luZDogJ3dvcmtmbG93LXN0YXJ0JyB9KTtcblxuICAgIGNvbnN0IGNvbnRleHQgPSB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgZGVidWc6IG9wdGlvbnMuZGVidWcgfHwgZmFsc2UsXG4gICAgICBsb2dnZXI6IG9wdGlvbnMubG9nZ2VyIHx8IChwYXJlbnRDb250ZXh0ICYmIHBhcmVudENvbnRleHQubG9nZ2VyKSB8fCBuZXcgbG9nZ2luZy5OdWxsTG9nZ2VyKCksXG4gICAgICBwYXJlbnRDb250ZXh0LFxuICAgIH07XG4gICAgdGhpcy5fY29udGV4dC5wdXNoKGNvbnRleHQpO1xuXG4gICAgcmV0dXJuIHNjaGVtYXRpYy5jYWxsKFxuICAgICAgb3B0aW9ucy5vcHRpb25zLFxuICAgICAgb2YobmV3IEhvc3RUcmVlKHRoaXMuX2hvc3QpKSxcbiAgICAgIHsgbG9nZ2VyOiBjb250ZXh0LmxvZ2dlciB9LFxuICAgICkucGlwZShcbiAgICAgIG1hcCh0cmVlID0+IG9wdGltaXplKHRyZWUpKSxcbiAgICAgIGNvbmNhdE1hcCgodHJlZTogVHJlZSkgPT4ge1xuICAgICAgICAvLyBQcm9jZXNzIGFsbCBzaW5rcy5cbiAgICAgICAgcmV0dXJuIGNvbmNhdChcbiAgICAgICAgICBmcm9tKHNpbmtzKS5waXBlKFxuICAgICAgICAgICAgY29uY2F0TWFwKHNpbmsgPT4gc2luay5jb21taXQodHJlZSkpLFxuICAgICAgICAgICAgaWdub3JlRWxlbWVudHMoKSxcbiAgICAgICAgICApLFxuICAgICAgICAgIG9mKHRyZWUpLFxuICAgICAgICApO1xuICAgICAgfSksXG4gICAgICBjb25jYXRNYXAoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fZHJ5UnVuKSB7XG4gICAgICAgICAgcmV0dXJuIEVNUFRZO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fbGlmZUN5Y2xlLm5leHQoeyBraW5kOiAncG9zdC10YXNrcy1zdGFydCcgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2VuZ2luZS5leGVjdXRlUG9zdFRhc2tzKClcbiAgICAgICAgICAucGlwZShcbiAgICAgICAgICAgIHRhcCh7IGNvbXBsZXRlOiAoKSA9PiB0aGlzLl9saWZlQ3ljbGUubmV4dCh7IGtpbmQ6ICdwb3N0LXRhc2tzLWVuZCcgfSkgfSksXG4gICAgICAgICAgICBkZWZhdWx0SWZFbXB0eSgpLFxuICAgICAgICAgICAgbGFzdCgpLFxuICAgICAgICAgICk7XG4gICAgICB9KSxcbiAgICAgIHRhcCh7IGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5fbGlmZUN5Y2xlLm5leHQoeyBraW5kOiAnd29ya2Zsb3ctZW5kJyB9KTtcbiAgICAgICAgICB0aGlzLl9jb250ZXh0LnBvcCgpO1xuXG4gICAgICAgICAgaWYgKHRoaXMuX2NvbnRleHQubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2xpZmVDeWNsZS5uZXh0KHsga2luZDogJ2VuZCcgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9fSksXG4gICAgKTtcbiAgfVxufVxuIl19