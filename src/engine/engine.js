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
const from_1 = require("rxjs/observable/from");
const operators_1 = require("rxjs/operators");
const interface_1 = require("../tree/interface");
const null_1 = require("../tree/null");
const static_1 = require("../tree/static");
const collection_1 = require("./collection");
const schematic_1 = require("./schematic");
const task_1 = require("./task");
class UnknownUrlSourceProtocol extends core_1.BaseException {
    constructor(url) { super(`Unknown Protocol on url "${url}".`); }
}
exports.UnknownUrlSourceProtocol = UnknownUrlSourceProtocol;
class UnknownCollectionException extends core_1.BaseException {
    constructor(name) { super(`Unknown collection "${name}".`); }
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
    constructor() { super(`A schematic was called from a different engine as its parent.`); }
}
exports.SchematicEngineConflictingException = SchematicEngineConflictingException;
class UnregisteredTaskException extends core_1.BaseException {
    constructor(name, schematic) {
        const addendum = schematic ? ` in schematic "${schematic.name}"` : '';
        super(`Unregistered task "${name}"${addendum}.`);
    }
}
exports.UnregisteredTaskException = UnregisteredTaskException;
class SchematicEngine {
    constructor(_host) {
        this._host = _host;
        this._collectionCache = new Map();
        this._schematicCache = new Map();
        this._taskSchedulers = new Array();
    }
    get defaultMergeStrategy() { return this._host.defaultMergeStrategy || interface_1.MergeStrategy.Default; }
    createCollection(name) {
        let collection = this._collectionCache.get(name);
        if (collection) {
            return collection;
        }
        const [description, bases] = this._createCollectionDescription(name);
        collection = new collection_1.CollectionImpl(description, this, bases);
        this._collectionCache.set(name, collection);
        this._schematicCache.set(name, new Map());
        return collection;
    }
    _createCollectionDescription(name, parentNames) {
        const description = this._host.createCollectionDescription(name);
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
                const [base, baseBases] = this._createCollectionDescription(baseName, new Set(parentNames));
                bases.unshift(base, ...baseBases);
            }
        }
        return [description, bases];
    }
    createContext(schematic, parent) {
        // Check for inconsistencies.
        if (parent && parent.engine && parent.engine !== this) {
            throw new SchematicEngineConflictingException();
        }
        const context = {
            debug: parent && parent.debug || false,
            engine: this,
            logger: (parent && parent.logger && parent.logger.createChild(schematic.description.name))
                || new core_1.logging.NullLogger(),
            schematic,
            strategy: (parent && parent.strategy !== undefined)
                ? parent.strategy : this.defaultMergeStrategy,
            addTask,
        };
        const taskScheduler = new task_1.TaskScheduler(context);
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
        const collectionImpl = this._collectionCache.get(collection.description.name);
        const schematicMap = this._schematicCache.get(collection.description.name);
        if (!collectionImpl || !schematicMap || collectionImpl !== collection) {
            // This is weird, maybe the collection was created by another engine?
            throw new UnknownCollectionException(collection.description.name);
        }
        let schematic = schematicMap.get(name);
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
        schematicMap.set(name, schematic);
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
        return [...new Set(names)];
    }
    transformOptions(schematic, options) {
        return this._host.transformOptions(schematic.description, options);
    }
    createSourceFromUrl(url, context) {
        switch (url.protocol) {
            case 'null:': return () => new null_1.NullTree();
            case 'empty:': return () => static_1.empty();
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
        const taskObservable = from_1.from(this._taskSchedulers)
            .pipe(operators_1.concatMap(scheduler => scheduler.finalize()), operators_1.concatMap(task => {
            const { name, options } = task.configuration;
            const executor = executors.get(name);
            if (executor) {
                return executor(options, task.context);
            }
            return this._host.createTaskExecutor(name)
                .pipe(operators_1.concatMap(executor => {
                executors.set(name, executor);
                return executor(options, task.context);
            }));
        }));
        return taskObservable;
    }
}
exports.SchematicEngine = SchematicEngine;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy9lbmdpbmUvZW5naW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQThEO0FBRTlELCtDQUE4RDtBQUM5RCw4Q0FBMkM7QUFFM0MsaURBQWtEO0FBQ2xELHVDQUF3QztBQUN4QywyQ0FBdUM7QUFDdkMsNkNBQThDO0FBVzlDLDJDQUE0QztBQUM1QyxpQ0FLZ0I7QUFHaEIsOEJBQXNDLFNBQVEsb0JBQWE7SUFDekQsWUFBWSxHQUFXLElBQUksS0FBSyxDQUFDLDRCQUE0QixHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN6RTtBQUZELDREQUVDO0FBRUQsZ0NBQXdDLFNBQVEsb0JBQWE7SUFDM0QsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLHVCQUF1QixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN0RTtBQUZELGdFQUVDO0FBRUQsaUNBQXlDLFNBQVEsb0JBQWE7SUFDNUQsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyxrQ0FBa0MsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUNwRCxDQUFDO0NBQ0Y7QUFKRCxrRUFJQztBQUVELCtCQUF1QyxTQUFRLG9CQUFhO0lBQzFELFlBQVksSUFBWSxFQUFFLFVBQXFDO1FBQzdELEtBQUssQ0FBQyxjQUFjLElBQUksOEJBQThCLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO0lBQzdFLENBQUM7Q0FDRjtBQUpELDhEQUlDO0FBRUQsK0JBQXVDLFNBQVEsb0JBQWE7SUFDMUQsWUFBWSxJQUFZLEVBQUUsVUFBcUM7UUFDN0QsS0FBSyxDQUFDLGNBQWMsSUFBSSw4QkFBOEIsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7SUFDN0UsQ0FBQztDQUNGO0FBSkQsOERBSUM7QUFFRCx5Q0FBaUQsU0FBUSxv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QztZQUN6QyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1IsQ0FBQyxDQUFDLENBQ0gsQ0FBQztRQUVKLE1BQU0sQ0FBQyxjQUFjLENBQUM7SUFDeEIsQ0FBQztDQUNGO0FBNU1ELDBDQTRNQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24sIGxvZ2dpbmcgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcy9PYnNlcnZhYmxlJztcbmltcG9ydCB7IGZyb20gYXMgb2JzZXJ2YWJsZUZyb20gfSBmcm9tICdyeGpzL29ic2VydmFibGUvZnJvbSc7XG5pbXBvcnQgeyBjb25jYXRNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBVcmwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHsgTWVyZ2VTdHJhdGVneSB9IGZyb20gJy4uL3RyZWUvaW50ZXJmYWNlJztcbmltcG9ydCB7IE51bGxUcmVlIH0gZnJvbSAnLi4vdHJlZS9udWxsJztcbmltcG9ydCB7IGVtcHR5IH0gZnJvbSAnLi4vdHJlZS9zdGF0aWMnO1xuaW1wb3J0IHsgQ29sbGVjdGlvbkltcGwgfSBmcm9tICcuL2NvbGxlY3Rpb24nO1xuaW1wb3J0IHtcbiAgQ29sbGVjdGlvbixcbiAgQ29sbGVjdGlvbkRlc2NyaXB0aW9uLFxuICBFbmdpbmUsXG4gIEVuZ2luZUhvc3QsXG4gIFNjaGVtYXRpYyxcbiAgU2NoZW1hdGljRGVzY3JpcHRpb24sXG4gIFNvdXJjZSxcbiAgVHlwZWRTY2hlbWF0aWNDb250ZXh0LFxufSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBTY2hlbWF0aWNJbXBsIH0gZnJvbSAnLi9zY2hlbWF0aWMnO1xuaW1wb3J0IHtcbiAgVGFza0NvbmZpZ3VyYXRpb25HZW5lcmF0b3IsXG4gIFRhc2tFeGVjdXRvcixcbiAgVGFza0lkLFxuICBUYXNrU2NoZWR1bGVyLFxufSBmcm9tICcuL3Rhc2snO1xuXG5cbmV4cG9ydCBjbGFzcyBVbmtub3duVXJsU291cmNlUHJvdG9jb2wgZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IodXJsOiBzdHJpbmcpIHsgc3VwZXIoYFVua25vd24gUHJvdG9jb2wgb24gdXJsIFwiJHt1cmx9XCIuYCk7IH1cbn1cblxuZXhwb3J0IGNsYXNzIFVua25vd25Db2xsZWN0aW9uRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykgeyBzdXBlcihgVW5rbm93biBjb2xsZWN0aW9uIFwiJHtuYW1lfVwiLmApOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBDaXJjdWxhckNvbGxlY3Rpb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENpcmN1bGFyIGNvbGxlY3Rpb24gcmVmZXJlbmNlIFwiJHtuYW1lfVwiLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVbmtub3duU2NoZW1hdGljRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgY29sbGVjdGlvbjogQ29sbGVjdGlvbkRlc2NyaXB0aW9uPHt9Pikge1xuICAgIHN1cGVyKGBTY2hlbWF0aWMgXCIke25hbWV9XCIgbm90IGZvdW5kIGluIGNvbGxlY3Rpb24gXCIke2NvbGxlY3Rpb24ubmFtZX1cIi5gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUHJpdmF0ZVNjaGVtYXRpY0V4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGNvbGxlY3Rpb246IENvbGxlY3Rpb25EZXNjcmlwdGlvbjx7fT4pIHtcbiAgICBzdXBlcihgU2NoZW1hdGljIFwiJHtuYW1lfVwiIG5vdCBmb3VuZCBpbiBjb2xsZWN0aW9uIFwiJHtjb2xsZWN0aW9uLm5hbWV9XCIuYCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY0VuZ2luZUNvbmZsaWN0aW5nRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKCkgeyBzdXBlcihgQSBzY2hlbWF0aWMgd2FzIGNhbGxlZCBmcm9tIGEgZGlmZmVyZW50IGVuZ2luZSBhcyBpdHMgcGFyZW50LmApOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBVbnJlZ2lzdGVyZWRUYXNrRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgc2NoZW1hdGljPzogU2NoZW1hdGljRGVzY3JpcHRpb248e30sIHt9Pikge1xuICAgIGNvbnN0IGFkZGVuZHVtID0gc2NoZW1hdGljID8gYCBpbiBzY2hlbWF0aWMgXCIke3NjaGVtYXRpYy5uYW1lfVwiYCA6ICcnO1xuICAgIHN1cGVyKGBVbnJlZ2lzdGVyZWQgdGFzayBcIiR7bmFtZX1cIiR7YWRkZW5kdW19LmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNFbmdpbmU8Q29sbGVjdGlvblQgZXh0ZW5kcyBvYmplY3QsIFNjaGVtYXRpY1QgZXh0ZW5kcyBvYmplY3Q+XG4gICAgaW1wbGVtZW50cyBFbmdpbmU8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+IHtcblxuICBwcml2YXRlIF9jb2xsZWN0aW9uQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgQ29sbGVjdGlvbkltcGw8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+PigpO1xuICBwcml2YXRlIF9zY2hlbWF0aWNDYWNoZVxuICAgID0gbmV3IE1hcDxzdHJpbmcsIE1hcDxzdHJpbmcsIFNjaGVtYXRpY0ltcGw8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+Pj4oKTtcbiAgcHJpdmF0ZSBfdGFza1NjaGVkdWxlcnMgPSBuZXcgQXJyYXk8VGFza1NjaGVkdWxlcj4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9ob3N0OiBFbmdpbmVIb3N0PENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPikge1xuICB9XG5cbiAgZ2V0IGRlZmF1bHRNZXJnZVN0cmF0ZWd5KCkgeyByZXR1cm4gdGhpcy5faG9zdC5kZWZhdWx0TWVyZ2VTdHJhdGVneSB8fCBNZXJnZVN0cmF0ZWd5LkRlZmF1bHQ7IH1cblxuICBjcmVhdGVDb2xsZWN0aW9uKG5hbWU6IHN0cmluZyk6IENvbGxlY3Rpb248Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+IHtcbiAgICBsZXQgY29sbGVjdGlvbiA9IHRoaXMuX2NvbGxlY3Rpb25DYWNoZS5nZXQobmFtZSk7XG4gICAgaWYgKGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICAgIH1cblxuICAgIGNvbnN0IFtkZXNjcmlwdGlvbiwgYmFzZXNdID0gdGhpcy5fY3JlYXRlQ29sbGVjdGlvbkRlc2NyaXB0aW9uKG5hbWUpO1xuXG4gICAgY29sbGVjdGlvbiA9IG5ldyBDb2xsZWN0aW9uSW1wbDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4oZGVzY3JpcHRpb24sIHRoaXMsIGJhc2VzKTtcbiAgICB0aGlzLl9jb2xsZWN0aW9uQ2FjaGUuc2V0KG5hbWUsIGNvbGxlY3Rpb24pO1xuICAgIHRoaXMuX3NjaGVtYXRpY0NhY2hlLnNldChuYW1lLCBuZXcgTWFwKCkpO1xuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVDb2xsZWN0aW9uRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHBhcmVudE5hbWVzPzogU2V0PHN0cmluZz4sXG4gICk6IFtDb2xsZWN0aW9uRGVzY3JpcHRpb248Q29sbGVjdGlvblQ+LCBBcnJheTxDb2xsZWN0aW9uRGVzY3JpcHRpb248Q29sbGVjdGlvblQ+Pl0ge1xuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGhpcy5faG9zdC5jcmVhdGVDb2xsZWN0aW9uRGVzY3JpcHRpb24obmFtZSk7XG4gICAgaWYgKCFkZXNjcmlwdGlvbikge1xuICAgICAgdGhyb3cgbmV3IFVua25vd25Db2xsZWN0aW9uRXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cbiAgICBpZiAocGFyZW50TmFtZXMgJiYgcGFyZW50TmFtZXMuaGFzKGRlc2NyaXB0aW9uLm5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgQ2lyY3VsYXJDb2xsZWN0aW9uRXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cblxuICAgIGNvbnN0IGJhc2VzID0gbmV3IEFycmF5PENvbGxlY3Rpb25EZXNjcmlwdGlvbjxDb2xsZWN0aW9uVD4+KCk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmV4dGVuZHMpIHtcbiAgICAgIHBhcmVudE5hbWVzID0gKHBhcmVudE5hbWVzIHx8IG5ldyBTZXQ8c3RyaW5nPigpKS5hZGQoZGVzY3JpcHRpb24ubmFtZSk7XG4gICAgICBmb3IgKGNvbnN0IGJhc2VOYW1lIG9mIGRlc2NyaXB0aW9uLmV4dGVuZHMpIHtcbiAgICAgICAgY29uc3QgW2Jhc2UsIGJhc2VCYXNlc10gPSB0aGlzLl9jcmVhdGVDb2xsZWN0aW9uRGVzY3JpcHRpb24oYmFzZU5hbWUsIG5ldyBTZXQocGFyZW50TmFtZXMpKTtcblxuICAgICAgICBiYXNlcy51bnNoaWZ0KGJhc2UsIC4uLmJhc2VCYXNlcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFtkZXNjcmlwdGlvbiwgYmFzZXNdO1xuICB9XG5cbiAgY3JlYXRlQ29udGV4dChcbiAgICBzY2hlbWF0aWM6IFNjaGVtYXRpYzxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICAgcGFyZW50PzogUGFydGlhbDxUeXBlZFNjaGVtYXRpY0NvbnRleHQ8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+PixcbiAgKTogVHlwZWRTY2hlbWF0aWNDb250ZXh0PENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPiB7XG4gICAgLy8gQ2hlY2sgZm9yIGluY29uc2lzdGVuY2llcy5cbiAgICBpZiAocGFyZW50ICYmIHBhcmVudC5lbmdpbmUgJiYgcGFyZW50LmVuZ2luZSAhPT0gdGhpcykge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY0VuZ2luZUNvbmZsaWN0aW5nRXhjZXB0aW9uKCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGV4dCA9IHtcbiAgICAgIGRlYnVnOiBwYXJlbnQgJiYgcGFyZW50LmRlYnVnIHx8IGZhbHNlLFxuICAgICAgZW5naW5lOiB0aGlzLFxuICAgICAgbG9nZ2VyOiAocGFyZW50ICYmIHBhcmVudC5sb2dnZXIgJiYgcGFyZW50LmxvZ2dlci5jcmVhdGVDaGlsZChzY2hlbWF0aWMuZGVzY3JpcHRpb24ubmFtZSkpXG4gICAgICAgICAgICAgIHx8IG5ldyBsb2dnaW5nLk51bGxMb2dnZXIoKSxcbiAgICAgIHNjaGVtYXRpYyxcbiAgICAgIHN0cmF0ZWd5OiAocGFyZW50ICYmIHBhcmVudC5zdHJhdGVneSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICA/IHBhcmVudC5zdHJhdGVneSA6IHRoaXMuZGVmYXVsdE1lcmdlU3RyYXRlZ3ksXG4gICAgICBhZGRUYXNrLFxuICAgIH07XG5cbiAgICBjb25zdCB0YXNrU2NoZWR1bGVyID0gbmV3IFRhc2tTY2hlZHVsZXIoY29udGV4dCk7XG4gICAgY29uc3QgaG9zdCA9IHRoaXMuX2hvc3Q7XG4gICAgdGhpcy5fdGFza1NjaGVkdWxlcnMucHVzaCh0YXNrU2NoZWR1bGVyKTtcblxuICAgIGZ1bmN0aW9uIGFkZFRhc2s8VD4oXG4gICAgICB0YXNrOiBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvcjxUPixcbiAgICAgIGRlcGVuZGVuY2llcz86IEFycmF5PFRhc2tJZD4sXG4gICAgKTogVGFza0lkIHtcbiAgICAgIGNvbnN0IGNvbmZpZyA9IHRhc2sudG9Db25maWd1cmF0aW9uKCk7XG5cbiAgICAgIGlmICghaG9zdC5oYXNUYXNrRXhlY3V0b3IoY29uZmlnLm5hbWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBVbnJlZ2lzdGVyZWRUYXNrRXhjZXB0aW9uKGNvbmZpZy5uYW1lLCBzY2hlbWF0aWMuZGVzY3JpcHRpb24pO1xuICAgICAgfVxuXG4gICAgICBjb25maWcuZGVwZW5kZW5jaWVzID0gY29uZmlnLmRlcGVuZGVuY2llcyB8fCBbXTtcbiAgICAgIGlmIChkZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgY29uZmlnLmRlcGVuZGVuY2llcy51bnNoaWZ0KC4uLmRlcGVuZGVuY2llcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0YXNrU2NoZWR1bGVyLnNjaGVkdWxlKGNvbmZpZyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnRleHQ7XG4gIH1cblxuICBjcmVhdGVTY2hlbWF0aWMoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNvbGxlY3Rpb246IENvbGxlY3Rpb248Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+LFxuICAgIGFsbG93UHJpdmF0ZSA9IGZhbHNlLFxuICApOiBTY2hlbWF0aWM8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+IHtcbiAgICBjb25zdCBjb2xsZWN0aW9uSW1wbCA9IHRoaXMuX2NvbGxlY3Rpb25DYWNoZS5nZXQoY29sbGVjdGlvbi5kZXNjcmlwdGlvbi5uYW1lKTtcbiAgICBjb25zdCBzY2hlbWF0aWNNYXAgPSB0aGlzLl9zY2hlbWF0aWNDYWNoZS5nZXQoY29sbGVjdGlvbi5kZXNjcmlwdGlvbi5uYW1lKTtcbiAgICBpZiAoIWNvbGxlY3Rpb25JbXBsIHx8ICFzY2hlbWF0aWNNYXAgfHwgY29sbGVjdGlvbkltcGwgIT09IGNvbGxlY3Rpb24pIHtcbiAgICAgIC8vIFRoaXMgaXMgd2VpcmQsIG1heWJlIHRoZSBjb2xsZWN0aW9uIHdhcyBjcmVhdGVkIGJ5IGFub3RoZXIgZW5naW5lP1xuICAgICAgdGhyb3cgbmV3IFVua25vd25Db2xsZWN0aW9uRXhjZXB0aW9uKGNvbGxlY3Rpb24uZGVzY3JpcHRpb24ubmFtZSk7XG4gICAgfVxuXG4gICAgbGV0IHNjaGVtYXRpYyA9IHNjaGVtYXRpY01hcC5nZXQobmFtZSk7XG4gICAgaWYgKHNjaGVtYXRpYykge1xuICAgICAgcmV0dXJuIHNjaGVtYXRpYztcbiAgICB9XG5cbiAgICBsZXQgY29sbGVjdGlvbkRlc2NyaXB0aW9uID0gY29sbGVjdGlvbi5kZXNjcmlwdGlvbjtcbiAgICBsZXQgZGVzY3JpcHRpb24gPSB0aGlzLl9ob3N0LmNyZWF0ZVNjaGVtYXRpY0Rlc2NyaXB0aW9uKG5hbWUsIGNvbGxlY3Rpb24uZGVzY3JpcHRpb24pO1xuICAgIGlmICghZGVzY3JpcHRpb24pIHtcbiAgICAgIGlmIChjb2xsZWN0aW9uLmJhc2VEZXNjcmlwdGlvbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBiYXNlIG9mIGNvbGxlY3Rpb24uYmFzZURlc2NyaXB0aW9ucykge1xuICAgICAgICAgIGRlc2NyaXB0aW9uID0gdGhpcy5faG9zdC5jcmVhdGVTY2hlbWF0aWNEZXNjcmlwdGlvbihuYW1lLCBiYXNlKTtcbiAgICAgICAgICBpZiAoZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIGNvbGxlY3Rpb25EZXNjcmlwdGlvbiA9IGJhc2U7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghZGVzY3JpcHRpb24pIHtcbiAgICAgICAgLy8gUmVwb3J0IHRoZSBlcnJvciBmb3IgdGhlIHRvcCBsZXZlbCBzY2hlbWF0aWMgY29sbGVjdGlvblxuICAgICAgICB0aHJvdyBuZXcgVW5rbm93blNjaGVtYXRpY0V4Y2VwdGlvbihuYW1lLCBjb2xsZWN0aW9uLmRlc2NyaXB0aW9uKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZGVzY3JpcHRpb24ucHJpdmF0ZSAmJiAhYWxsb3dQcml2YXRlKSB7XG4gICAgICB0aHJvdyBuZXcgUHJpdmF0ZVNjaGVtYXRpY0V4Y2VwdGlvbihuYW1lLCBjb2xsZWN0aW9uLmRlc2NyaXB0aW9uKTtcbiAgICB9XG5cbiAgICBjb25zdCBmYWN0b3J5ID0gdGhpcy5faG9zdC5nZXRTY2hlbWF0aWNSdWxlRmFjdG9yeShkZXNjcmlwdGlvbiwgY29sbGVjdGlvbkRlc2NyaXB0aW9uKTtcbiAgICBzY2hlbWF0aWMgPSBuZXcgU2NoZW1hdGljSW1wbDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4oZGVzY3JpcHRpb24sIGZhY3RvcnksIGNvbGxlY3Rpb24sIHRoaXMpO1xuXG4gICAgc2NoZW1hdGljTWFwLnNldChuYW1lLCBzY2hlbWF0aWMpO1xuXG4gICAgcmV0dXJuIHNjaGVtYXRpYztcbiAgfVxuXG4gIGxpc3RTY2hlbWF0aWNOYW1lcyhjb2xsZWN0aW9uOiBDb2xsZWN0aW9uPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPik6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBuYW1lcyA9IHRoaXMuX2hvc3QubGlzdFNjaGVtYXRpY05hbWVzKGNvbGxlY3Rpb24uZGVzY3JpcHRpb24pO1xuXG4gICAgaWYgKGNvbGxlY3Rpb24uYmFzZURlc2NyaXB0aW9ucykge1xuICAgICAgZm9yIChjb25zdCBiYXNlIG9mIGNvbGxlY3Rpb24uYmFzZURlc2NyaXB0aW9ucykge1xuICAgICAgICBuYW1lcy5wdXNoKC4uLnRoaXMuX2hvc3QubGlzdFNjaGVtYXRpY05hbWVzKGJhc2UpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyByZW1vdmUgZHVwbGljYXRlc1xuICAgIHJldHVybiBbLi4ubmV3IFNldChuYW1lcyldO1xuICB9XG5cbiAgdHJhbnNmb3JtT3B0aW9uczxPcHRpb25UIGV4dGVuZHMgb2JqZWN0LCBSZXN1bHRUIGV4dGVuZHMgb2JqZWN0PihcbiAgICBzY2hlbWF0aWM6IFNjaGVtYXRpYzxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICAgb3B0aW9uczogT3B0aW9uVCxcbiAgKTogT2JzZXJ2YWJsZTxSZXN1bHRUPiB7XG4gICAgcmV0dXJuIHRoaXMuX2hvc3QudHJhbnNmb3JtT3B0aW9uczxPcHRpb25ULCBSZXN1bHRUPihzY2hlbWF0aWMuZGVzY3JpcHRpb24sIG9wdGlvbnMpO1xuICB9XG5cbiAgY3JlYXRlU291cmNlRnJvbVVybCh1cmw6IFVybCwgY29udGV4dDogVHlwZWRTY2hlbWF0aWNDb250ZXh0PENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPik6IFNvdXJjZSB7XG4gICAgc3dpdGNoICh1cmwucHJvdG9jb2wpIHtcbiAgICAgIGNhc2UgJ251bGw6JzogcmV0dXJuICgpID0+IG5ldyBOdWxsVHJlZSgpO1xuICAgICAgY2FzZSAnZW1wdHk6JzogcmV0dXJuICgpID0+IGVtcHR5KCk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zdCBob3N0U291cmNlID0gdGhpcy5faG9zdC5jcmVhdGVTb3VyY2VGcm9tVXJsKHVybCwgY29udGV4dCk7XG4gICAgICAgIGlmICghaG9zdFNvdXJjZSkge1xuICAgICAgICAgIHRocm93IG5ldyBVbmtub3duVXJsU291cmNlUHJvdG9jb2wodXJsLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGhvc3RTb3VyY2U7XG4gICAgfVxuICB9XG5cbiAgZXhlY3V0ZVBvc3RUYXNrcygpOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICBjb25zdCBleGVjdXRvcnMgPSBuZXcgTWFwPHN0cmluZywgVGFza0V4ZWN1dG9yPigpO1xuXG4gICAgY29uc3QgdGFza09ic2VydmFibGUgPSBvYnNlcnZhYmxlRnJvbSh0aGlzLl90YXNrU2NoZWR1bGVycylcbiAgICAgIC5waXBlKFxuICAgICAgICBjb25jYXRNYXAoc2NoZWR1bGVyID0+IHNjaGVkdWxlci5maW5hbGl6ZSgpKSxcbiAgICAgICAgY29uY2F0TWFwKHRhc2sgPT4ge1xuICAgICAgICAgIGNvbnN0IHsgbmFtZSwgb3B0aW9ucyB9ID0gdGFzay5jb25maWd1cmF0aW9uO1xuXG4gICAgICAgICAgY29uc3QgZXhlY3V0b3IgPSBleGVjdXRvcnMuZ2V0KG5hbWUpO1xuICAgICAgICAgIGlmIChleGVjdXRvcikge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dG9yKG9wdGlvbnMsIHRhc2suY29udGV4dCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2hvc3QuY3JlYXRlVGFza0V4ZWN1dG9yKG5hbWUpXG4gICAgICAgICAgICAucGlwZShjb25jYXRNYXAoZXhlY3V0b3IgPT4ge1xuICAgICAgICAgICAgICBleGVjdXRvcnMuc2V0KG5hbWUsIGV4ZWN1dG9yKTtcblxuICAgICAgICAgICAgICByZXR1cm4gZXhlY3V0b3Iob3B0aW9ucywgdGFzay5jb250ZXh0KTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgcmV0dXJuIHRhc2tPYnNlcnZhYmxlO1xuICB9XG59XG4iXX0=