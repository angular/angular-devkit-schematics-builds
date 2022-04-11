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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBdUY7QUFDdkYsb0RBQTJEO0FBQzNELDJCQUEwQztBQUMxQywrQkFBMEQ7QUFDMUQsK0JBQW9GO0FBRXBGLGdDQU9nQjtBQVFoQiwrREFBcUQ7QUFXckQsTUFBYSxtQ0FBb0MsU0FBUSxvQkFBYTtJQUNwRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGNBQWMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUNsRSxDQUFDO0NBQ0Y7QUFKRCxrRkFJQztBQUNELE1BQWEsOEJBQStCLFNBQVEsb0JBQWE7SUFDL0QsWUFBWSxLQUFhLEVBQUUsSUFBWSxFQUFFLGFBQXFCO1FBQzVELElBQUksR0FBRyxHQUFHLDJCQUEyQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUM7UUFFeEUsSUFBSSxhQUFhLEVBQUU7WUFDakIsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUN6QztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNiLENBQUM7Q0FDRjtBQVZELHdFQVVDO0FBQ0QsTUFBYSxnQ0FBaUMsU0FBUSxvQkFBYTtJQUNqRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztJQUNuRSxDQUFDO0NBQ0Y7QUFKRCw0RUFJQztBQUNELE1BQWEsZ0NBQWlDLFNBQVEsb0JBQWE7SUFDakUsWUFBWSxJ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LEVBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkYsQ0FBQztJQUVELGtCQUFrQixDQUFDLElBQVk7UUFDN0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUMsSUFBSSxPQUFPLEVBQUU7WUFDWCxPQUFPLE9BQU8sRUFBRSxDQUFDO1NBQ2xCO1FBRUQsT0FBTyxJQUFBLGlCQUFVLEVBQUMsSUFBSSwrQkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxlQUFlLENBQUMsSUFBWTtRQUMxQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Q0FDRjtBQXZQRCw0REF1UEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiwgSnNvbk9iamVjdCwgbm9ybWFsaXplLCB2aXJ0dWFsRnMgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBOb2RlSnNTeW5jSG9zdCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlL25vZGUnO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgc3RhdFN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBkaXJuYW1lLCBpc0Fic29sdXRlLCBqb2luLCByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBpc09ic2VydmFibGUsIGZyb20gYXMgb2JzZXJ2YWJsZUZyb20sIHRocm93RXJyb3IgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IFVybCB9IGZyb20gJ3VybCc7XG5pbXBvcnQge1xuICBIb3N0Q3JlYXRlVHJlZSxcbiAgUnVsZUZhY3RvcnksXG4gIFNvdXJjZSxcbiAgVGFza0V4ZWN1dG9yLFxuICBUYXNrRXhlY3V0b3JGYWN0b3J5LFxuICBVbnJlZ2lzdGVyZWRUYXNrRXhjZXB0aW9uLFxufSBmcm9tICcuLi9zcmMnO1xuaW1wb3J0IHtcbiAgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLFxuICBGaWxlU3lzdGVtRW5naW5lSG9zdCxcbiAgRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQsXG4gIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjLFxuICBGaWxlU3lzdGVtU2NoZW1hdGljRGVzY3JpcHRpb24sXG59IGZyb20gJy4vZGVzY3JpcHRpb24nO1xuaW1wb3J0IHsgcmVhZEpzb25GaWxlIH0gZnJvbSAnLi9maWxlLXN5c3RlbS11dGlsaXR5JztcblxuZXhwb3J0IGRlY2xhcmUgdHlwZSBPcHRpb25UcmFuc2Zvcm08VCBleHRlbmRzIG9iamVjdCwgUiBleHRlbmRzIG9iamVjdD4gPSAoXG4gIHNjaGVtYXRpYzogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uLFxuICBvcHRpb25zOiBULFxuICBjb250ZXh0PzogRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQsXG4pID0+IE9ic2VydmFibGU8Uj4gfCBQcm9taXNlTGlrZTxSPiB8IFI7XG5leHBvcnQgZGVjbGFyZSB0eXBlIENvbnRleHRUcmFuc2Zvcm0gPSAoXG4gIGNvbnRleHQ6IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0LFxuKSA9PiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dDtcblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25DYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBDb2xsZWN0aW9uICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGNhbm5vdCBiZSByZXNvbHZlZC5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEludmFsaWRDb2xsZWN0aW9uSnNvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihfbmFtZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIGpzb25FeGNlcHRpb24/OiBFcnJvcikge1xuICAgIGxldCBtc2cgPSBgQ29sbGVjdGlvbiBKU09OIGF0IHBhdGggJHtKU09OLnN0cmluZ2lmeShwYXRoKX0gaXMgaW52YWxpZC5gO1xuXG4gICAgaWYgKGpzb25FeGNlcHRpb24pIHtcbiAgICAgIG1zZyA9IGAke21zZ30gJHtqc29uRXhjZXB0aW9uLm1lc3NhZ2V9YDtcbiAgICB9XG5cbiAgICBzdXBlcihtc2cpO1xuICB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTWlzc2luZ0ZhY3RvcnlFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpYyAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBpcyBtaXNzaW5nIGEgZmFjdG9yeS5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEZhY3RvcnlDYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBTY2hlbWF0aWMgJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gY2Fubm90IHJlc29sdmUgdGhlIGZhY3RvcnkuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uTWlzc2luZ1NjaGVtYXRpY3NNYXBFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENvbGxlY3Rpb24gXCIke25hbWV9XCIgZG9lcyBub3QgaGF2ZSBhIHNjaGVtYXRpY3MgbWFwLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbk1pc3NpbmdGaWVsZHNFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENvbGxlY3Rpb24gXCIke25hbWV9XCIgaXMgbWlzc2luZyBmaWVsZHMuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNNaXNzaW5nRmllbGRzRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBTY2hlbWF0aWMgXCIke25hbWV9XCIgaXMgbWlzc2luZyBmaWVsZHMuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNNaXNzaW5nRGVzY3JpcHRpb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpY3MgXCIke25hbWV9XCIgZG9lcyBub3QgaGF2ZSBhIGRlc2NyaXB0aW9uLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTmFtZUNvbGxpc2lvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIGBTY2hlbWF0aWNzL2FsaWFzICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGNvbGxpZGVzIHdpdGggYW5vdGhlciBhbGlhcyBvciBzY2hlbWF0aWNgICtcbiAgICAgICAgJyBuYW1lLicsXG4gICAgKTtcbiAgfVxufVxuXG4vKipcbiAqIEEgRW5naW5lSG9zdCBiYXNlIGNsYXNzIHRoYXQgdXNlcyB0aGUgZmlsZSBzeXN0ZW0gdG8gcmVzb2x2ZSBjb2xsZWN0aW9ucy4gVGhpcyBpcyB0aGUgYmFzZSBvZlxuICogYWxsIG90aGVyIEVuZ2luZUhvc3QgcHJvdmlkZWQgYnkgdGhlIHRvb2xpbmcgcGFydCBvZiB0aGUgU2NoZW1hdGljcyBsaWJyYXJ5LlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRmlsZVN5c3RlbUVuZ2luZUhvc3RCYXNlIGltcGxlbWVudHMgRmlsZVN5c3RlbUVuZ2luZUhvc3Qge1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgX3Jlc29sdmVDb2xsZWN0aW9uUGF0aChuYW1lOiBzdHJpbmcsIHJlcXVlc3Rlcj86IHN0cmluZyk6IHN0cmluZztcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF9yZXNvbHZlUmVmZXJlbmNlU3RyaW5nKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBwYXJlbnRQYXRoOiBzdHJpbmcsXG4gICAgY29sbGVjdGlvbkRlc2NyaXB0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICk6IHsgcmVmOiBSdWxlRmFjdG9yeTx7fT47IHBhdGg6IHN0cmluZyB9IHwgbnVsbDtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF90cmFuc2Zvcm1Db2xsZWN0aW9uRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGRlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjPixcbiAgKTogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjO1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgX3RyYW5zZm9ybVNjaGVtYXRpY0Rlc2NyaXB0aW9uKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBjb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICAgZGVzYzogUGFydGlhbDxGaWxlU3lzdGVtU2NoZW1hdGljRGVzYz4sXG4gICk6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjO1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHByaXZhdGUgX3RyYW5zZm9ybXM6IE9wdGlvblRyYW5zZm9ybTxhbnksIGFueT5bXSA9IFtdO1xuICBwcml2YXRlIF9jb250ZXh0VHJhbnNmb3JtczogQ29udGV4dFRyYW5zZm9ybVtdID0gW107XG4gIHByaXZhdGUgX3Rhc2tGYWN0b3JpZXMgPSBuZXcgTWFwPHN0cmluZywgKCkgPT4gT2JzZXJ2YWJsZTxUYXNrRXhlY3V0b3I+PigpO1xuXG4gIGxpc3RTY2hlbWF0aWNOYW1lcyhjb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsIGluY2x1ZGVIaWRkZW4/OiBib29sZWFuKSB7XG4gICAgY29uc3Qgc2NoZW1hdGljczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhjb2xsZWN0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICBjb25zdCBzY2hlbWF0aWMgPSBjb2xsZWN0aW9uLnNjaGVtYXRpY3Nba2V5XTtcblxuICAgICAgaWYgKChzY2hlbWF0aWMuaGlkZGVuICYmICFpbmNsdWRlSGlkZGVuKSB8fCBzY2hlbWF0aWMucHJpdmF0ZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgZXh0ZW5kcyBpcyBwcmVzZW50IHdpdGhvdXQgYSBmYWN0b3J5IGl0IGlzIGFuIGFsaWFzLCBkbyBub3QgcmV0dXJuIGl0XG4gICAgICAvLyAgIHVubGVzcyBpdCBpcyBmcm9tIGFub3RoZXIgY29sbGVjdGlvbi5cbiAgICAgIGlmICghc2NoZW1hdGljLmV4dGVuZHMgfHwgc2NoZW1hdGljLmZhY3RvcnkpIHtcbiAgICAgICAgc2NoZW1hdGljcy5wdXNoKGtleSk7XG4gICAgICB9IGVsc2UgaWYgKHNjaGVtYXRpYy5leHRlbmRzICYmIHNjaGVtYXRpYy5leHRlbmRzLmluZGV4T2YoJzonKSAhPT0gLTEpIHtcbiAgICAgICAgc2NoZW1hdGljcy5wdXNoKGtleSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjaGVtYXRpY3M7XG4gIH1cblxuICByZWdpc3Rlck9wdGlvbnNUcmFuc2Zvcm08VCBleHRlbmRzIG9iamVjdCwgUiBleHRlbmRzIG9iamVjdD4odDogT3B0aW9uVHJhbnNmb3JtPFQsIFI+KSB7XG4gICAgdGhpcy5fdHJhbnNmb3Jtcy5wdXNoKHQpO1xuICB9XG5cbiAgcmVnaXN0ZXJDb250ZXh0VHJhbnNmb3JtKHQ6IENvbnRleHRUcmFuc2Zvcm0pIHtcbiAgICB0aGlzLl9jb250ZXh0VHJhbnNmb3Jtcy5wdXNoKHQpO1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lXG4gICAqIEByZXR1cm4ge3twYXRoOiBzdHJpbmd9fVxuICAgKi9cbiAgY3JlYXRlQ29sbGVjdGlvbkRlc2NyaXB0aW9uKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICByZXF1ZXN0ZXI/OiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICk6IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyB7XG4gICAgY29uc3QgcGF0aCA9IHRoaXMuX3Jlc29sdmVDb2xsZWN0aW9uUGF0aChuYW1lLCByZXF1ZXN0ZXI/LnBhdGgpO1xuICAgIGNvbnN0IGpzb25WYWx1ZSA9IHJlYWRKc29uRmlsZShwYXRoKTtcbiAgICBpZiAoIWpzb25WYWx1ZSB8fCB0eXBlb2YganNvblZhbHVlICE9ICdvYmplY3QnIHx8IEFycmF5LmlzQXJyYXkoanNvblZhbHVlKSkge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRDb2xsZWN0aW9uSnNvbkV4Y2VwdGlvbihuYW1lLCBwYXRoKTtcbiAgICB9XG5cbiAgICAvLyBub3JtYWxpemUgZXh0ZW5kcyBwcm9wZXJ0eSB0byBhbiBhcnJheVxuICAgIGlmICh0eXBlb2YganNvblZhbHVlWydleHRlbmRzJ10gPT09ICdzdHJpbmcnKSB7XG4gICAgICBqc29uVmFsdWVbJ2V4dGVuZHMnXSA9IFtqc29uVmFsdWVbJ2V4dGVuZHMnXV07XG4gICAgfVxuXG4gICAgY29uc3QgZGVzY3JpcHRpb24gPSB0aGlzLl90cmFuc2Zvcm1Db2xsZWN0aW9uRGVzY3JpcHRpb24obmFtZSwge1xuICAgICAgLi4uanNvblZhbHVlLFxuICAgICAgcGF0aCxcbiAgICB9KTtcbiAgICBpZiAoIWRlc2NyaXB0aW9uIHx8ICFkZXNjcmlwdGlvbi5uYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZENvbGxlY3Rpb25Kc29uRXhjZXB0aW9uKG5hbWUsIHBhdGgpO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIGFsaWFzZXMuXG4gICAgY29uc3QgYWxsTmFtZXMgPSBPYmplY3Qua2V5cyhkZXNjcmlwdGlvbi5zY2hlbWF0aWNzKTtcbiAgICBmb3IgKGNvbnN0IHNjaGVtYXRpY05hbWUgb2YgT2JqZWN0LmtleXMoZGVzY3JpcHRpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIGNvbnN0IGFsaWFzZXMgPSBkZXNjcmlwdGlvbi5zY2hlbWF0aWNzW3NjaGVtYXRpY05hbWVdLmFsaWFzZXMgfHwgW107XG5cbiAgICAgIGZvciAoY29uc3QgYWxpYXMgb2YgYWxpYXNlcykge1xuICAgICAgICBpZiAoYWxsTmFtZXMuaW5kZXhPZihhbGlhcykgIT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgU2NoZW1hdGljTmFtZUNvbGxpc2lvbkV4Y2VwdGlvbihhbGlhcyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYWxsTmFtZXMucHVzaCguLi5hbGlhc2VzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVzY3JpcHRpb247XG4gIH1cblxuICBjcmVhdGVTY2hlbWF0aWNEZXNjcmlwdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLFxuICApOiBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyB8IG51bGwge1xuICAgIC8vIFJlc29sdmUgYWxpYXNlcyBmaXJzdC5cbiAgICBmb3IgKGNvbnN0IHNjaGVtYXRpY05hbWUgb2YgT2JqZWN0LmtleXMoY29sbGVjdGlvbi5zY2hlbWF0aWNzKSkge1xuICAgICAgY29uc3Qgc2NoZW1hdGljRGVzY3JpcHRpb24gPSBjb2xsZWN0aW9uLnNjaGVtYXRpY3Nbc2NoZW1hdGljTmFtZV07XG4gICAgICBpZiAoc2NoZW1hdGljRGVzY3JpcHRpb24uYWxpYXNlcyAmJiBzY2hlbWF0aWNEZXNjcmlwdGlvbi5hbGlhc2VzLmluZGV4T2YobmFtZSkgIT0gLTEpIHtcbiAgICAgICAgbmFtZSA9IHNjaGVtYXRpY05hbWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghKG5hbWUgaW4gY29sbGVjdGlvbi5zY2hlbWF0aWNzKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgY29sbGVjdGlvblBhdGggPSBkaXJuYW1lKGNvbGxlY3Rpb24ucGF0aCk7XG4gICAgY29uc3QgcGFydGlhbERlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M+IHwgbnVsbCA9IGNvbGxlY3Rpb24uc2NoZW1hdGljc1tuYW1lXTtcbiAgICBpZiAoIXBhcnRpYWxEZXNjKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAocGFydGlhbERlc2MuZXh0ZW5kcykge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJ0aWFsRGVzYy5leHRlbmRzLmluZGV4T2YoJzonKTtcbiAgICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gaW5kZXggIT09IC0xID8gcGFydGlhbERlc2MuZXh0ZW5kcy5zbGljZSgwLCBpbmRleCkgOiBudWxsO1xuICAgICAgY29uc3Qgc2NoZW1hdGljTmFtZSA9XG4gICAgICAgIGluZGV4ID09PSAtMSA/IHBhcnRpYWxEZXNjLmV4dGVuZHMgOiBwYXJ0aWFsRGVzYy5leHRlbmRzLnNsaWNlKGluZGV4ICsgMSk7XG5cbiAgICAgIGlmIChjb2xsZWN0aW9uTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICBjb25zdCBleHRlbmRDb2xsZWN0aW9uID0gdGhpcy5jcmVhdGVDb2xsZWN0aW9uRGVzY3JpcHRpb24oY29sbGVjdGlvbk5hbWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVNjaGVtYXRpY0Rlc2NyaXB0aW9uKHNjaGVtYXRpY05hbWUsIGV4dGVuZENvbGxlY3Rpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU2NoZW1hdGljRGVzY3JpcHRpb24oc2NoZW1hdGljTmFtZSwgY29sbGVjdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFVzZSBhbnkgb24gdGhpcyByZWYgYXMgd2UgZG9uJ3QgaGF2ZSB0aGUgT3B0aW9uVCBoZXJlLCBidXQgd2UgZG9uJ3QgbmVlZCBpdCAod2Ugb25seSBuZWVkXG4gICAgLy8gdGhlIHBhdGgpLlxuICAgIGlmICghcGFydGlhbERlc2MuZmFjdG9yeSkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY01pc3NpbmdGYWN0b3J5RXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cbiAgICBjb25zdCByZXNvbHZlZFJlZiA9IHRoaXMuX3Jlc29sdmVSZWZlcmVuY2VTdHJpbmcoXG4gICAgICBwYXJ0aWFsRGVzYy5mYWN0b3J5LFxuICAgICAgY29sbGVjdGlvblBhdGgsXG4gICAgICBjb2xsZWN0aW9uLFxuICAgICk7XG4gICAgaWYgKCFyZXNvbHZlZFJlZikge1xuICAgICAgdGhyb3cgbmV3IEZhY3RvcnlDYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cblxuICAgIGxldCBzY2hlbWEgPSBwYXJ0aWFsRGVzYy5zY2hlbWE7XG4gICAgbGV0IHNjaGVtYUpzb246IEpzb25PYmplY3QgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHNjaGVtYSkge1xuICAgICAgaWYgKCFpc0Fic29sdXRlKHNjaGVtYSkpIHtcbiAgICAgICAgc2NoZW1hID0gam9pbihjb2xsZWN0aW9uUGF0aCwgc2NoZW1hKTtcbiAgICAgIH1cbiAgICAgIHNjaGVtYUpzb24gPSByZWFkSnNvbkZpbGUoc2NoZW1hKSBhcyBKc29uT2JqZWN0O1xuICAgIH1cblxuICAgIC8vIFRoZSBzY2hlbWF0aWMgcGF0aCBpcyB1c2VkIHRvIHJlc29sdmUgVVJMcy5cbiAgICAvLyBXZSBzaG91bGQgYmUgYWJsZSB0byBqdXN0IGRvIGBkaXJuYW1lKHJlc29sdmVkUmVmLnBhdGgpYCBidXQgZm9yIGNvbXBhdGliaWxpdHkgd2l0aFxuICAgIC8vIEJhemVsIHVuZGVyIFdpbmRvd3MgdGhpcyBkaXJlY3RvcnkgbmVlZHMgdG8gYmUgcmVzb2x2ZWQgZnJvbSB0aGUgY29sbGVjdGlvbiBpbnN0ZWFkLlxuICAgIC8vIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2Ugb24gQmF6ZWwgdW5kZXIgV2luZG93cyB0aGUgZGF0YSBmaWxlcyAoc3VjaCBhcyB0aGUgY29sbGVjdGlvbiBvclxuICAgIC8vIHVybCBmaWxlcykgYXJlIG5vdCBpbiB0aGUgc2FtZSBwbGFjZSBhcyB0aGUgY29tcGlsZWQgSlMuXG4gICAgY29uc3QgbWF5YmVQYXRoID0gam9pbihjb2xsZWN0aW9uUGF0aCwgcGFydGlhbERlc2MuZmFjdG9yeSk7XG4gICAgY29uc3QgcGF0aCA9XG4gICAgICBleGlzdHNTeW5jKG1heWJlUGF0aCkgJiYgc3RhdFN5bmMobWF5YmVQYXRoKS5pc0RpcmVjdG9yeSgpID8gbWF5YmVQYXRoIDogZGlybmFtZShtYXliZVBhdGgpO1xuXG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybVNjaGVtYXRpY0Rlc2NyaXB0aW9uKG5hbWUsIGNvbGxlY3Rpb24sIHtcbiAgICAgIC4uLnBhcnRpYWxEZXNjLFxuICAgICAgc2NoZW1hLFxuICAgICAgc2NoZW1hSnNvbixcbiAgICAgIG5hbWUsXG4gICAgICBwYXRoLFxuICAgICAgZmFjdG9yeUZuOiByZXNvbHZlZFJlZi5yZWYsXG4gICAgICBjb2xsZWN0aW9uLFxuICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlU291cmNlRnJvbVVybCh1cmw6IFVybCk6IFNvdXJjZSB8IG51bGwge1xuICAgIHN3aXRjaCAodXJsLnByb3RvY29sKSB7XG4gICAgICBjYXNlIG51bGw6XG4gICAgICBjYXNlICdmaWxlOic6XG4gICAgICAgIHJldHVybiAoY29udGV4dCkgPT4ge1xuICAgICAgICAgIC8vIENoZWNrIGlmIGNvbnRleHQgaGFzIG5lY2Vzc2FyeSBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCBwYXRoIHByb3BlcnR5XG4gICAgICAgICAgY29uc3QgZmlsZURlc2NyaXB0aW9uID0gY29udGV4dC5zY2hlbWF0aWMuZGVzY3JpcHRpb24gYXMgeyBwYXRoPzogc3RyaW5nIH07XG4gICAgICAgICAgaWYgKGZpbGVEZXNjcmlwdGlvbi5wYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgJ1Vuc3VwcG9ydGVkIHNjaGVtYXRpYyBjb250ZXh0LiBFeHBlY3RlZCBhIEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0LicsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFJlc29sdmUgYWxsIGZpbGU6Ly8vYS9iL2MvZCBmcm9tIHRoZSBzY2hlbWF0aWMncyBvd24gcGF0aCwgYW5kIG5vdCB0aGUgY3VycmVudFxuICAgICAgICAgIC8vIHBhdGguXG4gICAgICAgICAgY29uc3Qgcm9vdCA9IG5vcm1hbGl6ZShyZXNvbHZlKGZpbGVEZXNjcmlwdGlvbi5wYXRoLCB1cmwucGF0aCB8fCAnJykpO1xuXG4gICAgICAgICAgcmV0dXJuIG5ldyBIb3N0Q3JlYXRlVHJlZShuZXcgdmlydHVhbEZzLlNjb3BlZEhvc3QobmV3IE5vZGVKc1N5bmNIb3N0KCksIHJvb3QpKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHRyYW5zZm9ybU9wdGlvbnM8T3B0aW9uVCBleHRlbmRzIG9iamVjdCwgUmVzdWx0VCBleHRlbmRzIG9iamVjdD4oXG4gICAgc2NoZW1hdGljOiBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyxcbiAgICBvcHRpb25zOiBPcHRpb25ULFxuICAgIGNvbnRleHQ/OiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCxcbiAgKTogT2JzZXJ2YWJsZTxSZXN1bHRUPiB7XG4gICAgY29uc3QgdHJhbnNmb3JtID0gYXN5bmMgKCkgPT4ge1xuICAgICAgbGV0IHRyYW5zZm9ybWVkT3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICBmb3IgKGNvbnN0IHRyYW5zZm9ybWVyIG9mIHRoaXMuX3RyYW5zZm9ybXMpIHtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtZXJSZXN1bHQgPSB0cmFuc2Zvcm1lcihzY2hlbWF0aWMsIHRyYW5zZm9ybWVkT3B0aW9ucywgY29udGV4dCk7XG4gICAgICAgIHRyYW5zZm9ybWVkT3B0aW9ucyA9IGF3YWl0IChpc09ic2VydmFibGUodHJhbnNmb3JtZXJSZXN1bHQpXG4gICAgICAgICAgPyB0cmFuc2Zvcm1lclJlc3VsdC50b1Byb21pc2UoKVxuICAgICAgICAgIDogdHJhbnNmb3JtZXJSZXN1bHQpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJhbnNmb3JtZWRPcHRpb25zO1xuICAgIH07XG5cbiAgICByZXR1cm4gb2JzZXJ2YWJsZUZyb20odHJhbnNmb3JtKCkpIGFzIHVua25vd24gYXMgT2JzZXJ2YWJsZTxSZXN1bHRUPjtcbiAgfVxuXG4gIHRyYW5zZm9ybUNvbnRleHQoY29udGV4dDogRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQpOiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRleHRUcmFuc2Zvcm1zLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiBjdXJyKGFjYyksIGNvbnRleHQpO1xuICB9XG5cbiAgZ2V0U2NoZW1hdGljUnVsZUZhY3Rvcnk8T3B0aW9uVCBleHRlbmRzIG9iamVjdD4oXG4gICAgc2NoZW1hdGljOiBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyxcbiAgICBfY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLFxuICApOiBSdWxlRmFjdG9yeTxPcHRpb25UPiB7XG4gICAgcmV0dXJuIHNjaGVtYXRpYy5mYWN0b3J5Rm47XG4gIH1cblxuICByZWdpc3RlclRhc2tFeGVjdXRvcjxUPihmYWN0b3J5OiBUYXNrRXhlY3V0b3JGYWN0b3J5PFQ+LCBvcHRpb25zPzogVCk6IHZvaWQge1xuICAgIHRoaXMuX3Rhc2tGYWN0b3JpZXMuc2V0KGZhY3RvcnkubmFtZSwgKCkgPT4gb2JzZXJ2YWJsZUZyb20oZmFjdG9yeS5jcmVhdGUob3B0aW9ucykpKTtcbiAgfVxuXG4gIGNyZWF0ZVRhc2tFeGVjdXRvcihuYW1lOiBzdHJpbmcpOiBPYnNlcnZhYmxlPFRhc2tFeGVjdXRvcj4ge1xuICAgIGNvbnN0IGZhY3RvcnkgPSB0aGlzLl90YXNrRmFjdG9yaWVzLmdldChuYW1lKTtcbiAgICBpZiAoZmFjdG9yeSkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhyb3dFcnJvcihuZXcgVW5yZWdpc3RlcmVkVGFza0V4Y2VwdGlvbihuYW1lKSk7XG4gIH1cblxuICBoYXNUYXNrRXhlY3V0b3IobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3Rhc2tGYWN0b3JpZXMuaGFzKG5hbWUpO1xuICB9XG59XG4iXX0=