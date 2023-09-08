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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _transforms = [];
    _contextTransforms = [];
    _taskFactories = new Map();
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
        const path = this._resolveCollectionPath(name, requester?.path);
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
        const resolvedRef = this._resolveReferenceString(partialDesc.factory, collectionPath, collection);
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
                    ? (0, rxjs_1.lastValueFrom)(transformerResult)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBdUY7QUFDdkYsb0RBQTJEO0FBQzNELDJCQUEwQztBQUMxQywrQkFBMEQ7QUFDMUQsK0JBQW1HO0FBRW5HLGdDQU9nQjtBQVFoQiwrREFBcUQ7QUFXckQsTUFBYSxtQ0FBb0MsU0FBUSxvQkFBYTtJQUNwRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGNBQWMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUNsRSxDQUFDO0NBQ0Y7QUFKRCxrRkFJQztBQUNELE1BQWEsOEJBQStCLFNBQVEsb0JBQWE7SUFDL0QsWUFBWSxLQUFhLEVBQUUsSUFBWSxFQUFFLGFBQXFCO1FBQzVELElBQUksR0FBRyxHQUFHLDJCQUEyQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUM7UUFFeEUsSUFBSSxhQUFhLEVBQUU7WUFDakIsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUN6QztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNiLENBQUM7Q0FDRjtBQVZELHdFQVVDO0FBQ0QsTUFBYSxnQ0FBaUMsU0FBUSxvQkFBYTtJQUNqRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztJQUNuRSxDQUFDO0NBQ0Y7QUFKRCw0RUFJQztBQUNELE1BQWEsZ0NBQWlDLFNBQVEsb0JBQWE7SUFDakUsWUFBWSxJ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QyxDQUFDLENBQUMsQ0FBQztJQUN2RixDQUFDO0lBRUQsa0JBQWtCLENBQUMsSUFBWTtRQUM3QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxJQUFJLE9BQU8sRUFBRTtZQUNYLE9BQU8sT0FBTyxFQUFFLENBQUM7U0FDbEI7UUFFRCxPQUFPLElBQUEsaUJBQVUsRUFBQyxJQUFJLCtCQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELGVBQWUsQ0FBQyxJQUFZO1FBQzFCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztDQUNGO0FBdlBELDREQXVQQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uLCBKc29uT2JqZWN0LCBub3JtYWxpemUsIHZpcnR1YWxGcyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE5vZGVKc1N5bmNIb3N0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUvbm9kZSc7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCBzdGF0U3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGRpcm5hbWUsIGlzQWJzb2x1dGUsIGpvaW4sIHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IE9ic2VydmFibGUsIGlzT2JzZXJ2YWJsZSwgbGFzdFZhbHVlRnJvbSwgZnJvbSBhcyBvYnNlcnZhYmxlRnJvbSwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSAndXJsJztcbmltcG9ydCB7XG4gIEhvc3RDcmVhdGVUcmVlLFxuICBSdWxlRmFjdG9yeSxcbiAgU291cmNlLFxuICBUYXNrRXhlY3V0b3IsXG4gIFRhc2tFeGVjdXRvckZhY3RvcnksXG4gIFVucmVnaXN0ZXJlZFRhc2tFeGNlcHRpb24sXG59IGZyb20gJy4uL3NyYyc7XG5pbXBvcnQge1xuICBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gIEZpbGVTeXN0ZW1FbmdpbmVIb3N0LFxuICBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCxcbiAgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MsXG4gIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbixcbn0gZnJvbSAnLi9kZXNjcmlwdGlvbic7XG5pbXBvcnQgeyByZWFkSnNvbkZpbGUgfSBmcm9tICcuL2ZpbGUtc3lzdGVtLXV0aWxpdHknO1xuXG5leHBvcnQgZGVjbGFyZSB0eXBlIE9wdGlvblRyYW5zZm9ybTxUIGV4dGVuZHMgb2JqZWN0IHwgbnVsbCwgUiBleHRlbmRzIG9iamVjdD4gPSAoXG4gIHNjaGVtYXRpYzogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uLFxuICBvcHRpb25zOiBULFxuICBjb250ZXh0PzogRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQsXG4pID0+IE9ic2VydmFibGU8Uj4gfCBQcm9taXNlTGlrZTxSPiB8IFI7XG5leHBvcnQgZGVjbGFyZSB0eXBlIENvbnRleHRUcmFuc2Zvcm0gPSAoXG4gIGNvbnRleHQ6IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0LFxuKSA9PiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dDtcblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25DYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBDb2xsZWN0aW9uICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGNhbm5vdCBiZSByZXNvbHZlZC5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEludmFsaWRDb2xsZWN0aW9uSnNvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihfbmFtZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIGpzb25FeGNlcHRpb24/OiBFcnJvcikge1xuICAgIGxldCBtc2cgPSBgQ29sbGVjdGlvbiBKU09OIGF0IHBhdGggJHtKU09OLnN0cmluZ2lmeShwYXRoKX0gaXMgaW52YWxpZC5gO1xuXG4gICAgaWYgKGpzb25FeGNlcHRpb24pIHtcbiAgICAgIG1zZyA9IGAke21zZ30gJHtqc29uRXhjZXB0aW9uLm1lc3NhZ2V9YDtcbiAgICB9XG5cbiAgICBzdXBlcihtc2cpO1xuICB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTWlzc2luZ0ZhY3RvcnlFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpYyAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBpcyBtaXNzaW5nIGEgZmFjdG9yeS5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEZhY3RvcnlDYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBTY2hlbWF0aWMgJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gY2Fubm90IHJlc29sdmUgdGhlIGZhY3RvcnkuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uTWlzc2luZ1NjaGVtYXRpY3NNYXBFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENvbGxlY3Rpb24gXCIke25hbWV9XCIgZG9lcyBub3QgaGF2ZSBhIHNjaGVtYXRpY3MgbWFwLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbk1pc3NpbmdGaWVsZHNFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENvbGxlY3Rpb24gXCIke25hbWV9XCIgaXMgbWlzc2luZyBmaWVsZHMuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNNaXNzaW5nRmllbGRzRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBTY2hlbWF0aWMgXCIke25hbWV9XCIgaXMgbWlzc2luZyBmaWVsZHMuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNNaXNzaW5nRGVzY3JpcHRpb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpY3MgXCIke25hbWV9XCIgZG9lcyBub3QgaGF2ZSBhIGRlc2NyaXB0aW9uLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTmFtZUNvbGxpc2lvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIGBTY2hlbWF0aWNzL2FsaWFzICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGNvbGxpZGVzIHdpdGggYW5vdGhlciBhbGlhcyBvciBzY2hlbWF0aWNgICtcbiAgICAgICAgJyBuYW1lLicsXG4gICAgKTtcbiAgfVxufVxuXG4vKipcbiAqIEEgRW5naW5lSG9zdCBiYXNlIGNsYXNzIHRoYXQgdXNlcyB0aGUgZmlsZSBzeXN0ZW0gdG8gcmVzb2x2ZSBjb2xsZWN0aW9ucy4gVGhpcyBpcyB0aGUgYmFzZSBvZlxuICogYWxsIG90aGVyIEVuZ2luZUhvc3QgcHJvdmlkZWQgYnkgdGhlIHRvb2xpbmcgcGFydCBvZiB0aGUgU2NoZW1hdGljcyBsaWJyYXJ5LlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRmlsZVN5c3RlbUVuZ2luZUhvc3RCYXNlIGltcGxlbWVudHMgRmlsZVN5c3RlbUVuZ2luZUhvc3Qge1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgX3Jlc29sdmVDb2xsZWN0aW9uUGF0aChuYW1lOiBzdHJpbmcsIHJlcXVlc3Rlcj86IHN0cmluZyk6IHN0cmluZztcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF9yZXNvbHZlUmVmZXJlbmNlU3RyaW5nKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBwYXJlbnRQYXRoOiBzdHJpbmcsXG4gICAgY29sbGVjdGlvbkRlc2NyaXB0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICk6IHsgcmVmOiBSdWxlRmFjdG9yeTx7fT47IHBhdGg6IHN0cmluZyB9IHwgbnVsbDtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF90cmFuc2Zvcm1Db2xsZWN0aW9uRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGRlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjPixcbiAgKTogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjO1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgX3RyYW5zZm9ybVNjaGVtYXRpY0Rlc2NyaXB0aW9uKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBjb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICAgZGVzYzogUGFydGlhbDxGaWxlU3lzdGVtU2NoZW1hdGljRGVzYz4sXG4gICk6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjO1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHByaXZhdGUgX3RyYW5zZm9ybXM6IE9wdGlvblRyYW5zZm9ybTxhbnksIGFueT5bXSA9IFtdO1xuICBwcml2YXRlIF9jb250ZXh0VHJhbnNmb3JtczogQ29udGV4dFRyYW5zZm9ybVtdID0gW107XG4gIHByaXZhdGUgX3Rhc2tGYWN0b3JpZXMgPSBuZXcgTWFwPHN0cmluZywgKCkgPT4gT2JzZXJ2YWJsZTxUYXNrRXhlY3V0b3I+PigpO1xuXG4gIGxpc3RTY2hlbWF0aWNOYW1lcyhjb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsIGluY2x1ZGVIaWRkZW4/OiBib29sZWFuKSB7XG4gICAgY29uc3Qgc2NoZW1hdGljczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhjb2xsZWN0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICBjb25zdCBzY2hlbWF0aWMgPSBjb2xsZWN0aW9uLnNjaGVtYXRpY3Nba2V5XTtcblxuICAgICAgaWYgKChzY2hlbWF0aWMuaGlkZGVuICYmICFpbmNsdWRlSGlkZGVuKSB8fCBzY2hlbWF0aWMucHJpdmF0ZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgZXh0ZW5kcyBpcyBwcmVzZW50IHdpdGhvdXQgYSBmYWN0b3J5IGl0IGlzIGFuIGFsaWFzLCBkbyBub3QgcmV0dXJuIGl0XG4gICAgICAvLyAgIHVubGVzcyBpdCBpcyBmcm9tIGFub3RoZXIgY29sbGVjdGlvbi5cbiAgICAgIGlmICghc2NoZW1hdGljLmV4dGVuZHMgfHwgc2NoZW1hdGljLmZhY3RvcnkpIHtcbiAgICAgICAgc2NoZW1hdGljcy5wdXNoKGtleSk7XG4gICAgICB9IGVsc2UgaWYgKHNjaGVtYXRpYy5leHRlbmRzICYmIHNjaGVtYXRpYy5leHRlbmRzLmluZGV4T2YoJzonKSAhPT0gLTEpIHtcbiAgICAgICAgc2NoZW1hdGljcy5wdXNoKGtleSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjaGVtYXRpY3M7XG4gIH1cblxuICByZWdpc3Rlck9wdGlvbnNUcmFuc2Zvcm08VCBleHRlbmRzIG9iamVjdCB8IG51bGwsIFIgZXh0ZW5kcyBvYmplY3Q+KHQ6IE9wdGlvblRyYW5zZm9ybTxULCBSPikge1xuICAgIHRoaXMuX3RyYW5zZm9ybXMucHVzaCh0KTtcbiAgfVxuXG4gIHJlZ2lzdGVyQ29udGV4dFRyYW5zZm9ybSh0OiBDb250ZXh0VHJhbnNmb3JtKSB7XG4gICAgdGhpcy5fY29udGV4dFRyYW5zZm9ybXMucHVzaCh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZVxuICAgKiBAcmV0dXJuIHt7cGF0aDogc3RyaW5nfX1cbiAgICovXG4gIGNyZWF0ZUNvbGxlY3Rpb25EZXNjcmlwdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcmVxdWVzdGVyPzogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLFxuICApOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2Mge1xuICAgIGNvbnN0IHBhdGggPSB0aGlzLl9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZSwgcmVxdWVzdGVyPy5wYXRoKTtcbiAgICBjb25zdCBqc29uVmFsdWUgPSByZWFkSnNvbkZpbGUocGF0aCk7XG4gICAgaWYgKCFqc29uVmFsdWUgfHwgdHlwZW9mIGpzb25WYWx1ZSAhPSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KGpzb25WYWx1ZSkpIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkQ29sbGVjdGlvbkpzb25FeGNlcHRpb24obmFtZSwgcGF0aCk7XG4gICAgfVxuXG4gICAgLy8gbm9ybWFsaXplIGV4dGVuZHMgcHJvcGVydHkgdG8gYW4gYXJyYXlcbiAgICBpZiAodHlwZW9mIGpzb25WYWx1ZVsnZXh0ZW5kcyddID09PSAnc3RyaW5nJykge1xuICAgICAganNvblZhbHVlWydleHRlbmRzJ10gPSBbanNvblZhbHVlWydleHRlbmRzJ11dO1xuICAgIH1cblxuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGhpcy5fdHJhbnNmb3JtQ29sbGVjdGlvbkRlc2NyaXB0aW9uKG5hbWUsIHtcbiAgICAgIC4uLmpzb25WYWx1ZSxcbiAgICAgIHBhdGgsXG4gICAgfSk7XG4gICAgaWYgKCFkZXNjcmlwdGlvbiB8fCAhZGVzY3JpcHRpb24ubmFtZSkge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRDb2xsZWN0aW9uSnNvbkV4Y2VwdGlvbihuYW1lLCBwYXRoKTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBhbGlhc2VzLlxuICAgIGNvbnN0IGFsbE5hbWVzID0gT2JqZWN0LmtleXMoZGVzY3JpcHRpb24uc2NoZW1hdGljcyk7XG4gICAgZm9yIChjb25zdCBzY2hlbWF0aWNOYW1lIG9mIE9iamVjdC5rZXlzKGRlc2NyaXB0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICBjb25zdCBhbGlhc2VzID0gZGVzY3JpcHRpb24uc2NoZW1hdGljc1tzY2hlbWF0aWNOYW1lXS5hbGlhc2VzIHx8IFtdO1xuXG4gICAgICBmb3IgKGNvbnN0IGFsaWFzIG9mIGFsaWFzZXMpIHtcbiAgICAgICAgaWYgKGFsbE5hbWVzLmluZGV4T2YoYWxpYXMpICE9IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY05hbWVDb2xsaXNpb25FeGNlcHRpb24oYWxpYXMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGFsbE5hbWVzLnB1c2goLi4uYWxpYXNlcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc2NyaXB0aW9uO1xuICB9XG5cbiAgY3JlYXRlU2NoZW1hdGljRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgKTogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MgfCBudWxsIHtcbiAgICAvLyBSZXNvbHZlIGFsaWFzZXMgZmlyc3QuXG4gICAgZm9yIChjb25zdCBzY2hlbWF0aWNOYW1lIG9mIE9iamVjdC5rZXlzKGNvbGxlY3Rpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIGNvbnN0IHNjaGVtYXRpY0Rlc2NyaXB0aW9uID0gY29sbGVjdGlvbi5zY2hlbWF0aWNzW3NjaGVtYXRpY05hbWVdO1xuICAgICAgaWYgKHNjaGVtYXRpY0Rlc2NyaXB0aW9uLmFsaWFzZXMgJiYgc2NoZW1hdGljRGVzY3JpcHRpb24uYWxpYXNlcy5pbmRleE9mKG5hbWUpICE9IC0xKSB7XG4gICAgICAgIG5hbWUgPSBzY2hlbWF0aWNOYW1lO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIShuYW1lIGluIGNvbGxlY3Rpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbGxlY3Rpb25QYXRoID0gZGlybmFtZShjb2xsZWN0aW9uLnBhdGgpO1xuICAgIGNvbnN0IHBhcnRpYWxEZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjPiB8IG51bGwgPSBjb2xsZWN0aW9uLnNjaGVtYXRpY3NbbmFtZV07XG4gICAgaWYgKCFwYXJ0aWFsRGVzYykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHBhcnRpYWxEZXNjLmV4dGVuZHMpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gcGFydGlhbERlc2MuZXh0ZW5kcy5pbmRleE9mKCc6Jyk7XG4gICAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IGluZGV4ICE9PSAtMSA/IHBhcnRpYWxEZXNjLmV4dGVuZHMuc2xpY2UoMCwgaW5kZXgpIDogbnVsbDtcbiAgICAgIGNvbnN0IHNjaGVtYXRpY05hbWUgPVxuICAgICAgICBpbmRleCA9PT0gLTEgPyBwYXJ0aWFsRGVzYy5leHRlbmRzIDogcGFydGlhbERlc2MuZXh0ZW5kcy5zbGljZShpbmRleCArIDEpO1xuXG4gICAgICBpZiAoY29sbGVjdGlvbk5hbWUgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgZXh0ZW5kQ29sbGVjdGlvbiA9IHRoaXMuY3JlYXRlQ29sbGVjdGlvbkRlc2NyaXB0aW9uKGNvbGxlY3Rpb25OYW1lKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTY2hlbWF0aWNEZXNjcmlwdGlvbihzY2hlbWF0aWNOYW1lLCBleHRlbmRDb2xsZWN0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVNjaGVtYXRpY0Rlc2NyaXB0aW9uKHNjaGVtYXRpY05hbWUsIGNvbGxlY3Rpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBVc2UgYW55IG9uIHRoaXMgcmVmIGFzIHdlIGRvbid0IGhhdmUgdGhlIE9wdGlvblQgaGVyZSwgYnV0IHdlIGRvbid0IG5lZWQgaXQgKHdlIG9ubHkgbmVlZFxuICAgIC8vIHRoZSBwYXRoKS5cbiAgICBpZiAoIXBhcnRpYWxEZXNjLmZhY3RvcnkpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNNaXNzaW5nRmFjdG9yeUV4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG4gICAgY29uc3QgcmVzb2x2ZWRSZWYgPSB0aGlzLl9yZXNvbHZlUmVmZXJlbmNlU3RyaW5nKFxuICAgICAgcGFydGlhbERlc2MuZmFjdG9yeSxcbiAgICAgIGNvbGxlY3Rpb25QYXRoLFxuICAgICAgY29sbGVjdGlvbixcbiAgICApO1xuICAgIGlmICghcmVzb2x2ZWRSZWYpIHtcbiAgICAgIHRocm93IG5ldyBGYWN0b3J5Q2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG5cbiAgICBsZXQgc2NoZW1hID0gcGFydGlhbERlc2Muc2NoZW1hO1xuICAgIGxldCBzY2hlbWFKc29uOiBKc29uT2JqZWN0IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGlmIChzY2hlbWEpIHtcbiAgICAgIGlmICghaXNBYnNvbHV0ZShzY2hlbWEpKSB7XG4gICAgICAgIHNjaGVtYSA9IGpvaW4oY29sbGVjdGlvblBhdGgsIHNjaGVtYSk7XG4gICAgICB9XG4gICAgICBzY2hlbWFKc29uID0gcmVhZEpzb25GaWxlKHNjaGVtYSkgYXMgSnNvbk9iamVjdDtcbiAgICB9XG5cbiAgICAvLyBUaGUgc2NoZW1hdGljIHBhdGggaXMgdXNlZCB0byByZXNvbHZlIFVSTHMuXG4gICAgLy8gV2Ugc2hvdWxkIGJlIGFibGUgdG8ganVzdCBkbyBgZGlybmFtZShyZXNvbHZlZFJlZi5wYXRoKWAgYnV0IGZvciBjb21wYXRpYmlsaXR5IHdpdGhcbiAgICAvLyBCYXplbCB1bmRlciBXaW5kb3dzIHRoaXMgZGlyZWN0b3J5IG5lZWRzIHRvIGJlIHJlc29sdmVkIGZyb20gdGhlIGNvbGxlY3Rpb24gaW5zdGVhZC5cbiAgICAvLyBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIG9uIEJhemVsIHVuZGVyIFdpbmRvd3MgdGhlIGRhdGEgZmlsZXMgKHN1Y2ggYXMgdGhlIGNvbGxlY3Rpb24gb3JcbiAgICAvLyB1cmwgZmlsZXMpIGFyZSBub3QgaW4gdGhlIHNhbWUgcGxhY2UgYXMgdGhlIGNvbXBpbGVkIEpTLlxuICAgIGNvbnN0IG1heWJlUGF0aCA9IGpvaW4oY29sbGVjdGlvblBhdGgsIHBhcnRpYWxEZXNjLmZhY3RvcnkpO1xuICAgIGNvbnN0IHBhdGggPVxuICAgICAgZXhpc3RzU3luYyhtYXliZVBhdGgpICYmIHN0YXRTeW5jKG1heWJlUGF0aCkuaXNEaXJlY3RvcnkoKSA/IG1heWJlUGF0aCA6IGRpcm5hbWUobWF5YmVQYXRoKTtcblxuICAgIHJldHVybiB0aGlzLl90cmFuc2Zvcm1TY2hlbWF0aWNEZXNjcmlwdGlvbihuYW1lLCBjb2xsZWN0aW9uLCB7XG4gICAgICAuLi5wYXJ0aWFsRGVzYyxcbiAgICAgIHNjaGVtYSxcbiAgICAgIHNjaGVtYUpzb24sXG4gICAgICBuYW1lLFxuICAgICAgcGF0aCxcbiAgICAgIGZhY3RvcnlGbjogcmVzb2x2ZWRSZWYucmVmLFxuICAgICAgY29sbGVjdGlvbixcbiAgICB9KTtcbiAgfVxuXG4gIGNyZWF0ZVNvdXJjZUZyb21VcmwodXJsOiBVcmwpOiBTb3VyY2UgfCBudWxsIHtcbiAgICBzd2l0Y2ggKHVybC5wcm90b2NvbCkge1xuICAgICAgY2FzZSBudWxsOlxuICAgICAgY2FzZSAnZmlsZTonOlxuICAgICAgICByZXR1cm4gKGNvbnRleHQpID0+IHtcbiAgICAgICAgICAvLyBDaGVjayBpZiBjb250ZXh0IGhhcyBuZWNlc3NhcnkgRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQgcGF0aCBwcm9wZXJ0eVxuICAgICAgICAgIGNvbnN0IGZpbGVEZXNjcmlwdGlvbiA9IGNvbnRleHQuc2NoZW1hdGljLmRlc2NyaXB0aW9uIGFzIHsgcGF0aD86IHN0cmluZyB9O1xuICAgICAgICAgIGlmIChmaWxlRGVzY3JpcHRpb24ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICdVbnN1cHBvcnRlZCBzY2hlbWF0aWMgY29udGV4dC4gRXhwZWN0ZWQgYSBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dC4nLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBSZXNvbHZlIGFsbCBmaWxlOi8vL2EvYi9jL2QgZnJvbSB0aGUgc2NoZW1hdGljJ3Mgb3duIHBhdGgsIGFuZCBub3QgdGhlIGN1cnJlbnRcbiAgICAgICAgICAvLyBwYXRoLlxuICAgICAgICAgIGNvbnN0IHJvb3QgPSBub3JtYWxpemUocmVzb2x2ZShmaWxlRGVzY3JpcHRpb24ucGF0aCwgdXJsLnBhdGggfHwgJycpKTtcblxuICAgICAgICAgIHJldHVybiBuZXcgSG9zdENyZWF0ZVRyZWUobmV3IHZpcnR1YWxGcy5TY29wZWRIb3N0KG5ldyBOb2RlSnNTeW5jSG9zdCgpLCByb290KSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB0cmFuc2Zvcm1PcHRpb25zPE9wdGlvblQgZXh0ZW5kcyBvYmplY3QsIFJlc3VsdFQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgIHNjaGVtYXRpYzogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MsXG4gICAgb3B0aW9uczogT3B0aW9uVCxcbiAgICBjb250ZXh0PzogRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQsXG4gICk6IE9ic2VydmFibGU8UmVzdWx0VD4ge1xuICAgIGNvbnN0IHRyYW5zZm9ybSA9IGFzeW5jICgpID0+IHtcbiAgICAgIGxldCB0cmFuc2Zvcm1lZE9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgZm9yIChjb25zdCB0cmFuc2Zvcm1lciBvZiB0aGlzLl90cmFuc2Zvcm1zKSB7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybWVyUmVzdWx0ID0gdHJhbnNmb3JtZXIoc2NoZW1hdGljLCB0cmFuc2Zvcm1lZE9wdGlvbnMsIGNvbnRleHQpO1xuICAgICAgICB0cmFuc2Zvcm1lZE9wdGlvbnMgPSBhd2FpdCAoaXNPYnNlcnZhYmxlKHRyYW5zZm9ybWVyUmVzdWx0KVxuICAgICAgICAgID8gbGFzdFZhbHVlRnJvbSh0cmFuc2Zvcm1lclJlc3VsdClcbiAgICAgICAgICA6IHRyYW5zZm9ybWVyUmVzdWx0KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRyYW5zZm9ybWVkT3B0aW9ucztcbiAgICB9O1xuXG4gICAgcmV0dXJuIG9ic2VydmFibGVGcm9tKHRyYW5zZm9ybSgpKSBhcyB1bmtub3duIGFzIE9ic2VydmFibGU8UmVzdWx0VD47XG4gIH1cblxuICB0cmFuc2Zvcm1Db250ZXh0KGNvbnRleHQ6IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0KTogRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQge1xuICAgIHJldHVybiB0aGlzLl9jb250ZXh0VHJhbnNmb3Jtcy5yZWR1Y2UoKGFjYywgY3VycikgPT4gY3VycihhY2MpLCBjb250ZXh0KTtcbiAgfVxuXG4gIGdldFNjaGVtYXRpY1J1bGVGYWN0b3J5PE9wdGlvblQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgIHNjaGVtYXRpYzogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MsXG4gICAgX2NvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgKTogUnVsZUZhY3Rvcnk8T3B0aW9uVD4ge1xuICAgIHJldHVybiBzY2hlbWF0aWMuZmFjdG9yeUZuO1xuICB9XG5cbiAgcmVnaXN0ZXJUYXNrRXhlY3V0b3I8VD4oZmFjdG9yeTogVGFza0V4ZWN1dG9yRmFjdG9yeTxUPiwgb3B0aW9ucz86IFQpOiB2b2lkIHtcbiAgICB0aGlzLl90YXNrRmFjdG9yaWVzLnNldChmYWN0b3J5Lm5hbWUsICgpID0+IG9ic2VydmFibGVGcm9tKGZhY3RvcnkuY3JlYXRlKG9wdGlvbnMpKSk7XG4gIH1cblxuICBjcmVhdGVUYXNrRXhlY3V0b3IobmFtZTogc3RyaW5nKTogT2JzZXJ2YWJsZTxUYXNrRXhlY3V0b3I+IHtcbiAgICBjb25zdCBmYWN0b3J5ID0gdGhpcy5fdGFza0ZhY3Rvcmllcy5nZXQobmFtZSk7XG4gICAgaWYgKGZhY3RvcnkpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRocm93RXJyb3IobmV3IFVucmVnaXN0ZXJlZFRhc2tFeGNlcHRpb24obmFtZSkpO1xuICB9XG5cbiAgaGFzVGFza0V4ZWN1dG9yKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl90YXNrRmFjdG9yaWVzLmhhcyhuYW1lKTtcbiAgfVxufVxuIl19