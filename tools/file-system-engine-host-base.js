"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemEngineHostBase = exports.SchematicNameCollisionException = exports.SchematicMissingDescriptionException = exports.SchematicMissingFieldsException = exports.CollectionMissingFieldsException = exports.CollectionMissingSchematicsMapException = exports.FactoryCannotBeResolvedException = exports.SchematicMissingFactoryException = exports.InvalidCollectionJsonException = exports.CollectionCannotBeResolvedException = void 0;
const core_1 = require("@angular-devkit/core");
const node_1 = require("@angular-devkit/core/node");
const fs_1 = require("fs");
const path_1 = require("path");
const rxjs_1 = require("rxjs");
const src_1 = require("../src");
const file_system_utility_1 = require("./file-system-utility");
class CollectionCannotBeResolvedException extends core_1.BaseException {
    constructor(name) {
        super(`Collection ${JSON.stringify(name)} cannot be resolved.`);
    }
}
exports.CollectionCannotBeResolvedException = CollectionCannotBeResolvedException;
class InvalidCollectionJsonException extends core_1.BaseException {
    constructor(_name, path, jsonException) {
        let msg = `Collection JSON at path ${JSON.stringify(path)} is invalid.`;
        if (jsonException) {
            msg = `${msg} ${jsonException.message}`;
        }
        super(msg);
    }
}
exports.InvalidCollectionJsonException = InvalidCollectionJsonException;
class SchematicMissingFactoryException extends core_1.BaseException {
    constructor(name) {
        super(`Schematic ${JSON.stringify(name)} is missing a factory.`);
    }
}
exports.SchematicMissingFactoryException = SchematicMissingFactoryException;
class FactoryCannotBeResolvedException extends core_1.BaseException {
    constructor(name) {
        super(`Schematic ${JSON.stringify(name)} cannot resolve the factory.`);
    }
}
exports.FactoryCannotBeResolvedException = FactoryCannotBeResolvedException;
class CollectionMissingSchematicsMapException extends core_1.BaseException {
    constructor(name) {
        super(`Collection "${name}" does not have a schematics map.`);
    }
}
exports.CollectionMissingSchematicsMapException = CollectionMissingSchematicsMapException;
class CollectionMissingFieldsException extends core_1.BaseException {
    constructor(name) {
        super(`Collection "${name}" is missing fields.`);
    }
}
exports.CollectionMissingFieldsException = CollectionMissingFieldsException;
class SchematicMissingFieldsException extends core_1.BaseException {
    constructor(name) {
        super(`Schematic "${name}" is missing fields.`);
    }
}
exports.SchematicMissingFieldsException = SchematicMissingFieldsException;
class SchematicMissingDescriptionException extends core_1.BaseException {
    constructor(name) {
        super(`Schematics "${name}" does not have a description.`);
    }
}
exports.SchematicMissingDescriptionException = SchematicMissingDescriptionException;
class SchematicNameCollisionException extends core_1.BaseException {
    constructor(name) {
        super(`Schematics/alias ${JSON.stringify(name)} collides with another alias or schematic` +
            ' name.');
    }
}
exports.SchematicNameCollisionException = SchematicNameCollisionException;
/**
 * A EngineHost base class that uses the file system to resolve collections. This is the base of
 * all other EngineHost provided by the tooling part of the Schematics library.
 */
