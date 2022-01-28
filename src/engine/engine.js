"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchematicEngine = exports.TaskScheduler = exports.CollectionImpl = exports.UnknownTaskDependencyException = exports.UnregisteredTaskException = exports.SchematicEngineConflictingException = exports.PrivateSchematicException = exports.UnknownSchematicException = exports.CircularCollectionException = exports.UnknownCollectionException = exports.UnknownUrlSourceProtocol = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const interface_1 = require("../tree/interface");
const null_1 = require("../tree/null");
const static_1 = require("../tree/static");
const schematic_1 = require("./schematic");
class UnknownUrlSourceProtocol extends core_1.BaseException {
    constructor(url) {
        super(`Unknown Protocol on url "${url}".`);
    }
}
exports.UnknownUrlSourceProtocol = UnknownUrlSourceProtocol;
class UnknownCollectionException extends core_1.BaseException {
    constructor(name) {
        super(`Unknown collection "${name}".`);
    }
}
exports.UnknownCollectionException = UnknownCollectionException;
class CircularCollectionException extends core_1.BaseException {
    constructor(name) {
        super(`Circular collection reference "${name}".`);
    }
}
exports.CircularCollectionException = CircularCollectionException;
class UnknownSchematicException extends core_1.BaseException {
    constructor(name, collection) {
        super(`Schematic "${name}" not found in collection "${collection.name}".`);
    }
}
exports.UnknownSchematicException = UnknownSchematicException;
class PrivateSchematicException extends core_1.BaseException {
    constructor(name, collection) {
        super(`Schematic "${name}" not found in collection "${collection.name}".`);
    }
}
exports.PrivateSchematicException = PrivateSchematicException;
class SchematicEngineConflictingException extends core_1.BaseException {
    constructor() {
        super(`A schematic was called from a different engine as its parent.`);
    }
}
exports.SchematicEngineConflictingException = SchematicEngineConflictingException;
class UnregisteredTaskException extends core_1.BaseException {
    constructor(name, schematic) {
        const addendum = schematic ? ` in schematic "${schematic.name}"` : '';
        super(`Unregistered task "${name}"${addendum}.`);
    }
}
exports.UnregisteredTaskException = UnregisteredTaskException;
class UnknownTaskDependencyException extends core_1.BaseException {
    constructor(id) {
        super(`Unknown task dependency [ID: ${id.id}].`);
    }
}
exports.UnknownTaskDependencyException = UnknownTaskDependencyException;
class CollectionImpl {
    constructor(_description, _engine, baseDescriptions) {
        this._description = _description;
        this._engine = _engine;
        this.baseDescriptions = baseDescriptions;
    }
    get description() {
        return this._description;
    }
    get name() {
        return this.description.name || '<unknown>';
    }
    createSchematic(name, allowPrivate = false) {
        return this._engine.createSchematic(name, this, allowPrivate);
    }
    listSchematicNames() {
        return this._engine.listSchematicNames(this);
    }
}
exports.CollectionImpl = CollectionImpl;
class TaskScheduler {
    constructor(_context) {
        this._context = _context;
        this._queue = new core_1.PriorityQueue((x, y) => x.priority - y.priority);
        this._taskIds = new Map();
    }
    _calculatePriority(dependencies) {
        if (dependencies.size === 0) {
            return 0;
        }
        const prio = [...dependencies].reduce((prio, task) => prio + task.priority, 1);
        return prio;
    }
    _mapDependencies(dependencies) {
        if (!dependencies) {
            return new Set();
        }
        const tasks = dependencies.map((dep) => {
            const task = this._taskIds.get(dep);
            if (!task) {
                throw new UnknownTaskDependencyException(dep);
            }
            return task;
        });
        return new Set(tasks);
    }
    schedule(taskConfiguration) {
        const dependencies = this._mapDependencies(taskConfiguration.dependencies);
        const priority = this._calculatePriority(dependencies);
        const task = {
            id: TaskScheduler._taskIdCounter++,
            priority,
            configuration: taskConfiguration,
            context: this._context,
        };
        this._queue.push(task);
        const id = { id: task.id };
        this._taskIds.set(id, task);
        return id;
    }
    finalize() {
        const tasks = this._queue.toArray();
        this._queue.clear();
        this._taskIds.clear();
        return tasks;
    }
}
exports.TaskScheduler = TaskScheduler;
TaskScheduler._taskIdCounter = 1;
class SchematicEngine {
    constructor(_host, _workflow) {
        this._host = _host;
        this._workflow = _workflow;
        this._collectionCache = new Map();
        this._schematicCache = new WeakMap();
        this._taskSchedulers = new Array();
    }
    get workflow() {
        return this._workflow || null;
    }
    get defaultMergeStrategy() {
        return this._host.defaultMergeStrategy || interface_1.MergeStrategy.Default;
    }
    createCollection(name, requester) {
        let collection = this._collectionCache.get(name);
        if (collection) {
            return collection;
        }
        const [description, bases] = this._createCollectionDescription(name, requester === null || requester === void 0 ? void 0 : requester.description);
        collection = new CollectionImpl(description, this, bases);
        this._collectionCache.set(name, collection);
        this._schematicCache.set(collection, new Map());
        return collection;
    }
    _createCollectionDescription(name, requester, parentNames) {
        const description = this._host.createCollectionDescription(name, requester);
        if (!description) {
            throw new UnknownCollectionException(name);
        }
        if (parentNames && parentNames.has(description.name)) {
            throw new CircularCollectionException(name);
        }
        const bases = new Array();
        if (description.extends) {
            parentNames = (parentNames || new Set()).add(description.name);
            for (const baseName of description.extends) {
                const [base, baseBases] = this._createCollectionDescription(baseName, description, new Set(parentNames));
                bases.unshift(base, ...baseBases);
            }
        }
        return [description, bases];
    }
    createContext(schematic, parent, executionOptions) {
        // Check for inconsistencies.
        if (parent && parent.engine && parent.engine !== this) {
            throw new SchematicEngineConflictingException();
        }
        let interactive = true;
        if (executionOptions && executionOptions.interactive != undefined) {
            interactive = executionOptions.interactive;
        }
        else if (parent && parent.interactive != undefined) {
            interactive = parent.interactive;
        }
        let context = {
            debug: (parent && parent.debug) || false,
            engine: this,
            logger: (parent && parent.logger && parent.logger.createChild(schematic.description.name)) ||
                new core_1.logging.NullLogger(),
            schematic,
            strategy: parent && parent.strategy !== undefined ? parent.strategy : this.defaultMergeStrategy,
            interactive,
            addTask,
        };
        const maybeNewContext = this._host.transformContext(context);
        if (maybeNewContext) {
            context = maybeNewContext;
        }
        const taskScheduler = new TaskScheduler(context);
        const host = this._host;
        this._taskSchedulers.push(taskScheduler);
        function addTask(task, dependencies) {
            const config = task.toConfiguration();
            if (!host.hasTaskExecutor(config.name)) {
                throw new UnregisteredTaskException(config.name, schematic.description);
            }
            config.dependencies = config.dependencies || [];
            if (dependencies) {
                config.dependencies.unshift(...dependencies);
            }
            return taskScheduler.schedule(config);
        }
        return context;
    }
    createSchematic(name, collection, allowPrivate = false) {
        const schematicMap = this._schematicCache.get(collection);
        let schematic = schematicMap === null || schematicMap === void 0 ? void 0 : schematicMap.get(name);
        if (schematic) {
            return schematic;
        }
        let collectionDescription = collection.description;
        let description = this._host.createSchematicDescription(name, collection.description);
        if (!description) {
            if (collection.baseDescriptions) {
                for (const base of collection.baseDescriptions) {
                    description = this._host.createSchematicDescription(name, base);
                    if (description) {
                        collectionDescription = base;
                        break;
                    }
                }
            }
            if (!description) {
                // Report the error for the top level schematic collection
                throw new UnknownSchematicException(name, collection.description);
            }
        }
        if (description.private && !allowPrivate) {
            throw new PrivateSchematicException(name, collection.description);
        }
        const factory = this._host.getSchematicRuleFactory(description, collectionDescription);
        schematic = new schematic_1.SchematicImpl(description, factory, collection, this);
        schematicMap === null || schematicMap === void 0 ? void 0 : schematicMap.set(name, schematic);
        return schematic;
    }
    listSchematicNames(collection) {
        const names = this._host.listSchematicNames(collection.description);
        if (collection.baseDescriptions) {
            for (const base of collection.baseDescriptions) {
                names.push(...this._host.listSchematicNames(base));
            }
        }
        // remove duplicates
        return [...new Set(names)].sort();
    }
    transformOptions(schematic, options, context) {
        return this._host.transformOptions(schematic.description, options, context);
    }
    createSourceFromUrl(url, context) {
        switch (url.protocol) {
            case 'null:':
                return () => new null_1.NullTree();
            case 'empty:':
                return () => (0, static_1.empty)();
            default:
                const hostSource = this._host.createSourceFromUrl(url, context);
                if (!hostSource) {
                    throw new UnknownUrlSourceProtocol(url.toString());
                }
                return hostSource;
        }
    }
    executePostTasks() {
        const executors = new Map();
        const taskObservable = (0, rxjs_1.from)(this._taskSchedulers).pipe((0, operators_1.concatMap)((scheduler) => scheduler.finalize()), (0, operators_1.concatMap)((task) => {
            const { name, options } = task.configuration;
            const executor = executors.get(name);
            if (executor) {
                return executor(options, task.context);
            }
            return this._host.createTaskExecutor(name).pipe((0, operators_1.concatMap)((executor) => {
                executors.set(name, executor);
                return executor(options, task.context);
            }));
        }));
        return taskObservable;
    }
}
exports.SchematicEngine = SchematicEngine;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvZW5naW5lL2VuZ2luZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBNkU7QUFDN0UsK0JBQTBEO0FBQzFELDhDQUEyQztBQUUzQyxpREFBa0Q7QUFDbEQsdUNBQXdDO0FBQ3hDLDJDQUF1QztBQW1CdkMsMkNBQTRDO0FBRTVDLE1BQWEsd0JBQXlCLFNBQVEsb0JBQWE7SUFDekQsWUFBWSxHQUFXO1FBQ3JCLEtBQUssQ0FBQyw0QkFBNEIsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM3QyxDQUFDO0NBQ0Y7QUFKRCw0REFJQztBQUVELE1BQWEsMEJBQTJCLFNBQVEsb0JBQWE7SUFDM0QsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyx1QkFBdUIsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUN6QyxDQUFDO0NBQ0Y7QUFKRCxnRUFJQztBQUVELE1BQWEsMkJBQTRCLFNBQVEsb0JBQWE7SUFDNUQsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyxrQ0FBa0MsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUNwRCxDQUFDO0NBQ0Y7QUFKRCxrRUFJQztBQUVELE1BQWEseUJBQTBCLFNBQVEsb0JBQWE7SUFDMUQsWUFBWSxJQUFZLEVBQUUsVUFBcUM7UUFDN0QsS0FBSyxDQUFDLGNBQWMsSUFBSSw4QkFBOEIsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7SUFDN0UsQ0FBQztDQUNGO0FBSkQsOERBSUM7QUFFRCxNQUFhLHlCQUEwQixTQUFRLG9CQUFhO0lBQzFELFlBQVksSUFBWSxFQUFFLFVBQXFDO1FBQzdELEtBQUssQ0FBQyxjQUFjLElBQUksOEJBQThCLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO0lBQzdFLENBQUM7Q0FDRjtBQUpE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Q0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3hDO1lBRUQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FDN0MsSUFBQSxxQkFBUyxFQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7Z0JBQ3JCLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUU5QixPQUFPLFFBQVEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxDQUNILENBQUM7UUFDSixDQUFDLENBQUMsQ0FDSCxDQUFDO1FBRUYsT0FBTyxjQUFjLENBQUM7SUFDeEIsQ0FBQztDQUNGO0FBbk9ELDBDQW1PQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uLCBQcmlvcml0eVF1ZXVlLCBsb2dnaW5nIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgZnJvbSBhcyBvYnNlcnZhYmxlRnJvbSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY29uY2F0TWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSAndXJsJztcbmltcG9ydCB7IE1lcmdlU3RyYXRlZ3kgfSBmcm9tICcuLi90cmVlL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBOdWxsVHJlZSB9IGZyb20gJy4uL3RyZWUvbnVsbCc7XG5pbXBvcnQgeyBlbXB0eSB9IGZyb20gJy4uL3RyZWUvc3RhdGljJztcbmltcG9ydCB7IFdvcmtmbG93IH0gZnJvbSAnLi4vd29ya2Zsb3cvaW50ZXJmYWNlJztcbmltcG9ydCB7XG4gIENvbGxlY3Rpb24sXG4gIENvbGxlY3Rpb25EZXNjcmlwdGlvbixcbiAgRW5naW5lLFxuICBFbmdpbmVIb3N0LFxuICBFeGVjdXRpb25PcHRpb25zLFxuICBTY2hlbWF0aWMsXG4gIFNjaGVtYXRpY0NvbnRleHQsXG4gIFNjaGVtYXRpY0Rlc2NyaXB0aW9uLFxuICBTb3VyY2UsXG4gIFRhc2tDb25maWd1cmF0aW9uLFxuICBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvcixcbiAgVGFza0V4ZWN1dG9yLFxuICBUYXNrSWQsXG4gIFRhc2tJbmZvLFxuICBUeXBlZFNjaGVtYXRpY0NvbnRleHQsXG59IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7IFNjaGVtYXRpY0ltcGwgfSBmcm9tICcuL3NjaGVtYXRpYyc7XG5cbmV4cG9ydCBjbGFzcyBVbmtub3duVXJsU291cmNlUHJvdG9jb2wgZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IodXJsOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgVW5rbm93biBQcm90b2NvbCBvbiB1cmwgXCIke3VybH1cIi5gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVW5rbm93bkNvbGxlY3Rpb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFVua25vd24gY29sbGVjdGlvbiBcIiR7bmFtZX1cIi5gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2lyY3VsYXJDb2xsZWN0aW9uRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBDaXJjdWxhciBjb2xsZWN0aW9uIHJlZmVyZW5jZSBcIiR7bmFtZX1cIi5gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVW5rbm93blNjaGVtYXRpY0V4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGNvbGxlY3Rpb246IENvbGxlY3Rpb25EZXNjcmlwdGlvbjx7fT4pIHtcbiAgICBzdXBlcihgU2NoZW1hdGljIFwiJHtuYW1lfVwiIG5vdCBmb3VuZCBpbiBjb2xsZWN0aW9uIFwiJHtjb2xsZWN0aW9uLm5hbWV9XCIuYCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFByaXZhdGVTY2hlbWF0aWNFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBjb2xsZWN0aW9uOiBDb2xsZWN0aW9uRGVzY3JpcHRpb248e30+KSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpYyBcIiR7bmFtZX1cIiBub3QgZm91bmQgaW4gY29sbGVjdGlvbiBcIiR7Y29sbGVjdGlvbi5uYW1lfVwiLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNFbmdpbmVDb25mbGljdGluZ0V4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihgQSBzY2hlbWF0aWMgd2FzIGNhbGxlZCBmcm9tIGEgZGlmZmVyZW50IGVuZ2luZSBhcyBpdHMgcGFyZW50LmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVbnJlZ2lzdGVyZWRUYXNrRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgc2NoZW1hdGljPzogU2NoZW1hdGljRGVzY3JpcHRpb248e30sIHt9Pikge1xuICAgIGNvbnN0IGFkZGVuZHVtID0gc2NoZW1hdGljID8gYCBpbiBzY2hlbWF0aWMgXCIke3NjaGVtYXRpYy5uYW1lfVwiYCA6ICcnO1xuICAgIHN1cGVyKGBVbnJlZ2lzdGVyZWQgdGFzayBcIiR7bmFtZX1cIiR7YWRkZW5kdW19LmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVbmtub3duVGFza0RlcGVuZGVuY3lFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IoaWQ6IFRhc2tJZCkge1xuICAgIHN1cGVyKGBVbmtub3duIHRhc2sgZGVwZW5kZW5jeSBbSUQ6ICR7aWQuaWR9XS5gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbkltcGw8Q29sbGVjdGlvblQgZXh0ZW5kcyBvYmplY3QsIFNjaGVtYXRpY1QgZXh0ZW5kcyBvYmplY3Q+XG4gIGltcGxlbWVudHMgQ29sbGVjdGlvbjxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4ge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9kZXNjcmlwdGlvbjogQ29sbGVjdGlvbkRlc2NyaXB0aW9uPENvbGxlY3Rpb25UPixcbiAgICBwcml2YXRlIF9lbmdpbmU6IFNjaGVtYXRpY0VuZ2luZTxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICAgcHVibGljIHJlYWRvbmx5IGJhc2VEZXNjcmlwdGlvbnM/OiBBcnJheTxDb2xsZWN0aW9uRGVzY3JpcHRpb248Q29sbGVjdGlvblQ+PixcbiAgKSB7fVxuXG4gIGdldCBkZXNjcmlwdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVzY3JpcHRpb247XG4gIH1cbiAgZ2V0IG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGVzY3JpcHRpb24ubmFtZSB8fCAnPHVua25vd24+JztcbiAgfVxuXG4gIGNyZWF0ZVNjaGVtYXRpYyhuYW1lOiBzdHJpbmcsIGFsbG93UHJpdmF0ZSA9IGZhbHNlKTogU2NoZW1hdGljPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPiB7XG4gICAgcmV0dXJuIHRoaXMuX2VuZ2luZS5jcmVhdGVTY2hlbWF0aWMobmFtZSwgdGhpcywgYWxsb3dQcml2YXRlKTtcbiAgfVxuXG4gIGxpc3RTY2hlbWF0aWNOYW1lcygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMuX2VuZ2luZS5saXN0U2NoZW1hdGljTmFtZXModGhpcyk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRhc2tTY2hlZHVsZXIge1xuICBwcml2YXRlIF9xdWV1ZSA9IG5ldyBQcmlvcml0eVF1ZXVlPFRhc2tJbmZvPigoeCwgeSkgPT4geC5wcmlvcml0eSAtIHkucHJpb3JpdHkpO1xuICBwcml2YXRlIF90YXNrSWRzID0gbmV3IE1hcDxUYXNrSWQsIFRhc2tJbmZvPigpO1xuICBwcml2YXRlIHN0YXRpYyBfdGFza0lkQ291bnRlciA9IDE7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkge31cblxuICBwcml2YXRlIF9jYWxjdWxhdGVQcmlvcml0eShkZXBlbmRlbmNpZXM6IFNldDxUYXNrSW5mbz4pOiBudW1iZXIge1xuICAgIGlmIChkZXBlbmRlbmNpZXMuc2l6ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgY29uc3QgcHJpbyA9IFsuLi5kZXBlbmRlbmNpZXNdLnJlZHVjZSgocHJpbywgdGFzaykgPT4gcHJpbyArIHRhc2sucHJpb3JpdHksIDEpO1xuXG4gICAgcmV0dXJuIHByaW87XG4gIH1cblxuICBwcml2YXRlIF9tYXBEZXBlbmRlbmNpZXMoZGVwZW5kZW5jaWVzPzogQXJyYXk8VGFza0lkPik6IFNldDxUYXNrSW5mbz4ge1xuICAgIGlmICghZGVwZW5kZW5jaWVzKSB7XG4gICAgICByZXR1cm4gbmV3IFNldCgpO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2tzID0gZGVwZW5kZW5jaWVzLm1hcCgoZGVwKSA9PiB7XG4gICAgICBjb25zdCB0YXNrID0gdGhpcy5fdGFza0lkcy5nZXQoZGVwKTtcbiAgICAgIGlmICghdGFzaykge1xuICAgICAgICB0aHJvdyBuZXcgVW5rbm93blRhc2tEZXBlbmRlbmN5RXhjZXB0aW9uKGRlcCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0YXNrO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBTZXQodGFza3MpO1xuICB9XG5cbiAgc2NoZWR1bGU8VD4odGFza0NvbmZpZ3VyYXRpb246IFRhc2tDb25maWd1cmF0aW9uPFQ+KTogVGFza0lkIHtcbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSB0aGlzLl9tYXBEZXBlbmRlbmNpZXModGFza0NvbmZpZ3VyYXRpb24uZGVwZW5kZW5jaWVzKTtcbiAgICBjb25zdCBwcmlvcml0eSA9IHRoaXMuX2NhbGN1bGF0ZVByaW9yaXR5KGRlcGVuZGVuY2llcyk7XG5cbiAgICBjb25zdCB0YXNrID0ge1xuICAgICAgaWQ6IFRhc2tTY2hlZHVsZXIuX3Rhc2tJZENvdW50ZXIrKyxcbiAgICAgIHByaW9yaXR5LFxuICAgICAgY29uZmlndXJhdGlvbjogdGFza0NvbmZpZ3VyYXRpb24sXG4gICAgICBjb250ZXh0OiB0aGlzLl9jb250ZXh0LFxuICAgIH07XG5cbiAgICB0aGlzLl9xdWV1ZS5wdXNoKHRhc2spO1xuXG4gICAgY29uc3QgaWQgPSB7IGlkOiB0YXNrLmlkIH07XG4gICAgdGhpcy5fdGFza0lkcy5zZXQoaWQsIHRhc2spO1xuXG4gICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgZmluYWxpemUoKTogUmVhZG9ubHlBcnJheTxUYXNrSW5mbz4ge1xuICAgIGNvbnN0IHRhc2tzID0gdGhpcy5fcXVldWUudG9BcnJheSgpO1xuICAgIHRoaXMuX3F1ZXVlLmNsZWFyKCk7XG4gICAgdGhpcy5fdGFza0lkcy5jbGVhcigpO1xuXG4gICAgcmV0dXJuIHRhc2tzO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNFbmdpbmU8Q29sbGVjdGlvblQgZXh0ZW5kcyBvYmplY3QsIFNjaGVtYXRpY1QgZXh0ZW5kcyBvYmplY3Q+XG4gIGltcGxlbWVudHMgRW5naW5lPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPiB7XG4gIHByaXZhdGUgX2NvbGxlY3Rpb25DYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBDb2xsZWN0aW9uSW1wbDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4+KCk7XG4gIHByaXZhdGUgX3NjaGVtYXRpY0NhY2hlID0gbmV3IFdlYWtNYXA8XG4gICAgQ29sbGVjdGlvbjxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICAgTWFwPHN0cmluZywgU2NoZW1hdGljSW1wbDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4+XG4gID4oKTtcbiAgcHJpdmF0ZSBfdGFza1NjaGVkdWxlcnMgPSBuZXcgQXJyYXk8VGFza1NjaGVkdWxlcj4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9ob3N0OiBFbmdpbmVIb3N0PENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPiwgcHJvdGVjdGVkIF93b3JrZmxvdz86IFdvcmtmbG93KSB7fVxuXG4gIGdldCB3b3JrZmxvdygpIHtcbiAgICByZXR1cm4gdGhpcy5fd29ya2Zsb3cgfHwgbnVsbDtcbiAgfVxuICBnZXQgZGVmYXVsdE1lcmdlU3RyYXRlZ3koKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hvc3QuZGVmYXVsdE1lcmdlU3RyYXRlZ3kgfHwgTWVyZ2VTdHJhdGVneS5EZWZhdWx0O1xuICB9XG5cbiAgY3JlYXRlQ29sbGVjdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcmVxdWVzdGVyPzogQ29sbGVjdGlvbjxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICk6IENvbGxlY3Rpb248Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+IHtcbiAgICBsZXQgY29sbGVjdGlvbiA9IHRoaXMuX2NvbGxlY3Rpb25DYWNoZS5nZXQobmFtZSk7XG4gICAgaWYgKGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICAgIH1cblxuICAgIGNvbnN0IFtkZXNjcmlwdGlvbiwgYmFzZXNdID0gdGhpcy5fY3JlYXRlQ29sbGVjdGlvbkRlc2NyaXB0aW9uKG5hbWUsIHJlcXVlc3Rlcj8uZGVzY3JpcHRpb24pO1xuXG4gICAgY29sbGVjdGlvbiA9IG5ldyBDb2xsZWN0aW9uSW1wbDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4oZGVzY3JpcHRpb24sIHRoaXMsIGJhc2VzKTtcbiAgICB0aGlzLl9jb2xsZWN0aW9uQ2FjaGUuc2V0KG5hbWUsIGNvbGxlY3Rpb24pO1xuICAgIHRoaXMuX3NjaGVtYXRpY0NhY2hlLnNldChjb2xsZWN0aW9uLCBuZXcgTWFwKCkpO1xuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVDb2xsZWN0aW9uRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHJlcXVlc3Rlcj86IENvbGxlY3Rpb25EZXNjcmlwdGlvbjxDb2xsZWN0aW9uVD4sXG4gICAgcGFyZW50TmFtZXM/OiBTZXQ8c3RyaW5nPixcbiAgKTogW0NvbGxlY3Rpb25EZXNjcmlwdGlvbjxDb2xsZWN0aW9uVD4sIEFycmF5PENvbGxlY3Rpb25EZXNjcmlwdGlvbjxDb2xsZWN0aW9uVD4+XSB7XG4gICAgY29uc3QgZGVzY3JpcHRpb24gPSB0aGlzLl9ob3N0LmNyZWF0ZUNvbGxlY3Rpb25EZXNjcmlwdGlvbihuYW1lLCByZXF1ZXN0ZXIpO1xuICAgIGlmICghZGVzY3JpcHRpb24pIHtcbiAgICAgIHRocm93IG5ldyBVbmtub3duQ29sbGVjdGlvbkV4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG4gICAgaWYgKHBhcmVudE5hbWVzICYmIHBhcmVudE5hbWVzLmhhcyhkZXNjcmlwdGlvbi5uYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IENpcmN1bGFyQ29sbGVjdGlvbkV4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlcyA9IG5ldyBBcnJheTxDb2xsZWN0aW9uRGVzY3JpcHRpb248Q29sbGVjdGlvblQ+PigpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5leHRlbmRzKSB7XG4gICAgICBwYXJlbnROYW1lcyA9IChwYXJlbnROYW1lcyB8fCBuZXcgU2V0PHN0cmluZz4oKSkuYWRkKGRlc2NyaXB0aW9uLm5hbWUpO1xuICAgICAgZm9yIChjb25zdCBiYXNlTmFtZSBvZiBkZXNjcmlwdGlvbi5leHRlbmRzKSB7XG4gICAgICAgIGNvbnN0IFtiYXNlLCBiYXNlQmFzZXNdID0gdGhpcy5fY3JlYXRlQ29sbGVjdGlvbkRlc2NyaXB0aW9uKFxuICAgICAgICAgIGJhc2VOYW1lLFxuICAgICAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgICAgIG5ldyBTZXQocGFyZW50TmFtZXMpLFxuICAgICAgICApO1xuXG4gICAgICAgIGJhc2VzLnVuc2hpZnQoYmFzZSwgLi4uYmFzZUJhc2VzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gW2Rlc2NyaXB0aW9uLCBiYXNlc107XG4gIH1cblxuICBjcmVhdGVDb250ZXh0KFxuICAgIHNjaGVtYXRpYzogU2NoZW1hdGljPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPixcbiAgICBwYXJlbnQ/OiBQYXJ0aWFsPFR5cGVkU2NoZW1hdGljQ29udGV4dDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4+LFxuICAgIGV4ZWN1dGlvbk9wdGlvbnM/OiBQYXJ0aWFsPEV4ZWN1dGlvbk9wdGlvbnM+LFxuICApOiBUeXBlZFNjaGVtYXRpY0NvbnRleHQ8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+IHtcbiAgICAvLyBDaGVjayBmb3IgaW5jb25zaXN0ZW5jaWVzLlxuICAgIGlmIChwYXJlbnQgJiYgcGFyZW50LmVuZ2luZSAmJiBwYXJlbnQuZW5naW5lICE9PSB0aGlzKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljRW5naW5lQ29uZmxpY3RpbmdFeGNlcHRpb24oKTtcbiAgICB9XG5cbiAgICBsZXQgaW50ZXJhY3RpdmUgPSB0cnVlO1xuICAgIGlmIChleGVjdXRpb25PcHRpb25zICYmIGV4ZWN1dGlvbk9wdGlvbnMuaW50ZXJhY3RpdmUgIT0gdW5kZWZpbmVkKSB7XG4gICAgICBpbnRlcmFjdGl2ZSA9IGV4ZWN1dGlvbk9wdGlvbnMuaW50ZXJhY3RpdmU7XG4gICAgfSBlbHNlIGlmIChwYXJlbnQgJiYgcGFyZW50LmludGVyYWN0aXZlICE9IHVuZGVmaW5lZCkge1xuICAgICAgaW50ZXJhY3RpdmUgPSBwYXJlbnQuaW50ZXJhY3RpdmU7XG4gICAgfVxuXG4gICAgbGV0IGNvbnRleHQ6IFR5cGVkU2NoZW1hdGljQ29udGV4dDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4gPSB7XG4gICAgICBkZWJ1ZzogKHBhcmVudCAmJiBwYXJlbnQuZGVidWcpIHx8IGZhbHNlLFxuICAgICAgZW5naW5lOiB0aGlzLFxuICAgICAgbG9nZ2VyOlxuICAgICAgICAocGFyZW50ICYmIHBhcmVudC5sb2dnZXIgJiYgcGFyZW50LmxvZ2dlci5jcmVhdGVDaGlsZChzY2hlbWF0aWMuZGVzY3JpcHRpb24ubmFtZSkpIHx8XG4gICAgICAgIG5ldyBsb2dnaW5nLk51bGxMb2dnZXIoKSxcbiAgICAgIHNjaGVtYXRpYyxcbiAgICAgIHN0cmF0ZWd5OlxuICAgICAgICBwYXJlbnQgJiYgcGFyZW50LnN0cmF0ZWd5ICE9PSB1bmRlZmluZWQgPyBwYXJlbnQuc3RyYXRlZ3kgOiB0aGlzLmRlZmF1bHRNZXJnZVN0cmF0ZWd5LFxuICAgICAgaW50ZXJhY3RpdmUsXG4gICAgICBhZGRUYXNrLFxuICAgIH07XG5cbiAgICBjb25zdCBtYXliZU5ld0NvbnRleHQgPSB0aGlzLl9ob3N0LnRyYW5zZm9ybUNvbnRleHQoY29udGV4dCk7XG4gICAgaWYgKG1heWJlTmV3Q29udGV4dCkge1xuICAgICAgY29udGV4dCA9IG1heWJlTmV3Q29udGV4dDtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrU2NoZWR1bGVyID0gbmV3IFRhc2tTY2hlZHVsZXIoY29udGV4dCk7XG4gICAgY29uc3QgaG9zdCA9IHRoaXMuX2hvc3Q7XG4gICAgdGhpcy5fdGFza1NjaGVkdWxlcnMucHVzaCh0YXNrU2NoZWR1bGVyKTtcblxuICAgIGZ1bmN0aW9uIGFkZFRhc2s8VD4odGFzazogVGFza0NvbmZpZ3VyYXRpb25HZW5lcmF0b3I8VD4sIGRlcGVuZGVuY2llcz86IEFycmF5PFRhc2tJZD4pOiBUYXNrSWQge1xuICAgICAgY29uc3QgY29uZmlnID0gdGFzay50b0NvbmZpZ3VyYXRpb24oKTtcblxuICAgICAgaWYgKCFob3N0Lmhhc1Rhc2tFeGVjdXRvcihjb25maWcubmFtZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFVucmVnaXN0ZXJlZFRhc2tFeGNlcHRpb24oY29uZmlnLm5hbWUsIHNjaGVtYXRpYy5kZXNjcmlwdGlvbik7XG4gICAgICB9XG5cbiAgICAgIGNvbmZpZy5kZXBlbmRlbmNpZXMgPSBjb25maWcuZGVwZW5kZW5jaWVzIHx8IFtdO1xuICAgICAgaWYgKGRlcGVuZGVuY2llcykge1xuICAgICAgICBjb25maWcuZGVwZW5kZW5jaWVzLnVuc2hpZnQoLi4uZGVwZW5kZW5jaWVzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRhc2tTY2hlZHVsZXIuc2NoZWR1bGUoY29uZmlnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29udGV4dDtcbiAgfVxuXG4gIGNyZWF0ZVNjaGVtYXRpYyhcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgY29sbGVjdGlvbjogQ29sbGVjdGlvbjxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICAgYWxsb3dQcml2YXRlID0gZmFsc2UsXG4gICk6IFNjaGVtYXRpYzxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4ge1xuICAgIGNvbnN0IHNjaGVtYXRpY01hcCA9IHRoaXMuX3NjaGVtYXRpY0NhY2hlLmdldChjb2xsZWN0aW9uKTtcblxuICAgIGxldCBzY2hlbWF0aWMgPSBzY2hlbWF0aWNNYXA/LmdldChuYW1lKTtcbiAgICBpZiAoc2NoZW1hdGljKSB7XG4gICAgICByZXR1cm4gc2NoZW1hdGljO1xuICAgIH1cblxuICAgIGxldCBjb2xsZWN0aW9uRGVzY3JpcHRpb24gPSBjb2xsZWN0aW9uLmRlc2NyaXB0aW9uO1xuICAgIGxldCBkZXNjcmlwdGlvbiA9IHRoaXMuX2hvc3QuY3JlYXRlU2NoZW1hdGljRGVzY3JpcHRpb24obmFtZSwgY29sbGVjdGlvbi5kZXNjcmlwdGlvbik7XG4gICAgaWYgKCFkZXNjcmlwdGlvbikge1xuICAgICAgaWYgKGNvbGxlY3Rpb24uYmFzZURlc2NyaXB0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGJhc2Ugb2YgY29sbGVjdGlvbi5iYXNlRGVzY3JpcHRpb25zKSB7XG4gICAgICAgICAgZGVzY3JpcHRpb24gPSB0aGlzLl9ob3N0LmNyZWF0ZVNjaGVtYXRpY0Rlc2NyaXB0aW9uKG5hbWUsIGJhc2UpO1xuICAgICAgICAgIGlmIChkZXNjcmlwdGlvbikge1xuICAgICAgICAgICAgY29sbGVjdGlvbkRlc2NyaXB0aW9uID0gYmFzZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFkZXNjcmlwdGlvbikge1xuICAgICAgICAvLyBSZXBvcnQgdGhlIGVycm9yIGZvciB0aGUgdG9wIGxldmVsIHNjaGVtYXRpYyBjb2xsZWN0aW9uXG4gICAgICAgIHRocm93IG5ldyBVbmtub3duU2NoZW1hdGljRXhjZXB0aW9uKG5hbWUsIGNvbGxlY3Rpb24uZGVzY3JpcHRpb24pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChkZXNjcmlwdGlvbi5wcml2YXRlICYmICFhbGxvd1ByaXZhdGUpIHtcbiAgICAgIHRocm93IG5ldyBQcml2YXRlU2NoZW1hdGljRXhjZXB0aW9uKG5hbWUsIGNvbGxlY3Rpb24uZGVzY3JpcHRpb24pO1xuICAgIH1cblxuICAgIGNvbnN0IGZhY3RvcnkgPSB0aGlzLl9ob3N0LmdldFNjaGVtYXRpY1J1bGVGYWN0b3J5KGRlc2NyaXB0aW9uLCBjb2xsZWN0aW9uRGVzY3JpcHRpb24pO1xuICAgIHNjaGVtYXRpYyA9IG5ldyBTY2hlbWF0aWNJbXBsPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPihkZXNjcmlwdGlvbiwgZmFjdG9yeSwgY29sbGVjdGlvbiwgdGhpcyk7XG5cbiAgICBzY2hlbWF0aWNNYXA/LnNldChuYW1lLCBzY2hlbWF0aWMpO1xuXG4gICAgcmV0dXJuIHNjaGVtYXRpYztcbiAgfVxuXG4gIGxpc3RTY2hlbWF0aWNOYW1lcyhjb2xsZWN0aW9uOiBDb2xsZWN0aW9uPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPik6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBuYW1lcyA9IHRoaXMuX2hvc3QubGlzdFNjaGVtYXRpY05hbWVzKGNvbGxlY3Rpb24uZGVzY3JpcHRpb24pO1xuXG4gICAgaWYgKGNvbGxlY3Rpb24uYmFzZURlc2NyaXB0aW9ucykge1xuICAgICAgZm9yIChjb25zdCBiYXNlIG9mIGNvbGxlY3Rpb24uYmFzZURlc2NyaXB0aW9ucykge1xuICAgICAgICBuYW1lcy5wdXNoKC4uLnRoaXMuX2hvc3QubGlzdFNjaGVtYXRpY05hbWVzKGJhc2UpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyByZW1vdmUgZHVwbGljYXRlc1xuICAgIHJldHVybiBbLi4ubmV3IFNldChuYW1lcyldLnNvcnQoKTtcbiAgfVxuXG4gIHRyYW5zZm9ybU9wdGlvbnM8T3B0aW9uVCBleHRlbmRzIG9iamVjdCwgUmVzdWx0VCBleHRlbmRzIG9iamVjdD4oXG4gICAgc2NoZW1hdGljOiBTY2hlbWF0aWM8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+LFxuICAgIG9wdGlvbnM6IE9wdGlvblQsXG4gICAgY29udGV4dD86IFR5cGVkU2NoZW1hdGljQ29udGV4dDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICk6IE9ic2VydmFibGU8UmVzdWx0VD4ge1xuICAgIHJldHVybiB0aGlzLl9ob3N0LnRyYW5zZm9ybU9wdGlvbnM8T3B0aW9uVCwgUmVzdWx0VD4oc2NoZW1hdGljLmRlc2NyaXB0aW9uLCBvcHRpb25zLCBjb250ZXh0KTtcbiAgfVxuXG4gIGNyZWF0ZVNvdXJjZUZyb21VcmwodXJsOiBVcmwsIGNvbnRleHQ6IFR5cGVkU2NoZW1hdGljQ29udGV4dDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4pOiBTb3VyY2Uge1xuICAgIHN3aXRjaCAodXJsLnByb3RvY29sKSB7XG4gICAgICBjYXNlICdudWxsOic6XG4gICAgICAgIHJldHVybiAoKSA9PiBuZXcgTnVsbFRyZWUoKTtcbiAgICAgIGNhc2UgJ2VtcHR5Oic6XG4gICAgICAgIHJldHVybiAoKSA9PiBlbXB0eSgpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc3QgaG9zdFNvdXJjZSA9IHRoaXMuX2hvc3QuY3JlYXRlU291cmNlRnJvbVVybCh1cmwsIGNvbnRleHQpO1xuICAgICAgICBpZiAoIWhvc3RTb3VyY2UpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVW5rbm93blVybFNvdXJjZVByb3RvY29sKHVybC50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBob3N0U291cmNlO1xuICAgIH1cbiAgfVxuXG4gIGV4ZWN1dGVQb3N0VGFza3MoKTogT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgY29uc3QgZXhlY3V0b3JzID0gbmV3IE1hcDxzdHJpbmcsIFRhc2tFeGVjdXRvcj4oKTtcblxuICAgIGNvbnN0IHRhc2tPYnNlcnZhYmxlID0gb2JzZXJ2YWJsZUZyb20odGhpcy5fdGFza1NjaGVkdWxlcnMpLnBpcGUoXG4gICAgICBjb25jYXRNYXAoKHNjaGVkdWxlcikgPT4gc2NoZWR1bGVyLmZpbmFsaXplKCkpLFxuICAgICAgY29uY2F0TWFwKCh0YXNrKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgbmFtZSwgb3B0aW9ucyB9ID0gdGFzay5jb25maWd1cmF0aW9uO1xuXG4gICAgICAgIGNvbnN0IGV4ZWN1dG9yID0gZXhlY3V0b3JzLmdldChuYW1lKTtcbiAgICAgICAgaWYgKGV4ZWN1dG9yKSB7XG4gICAgICAgICAgcmV0dXJuIGV4ZWN1dG9yKG9wdGlvbnMsIHRhc2suY29udGV4dCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5faG9zdC5jcmVhdGVUYXNrRXhlY3V0b3IobmFtZSkucGlwZShcbiAgICAgICAgICBjb25jYXRNYXAoKGV4ZWN1dG9yKSA9PiB7XG4gICAgICAgICAgICBleGVjdXRvcnMuc2V0KG5hbWUsIGV4ZWN1dG9yKTtcblxuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dG9yKG9wdGlvbnMsIHRhc2suY29udGV4dCk7XG4gICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgcmV0dXJuIHRhc2tPYnNlcnZhYmxlO1xuICB9XG59XG4iXX0=