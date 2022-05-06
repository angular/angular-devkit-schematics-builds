"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchematicTestRunner = exports.UnitTestTree = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const src_1 = require("../src");
const call_1 = require("../src/rules/call");
const node_1 = require("../tasks/node");
const tools_1 = require("../tools");
class UnitTestTree extends src_1.DelegateTree {
    get files() {
        const result = [];
        this.visit((path) => result.push(path));
        return result;
    }
    readContent(path) {
        const buffer = this.read(path);
        if (buffer === null) {
            return '';
        }
        return buffer.toString();
    }
}
exports.UnitTestTree = UnitTestTree;
class SchematicTestRunner {
    constructor(_collectionName, collectionPath) {
        this._collectionName = _collectionName;
        this._engineHost = new tools_1.NodeModulesTestEngineHost();
        this._engine = new src_1.SchematicEngine(this._engineHost);
        this._engineHost.registerCollection(_collectionName, collectionPath);
        this._logger = new core_1.logging.Logger('test');
        const registry = new core_1.schema.CoreSchemaRegistry(src_1.formats.standardFormats);
        registry.addPostTransform(core_1.schema.transforms.addUndefinedDefaults);
        this._engineHost.registerOptionsTransform((0, tools_1.validateOptionsWithSchema)(registry));
        this._engineHost.registerTaskExecutor(node_1.BuiltinTaskExecutor.NodePackage);
        this._engineHost.registerTaskExecutor(node_1.BuiltinTaskExecutor.RepositoryInitializer);
        this._engineHost.registerTaskExecutor(node_1.BuiltinTaskExecutor.RunSchematic);
        this._collection = this._engine.createCollection(this._collectionName);
    }
    get engine() {
        return this._engine;
    }
    get logger() {
        return this._logger;
    }
    get tasks() {
        return [...this._engineHost.tasks];
    }
    registerCollection(collectionName, collectionPath) {
        this._engineHost.registerCollection(collectionName, collectionPath);
    }
    runSchematicAsync(schematicName, opts, tree) {
        const schematic = this._collection.createSchematic(schematicName, true);
        const host = (0, rxjs_1.of)(tree || new src_1.HostTree());
        this._engineHost.clearTasks();
        return schematic
            .call(opts || {}, host, { logger: this._logger })
            .pipe((0, operators_1.map)((tree) => new UnitTestTree(tree)));
    }
    runExternalSchematicAsync(collectionName, schematicName, opts, tree) {
        const externalCollection = this._engine.createCollection(collectionName);
        const schematic = externalCollection.createSchematic(schematicName, true);
        const host = (0, rxjs_1.of)(tree || new src_1.HostTree());
        this._engineHost.clearTasks();
        return schematic
            .call(opts || {}, host, { logger: this._logger })
            .pipe((0, operators_1.map)((tree) => new UnitTestTree(tree)));
    }
    callRule(rule, tree, parentContext) {
        const context = this._engine.createContext({}, parentContext);
        return (0, call_1.callRule)(rule, (0, rxjs_1.of)(tree), context);
    }
}
exports.SchematicTestRunner = SchematicTestRunner;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hdGljLXRlc3QtcnVubmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90ZXN0aW5nL3NjaGVtYXRpYy10ZXN0LXJ1bm5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBdUQ7QUFDdkQsK0JBQXNEO0FBQ3RELDhDQUFxQztBQUNyQyxnQ0FXZ0I7QUFDaEIsNENBQTZDO0FBQzdDLHdDQUFvRDtBQUNwRCxvQ0FBZ0Y7QUFFaEYsTUFBYSxZQUFhLFNBQVEsa0JBQVk7SUFDNUMsSUFBSSxLQUFLO1FBQ1AsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUV4QyxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQsV0FBVyxDQUFDLElBQVk7UUFDdEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7WUFDbkIsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUVELE9BQU8sTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzNCLENBQUM7Q0FDRjtBQWhCRCxvQ0FnQkM7QUFFRCxNQUFhLG1CQUFtQjtJQU05QixZQUFvQixlQUF1QixFQUFFLGNBQXNCO1FBQS9DLG9CQUFlLEdBQWYsZUFBZSxDQUFRO1FBTG5DLGdCQUFXLEdBQUcsSUFBSSxpQ0FBeUIsRUFBRSxDQUFDO1FBQzlDLFlBQU8sR0FBNEIsSUFBSSxxQkFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUsvRSxJQUFJLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLGVB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SUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRCxRQUFRLENBQUMsSUFBVSxFQUFFLElBQVUsRUFBRSxhQUF5QztRQUN4RSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUF1QixFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRW5GLE9BQU8sSUFBQSxlQUFRLEVBQUMsSUFBSSxFQUFFLElBQUEsU0FBWSxFQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3JELENBQUM7Q0FDRjtBQXRFRCxrREFzRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgbG9nZ2luZywgc2NoZW1hIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1xuICBDb2xsZWN0aW9uLFxuICBEZWxlZ2F0ZVRyZWUsXG4gIEhvc3RUcmVlLFxuICBSdWxlLFxuICBTY2hlbWF0aWMsXG4gIFNjaGVtYXRpY0NvbnRleHQsXG4gIFNjaGVtYXRpY0VuZ2luZSxcbiAgVGFza0NvbmZpZ3VyYXRpb24sXG4gIFRyZWUsXG4gIGZvcm1hdHMsXG59IGZyb20gJy4uL3NyYyc7XG5pbXBvcnQgeyBjYWxsUnVsZSB9IGZyb20gJy4uL3NyYy9ydWxlcy9jYWxsJztcbmltcG9ydCB7IEJ1aWx0aW5UYXNrRXhlY3V0b3IgfSBmcm9tICcuLi90YXNrcy9ub2RlJztcbmltcG9ydCB7IE5vZGVNb2R1bGVzVGVzdEVuZ2luZUhvc3QsIHZhbGlkYXRlT3B0aW9uc1dpdGhTY2hlbWEgfSBmcm9tICcuLi90b29scyc7XG5cbmV4cG9ydCBjbGFzcyBVbml0VGVzdFRyZWUgZXh0ZW5kcyBEZWxlZ2F0ZVRyZWUge1xuICBnZXQgZmlsZXMoKSB7XG4gICAgY29uc3QgcmVzdWx0OiBzdHJpbmdbXSA9IFtdO1xuICAgIHRoaXMudmlzaXQoKHBhdGgpID0+IHJlc3VsdC5wdXNoKHBhdGgpKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICByZWFkQ29udGVudChwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMucmVhZChwYXRoKTtcbiAgICBpZiAoYnVmZmVyID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1ZmZlci50b1N0cmluZygpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNUZXN0UnVubmVyIHtcbiAgcHJpdmF0ZSBfZW5naW5lSG9zdCA9IG5ldyBOb2RlTW9kdWxlc1Rlc3RFbmdpbmVIb3N0KCk7XG4gIHByaXZhdGUgX2VuZ2luZTogU2NoZW1hdGljRW5naW5lPHt9LCB7fT4gPSBuZXcgU2NoZW1hdGljRW5naW5lKHRoaXMuX2VuZ2luZUhvc3QpO1xuICBwcml2YXRlIF9jb2xsZWN0aW9uOiBDb2xsZWN0aW9uPHt9LCB7fT47XG4gIHByaXZhdGUgX2xvZ2dlcjogbG9nZ2luZy5Mb2dnZXI7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfY29sbGVjdGlvbk5hbWU6IHN0cmluZywgY29sbGVjdGlvblBhdGg6IHN0cmluZykge1xuICAgIHRoaXMuX2VuZ2luZUhvc3QucmVnaXN0ZXJDb2xsZWN0aW9uKF9jb2xsZWN0aW9uTmFtZSwgY29sbGVjdGlvblBhdGgpO1xuICAgIHRoaXMuX2xvZ2dlciA9IG5ldyBsb2dnaW5nLkxvZ2dlcigndGVzdCcpO1xuXG4gICAgY29uc3QgcmVnaXN0cnkgPSBuZXcgc2NoZW1hLkNvcmVTY2hlbWFSZWdpc3RyeShmb3JtYXRzLnN0YW5kYXJkRm9ybWF0cyk7XG4gICAgcmVnaXN0cnkuYWRkUG9zdFRyYW5zZm9ybShzY2hlbWEudHJhbnNmb3Jtcy5hZGRVbmRlZmluZWREZWZhdWx0cyk7XG5cbiAgICB0aGlzLl9lbmdpbmVIb3N0LnJlZ2lzdGVyT3B0aW9uc1RyYW5zZm9ybSh2YWxpZGF0ZU9wdGlvbnNXaXRoU2NoZW1hKHJlZ2lzdHJ5KSk7XG4gICAgdGhpcy5fZW5naW5lSG9zdC5yZWdpc3RlclRhc2tFeGVjdXRvcihCdWlsdGluVGFza0V4ZWN1dG9yLk5vZGVQYWNrYWdlKTtcbiAgICB0aGlzLl9lbmdpbmVIb3N0LnJlZ2lzdGVyVGFza0V4ZWN1dG9yKEJ1aWx0aW5UYXNrRXhlY3V0b3IuUmVwb3NpdG9yeUluaXRpYWxpemVyKTtcbiAgICB0aGlzLl9lbmdpbmVIb3N0LnJlZ2lzdGVyVGFza0V4ZWN1dG9yKEJ1aWx0aW5UYXNrRXhlY3V0b3IuUnVuU2NoZW1hdGljKTtcblxuICAgIHRoaXMuX2NvbGxlY3Rpb24gPSB0aGlzLl9lbmdpbmUuY3JlYXRlQ29sbGVjdGlvbih0aGlzLl9jb2xsZWN0aW9uTmFtZSk7XG4gIH1cblxuICBnZXQgZW5naW5lKCkge1xuICAgIHJldHVybiB0aGlzLl9lbmdpbmU7XG4gIH1cbiAgZ2V0IGxvZ2dlcigpOiBsb2dnaW5nLkxvZ2dlciB7XG4gICAgcmV0dXJuIHRoaXMuX2xvZ2dlcjtcbiAgfVxuICBnZXQgdGFza3MoKTogVGFza0NvbmZpZ3VyYXRpb25bXSB7XG4gICAgcmV0dXJuIFsuLi50aGlzLl9lbmdpbmVIb3N0LnRhc2tzXTtcbiAgfVxuXG4gIHJlZ2lzdGVyQ29sbGVjdGlvbihjb2xsZWN0aW9uTmFtZTogc3RyaW5nLCBjb2xsZWN0aW9uUGF0aDogc3RyaW5nKSB7XG4gICAgdGhpcy5fZW5naW5lSG9zdC5yZWdpc3RlckNvbGxlY3Rpb24oY29sbGVjdGlvbk5hbWUsIGNvbGxlY3Rpb25QYXRoKTtcbiAgfVxuXG4gIHJ1blNjaGVtYXRpY0FzeW5jPFNjaGVtYXRpY1NjaGVtYVQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgIHNjaGVtYXRpY05hbWU6IHN0cmluZyxcbiAgICBvcHRzPzogU2NoZW1hdGljU2NoZW1hVCxcbiAgICB0cmVlPzogVHJlZSxcbiAgKTogT2JzZXJ2YWJsZTxVbml0VGVzdFRyZWU+IHtcbiAgICBjb25zdCBzY2hlbWF0aWMgPSB0aGlzLl9jb2xsZWN0aW9uLmNyZWF0ZVNjaGVtYXRpYyhzY2hlbWF0aWNOYW1lLCB0cnVlKTtcbiAgICBjb25zdCBob3N0ID0gb2JzZXJ2YWJsZU9mKHRyZWUgfHwgbmV3IEhvc3RUcmVlKCkpO1xuICAgIHRoaXMuX2VuZ2luZUhvc3QuY2xlYXJUYXNrcygpO1xuXG4gICAgcmV0dXJuIHNjaGVtYXRpY1xuICAgICAgLmNhbGwob3B0cyB8fCB7fSwgaG9zdCwgeyBsb2dnZXI6IHRoaXMuX2xvZ2dlciB9KVxuICAgICAgLnBpcGUobWFwKCh0cmVlKSA9PiBuZXcgVW5pdFRlc3RUcmVlKHRyZWUpKSk7XG4gIH1cblxuICBydW5FeHRlcm5hbFNjaGVtYXRpY0FzeW5jPFNjaGVtYXRpY1NjaGVtYVQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgIGNvbGxlY3Rpb25OYW1lOiBzdHJpbmcsXG4gICAgc2NoZW1hdGljTmFtZTogc3RyaW5nLFxuICAgIG9wdHM/OiBTY2hlbWF0aWNTY2hlbWFULFxuICAgIHRyZWU/OiBUcmVlLFxuICApOiBPYnNlcnZhYmxlPFVuaXRUZXN0VHJlZT4ge1xuICAgIGNvbnN0IGV4dGVybmFsQ29sbGVjdGlvbiA9IHRoaXMuX2VuZ2luZS5jcmVhdGVDb2xsZWN0aW9uKGNvbGxlY3Rpb25OYW1lKTtcbiAgICBjb25zdCBzY2hlbWF0aWMgPSBleHRlcm5hbENvbGxlY3Rpb24uY3JlYXRlU2NoZW1hdGljKHNjaGVtYXRpY05hbWUsIHRydWUpO1xuICAgIGNvbnN0IGhvc3QgPSBvYnNlcnZhYmxlT2YodHJlZSB8fCBuZXcgSG9zdFRyZWUoKSk7XG4gICAgdGhpcy5fZW5naW5lSG9zdC5jbGVhclRhc2tzKCk7XG5cbiAgICByZXR1cm4gc2NoZW1hdGljXG4gICAgICAuY2FsbChvcHRzIHx8IHt9LCBob3N0LCB7IGxvZ2dlcjogdGhpcy5fbG9nZ2VyIH0pXG4gICAgICAucGlwZShtYXAoKHRyZWUpID0+IG5ldyBVbml0VGVzdFRyZWUodHJlZSkpKTtcbiAgfVxuXG4gIGNhbGxSdWxlKHJ1bGU6IFJ1bGUsIHRyZWU6IFRyZWUsIHBhcmVudENvbnRleHQ/OiBQYXJ0aWFsPFNjaGVtYXRpY0NvbnRleHQ+KTogT2JzZXJ2YWJsZTxUcmVlPiB7XG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuX2VuZ2luZS5jcmVhdGVDb250ZXh0KHt9IGFzIFNjaGVtYXRpYzx7fSwge30+LCBwYXJlbnRDb250ZXh0KTtcblxuICAgIHJldHVybiBjYWxsUnVsZShydWxlLCBvYnNlcnZhYmxlT2YodHJlZSksIGNvbnRleHQpO1xuICB9XG59XG4iXX0=