class FileSystemEngineHostBase {
    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._transforms = [];
        this._contextTransforms = [];
        this._taskFactories = new Map();
    }
    listSchematicNames(collection, includeHidden) {
        const schematics = [];
        for (const key of Object.keys(collection.schematics)) {
            const schematic = collection.schematics[key];
            if ((schematic.hidden && !includeHidden) || schematic.private) {
                continue;
            }
            // If extends is present without a factory it is an alias, do not return it
            //   unless it is from another collection.
            if (!schematic.extends || schematic.factory) {
                schematics.push(key);
            }
            else if (schematic.extends && schematic.extends.indexOf(':') !== -1) {
                schematics.push(key);
            }
        }
        return schematics;
    }
    registerOptionsTransform(t) {
        this._transforms.push(t);
    }
    registerContextTransform(t) {
        this._contextTransforms.push(t);
    }
    /**
     *
     * @param name
     * @return {{path: string}}
     */
    createCollectionDescription(name, requester) {
        const path = this._resolveCollectionPath(name, requester === null || requester === void 0 ? void 0 : requester.path);
        const jsonValue = (0, file_system_utility_1.readJsonFile)(path);
        if (!jsonValue || typeof jsonValue != 'object' || Array.isArray(jsonValue)) {
            throw new InvalidCollectionJsonException(name, path);
        }
        // normalize extends property to an array
        if (typeof jsonValue['extends'] === 'string') {
            jsonValue['extends'] = [jsonValue['extends']];
        }
        const description = this._transformCollectionDescription(name, {
            ...jsonValue,
            path,
        });
        if (!description || !description.name) {
            throw new InvalidCollectionJsonException(name, path);
        }
        // Validate aliases.
        const allNames = Object.keys(description.schematics);
        for (const schematicName of Object.keys(description.schematics)) {
            const aliases = description.schematics[schematicName].aliases || [];
            for (const alias of aliases) {
                if (allNames.indexOf(alias) != -1) {
                    throw new SchematicNameCollisionException(alias);
                }
            }
            allNames.push(...aliases);
        }
        return description;
    }
    createSchematicDescription(name, collection) {
        // Resolve aliases first.
        for (const schematicName of Object.keys(collection.schematics)) {
            const schematicDescription = collection.schematics[schematicName];
            if (schematicDescription.aliases && schematicDescription.aliases.indexOf(name) != -1) {
                name = schematicName;
                break;
            }
        }
        if (!(name in collection.schematics)) {
            return null;
        }
        const collectionPath = (0, path_1.dirname)(collection.path);
        const partialDesc = collection.schematics[name];
        if (!partialDesc) {
            return null;
        }
        if (partialDesc.extends) {
            const index = partialDesc.extends.indexOf(':');
            const collectionName = index !== -1 ? partialDesc.extends.slice(0, index) : null;
            const schematicName = index === -1 ? partialDesc.extends : partialDesc.extends.slice(index + 1);
            if (collectionName !== null) {
                const extendCollection = this.createCollectionDescription(collectionName);
                return this.createSchematicDescription(schematicName, extendCollection);
            }
            else {
                return this.createSchematicDescription(schematicName, collection);
            }
        }
        // Use any on this ref as we don't have the OptionT here, but we don't need it (we only need
        // the path).
        if (!partialDesc.factory) {
            throw new SchematicMissingFactoryException(name);
        }
        const resolvedRef = this._resolveReferenceString(partialDesc.factory, collectionPath);
        if (!resolvedRef) {
            throw new FactoryCannotBeResolvedException(name);
        }
        let schema = partialDesc.schema;
        let schemaJson = undefined;
        if (schema) {
            if (!(0, path_1.isAbsolute)(schema)) {
                schema = (0, path_1.join)(collectionPath, schema);
            }
            schemaJson = (0, file_system_utility_1.readJsonFile)(schema);
        }
        // The schematic path is used to resolve URLs.
        // We should be able to just do `dirname(resolvedRef.path)` but for compatibility with
        // Bazel under Windows this directory needs to be resolved from the collection instead.
        // This is needed because on Bazel under Windows the data files (such as the collection or
        // url files) are not in the same place as the compiled JS.
        const maybePath = (0, path_1.join)(collectionPath, partialDesc.factory);
        const path = (0, fs_1.existsSync)(maybePath) && (0, fs_1.statSync)(maybePath).isDirectory() ? maybePath : (0, path_1.dirname)(maybePath);
        return this._transformSchematicDescription(name, collection, {
            ...partialDesc,
            schema,
            schemaJson,
            name,
            path,
            factoryFn: resolvedRef.ref,
            collection,
        });
    }
    createSourceFromUrl(url) {
        switch (url.protocol) {
            case null:
            case 'file:':
                return (context) => {
                    // Check if context has necessary FileSystemSchematicContext path property
                    const fileDescription = context.schematic.description;
                    if (fileDescription.path === undefined) {
                        throw new Error('Unsupported schematic context. Expected a FileSystemSchematicContext.');
                    }
                    // Resolve all file:///a/b/c/d from the schematic's own path, and not the current
                    // path.
                    const root = (0, core_1.normalize)((0, path_1.resolve)(fileDescription.path, url.path || ''));
                    return new src_1.HostCreateTree(new core_1.virtualFs.ScopedHost(new node_1.NodeJsSyncHost(), root));
                };
        }
        return null;
    }
    transformOptions(schematic, options, context) {
        const transform = async () => {
            let transformedOptions = options;
            for (const transformer of this._transforms) {
                const transformerResult = transformer(schematic, transformedOptions, context);
                transformedOptions = await ((0, rxjs_1.isObservable)(transformerResult)
                    ? transformerResult.toPromise()
                    : transformerResult);
            }
            return transformedOptions;
        };
        return (0, rxjs_1.from)(transform());
    }
    transformContext(context) {
        return this._contextTransforms.reduce((acc, curr) => curr(acc), context);
    }
    getSchematicRuleFactory(schematic, _collection) {
        return schematic.factoryFn;
    }
    registerTaskExecutor(factory, options) {
        this._taskFactories.set(factory.name, () => (0, rxjs_1.from)(factory.create(options)));
    }
    createTaskExecutor(name) {
        const factory = this._taskFactories.get(name);
        if (factory) {
            return factory();
        }
        return (0, rxjs_1.throwError)(new src_1.UnregisteredTaskException(name));
    }
    hasTaskExecutor(name) {
        return this._taskFactories.has(name);
    }
}
exports.FileSystemEngineHostBase = FileSystemEngineHostBase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBdUY7QUFDdkYsb0RBQTJEO0FBQzNELDJCQUEwQztBQUMxQywrQkFBMEQ7QUFDMUQsK0JBQW9GO0FBRXBGLGdDQU9nQjtBQVFoQiwrREFBcUQ7QUFXckQsTUFBYSxtQ0FBb0MsU0FBUSxvQkFBYTtJQUNwRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGNBQWMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUNsRSxDQUFDO0NBQ0Y7QUFKRCxrRkFJQztBQUNELE1BQWEsOEJBQStCLFNBQVEsb0JBQWE7SUFDL0QsWUFBWSxLQUFhLEVBQUUsSUFBWSxFQUFFLGFBQXFCO1FBQzVELElBQUksR0FBRyxHQUFHLDJCQUEyQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUM7UUFFeEUsSUFBSSxhQUFhLEVBQUU7WUFDakIsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUN6QztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNiLENBQUM7Q0FDRjtBQVZELHdFQVVDO0FBQ0QsTUFBYSxnQ0FBaUMsU0FBUSxvQkFBYTtJQUNqRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztJQUNuRSxDQUFDO0NBQ0Y7QUFKRCw0RUFJQztBQUNELE1BQWEsZ0NBQWlDLFNBQVEsb0JBQWE7SUFDakUsWUFBWSxJ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Q0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7SUFFRCxrQkFBa0IsQ0FBQyxJQUFZO1FBQzdCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlDLElBQUksT0FBTyxFQUFFO1lBQ1gsT0FBTyxPQUFPLEVBQUUsQ0FBQztTQUNsQjtRQUVELE9BQU8sSUFBQSxpQkFBVSxFQUFDLElBQUksK0JBQXlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRUQsZUFBZSxDQUFDLElBQVk7UUFDMUIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0NBQ0Y7QUFsUEQsNERBa1BDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24sIEpzb25PYmplY3QsIG5vcm1hbGl6ZSwgdmlydHVhbEZzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgTm9kZUpzU3luY0hvc3QgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9ub2RlJztcbmltcG9ydCB7IGV4aXN0c1N5bmMsIHN0YXRTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgZGlybmFtZSwgaXNBYnNvbHV0ZSwgam9pbiwgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgaXNPYnNlcnZhYmxlLCBmcm9tIGFzIG9ic2VydmFibGVGcm9tLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBVcmwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHtcbiAgSG9zdENyZWF0ZVRyZWUsXG4gIFJ1bGVGYWN0b3J5LFxuICBTb3VyY2UsXG4gIFRhc2tFeGVjdXRvcixcbiAgVGFza0V4ZWN1dG9yRmFjdG9yeSxcbiAgVW5yZWdpc3RlcmVkVGFza0V4Y2VwdGlvbixcbn0gZnJvbSAnLi4vc3JjJztcbmltcG9ydCB7XG4gIEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgRmlsZVN5c3RlbUVuZ2luZUhvc3QsXG4gIEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0LFxuICBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyxcbiAgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uLFxufSBmcm9tICcuL2Rlc2NyaXB0aW9uJztcbmltcG9ydCB7IHJlYWRKc29uRmlsZSB9IGZyb20gJy4vZmlsZS1zeXN0ZW0tdXRpbGl0eSc7XG5cbmV4cG9ydCBkZWNsYXJlIHR5cGUgT3B0aW9uVHJhbnNmb3JtPFQgZXh0ZW5kcyBvYmplY3QsIFIgZXh0ZW5kcyBvYmplY3Q+ID0gKFxuICBzY2hlbWF0aWM6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbixcbiAgb3B0aW9uczogVCxcbiAgY29udGV4dD86IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0LFxuKSA9PiBPYnNlcnZhYmxlPFI+IHwgUHJvbWlzZUxpa2U8Uj4gfCBSO1xuZXhwb3J0IGRlY2xhcmUgdHlwZSBDb250ZXh0VHJhbnNmb3JtID0gKFxuICBjb250ZXh0OiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCxcbikgPT4gRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQ7XG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uQ2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgQ29sbGVjdGlvbiAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBjYW5ub3QgYmUgcmVzb2x2ZWQuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBJbnZhbGlkQ29sbGVjdGlvbkpzb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IoX25hbWU6IHN0cmluZywgcGF0aDogc3RyaW5nLCBqc29uRXhjZXB0aW9uPzogRXJyb3IpIHtcbiAgICBsZXQgbXNnID0gYENvbGxlY3Rpb24gSlNPTiBhdCBwYXRoICR7SlNPTi5zdHJpbmdpZnkocGF0aCl9IGlzIGludmFsaWQuYDtcblxuICAgIGlmIChqc29uRXhjZXB0aW9uKSB7XG4gICAgICBtc2cgPSBgJHttc2d9ICR7anNvbkV4Y2VwdGlvbi5tZXNzYWdlfWA7XG4gICAgfVxuXG4gICAgc3VwZXIobXNnKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY01pc3NpbmdGYWN0b3J5RXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBTY2hlbWF0aWMgJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gaXMgbWlzc2luZyBhIGZhY3RvcnkuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBGYWN0b3J5Q2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgU2NoZW1hdGljICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGNhbm5vdCByZXNvbHZlIHRoZSBmYWN0b3J5LmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbk1pc3NpbmdTY2hlbWF0aWNzTWFwRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBDb2xsZWN0aW9uIFwiJHtuYW1lfVwiIGRvZXMgbm90IGhhdmUgYSBzY2hlbWF0aWNzIG1hcC5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25NaXNzaW5nRmllbGRzRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBDb2xsZWN0aW9uIFwiJHtuYW1lfVwiIGlzIG1pc3NpbmcgZmllbGRzLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTWlzc2luZ0ZpZWxkc0V4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgU2NoZW1hdGljIFwiJHtuYW1lfVwiIGlzIG1pc3NpbmcgZmllbGRzLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTWlzc2luZ0Rlc2NyaXB0aW9uRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBTY2hlbWF0aWNzIFwiJHtuYW1lfVwiIGRvZXMgbm90IGhhdmUgYSBkZXNjcmlwdGlvbi5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY05hbWVDb2xsaXNpb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBgU2NoZW1hdGljcy9hbGlhcyAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBjb2xsaWRlcyB3aXRoIGFub3RoZXIgYWxpYXMgb3Igc2NoZW1hdGljYCArXG4gICAgICAgICcgbmFtZS4nLFxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIEVuZ2luZUhvc3QgYmFzZSBjbGFzcyB0aGF0IHVzZXMgdGhlIGZpbGUgc3lzdGVtIHRvIHJlc29sdmUgY29sbGVjdGlvbnMuIFRoaXMgaXMgdGhlIGJhc2Ugb2ZcbiAqIGFsbCBvdGhlciBFbmdpbmVIb3N0IHByb3ZpZGVkIGJ5IHRoZSB0b29saW5nIHBhcnQgb2YgdGhlIFNjaGVtYXRpY3MgbGlicmFyeS5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEZpbGVTeXN0ZW1FbmdpbmVIb3N0QmFzZSBpbXBsZW1lbnRzIEZpbGVTeXN0ZW1FbmdpbmVIb3N0IHtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZTogc3RyaW5nLCByZXF1ZXN0ZXI/OiBzdHJpbmcpOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBfcmVzb2x2ZVJlZmVyZW5jZVN0cmluZyhcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcGFyZW50UGF0aDogc3RyaW5nLFxuICApOiB7IHJlZjogUnVsZUZhY3Rvcnk8e30+OyBwYXRoOiBzdHJpbmcgfSB8IG51bGw7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBfdHJhbnNmb3JtQ29sbGVjdGlvbkRlc2NyaXB0aW9uKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBkZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYz4sXG4gICk6IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYztcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF90cmFuc2Zvcm1TY2hlbWF0aWNEZXNjcmlwdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLFxuICAgIGRlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M+LFxuICApOiBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYztcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBwcml2YXRlIF90cmFuc2Zvcm1zOiBPcHRpb25UcmFuc2Zvcm08YW55LCBhbnk+W10gPSBbXTtcbiAgcHJpdmF0ZSBfY29udGV4dFRyYW5zZm9ybXM6IENvbnRleHRUcmFuc2Zvcm1bXSA9IFtdO1xuICBwcml2YXRlIF90YXNrRmFjdG9yaWVzID0gbmV3IE1hcDxzdHJpbmcsICgpID0+IE9ic2VydmFibGU8VGFza0V4ZWN1dG9yPj4oKTtcblxuICBsaXN0U2NoZW1hdGljTmFtZXMoY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLCBpbmNsdWRlSGlkZGVuPzogYm9vbGVhbikge1xuICAgIGNvbnN0IHNjaGVtYXRpY3M6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoY29sbGVjdGlvbi5zY2hlbWF0aWNzKSkge1xuICAgICAgY29uc3Qgc2NoZW1hdGljID0gY29sbGVjdGlvbi5zY2hlbWF0aWNzW2tleV07XG5cbiAgICAgIGlmICgoc2NoZW1hdGljLmhpZGRlbiAmJiAhaW5jbHVkZUhpZGRlbikgfHwgc2NoZW1hdGljLnByaXZhdGUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGV4dGVuZHMgaXMgcHJlc2VudCB3aXRob3V0IGEgZmFjdG9yeSBpdCBpcyBhbiBhbGlhcywgZG8gbm90IHJldHVybiBpdFxuICAgICAgLy8gICB1bmxlc3MgaXQgaXMgZnJvbSBhbm90aGVyIGNvbGxlY3Rpb24uXG4gICAgICBpZiAoIXNjaGVtYXRpYy5leHRlbmRzIHx8IHNjaGVtYXRpYy5mYWN0b3J5KSB7XG4gICAgICAgIHNjaGVtYXRpY3MucHVzaChrZXkpO1xuICAgICAgfSBlbHNlIGlmIChzY2hlbWF0aWMuZXh0ZW5kcyAmJiBzY2hlbWF0aWMuZXh0ZW5kcy5pbmRleE9mKCc6JykgIT09IC0xKSB7XG4gICAgICAgIHNjaGVtYXRpY3MucHVzaChrZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzY2hlbWF0aWNzO1xuICB9XG5cbiAgcmVnaXN0ZXJPcHRpb25zVHJhbnNmb3JtPFQgZXh0ZW5kcyBvYmplY3QsIFIgZXh0ZW5kcyBvYmplY3Q+KHQ6IE9wdGlvblRyYW5zZm9ybTxULCBSPikge1xuICAgIHRoaXMuX3RyYW5zZm9ybXMucHVzaCh0KTtcbiAgfVxuXG4gIHJlZ2lzdGVyQ29udGV4dFRyYW5zZm9ybSh0OiBDb250ZXh0VHJhbnNmb3JtKSB7XG4gICAgdGhpcy5fY29udGV4dFRyYW5zZm9ybXMucHVzaCh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZVxuICAgKiBAcmV0dXJuIHt7cGF0aDogc3RyaW5nfX1cbiAgICovXG4gIGNyZWF0ZUNvbGxlY3Rpb25EZXNjcmlwdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcmVxdWVzdGVyPzogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLFxuICApOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2Mge1xuICAgIGNvbnN0IHBhdGggPSB0aGlzLl9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZSwgcmVxdWVzdGVyPy5wYXRoKTtcbiAgICBjb25zdCBqc29uVmFsdWUgPSByZWFkSnNvbkZpbGUocGF0aCk7XG4gICAgaWYgKCFqc29uVmFsdWUgfHwgdHlwZW9mIGpzb25WYWx1ZSAhPSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KGpzb25WYWx1ZSkpIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkQ29sbGVjdGlvbkpzb25FeGNlcHRpb24obmFtZSwgcGF0aCk7XG4gICAgfVxuXG4gICAgLy8gbm9ybWFsaXplIGV4dGVuZHMgcHJvcGVydHkgdG8gYW4gYXJyYXlcbiAgICBpZiAodHlwZW9mIGpzb25WYWx1ZVsnZXh0ZW5kcyddID09PSAnc3RyaW5nJykge1xuICAgICAganNvblZhbHVlWydleHRlbmRzJ10gPSBbanNvblZhbHVlWydleHRlbmRzJ11dO1xuICAgIH1cblxuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGhpcy5fdHJhbnNmb3JtQ29sbGVjdGlvbkRlc2NyaXB0aW9uKG5hbWUsIHtcbiAgICAgIC4uLmpzb25WYWx1ZSxcbiAgICAgIHBhdGgsXG4gICAgfSk7XG4gICAgaWYgKCFkZXNjcmlwdGlvbiB8fCAhZGVzY3JpcHRpb24ubmFtZSkge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRDb2xsZWN0aW9uSnNvbkV4Y2VwdGlvbihuYW1lLCBwYXRoKTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBhbGlhc2VzLlxuICAgIGNvbnN0IGFsbE5hbWVzID0gT2JqZWN0LmtleXMoZGVzY3JpcHRpb24uc2NoZW1hdGljcyk7XG4gICAgZm9yIChjb25zdCBzY2hlbWF0aWNOYW1lIG9mIE9iamVjdC5rZXlzKGRlc2NyaXB0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICBjb25zdCBhbGlhc2VzID0gZGVzY3JpcHRpb24uc2NoZW1hdGljc1tzY2hlbWF0aWNOYW1lXS5hbGlhc2VzIHx8IFtdO1xuXG4gICAgICBmb3IgKGNvbnN0IGFsaWFzIG9mIGFsaWFzZXMpIHtcbiAgICAgICAgaWYgKGFsbE5hbWVzLmluZGV4T2YoYWxpYXMpICE9IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY05hbWVDb2xsaXNpb25FeGNlcHRpb24oYWxpYXMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGFsbE5hbWVzLnB1c2goLi4uYWxpYXNlcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc2NyaXB0aW9uO1xuICB9XG5cbiAgY3JlYXRlU2NoZW1hdGljRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgKTogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MgfCBudWxsIHtcbiAgICAvLyBSZXNvbHZlIGFsaWFzZXMgZmlyc3QuXG4gICAgZm9yIChjb25zdCBzY2hlbWF0aWNOYW1lIG9mIE9iamVjdC5rZXlzKGNvbGxlY3Rpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIGNvbnN0IHNjaGVtYXRpY0Rlc2NyaXB0aW9uID0gY29sbGVjdGlvbi5zY2hlbWF0aWNzW3NjaGVtYXRpY05hbWVdO1xuICAgICAgaWYgKHNjaGVtYXRpY0Rlc2NyaXB0aW9uLmFsaWFzZXMgJiYgc2NoZW1hdGljRGVzY3JpcHRpb24uYWxpYXNlcy5pbmRleE9mKG5hbWUpICE9IC0xKSB7XG4gICAgICAgIG5hbWUgPSBzY2hlbWF0aWNOYW1lO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIShuYW1lIGluIGNvbGxlY3Rpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbGxlY3Rpb25QYXRoID0gZGlybmFtZShjb2xsZWN0aW9uLnBhdGgpO1xuICAgIGNvbnN0IHBhcnRpYWxEZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjPiB8IG51bGwgPSBjb2xsZWN0aW9uLnNjaGVtYXRpY3NbbmFtZV07XG4gICAgaWYgKCFwYXJ0aWFsRGVzYykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHBhcnRpYWxEZXNjLmV4dGVuZHMpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gcGFydGlhbERlc2MuZXh0ZW5kcy5pbmRleE9mKCc6Jyk7XG4gICAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IGluZGV4ICE9PSAtMSA/IHBhcnRpYWxEZXNjLmV4dGVuZHMuc2xpY2UoMCwgaW5kZXgpIDogbnVsbDtcbiAgICAgIGNvbnN0IHNjaGVtYXRpY05hbWUgPVxuICAgICAgICBpbmRleCA9PT0gLTEgPyBwYXJ0aWFsRGVzYy5leHRlbmRzIDogcGFydGlhbERlc2MuZXh0ZW5kcy5zbGljZShpbmRleCArIDEpO1xuXG4gICAgICBpZiAoY29sbGVjdGlvbk5hbWUgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgZXh0ZW5kQ29sbGVjdGlvbiA9IHRoaXMuY3JlYXRlQ29sbGVjdGlvbkRlc2NyaXB0aW9uKGNvbGxlY3Rpb25OYW1lKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTY2hlbWF0aWNEZXNjcmlwdGlvbihzY2hlbWF0aWNOYW1lLCBleHRlbmRDb2xsZWN0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVNjaGVtYXRpY0Rlc2NyaXB0aW9uKHNjaGVtYXRpY05hbWUsIGNvbGxlY3Rpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBVc2UgYW55IG9uIHRoaXMgcmVmIGFzIHdlIGRvbid0IGhhdmUgdGhlIE9wdGlvblQgaGVyZSwgYnV0IHdlIGRvbid0IG5lZWQgaXQgKHdlIG9ubHkgbmVlZFxuICAgIC8vIHRoZSBwYXRoKS5cbiAgICBpZiAoIXBhcnRpYWxEZXNjLmZhY3RvcnkpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNNaXNzaW5nRmFjdG9yeUV4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG4gICAgY29uc3QgcmVzb2x2ZWRSZWYgPSB0aGlzLl9yZXNvbHZlUmVmZXJlbmNlU3RyaW5nKHBhcnRpYWxEZXNjLmZhY3RvcnksIGNvbGxlY3Rpb25QYXRoKTtcbiAgICBpZiAoIXJlc29sdmVkUmVmKSB7XG4gICAgICB0aHJvdyBuZXcgRmFjdG9yeUNhbm5vdEJlUmVzb2x2ZWRFeGNlcHRpb24obmFtZSk7XG4gICAgfVxuXG4gICAgbGV0IHNjaGVtYSA9IHBhcnRpYWxEZXNjLnNjaGVtYTtcbiAgICBsZXQgc2NoZW1hSnNvbjogSnNvbk9iamVjdCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAoc2NoZW1hKSB7XG4gICAgICBpZiAoIWlzQWJzb2x1dGUoc2NoZW1hKSkge1xuICAgICAgICBzY2hlbWEgPSBqb2luKGNvbGxlY3Rpb25QYXRoLCBzY2hlbWEpO1xuICAgICAgfVxuICAgICAgc2NoZW1hSnNvbiA9IHJlYWRKc29uRmlsZShzY2hlbWEpIGFzIEpzb25PYmplY3Q7XG4gICAgfVxuXG4gICAgLy8gVGhlIHNjaGVtYXRpYyBwYXRoIGlzIHVzZWQgdG8gcmVzb2x2ZSBVUkxzLlxuICAgIC8vIFdlIHNob3VsZCBiZSBhYmxlIHRvIGp1c3QgZG8gYGRpcm5hbWUocmVzb2x2ZWRSZWYucGF0aClgIGJ1dCBmb3IgY29tcGF0aWJpbGl0eSB3aXRoXG4gICAgLy8gQmF6ZWwgdW5kZXIgV2luZG93cyB0aGlzIGRpcmVjdG9yeSBuZWVkcyB0byBiZSByZXNvbHZlZCBmcm9tIHRoZSBjb2xsZWN0aW9uIGluc3RlYWQuXG4gICAgLy8gVGhpcyBpcyBuZWVkZWQgYmVjYXVzZSBvbiBCYXplbCB1bmRlciBXaW5kb3dzIHRoZSBkYXRhIGZpbGVzIChzdWNoIGFzIHRoZSBjb2xsZWN0aW9uIG9yXG4gICAgLy8gdXJsIGZpbGVzKSBhcmUgbm90IGluIHRoZSBzYW1lIHBsYWNlIGFzIHRoZSBjb21waWxlZCBKUy5cbiAgICBjb25zdCBtYXliZVBhdGggPSBqb2luKGNvbGxlY3Rpb25QYXRoLCBwYXJ0aWFsRGVzYy5mYWN0b3J5KTtcbiAgICBjb25zdCBwYXRoID1cbiAgICAgIGV4aXN0c1N5bmMobWF5YmVQYXRoKSAmJiBzdGF0U3luYyhtYXliZVBhdGgpLmlzRGlyZWN0b3J5KCkgPyBtYXliZVBhdGggOiBkaXJuYW1lKG1heWJlUGF0aCk7XG5cbiAgICByZXR1cm4gdGhpcy5fdHJhbnNmb3JtU2NoZW1hdGljRGVzY3JpcHRpb24obmFtZSwgY29sbGVjdGlvbiwge1xuICAgICAgLi4ucGFydGlhbERlc2MsXG4gICAgICBzY2hlbWEsXG4gICAgICBzY2hlbWFKc29uLFxuICAgICAgbmFtZSxcbiAgICAgIHBhdGgsXG4gICAgICBmYWN0b3J5Rm46IHJlc29sdmVkUmVmLnJlZixcbiAgICAgIGNvbGxlY3Rpb24sXG4gICAgfSk7XG4gIH1cblxuICBjcmVhdGVTb3VyY2VGcm9tVXJsKHVybDogVXJsKTogU291cmNlIHwgbnVsbCB7XG4gICAgc3dpdGNoICh1cmwucHJvdG9jb2wpIHtcbiAgICAgIGNhc2UgbnVsbDpcbiAgICAgIGNhc2UgJ2ZpbGU6JzpcbiAgICAgICAgcmV0dXJuIChjb250ZXh0KSA9PiB7XG4gICAgICAgICAgLy8gQ2hlY2sgaWYgY29udGV4dCBoYXMgbmVjZXNzYXJ5IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0IHBhdGggcHJvcGVydHlcbiAgICAgICAgICBjb25zdCBmaWxlRGVzY3JpcHRpb24gPSBjb250ZXh0LnNjaGVtYXRpYy5kZXNjcmlwdGlvbiBhcyB7IHBhdGg/OiBzdHJpbmcgfTtcbiAgICAgICAgICBpZiAoZmlsZURlc2NyaXB0aW9uLnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAnVW5zdXBwb3J0ZWQgc2NoZW1hdGljIGNvbnRleHQuIEV4cGVjdGVkIGEgRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQuJyxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUmVzb2x2ZSBhbGwgZmlsZTovLy9hL2IvYy9kIGZyb20gdGhlIHNjaGVtYXRpYydzIG93biBwYXRoLCBhbmQgbm90IHRoZSBjdXJyZW50XG4gICAgICAgICAgLy8gcGF0aC5cbiAgICAgICAgICBjb25zdCByb290ID0gbm9ybWFsaXplKHJlc29sdmUoZmlsZURlc2NyaXB0aW9uLnBhdGgsIHVybC5wYXRoIHx8ICcnKSk7XG5cbiAgICAgICAgICByZXR1cm4gbmV3IEhvc3RDcmVhdGVUcmVlKG5ldyB2aXJ0dWFsRnMuU2NvcGVkSG9zdChuZXcgTm9kZUpzU3luY0hvc3QoKSwgcm9vdCkpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdHJhbnNmb3JtT3B0aW9uczxPcHRpb25UIGV4dGVuZHMgb2JqZWN0LCBSZXN1bHRUIGV4dGVuZHMgb2JqZWN0PihcbiAgICBzY2hlbWF0aWM6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjLFxuICAgIG9wdGlvbnM6IE9wdGlvblQsXG4gICAgY29udGV4dD86IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0LFxuICApOiBPYnNlcnZhYmxlPFJlc3VsdFQ+IHtcbiAgICBjb25zdCB0cmFuc2Zvcm0gPSBhc3luYyAoKSA9PiB7XG4gICAgICBsZXQgdHJhbnNmb3JtZWRPcHRpb25zID0gb3B0aW9ucztcbiAgICAgIGZvciAoY29uc3QgdHJhbnNmb3JtZXIgb2YgdGhpcy5fdHJhbnNmb3Jtcykge1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm1lclJlc3VsdCA9IHRyYW5zZm9ybWVyKHNjaGVtYXRpYywgdHJhbnNmb3JtZWRPcHRpb25zLCBjb250ZXh0KTtcbiAgICAgICAgdHJhbnNmb3JtZWRPcHRpb25zID0gYXdhaXQgKGlzT2JzZXJ2YWJsZSh0cmFuc2Zvcm1lclJlc3VsdClcbiAgICAgICAgICA/IHRyYW5zZm9ybWVyUmVzdWx0LnRvUHJvbWlzZSgpXG4gICAgICAgICAgOiB0cmFuc2Zvcm1lclJlc3VsdCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cmFuc2Zvcm1lZE9wdGlvbnM7XG4gICAgfTtcblxuICAgIHJldHVybiBvYnNlcnZhYmxlRnJvbSh0cmFuc2Zvcm0oKSkgYXMgdW5rbm93biBhcyBPYnNlcnZhYmxlPFJlc3VsdFQ+O1xuICB9XG5cbiAgdHJhbnNmb3JtQ29udGV4dChjb250ZXh0OiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCk6IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0IHtcbiAgICByZXR1cm4gdGhpcy5fY29udGV4dFRyYW5zZm9ybXMucmVkdWNlKChhY2MsIGN1cnIpID0+IGN1cnIoYWNjKSwgY29udGV4dCk7XG4gIH1cblxuICBnZXRTY2hlbWF0aWNSdWxlRmFjdG9yeTxPcHRpb25UIGV4dGVuZHMgb2JqZWN0PihcbiAgICBzY2hlbWF0aWM6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjLFxuICAgIF9jb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICk6IFJ1bGVGYWN0b3J5PE9wdGlvblQ+IHtcbiAgICByZXR1cm4gc2NoZW1hdGljLmZhY3RvcnlGbjtcbiAgfVxuXG4gIHJlZ2lzdGVyVGFza0V4ZWN1dG9yPFQ+KGZhY3Rvcnk6IFRhc2tFeGVjdXRvckZhY3Rvcnk8VD4sIG9wdGlvbnM/OiBUKTogdm9pZCB7XG4gICAgdGhpcy5fdGFza0ZhY3Rvcmllcy5zZXQoZmFjdG9yeS5uYW1lLCAoKSA9PiBvYnNlcnZhYmxlRnJvbShmYWN0b3J5LmNyZWF0ZShvcHRpb25zKSkpO1xuICB9XG5cbiAgY3JlYXRlVGFza0V4ZWN1dG9yKG5hbWU6IHN0cmluZyk6IE9ic2VydmFibGU8VGFza0V4ZWN1dG9yPiB7XG4gICAgY29uc3QgZmFjdG9yeSA9IHRoaXMuX3Rhc2tGYWN0b3JpZXMuZ2V0KG5hbWUpO1xuICAgIGlmIChmYWN0b3J5KSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aHJvd0Vycm9yKG5ldyBVbnJlZ2lzdGVyZWRUYXNrRXhjZXB0aW9uKG5hbWUpKTtcbiAgfVxuXG4gIGhhc1Rhc2tFeGVjdXRvcihuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fdGFza0ZhY3Rvcmllcy5oYXMobmFtZSk7XG4gIH1cbn1cbiJdfQ==