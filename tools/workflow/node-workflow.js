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
const schematics_1 = require("@angular-devkit/schematics"); // tslint:disable-line:no-implicit-dependencies
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const __1 = require("..");
const node_1 = require("../../tasks/node");
class NodeWorkflow {
    constructor(_host, _options) {
        this._host = _host;
        this._options = _options;
        this._reporter = new rxjs_1.Subject();
        this._lifeCycle = new rxjs_1.Subject();
        /**
         * Create the SchematicEngine, which is used by the Schematic library as callbacks to load a
         * Collection or a Schematic.
         */
        this._engineHost = new __1.NodeModulesEngineHost();
        this._engine = new schematics_1.SchematicEngine(this._engineHost, this);
        // Add support for schemaJson.
        this._registry = new core_1.schema.CoreSchemaRegistry(schematics_1.formats.standardFormats);
        this._engineHost.registerOptionsTransform(__1.validateOptionsWithSchema(this._registry));
        this._engineHost.registerTaskExecutor(node_1.BuiltinTaskExecutor.NodePackage, {
            allowPackageManagerOverride: true,
            packageManager: this._options.packageManager,
            rootDirectory: this._options.root,
        });
        this._engineHost.registerTaskExecutor(node_1.BuiltinTaskExecutor.RepositoryInitializer, {
            rootDirectory: this._options.root,
        });
        this._engineHost.registerTaskExecutor(node_1.BuiltinTaskExecutor.RunSchematic);
        this._engineHost.registerTaskExecutor(node_1.BuiltinTaskExecutor.TslintFix);
        this._context = [];
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
        const dryRunSink = new schematics_1.DryRunSink(this._host, this._options.force);
        const fsSink = new schematics_1.HostSink(this._host, this._options.force);
        let error = false;
        const dryRunSubscriber = dryRunSink.reporter.subscribe(event => {
            this._reporter.next(event);
            error = error || (event.kind == 'error');
        });
        this._lifeCycle.next({ kind: 'workflow-start' });
        const context = Object.assign({}, options, { debug: options.debug || false, logger: options.logger || (parentContext && parentContext.logger) || new core_1.logging.NullLogger(), parentContext });
        this._context.push(context);
        return schematic.call(options.options, rxjs_1.of(new schematics_1.HostTree(this._host)), { logger: context.logger }).pipe(operators_1.map(tree => schematics_1.Tree.optimize(tree)), operators_1.concatMap((tree) => {
            return rxjs_1.concat(dryRunSink.commit(tree).pipe(operators_1.ignoreElements()), rxjs_1.of(tree));
        }), operators_1.concatMap((tree) => {
            dryRunSubscriber.unsubscribe();
            if (error) {
                return rxjs_1.throwError(new schematics_1.UnsuccessfulWorkflowExecution());
            }
            if (this._options.dryRun) {
                return rxjs_1.of();
            }
            return fsSink.commit(tree).pipe(operators_1.defaultIfEmpty(), operators_1.last());
        }), operators_1.concatMap(() => {
            if (this._options.dryRun) {
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
exports.NodeWorkflow = NodeWorkflow;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS13b3JrZmxvdy5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90b29scy93b3JrZmxvdy9ub2RlLXdvcmtmbG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQXdFO0FBQ3hFLDJEQVNvQyxDQUFFLCtDQUErQztBQUNyRiwrQkFBbUU7QUFDbkUsOENBQTJGO0FBQzNGLDBCQUFzRTtBQUV0RSwyQ0FBdUQ7QUFFdkQ7SUFVRSxZQUNZLEtBQXFCLEVBQ3JCLFFBS1Q7UUFOUyxVQUFLLEdBQUwsS0FBSyxDQUFnQjtRQUNyQixhQUFRLEdBQVIsUUFBUSxDQUtqQjtRQVpPLGNBQVMsR0FBeUIsSUFBSSxjQUFPLEVBQUUsQ0FBQztRQUNoRCxlQUFVLEdBQXFDLElBQUksY0FBTyxFQUFFLENBQUM7UUFhckU7OztXQUdHO1FBQ0gsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLHlCQUFxQixFQUFFLENBQUM7UUFDL0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLDRCQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUzRCw4QkFBOEI7UUFDOUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGFBQU0sQ0FBQyxrQkFBa0IsQ0FBQyxvQkFBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3hFLElBQUksQ0FBQyxXQUFXLENBQUMsd0JBQXdCLENBQUMsNkJBQXlCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFFckYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FDbkMsMEJBQW1CLENBQUMsV0FBVyxFQUMvQjtZQUNFLDJCQUEyQixFQUFFLElBQUk7WUFDakMsY0FBYyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYztZQUM1QyxhQUFhLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJ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Q0FBQyxFQUFDLENBQUMsQ0FDSixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBMUpELG9DQTBKQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IFBhdGgsIGxvZ2dpbmcsIHNjaGVtYSwgdmlydHVhbEZzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtcbiAgRHJ5UnVuU2luayxcbiAgSG9zdFNpbmssXG4gIEhvc3RUcmVlLFxuICBTY2hlbWF0aWNFbmdpbmUsXG4gIFRyZWUsXG4gIFVuc3VjY2Vzc2Z1bFdvcmtmbG93RXhlY3V0aW9uLFxuICBmb3JtYXRzLFxuICB3b3JrZmxvdyxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnOyAgLy8gdHNsaW50OmRpc2FibGUtbGluZTpuby1pbXBsaWNpdC1kZXBlbmRlbmNpZXNcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QsIGNvbmNhdCwgb2YsIHRocm93RXJyb3IgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGNvbmNhdE1hcCwgZGVmYXVsdElmRW1wdHksIGlnbm9yZUVsZW1lbnRzLCBsYXN0LCBtYXAsIHRhcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IE5vZGVNb2R1bGVzRW5naW5lSG9zdCwgdmFsaWRhdGVPcHRpb25zV2l0aFNjaGVtYSB9IGZyb20gJy4uJztcbmltcG9ydCB7IERyeVJ1bkV2ZW50IH0gZnJvbSAnLi4vLi4vc3JjL3NpbmsvZHJ5cnVuJztcbmltcG9ydCB7IEJ1aWx0aW5UYXNrRXhlY3V0b3IgfSBmcm9tICcuLi8uLi90YXNrcy9ub2RlJztcblxuZXhwb3J0IGNsYXNzIE5vZGVXb3JrZmxvdyBpbXBsZW1lbnRzIHdvcmtmbG93LldvcmtmbG93IHtcbiAgcHJvdGVjdGVkIF9lbmdpbmU6IFNjaGVtYXRpY0VuZ2luZTx7fSwge30+O1xuICBwcm90ZWN0ZWQgX2VuZ2luZUhvc3Q6IE5vZGVNb2R1bGVzRW5naW5lSG9zdDtcbiAgcHJvdGVjdGVkIF9yZWdpc3RyeTogc2NoZW1hLkNvcmVTY2hlbWFSZWdpc3RyeTtcblxuICBwcm90ZWN0ZWQgX3JlcG9ydGVyOiBTdWJqZWN0PERyeVJ1bkV2ZW50PiA9IG5ldyBTdWJqZWN0KCk7XG4gIHByb3RlY3RlZCBfbGlmZUN5Y2xlOiBTdWJqZWN0PHdvcmtmbG93LkxpZmVDeWNsZUV2ZW50PiA9IG5ldyBTdWJqZWN0KCk7XG5cbiAgcHJvdGVjdGVkIF9jb250ZXh0OiB3b3JrZmxvdy5Xb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHRbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcm90ZWN0ZWQgX2hvc3Q6IHZpcnR1YWxGcy5Ib3N0LFxuICAgIHByb3RlY3RlZCBfb3B0aW9uczoge1xuICAgICAgZm9yY2U/OiBib29sZWFuO1xuICAgICAgZHJ5UnVuPzogYm9vbGVhbjtcbiAgICAgIHJvb3Q/OiBQYXRoLFxuICAgICAgcGFja2FnZU1hbmFnZXI/OiBzdHJpbmc7XG4gICAgfSxcbiAgKSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIHRoZSBTY2hlbWF0aWNFbmdpbmUsIHdoaWNoIGlzIHVzZWQgYnkgdGhlIFNjaGVtYXRpYyBsaWJyYXJ5IGFzIGNhbGxiYWNrcyB0byBsb2FkIGFcbiAgICAgKiBDb2xsZWN0aW9uIG9yIGEgU2NoZW1hdGljLlxuICAgICAqL1xuICAgIHRoaXMuX2VuZ2luZUhvc3QgPSBuZXcgTm9kZU1vZHVsZXNFbmdpbmVIb3N0KCk7XG4gICAgdGhpcy5fZW5naW5lID0gbmV3IFNjaGVtYXRpY0VuZ2luZSh0aGlzLl9lbmdpbmVIb3N0LCB0aGlzKTtcblxuICAgIC8vIEFkZCBzdXBwb3J0IGZvciBzY2hlbWFKc29uLlxuICAgIHRoaXMuX3JlZ2lzdHJ5ID0gbmV3IHNjaGVtYS5Db3JlU2NoZW1hUmVnaXN0cnkoZm9ybWF0cy5zdGFuZGFyZEZvcm1hdHMpO1xuICAgIHRoaXMuX2VuZ2luZUhvc3QucmVnaXN0ZXJPcHRpb25zVHJhbnNmb3JtKHZhbGlkYXRlT3B0aW9uc1dpdGhTY2hlbWEodGhpcy5fcmVnaXN0cnkpKTtcblxuICAgIHRoaXMuX2VuZ2luZUhvc3QucmVnaXN0ZXJUYXNrRXhlY3V0b3IoXG4gICAgICBCdWlsdGluVGFza0V4ZWN1dG9yLk5vZGVQYWNrYWdlLFxuICAgICAge1xuICAgICAgICBhbGxvd1BhY2thZ2VNYW5hZ2VyT3ZlcnJpZGU6IHRydWUsXG4gICAgICAgIHBhY2thZ2VNYW5hZ2VyOiB0aGlzLl9vcHRpb25zLnBhY2thZ2VNYW5hZ2VyLFxuICAgICAgICByb290RGlyZWN0b3J5OiB0aGlzLl9vcHRpb25zLnJvb3QsXG4gICAgICB9LFxuICAgICk7XG4gICAgdGhpcy5fZW5naW5lSG9zdC5yZWdpc3RlclRhc2tFeGVjdXRvcihcbiAgICAgIEJ1aWx0aW5UYXNrRXhlY3V0b3IuUmVwb3NpdG9yeUluaXRpYWxpemVyLFxuICAgICAge1xuICAgICAgICByb290RGlyZWN0b3J5OiB0aGlzLl9vcHRpb25zLnJvb3QsXG4gICAgICB9LFxuICAgICk7XG4gICAgdGhpcy5fZW5naW5lSG9zdC5yZWdpc3RlclRhc2tFeGVjdXRvcihCdWlsdGluVGFza0V4ZWN1dG9yLlJ1blNjaGVtYXRpYyk7XG4gICAgdGhpcy5fZW5naW5lSG9zdC5yZWdpc3RlclRhc2tFeGVjdXRvcihCdWlsdGluVGFza0V4ZWN1dG9yLlRzbGludEZpeCk7XG5cbiAgICB0aGlzLl9jb250ZXh0ID0gW107XG4gIH1cblxuICBnZXQgY29udGV4dCgpOiBSZWFkb25seTx3b3JrZmxvdy5Xb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHQ+IHtcbiAgICBjb25zdCBtYXliZUNvbnRleHQgPSB0aGlzLl9jb250ZXh0W3RoaXMuX2NvbnRleHQubGVuZ3RoIC0gMV07XG4gICAgaWYgKCFtYXliZUNvbnRleHQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGdldCBjb250ZXh0IHdoZW4gd29ya2Zsb3cgaXMgbm90IGV4ZWN1dGluZy4uLicpO1xuICAgIH1cblxuICAgIHJldHVybiBtYXliZUNvbnRleHQ7XG4gIH1cbiAgZ2V0IHJlZ2lzdHJ5KCk6IHNjaGVtYS5TY2hlbWFSZWdpc3RyeSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlZ2lzdHJ5O1xuICB9XG4gIGdldCByZXBvcnRlcigpOiBPYnNlcnZhYmxlPERyeVJ1bkV2ZW50PiB7XG4gICAgcmV0dXJuIHRoaXMuX3JlcG9ydGVyLmFzT2JzZXJ2YWJsZSgpO1xuICB9XG4gIGdldCBsaWZlQ3ljbGUoKTogT2JzZXJ2YWJsZTx3b3JrZmxvdy5MaWZlQ3ljbGVFdmVudD4ge1xuICAgIHJldHVybiB0aGlzLl9saWZlQ3ljbGUuYXNPYnNlcnZhYmxlKCk7XG4gIH1cblxuICBleGVjdXRlKFxuICAgIG9wdGlvbnM6IFBhcnRpYWw8d29ya2Zsb3cuV29ya2Zsb3dFeGVjdXRpb25Db250ZXh0PiAmIHdvcmtmbG93LlJlcXVpcmVkV29ya2Zsb3dFeGVjdXRpb25Db250ZXh0LFxuICApOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICBjb25zdCBwYXJlbnRDb250ZXh0ID0gdGhpcy5fY29udGV4dFt0aGlzLl9jb250ZXh0Lmxlbmd0aCAtIDFdO1xuXG4gICAgaWYgKCFwYXJlbnRDb250ZXh0KSB7XG4gICAgICB0aGlzLl9saWZlQ3ljbGUubmV4dCh7IGtpbmQ6ICdzdGFydCcgfSk7XG4gICAgfVxuXG4gICAgLyoqIENyZWF0ZSB0aGUgY29sbGVjdGlvbiBhbmQgdGhlIHNjaGVtYXRpYy4gKi9cbiAgICBjb25zdCBjb2xsZWN0aW9uID0gdGhpcy5fZW5naW5lLmNyZWF0ZUNvbGxlY3Rpb24ob3B0aW9ucy5jb2xsZWN0aW9uKTtcbiAgICAvLyBPbmx5IGFsbG93IHByaXZhdGUgc2NoZW1hdGljcyBpZiBjYWxsZWQgZnJvbSB0aGUgc2FtZSBjb2xsZWN0aW9uLlxuICAgIGNvbnN0IGFsbG93UHJpdmF0ZSA9IG9wdGlvbnMuYWxsb3dQcml2YXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgfHwgKHBhcmVudENvbnRleHQgJiYgcGFyZW50Q29udGV4dC5jb2xsZWN0aW9uID09PSBvcHRpb25zLmNvbGxlY3Rpb24pO1xuICAgIGNvbnN0IHNjaGVtYXRpYyA9IGNvbGxlY3Rpb24uY3JlYXRlU2NoZW1hdGljKG9wdGlvbnMuc2NoZW1hdGljLCBhbGxvd1ByaXZhdGUpO1xuXG4gICAgLy8gV2UgbmVlZCB0d28gc2lua3MgaWYgd2Ugd2FudCB0byBvdXRwdXQgd2hhdCB3aWxsIGhhcHBlbiwgYW5kIGFjdHVhbGx5IGRvIHRoZSB3b3JrLlxuICAgIC8vIE5vdGUgdGhhdCBmc1NpbmsgaXMgdGVjaG5pY2FsbHkgbm90IHVzZWQgaWYgYC0tZHJ5LXJ1bmAgaXMgcGFzc2VkLCBidXQgY3JlYXRpbmcgdGhlIFNpbmtcbiAgICAvLyBkb2VzIG5vdCBoYXZlIGFueSBzaWRlIGVmZmVjdC5cbiAgICBjb25zdCBkcnlSdW5TaW5rID0gbmV3IERyeVJ1blNpbmsodGhpcy5faG9zdCwgdGhpcy5fb3B0aW9ucy5mb3JjZSk7XG4gICAgY29uc3QgZnNTaW5rID0gbmV3IEhvc3RTaW5rKHRoaXMuX2hvc3QsIHRoaXMuX29wdGlvbnMuZm9yY2UpO1xuXG4gICAgbGV0IGVycm9yID0gZmFsc2U7XG4gICAgY29uc3QgZHJ5UnVuU3Vic2NyaWJlciA9IGRyeVJ1blNpbmsucmVwb3J0ZXIuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIHRoaXMuX3JlcG9ydGVyLm5leHQoZXZlbnQpO1xuICAgICAgZXJyb3IgPSBlcnJvciB8fCAoZXZlbnQua2luZCA9PSAnZXJyb3InKTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2xpZmVDeWNsZS5uZXh0KHsga2luZDogJ3dvcmtmbG93LXN0YXJ0JyB9KTtcblxuICAgIGNvbnN0IGNvbnRleHQgPSB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgZGVidWc6IG9wdGlvbnMuZGVidWcgfHwgZmFsc2UsXG4gICAgICBsb2dnZXI6IG9wdGlvbnMubG9nZ2VyIHx8IChwYXJlbnRDb250ZXh0ICYmIHBhcmVudENvbnRleHQubG9nZ2VyKSB8fCBuZXcgbG9nZ2luZy5OdWxsTG9nZ2VyKCksXG4gICAgICBwYXJlbnRDb250ZXh0LFxuICAgIH07XG4gICAgdGhpcy5fY29udGV4dC5wdXNoKGNvbnRleHQpO1xuXG4gICAgcmV0dXJuIHNjaGVtYXRpYy5jYWxsKFxuICAgICAgb3B0aW9ucy5vcHRpb25zLFxuICAgICAgb2YobmV3IEhvc3RUcmVlKHRoaXMuX2hvc3QpKSxcbiAgICAgIHsgbG9nZ2VyOiBjb250ZXh0LmxvZ2dlciB9LFxuICAgICkucGlwZShcbiAgICAgIG1hcCh0cmVlID0+IFRyZWUub3B0aW1pemUodHJlZSkpLFxuICAgICAgY29uY2F0TWFwKCh0cmVlOiBUcmVlKSA9PiB7XG4gICAgICAgIHJldHVybiBjb25jYXQoXG4gICAgICAgICAgZHJ5UnVuU2luay5jb21taXQodHJlZSkucGlwZShpZ25vcmVFbGVtZW50cygpKSxcbiAgICAgICAgICBvZih0cmVlKSxcbiAgICAgICAgKTtcbiAgICAgIH0pLFxuICAgICAgY29uY2F0TWFwKCh0cmVlOiBUcmVlKSA9PiB7XG4gICAgICAgIGRyeVJ1blN1YnNjcmliZXIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgcmV0dXJuIHRocm93RXJyb3IobmV3IFVuc3VjY2Vzc2Z1bFdvcmtmbG93RXhlY3V0aW9uKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX29wdGlvbnMuZHJ5UnVuKSB7XG4gICAgICAgICAgcmV0dXJuIG9mKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZnNTaW5rLmNvbW1pdCh0cmVlKS5waXBlKGRlZmF1bHRJZkVtcHR5KCksIGxhc3QoKSk7XG4gICAgICB9KSxcbiAgICAgIGNvbmNhdE1hcCgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9vcHRpb25zLmRyeVJ1bikge1xuICAgICAgICAgIHJldHVybiBvZigpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fbGlmZUN5Y2xlLm5leHQoeyBraW5kOiAncG9zdC10YXNrcy1zdGFydCcgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2VuZ2luZS5leGVjdXRlUG9zdFRhc2tzKClcbiAgICAgICAgICAucGlwZShcbiAgICAgICAgICAgIHRhcCh7IGNvbXBsZXRlOiAoKSA9PiB0aGlzLl9saWZlQ3ljbGUubmV4dCh7IGtpbmQ6ICdwb3N0LXRhc2tzLWVuZCcgfSkgfSksXG4gICAgICAgICAgICBkZWZhdWx0SWZFbXB0eSgpLFxuICAgICAgICAgICAgbGFzdCgpLFxuICAgICAgICAgICk7XG4gICAgICB9KSxcbiAgICAgIHRhcCh7IGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgIHRoaXMuX2xpZmVDeWNsZS5uZXh0KHsga2luZDogJ3dvcmtmbG93LWVuZCcgfSk7XG4gICAgICAgIHRoaXMuX2NvbnRleHQucG9wKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuX2NvbnRleHQubGVuZ3RoID09IDApIHtcbiAgICAgICAgICB0aGlzLl9saWZlQ3ljbGUubmV4dCh7IGtpbmQ6ICdlbmQnIH0pO1xuICAgICAgICB9XG4gICAgICB9fSksXG4gICAgKTtcbiAgfVxufVxuIl19