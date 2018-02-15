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
const node_1 = require("@angular-devkit/core/node");
const path_1 = require("path");
const from_1 = require("rxjs/observable/from");
const of_1 = require("rxjs/observable/of");
const throw_1 = require("rxjs/observable/throw");
const mergeMap_1 = require("rxjs/operators/mergeMap");
const src_1 = require("../src");
const file_system_utility_1 = require("./file-system-utility");
class CollectionCannotBeResolvedException extends core_1.BaseException {
    constructor(name) {
        super(`Collection ${JSON.stringify(name)} cannot be resolved.`);
    }
}
exports.CollectionCannotBeResolvedException = CollectionCannotBeResolvedException;
class InvalidCollectionJsonException extends core_1.BaseException {
    constructor(_name, path) {
        super(`Collection JSON at path ${JSON.stringify(path)} is invalid.`);
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
    constructor(name) { super(`Collection "${name}" does not have a schematics map.`); }
}
exports.CollectionMissingSchematicsMapException = CollectionMissingSchematicsMapException;
class CollectionMissingFieldsException extends core_1.BaseException {
    constructor(name) { super(`Collection "${name}" is missing fields.`); }
}
exports.CollectionMissingFieldsException = CollectionMissingFieldsException;
class SchematicMissingFieldsException extends core_1.BaseException {
    constructor(name) { super(`Schematic "${name}" is missing fields.`); }
}
exports.SchematicMissingFieldsException = SchematicMissingFieldsException;
class SchematicMissingDescriptionException extends core_1.BaseException {
    constructor(name) { super(`Schematics "${name}" does not have a description.`); }
}
exports.SchematicMissingDescriptionException = SchematicMissingDescriptionException;
class SchematicNameCollisionException extends core_1.BaseException {
    constructor(name) {
        super(`Schematics/alias ${JSON.stringify(name)} collides with another alias or schematic`
            + ' name.');
    }
}
exports.SchematicNameCollisionException = SchematicNameCollisionException;
/**
 * A EngineHost base class that uses the file system to resolve collections. This is the base of
 * all other EngineHost provided by the tooling part of the Schematics library.
 */
class FileSystemEngineHostBase {
    constructor() {
        this._transforms = [];
        this._taskFactories = new Map();
    }
    /**
     * @deprecated Use `listSchematicNames`.
     */
    listSchematics(collection) {
        return this.listSchematicNames(collection.description);
    }
    listSchematicNames(collection) {
        const schematics = [];
        for (const key of Object.keys(collection.schematics)) {
            const schematic = collection.schematics[key];
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
    /**
     *
     * @param name
     * @return {{path: string}}
     */
    createCollectionDescription(name) {
        const path = this._resolveCollectionPath(name);
        const jsonValue = file_system_utility_1.readJsonFile(path);
        if (!jsonValue || typeof jsonValue != 'object' || Array.isArray(jsonValue)) {
            throw new InvalidCollectionJsonException(name, path);
        }
        // normalize extends property to an array
        if (typeof jsonValue['extends'] === 'string') {
            jsonValue['extends'] = [jsonValue['extends']];
        }
        const description = this._transformCollectionDescription(name, Object.assign({}, jsonValue, { path }));
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
                allNames.push(...aliases);
            }
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
        const collectionPath = path_1.dirname(collection.path);
        const partialDesc = collection.schematics[name];
        if (!partialDesc) {
            return null;
        }
        if (partialDesc.extends) {
            const index = partialDesc.extends.indexOf(':');
            const collectionName = index !== -1 ? partialDesc.extends.substr(0, index) : null;
            const schematicName = index === -1 ?
                partialDesc.extends : partialDesc.extends.substr(index + 1);
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
        const { path } = resolvedRef;
        let schema = partialDesc.schema;
        let schemaJson = undefined;
        if (schema) {
            if (!path_1.isAbsolute(schema)) {
                schema = path_1.join(collectionPath, schema);
            }
            schemaJson = file_system_utility_1.readJsonFile(schema);
        }
        return this._transformSchematicDescription(name, collection, Object.assign({}, partialDesc, { schema,
            schemaJson,
            name,
            path, factoryFn: resolvedRef.ref, collection }));
    }
    createSourceFromUrl(url) {
        switch (url.protocol) {
            case null:
            case 'file:':
                return (context) => {
                    // Resolve all file:///a/b/c/d from the schematic's own path, and not the current
                    // path.
                    const root = core_1.normalize(path_1.resolve(path_1.dirname(context.schematic.description.path), url.path || ''));
                    return new src_1.FileSystemCreateTree(new core_1.virtualFs.ScopedHost(new node_1.NodeJsSyncHost(), root));
                };
        }
        return null;
    }
    transformOptions(schematic, options) {
        return (of_1.of(options)
            .pipe(...this._transforms.map(tFn => mergeMap_1.mergeMap(opt => {
            const newOptions = tFn(schematic, opt);
            if (Symbol.observable in newOptions) {
                return newOptions;
            }
            else {
                return of_1.of(newOptions);
            }
        }))));
    }
    getSchematicRuleFactory(schematic, _collection) {
        return schematic.factoryFn;
    }
    registerTaskExecutor(factory, options) {
        this._taskFactories.set(factory.name, () => from_1.from(factory.create(options)));
    }
    createTaskExecutor(name) {
        const factory = this._taskFactories.get(name);
        if (factory) {
            return factory();
        }
        return throw_1._throw(new src_1.UnregisteredTaskException(name));
    }
    hasTaskExecutor(name) {
        return this._taskFactories.has(name);
    }
}
exports.FileSystemEngineHostBase = FileSystemEngineHostBase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90b29scy9maWxlLXN5c3RlbS1lbmdpbmUtaG9zdC1iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQXVGO0FBQ3ZGLG9EQUEyRDtBQUMzRCwrQkFBMEQ7QUFFMUQsK0NBQThEO0FBQzlELDJDQUF3RDtBQUN4RCxpREFBK0M7QUFDL0Msc0RBQW1EO0FBRW5ELGdDQVFnQjtBQVNoQiwrREFBcUQ7QUFZckQseUNBQWlELFNBQVEsb0JBQWE7SUFDcEUsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyxjQUFjLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7SUFDbEUsQ0FBQztDQUNGO0FBSkQsa0ZBSUM7QUFDRCxvQ0FBNEMsU0FBUSxvQkFBYTtJQUMvRCxZQUFZLEtBQWEsRUFBRSxJQUFZO1FBQ3JDLEtBQUssQ0FBQywyQkFBMkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDdkUsQ0FBQztDQUNGO0FBSkQsd0VBSUM7QUFDRCxzQ0FBOEMsU0FBUSxvQkFBYTtJQUNqRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztJQUNuRSxDQUFDO0NBQ0Y7QUFKRCw0RUFJQztBQUNELHNDQUE4QyxTQUFRLG9CQUFhO0lBQ2pFLFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsYUFBYSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7Q0FDRjtBQUpELDRFQUlDO0FBQ0QsNkNBQXFELFNBQVEsb0JBQWE7SUFDeEUsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLGVBQWUsSUFBSSxtQ0FBbUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUM3RjtBQUZELDBGQUVDO0FBQ0Qsc0NBQThDLFNBQVEsb0JBQWE7SUFDakUsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLGVBQWUsSUFBSSxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoRjtBQUZELDRFQUVDO0FBQ0QscUNBQTZDLFNBQVEsb0JBQWE7SUFDaEUsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLGNBQWMsSUFBSSxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUMvRTtBQUZELDBFQUVDO0FBQ0QsMENBQWtELFNBQVEsb0JBQWE7SUFDckUsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLGVBQWUsSUFBSSxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUMxRjtBQUZELG9GQUVDO0FBQ0QscUNBQTZDLFNBQVEsb0JBQWE7SUFDaEUsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyxvQkFBb0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsMkNBQTJDO2NBQ2pGLFFBQVEsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQUxELDBFQUtDO0FBR0Q7OztHQUdHO0FBQ0g7SUFBQTtRQVlVLGdCQUFXLEdBQThCLEVBQUUsQ0FBQztRQUM1QyxtQkFBYyxHQUFHLElBQUksR0FBRyxFQUEwQyxDQUFDO0lBbU03RSxDQUFDO0lBak1DOztPQUVHO0lBQ0gsY0FBYyxDQUFDLFVBQWdDO1FBQzdDLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFDRCxrQkFBa0IsQ0FBQyxVQUEyQztRQUM1RCxNQUFNLFVBQVUsR0FBYSxFQUFFLENBQUM7UUFDaEMsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFN0MsMkVBQTJFO1lBQzNFLDBDQUEwQztZQUMxQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdkIsQ0FBQztZQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEUsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN2QixDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sQ0FBQyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVELHdCQUF3QixDQUFxQyxDQUF3QjtRQUNuRixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILDJCQUEyQixDQUFDLElBQVk7UUFDdEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9DLE1BQU0sU0FBUyxHQUFHLGtDQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLElBQUksT0FBTyxTQUFTLElBQUksUUFBUSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sSUFBSSw4QkFBOEIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVELHlDQUF5QztRQUN6QyxFQUFFLENBQUMsQ0FBQyxPQUFPLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzdDLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsK0JBQStCLENBQUMsSUFBSSxvQkFDeEQsU0FBUyxJQUNaLElBQUksSUFDSixDQUFDO1FBQ0gsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN0QyxNQUFNLElBQUksOEJBQThCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFFRCxvQkFBb0I7UUFDcEIsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDckQsR0FBRyxDQUFDLENBQUMsTUFBTSxhQUFhLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQztZQUVwRSxHQUFHLENBQUMsQ0FBQyxNQUFNLEtBQUssSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEMsTUFBTSxJQUFJLCtCQUErQixDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNuRCxDQUFDO2dCQUNELFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztZQUM1QixDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sQ0FBQyxXQUFXLENBQUM7SUFDckIsQ0FBQztJQUVELDBCQUEwQixDQUN4QixJQUFZLEVBQ1osVUFBb0M7UUFFcEMseUJBQXlCO1FBQ3pCLEdBQUcsQ0FBQyxDQUFDLE1BQU0sYUFBYSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRCxNQUFNLG9CQUFvQixHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDbEUsRUFBRSxDQUFDLENBQUMsb0JBQW9CLENBQUMsT0FBTyxJQUFJLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRixJQUFJLEdBQUcsYUFBYSxDQUFDO2dCQUNyQixLQUFLLENBQUM7WUFDUixDQUFDO1FBQ0gsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUVELE1BQU0sY0FBYyxHQUFHLGNBQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEQsTUFBTSxXQUFXLEdBQTRDLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekYsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDeEIsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDL0MsTUFBTSxjQUFjLEdBQUcsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNsRixNQUFNLGFBQWEsR0FBRyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRTlELEVBQUUsQ0FBQyxDQUFDLGNBQWMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFFMUUsTUFBTSxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxhQUFhLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUMxRSxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sTUFBTSxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxhQUFhLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDcEUsQ0FBQztRQUNILENBQUM7UUFDRCw0RkFBNEY7UUFDNUYsYUFBYTtRQUNiLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDekIsTUFBTSxJQUFJLGdDQUFnQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFDRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztRQUN0RixFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDakIsTUFBTSxJQUFJLGdDQUFnQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFRCxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsV0FBVyxDQUFDO1FBQzdCLElBQUksTUFBTSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUM7UUFDaEMsSUFBSSxVQUFVLEdBQTJCLFNBQVMsQ0FBQztRQUNuRCxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ1gsRUFBRSxDQUFDLENBQUMsQ0FBQyxpQkFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEIsTUFBTSxHQUFHLFdBQUksQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDeEMsQ0FBQztZQUNELFVBQVUsR0FBRyxrQ0FBWSxDQUFDLE1BQU0sQ0FBZSxDQUFDO1FBQ2xELENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLElBQUksRUFBRSxVQUFVLG9CQUN0RCxXQUFXLElBQ2QsTUFBTTtZQUNOLFVBQVU7WUFDVixJQUFJO1lBQ0osSUFBSSxFQUNKLFNBQVMsRUFBRSxXQUFXLENBQUMsR0FBRyxFQUMxQixVQUFVLElBQ1YsQ0FBQztJQUNMLENBQUM7SUFFRCxtQkFBbUIsQ0FBQyxHQUFRO1FBQzFCLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLEtBQUssSUFBSSxDQUFDO1lBQ1YsS0FBSyxPQUFPO2dCQUNWLE1BQU0sQ0FBQyxDQUFDLE9BQW1DLEVBQUUsRUFBRTtvQkFDN0MsaUZBQWlGO29CQUNqRixRQUFRO29CQUNSLE1BQU0sSUFBSSxHQUFHLGdCQUFTLENBQ3BCLGNBQU8sQ0FBQyxjQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FDckUsQ0FBQztvQkFFRixNQUFNLENBQUMsSUFBSSwwQkFBb0IsQ0FBQyxJQUFJLGdCQUFTLENBQUMsVUFBVSxDQUFDLElBQUkscUJBQWMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3hGLENBQUMsQ0FBQztRQUNOLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELGdCQUFnQixDQUNkLFNBQWtDLEVBQ2xDLE9BQWdCO1FBRWhCLE1BQU0sQ0FBQyxDQUFDLE9BQVksQ0FBQyxPQUFPLENBQUM7YUFDMUIsSUFBSSxDQUNILEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxtQkFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzVDLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDdkMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxNQUFNLENBQUMsVUFBVSxDQUFDO1lBQ3BCLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixNQUFNLENBQUMsT0FBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2xDLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQyxDQUNKLENBQThCLENBQUM7SUFDcEMsQ0FBQztJQUVELHVCQUF1QixDQUNyQixTQUFrQyxFQUNsQyxXQUFxQztRQUNyQyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztJQUM3QixDQUFDO0lBRUQsb0JBQW9CLENBQUksT0FBK0IsRUFBRSxPQUFXO1FBQ2xFLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsV0FBYyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7SUFFRCxrQkFBa0IsQ0FBQyxJQUFZO1FBQzdCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDWixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbkIsQ0FBQztRQUVELE1BQU0sQ0FBQyxjQUFNLENBQUMsSUFBSSwrQkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRCxlQUFlLENBQUMsSUFBWTtRQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztDQUNGO0FBaE5ELDREQWdOQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24sIEpzb25PYmplY3QsIG5vcm1hbGl6ZSwgdmlydHVhbEZzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgTm9kZUpzU3luY0hvc3QgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9ub2RlJztcbmltcG9ydCB7IGRpcm5hbWUsIGlzQWJzb2x1dGUsIGpvaW4sIHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzL09ic2VydmFibGUnO1xuaW1wb3J0IHsgZnJvbSBhcyBvYnNlcnZhYmxlRnJvbSB9IGZyb20gJ3J4anMvb2JzZXJ2YWJsZS9mcm9tJztcbmltcG9ydCB7IG9mIGFzIG9ic2VydmFibGVPZiB9IGZyb20gJ3J4anMvb2JzZXJ2YWJsZS9vZic7XG5pbXBvcnQgeyBfdGhyb3cgfSBmcm9tICdyeGpzL29ic2VydmFibGUvdGhyb3cnO1xuaW1wb3J0IHsgbWVyZ2VNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycy9tZXJnZU1hcCc7XG5pbXBvcnQgeyBVcmwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHtcbiAgRW5naW5lSG9zdCxcbiAgRmlsZVN5c3RlbUNyZWF0ZVRyZWUsXG4gIFJ1bGVGYWN0b3J5LFxuICBTb3VyY2UsXG4gIFRhc2tFeGVjdXRvcixcbiAgVGFza0V4ZWN1dG9yRmFjdG9yeSxcbiAgVW5yZWdpc3RlcmVkVGFza0V4Y2VwdGlvbixcbn0gZnJvbSAnLi4vc3JjJztcbmltcG9ydCB7XG4gIEZpbGVTeXN0ZW1Db2xsZWN0aW9uLFxuICBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gIEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzY3JpcHRpb24sXG4gIEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0LFxuICBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyxcbiAgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uLFxufSBmcm9tICcuL2Rlc2NyaXB0aW9uJztcbmltcG9ydCB7IHJlYWRKc29uRmlsZSB9IGZyb20gJy4vZmlsZS1zeXN0ZW0tdXRpbGl0eSc7XG5cblxuZGVjbGFyZSBjb25zdCBTeW1ib2w6IFN5bWJvbCAmIHtcbiAgcmVhZG9ubHkgb2JzZXJ2YWJsZTogc3ltYm9sO1xufTtcblxuXG5leHBvcnQgZGVjbGFyZSB0eXBlIE9wdGlvblRyYW5zZm9ybTxUIGV4dGVuZHMgb2JqZWN0LCBSIGV4dGVuZHMgb2JqZWN0PlxuICAgID0gKHNjaGVtYXRpYzogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uLCBvcHRpb25zOiBUKSA9PiBPYnNlcnZhYmxlPFI+O1xuXG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uQ2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgQ29sbGVjdGlvbiAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBjYW5ub3QgYmUgcmVzb2x2ZWQuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBJbnZhbGlkQ29sbGVjdGlvbkpzb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IoX25hbWU6IHN0cmluZywgcGF0aDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENvbGxlY3Rpb24gSlNPTiBhdCBwYXRoICR7SlNPTi5zdHJpbmdpZnkocGF0aCl9IGlzIGludmFsaWQuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNNaXNzaW5nRmFjdG9yeUV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgU2NoZW1hdGljICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGlzIG1pc3NpbmcgYSBmYWN0b3J5LmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRmFjdG9yeUNhbm5vdEJlUmVzb2x2ZWRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpYyAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBjYW5ub3QgcmVzb2x2ZSB0aGUgZmFjdG9yeS5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25NaXNzaW5nU2NoZW1hdGljc01hcEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYENvbGxlY3Rpb24gXCIke25hbWV9XCIgZG9lcyBub3QgaGF2ZSBhIHNjaGVtYXRpY3MgbWFwLmApOyB9XG59XG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbk1pc3NpbmdGaWVsZHNFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBDb2xsZWN0aW9uIFwiJHtuYW1lfVwiIGlzIG1pc3NpbmcgZmllbGRzLmApOyB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTWlzc2luZ0ZpZWxkc0V4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYFNjaGVtYXRpYyBcIiR7bmFtZX1cIiBpcyBtaXNzaW5nIGZpZWxkcy5gKTsgfVxufVxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY01pc3NpbmdEZXNjcmlwdGlvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYFNjaGVtYXRpY3MgXCIke25hbWV9XCIgZG9lcyBub3QgaGF2ZSBhIGRlc2NyaXB0aW9uLmApOyB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTmFtZUNvbGxpc2lvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgU2NoZW1hdGljcy9hbGlhcyAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBjb2xsaWRlcyB3aXRoIGFub3RoZXIgYWxpYXMgb3Igc2NoZW1hdGljYFxuICAgICAgICAgICsgJyBuYW1lLicpO1xuICB9XG59XG5cblxuLyoqXG4gKiBBIEVuZ2luZUhvc3QgYmFzZSBjbGFzcyB0aGF0IHVzZXMgdGhlIGZpbGUgc3lzdGVtIHRvIHJlc29sdmUgY29sbGVjdGlvbnMuIFRoaXMgaXMgdGhlIGJhc2Ugb2ZcbiAqIGFsbCBvdGhlciBFbmdpbmVIb3N0IHByb3ZpZGVkIGJ5IHRoZSB0b29saW5nIHBhcnQgb2YgdGhlIFNjaGVtYXRpY3MgbGlicmFyeS5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEZpbGVTeXN0ZW1FbmdpbmVIb3N0QmFzZSBpbXBsZW1lbnRzXG4gICAgRW5naW5lSG9zdDxGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2NyaXB0aW9uLCBGaWxlU3lzdGVtU2NoZW1hdGljRGVzY3JpcHRpb24+IHtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZTogc3RyaW5nKTogc3RyaW5nO1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgX3Jlc29sdmVSZWZlcmVuY2VTdHJpbmcoXG4gICAgICBuYW1lOiBzdHJpbmcsIHBhcmVudFBhdGg6IHN0cmluZyk6IHsgcmVmOiBSdWxlRmFjdG9yeTx7fT4sIHBhdGg6IHN0cmluZyB9IHwgbnVsbDtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF90cmFuc2Zvcm1Db2xsZWN0aW9uRGVzY3JpcHRpb24oXG4gICAgICBuYW1lOiBzdHJpbmcsIGRlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjPik6IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYztcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF90cmFuc2Zvcm1TY2hlbWF0aWNEZXNjcmlwdGlvbihcbiAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgIGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgICAgIGRlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M+KTogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M7XG5cbiAgcHJpdmF0ZSBfdHJhbnNmb3JtczogT3B0aW9uVHJhbnNmb3JtPHt9LCB7fT5bXSA9IFtdO1xuICBwcml2YXRlIF90YXNrRmFjdG9yaWVzID0gbmV3IE1hcDxzdHJpbmcsICgpID0+IE9ic2VydmFibGU8VGFza0V4ZWN1dG9yPj4oKTtcblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgVXNlIGBsaXN0U2NoZW1hdGljTmFtZXNgLlxuICAgKi9cbiAgbGlzdFNjaGVtYXRpY3MoY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb24pOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdFNjaGVtYXRpY05hbWVzKGNvbGxlY3Rpb24uZGVzY3JpcHRpb24pO1xuICB9XG4gIGxpc3RTY2hlbWF0aWNOYW1lcyhjb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2NyaXB0aW9uKSB7XG4gICAgY29uc3Qgc2NoZW1hdGljczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhjb2xsZWN0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICBjb25zdCBzY2hlbWF0aWMgPSBjb2xsZWN0aW9uLnNjaGVtYXRpY3Nba2V5XTtcblxuICAgICAgLy8gSWYgZXh0ZW5kcyBpcyBwcmVzZW50IHdpdGhvdXQgYSBmYWN0b3J5IGl0IGlzIGFuIGFsaWFzLCBkbyBub3QgcmV0dXJuIGl0XG4gICAgICAvLyAgIHVubGVzcyBpdCBpcyBmcm9tIGFub3RoZXIgY29sbGVjdGlvbi5cbiAgICAgIGlmICghc2NoZW1hdGljLmV4dGVuZHMgfHwgc2NoZW1hdGljLmZhY3RvcnkpIHtcbiAgICAgICAgc2NoZW1hdGljcy5wdXNoKGtleSk7XG4gICAgICB9IGVsc2UgaWYgKHNjaGVtYXRpYy5leHRlbmRzICYmIHNjaGVtYXRpYy5leHRlbmRzLmluZGV4T2YoJzonKSAhPT0gLTEpIHtcbiAgICAgICAgc2NoZW1hdGljcy5wdXNoKGtleSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjaGVtYXRpY3M7XG4gIH1cblxuICByZWdpc3Rlck9wdGlvbnNUcmFuc2Zvcm08VCBleHRlbmRzIG9iamVjdCwgUiBleHRlbmRzIG9iamVjdD4odDogT3B0aW9uVHJhbnNmb3JtPFQsIFI+KSB7XG4gICAgdGhpcy5fdHJhbnNmb3Jtcy5wdXNoKHQpO1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lXG4gICAqIEByZXR1cm4ge3twYXRoOiBzdHJpbmd9fVxuICAgKi9cbiAgY3JlYXRlQ29sbGVjdGlvbkRlc2NyaXB0aW9uKG5hbWU6IHN0cmluZyk6IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyB7XG4gICAgY29uc3QgcGF0aCA9IHRoaXMuX3Jlc29sdmVDb2xsZWN0aW9uUGF0aChuYW1lKTtcbiAgICBjb25zdCBqc29uVmFsdWUgPSByZWFkSnNvbkZpbGUocGF0aCk7XG4gICAgaWYgKCFqc29uVmFsdWUgfHwgdHlwZW9mIGpzb25WYWx1ZSAhPSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KGpzb25WYWx1ZSkpIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkQ29sbGVjdGlvbkpzb25FeGNlcHRpb24obmFtZSwgcGF0aCk7XG4gICAgfVxuXG4gICAgLy8gbm9ybWFsaXplIGV4dGVuZHMgcHJvcGVydHkgdG8gYW4gYXJyYXlcbiAgICBpZiAodHlwZW9mIGpzb25WYWx1ZVsnZXh0ZW5kcyddID09PSAnc3RyaW5nJykge1xuICAgICAganNvblZhbHVlWydleHRlbmRzJ10gPSBbanNvblZhbHVlWydleHRlbmRzJ11dO1xuICAgIH1cblxuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGhpcy5fdHJhbnNmb3JtQ29sbGVjdGlvbkRlc2NyaXB0aW9uKG5hbWUsIHtcbiAgICAgIC4uLmpzb25WYWx1ZSxcbiAgICAgIHBhdGgsXG4gICAgfSk7XG4gICAgaWYgKCFkZXNjcmlwdGlvbiB8fCAhZGVzY3JpcHRpb24ubmFtZSkge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRDb2xsZWN0aW9uSnNvbkV4Y2VwdGlvbihuYW1lLCBwYXRoKTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBhbGlhc2VzLlxuICAgIGNvbnN0IGFsbE5hbWVzID0gT2JqZWN0LmtleXMoZGVzY3JpcHRpb24uc2NoZW1hdGljcyk7XG4gICAgZm9yIChjb25zdCBzY2hlbWF0aWNOYW1lIG9mIE9iamVjdC5rZXlzKGRlc2NyaXB0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICBjb25zdCBhbGlhc2VzID0gZGVzY3JpcHRpb24uc2NoZW1hdGljc1tzY2hlbWF0aWNOYW1lXS5hbGlhc2VzIHx8IFtdO1xuXG4gICAgICBmb3IgKGNvbnN0IGFsaWFzIG9mIGFsaWFzZXMpIHtcbiAgICAgICAgaWYgKGFsbE5hbWVzLmluZGV4T2YoYWxpYXMpICE9IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY05hbWVDb2xsaXNpb25FeGNlcHRpb24oYWxpYXMpO1xuICAgICAgICB9XG4gICAgICAgIGFsbE5hbWVzLnB1c2goLi4uYWxpYXNlcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc2NyaXB0aW9uO1xuICB9XG5cbiAgY3JlYXRlU2NoZW1hdGljRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgKTogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MgfCBudWxsIHtcbiAgICAvLyBSZXNvbHZlIGFsaWFzZXMgZmlyc3QuXG4gICAgZm9yIChjb25zdCBzY2hlbWF0aWNOYW1lIG9mIE9iamVjdC5rZXlzKGNvbGxlY3Rpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIGNvbnN0IHNjaGVtYXRpY0Rlc2NyaXB0aW9uID0gY29sbGVjdGlvbi5zY2hlbWF0aWNzW3NjaGVtYXRpY05hbWVdO1xuICAgICAgaWYgKHNjaGVtYXRpY0Rlc2NyaXB0aW9uLmFsaWFzZXMgJiYgc2NoZW1hdGljRGVzY3JpcHRpb24uYWxpYXNlcy5pbmRleE9mKG5hbWUpICE9IC0xKSB7XG4gICAgICAgIG5hbWUgPSBzY2hlbWF0aWNOYW1lO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIShuYW1lIGluIGNvbGxlY3Rpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbGxlY3Rpb25QYXRoID0gZGlybmFtZShjb2xsZWN0aW9uLnBhdGgpO1xuICAgIGNvbnN0IHBhcnRpYWxEZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjPiB8IG51bGwgPSBjb2xsZWN0aW9uLnNjaGVtYXRpY3NbbmFtZV07XG4gICAgaWYgKCFwYXJ0aWFsRGVzYykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHBhcnRpYWxEZXNjLmV4dGVuZHMpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gcGFydGlhbERlc2MuZXh0ZW5kcy5pbmRleE9mKCc6Jyk7XG4gICAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IGluZGV4ICE9PSAtMSA/IHBhcnRpYWxEZXNjLmV4dGVuZHMuc3Vic3RyKDAsIGluZGV4KSA6IG51bGw7XG4gICAgICBjb25zdCBzY2hlbWF0aWNOYW1lID0gaW5kZXggPT09IC0xID9cbiAgICAgICAgcGFydGlhbERlc2MuZXh0ZW5kcyA6IHBhcnRpYWxEZXNjLmV4dGVuZHMuc3Vic3RyKGluZGV4ICsgMSk7XG5cbiAgICAgIGlmIChjb2xsZWN0aW9uTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICBjb25zdCBleHRlbmRDb2xsZWN0aW9uID0gdGhpcy5jcmVhdGVDb2xsZWN0aW9uRGVzY3JpcHRpb24oY29sbGVjdGlvbk5hbWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVNjaGVtYXRpY0Rlc2NyaXB0aW9uKHNjaGVtYXRpY05hbWUsIGV4dGVuZENvbGxlY3Rpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU2NoZW1hdGljRGVzY3JpcHRpb24oc2NoZW1hdGljTmFtZSwgY29sbGVjdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFVzZSBhbnkgb24gdGhpcyByZWYgYXMgd2UgZG9uJ3QgaGF2ZSB0aGUgT3B0aW9uVCBoZXJlLCBidXQgd2UgZG9uJ3QgbmVlZCBpdCAod2Ugb25seSBuZWVkXG4gICAgLy8gdGhlIHBhdGgpLlxuICAgIGlmICghcGFydGlhbERlc2MuZmFjdG9yeSkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY01pc3NpbmdGYWN0b3J5RXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cbiAgICBjb25zdCByZXNvbHZlZFJlZiA9IHRoaXMuX3Jlc29sdmVSZWZlcmVuY2VTdHJpbmcocGFydGlhbERlc2MuZmFjdG9yeSwgY29sbGVjdGlvblBhdGgpO1xuICAgIGlmICghcmVzb2x2ZWRSZWYpIHtcbiAgICAgIHRocm93IG5ldyBGYWN0b3J5Q2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHBhdGggfSA9IHJlc29sdmVkUmVmO1xuICAgIGxldCBzY2hlbWEgPSBwYXJ0aWFsRGVzYy5zY2hlbWE7XG4gICAgbGV0IHNjaGVtYUpzb246IEpzb25PYmplY3QgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHNjaGVtYSkge1xuICAgICAgaWYgKCFpc0Fic29sdXRlKHNjaGVtYSkpIHtcbiAgICAgICAgc2NoZW1hID0gam9pbihjb2xsZWN0aW9uUGF0aCwgc2NoZW1hKTtcbiAgICAgIH1cbiAgICAgIHNjaGVtYUpzb24gPSByZWFkSnNvbkZpbGUoc2NoZW1hKSBhcyBKc29uT2JqZWN0O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl90cmFuc2Zvcm1TY2hlbWF0aWNEZXNjcmlwdGlvbihuYW1lLCBjb2xsZWN0aW9uLCB7XG4gICAgICAuLi5wYXJ0aWFsRGVzYyxcbiAgICAgIHNjaGVtYSxcbiAgICAgIHNjaGVtYUpzb24sXG4gICAgICBuYW1lLFxuICAgICAgcGF0aCxcbiAgICAgIGZhY3RvcnlGbjogcmVzb2x2ZWRSZWYucmVmLFxuICAgICAgY29sbGVjdGlvbixcbiAgICB9KTtcbiAgfVxuXG4gIGNyZWF0ZVNvdXJjZUZyb21VcmwodXJsOiBVcmwpOiBTb3VyY2UgfCBudWxsIHtcbiAgICBzd2l0Y2ggKHVybC5wcm90b2NvbCkge1xuICAgICAgY2FzZSBudWxsOlxuICAgICAgY2FzZSAnZmlsZTonOlxuICAgICAgICByZXR1cm4gKGNvbnRleHQ6IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgICAgICAgLy8gUmVzb2x2ZSBhbGwgZmlsZTovLy9hL2IvYy9kIGZyb20gdGhlIHNjaGVtYXRpYydzIG93biBwYXRoLCBhbmQgbm90IHRoZSBjdXJyZW50XG4gICAgICAgICAgLy8gcGF0aC5cbiAgICAgICAgICBjb25zdCByb290ID0gbm9ybWFsaXplKFxuICAgICAgICAgICAgcmVzb2x2ZShkaXJuYW1lKGNvbnRleHQuc2NoZW1hdGljLmRlc2NyaXB0aW9uLnBhdGgpLCB1cmwucGF0aCB8fCAnJyksXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiBuZXcgRmlsZVN5c3RlbUNyZWF0ZVRyZWUobmV3IHZpcnR1YWxGcy5TY29wZWRIb3N0KG5ldyBOb2RlSnNTeW5jSG9zdCgpLCByb290KSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB0cmFuc2Zvcm1PcHRpb25zPE9wdGlvblQgZXh0ZW5kcyBvYmplY3QsIFJlc3VsdFQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgIHNjaGVtYXRpYzogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MsXG4gICAgb3B0aW9uczogT3B0aW9uVCxcbiAgKTogT2JzZXJ2YWJsZTxSZXN1bHRUPiB7XG4gICAgcmV0dXJuIChvYnNlcnZhYmxlT2Yob3B0aW9ucylcbiAgICAgIC5waXBlKFxuICAgICAgICAuLi50aGlzLl90cmFuc2Zvcm1zLm1hcCh0Rm4gPT4gbWVyZ2VNYXAob3B0ID0+IHtcbiAgICAgICAgICBjb25zdCBuZXdPcHRpb25zID0gdEZuKHNjaGVtYXRpYywgb3B0KTtcbiAgICAgICAgICBpZiAoU3ltYm9sLm9ic2VydmFibGUgaW4gbmV3T3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIG5ld09wdGlvbnM7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YobmV3T3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KSksXG4gICAgICApKSBhcyB7fSBhcyBPYnNlcnZhYmxlPFJlc3VsdFQ+O1xuICB9XG5cbiAgZ2V0U2NoZW1hdGljUnVsZUZhY3Rvcnk8T3B0aW9uVCBleHRlbmRzIG9iamVjdD4oXG4gICAgc2NoZW1hdGljOiBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyxcbiAgICBfY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjKTogUnVsZUZhY3Rvcnk8T3B0aW9uVD4ge1xuICAgIHJldHVybiBzY2hlbWF0aWMuZmFjdG9yeUZuO1xuICB9XG5cbiAgcmVnaXN0ZXJUYXNrRXhlY3V0b3I8VD4oZmFjdG9yeTogVGFza0V4ZWN1dG9yRmFjdG9yeTxUPiwgb3B0aW9ucz86IFQpOiB2b2lkIHtcbiAgICB0aGlzLl90YXNrRmFjdG9yaWVzLnNldChmYWN0b3J5Lm5hbWUsICgpID0+IG9ic2VydmFibGVGcm9tKGZhY3RvcnkuY3JlYXRlKG9wdGlvbnMpKSk7XG4gIH1cblxuICBjcmVhdGVUYXNrRXhlY3V0b3IobmFtZTogc3RyaW5nKTogT2JzZXJ2YWJsZTxUYXNrRXhlY3V0b3I+IHtcbiAgICBjb25zdCBmYWN0b3J5ID0gdGhpcy5fdGFza0ZhY3Rvcmllcy5nZXQobmFtZSk7XG4gICAgaWYgKGZhY3RvcnkpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF90aHJvdyhuZXcgVW5yZWdpc3RlcmVkVGFza0V4Y2VwdGlvbihuYW1lKSk7XG4gIH1cblxuICBoYXNUYXNrRXhlY3V0b3IobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3Rhc2tGYWN0b3JpZXMuaGFzKG5hbWUpO1xuICB9XG59XG4iXX0=