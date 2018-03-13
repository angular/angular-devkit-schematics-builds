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
            if (schematic.hidden || schematic.private) {
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
    transformContext(context) {
        return context;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90b29scy9maWxlLXN5c3RlbS1lbmdpbmUtaG9zdC1iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQXVGO0FBQ3ZGLG9EQUEyRDtBQUMzRCwrQkFBMEQ7QUFFMUQsK0NBQThEO0FBQzlELDJDQUF3RDtBQUN4RCxpREFBK0M7QUFDL0Msc0RBQW1EO0FBRW5ELGdDQVFnQjtBQVNoQiwrREFBcUQ7QUFZckQseUNBQWlELFNBQVEsb0JBQWE7SUFDcEUsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyxjQUFjLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7SUFDbEUsQ0FBQztDQUNGO0FBSkQsa0ZBSUM7QUFDRCxvQ0FBNEMsU0FBUSxvQkFBYTtJQUMvRCxZQUFZLEtBQWEsRUFBRSxJQUFZO1FBQ3JDLEtBQUssQ0FBQywyQkFBMkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDdkUsQ0FBQztDQUNGO0FBSkQsd0VBSUM7QUFDRCxzQ0FBOEMsU0FBUSxvQkFBYTtJQUNqRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztJQUNuRSxDQUFDO0NBQ0Y7QUFKRCw0RUFJQztBQUNELHNDQUE4QyxTQUFRLG9CQUFhO0lBQ2pFLFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsYUFBYSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7Q0FDRjtBQUpELDRFQUlDO0FBQ0QsNkNBQXFELFNBQVEsb0JBQWE7SUFDeEUsWUFBWSxJQUFZ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UUFFRCxNQUFNLENBQUMsY0FBTSxDQUFDLElBQUksK0JBQXlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRUQsZUFBZSxDQUFDLElBQVk7UUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Q0FDRjtBQXhORCw0REF3TkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uLCBKc29uT2JqZWN0LCBub3JtYWxpemUsIHZpcnR1YWxGcyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE5vZGVKc1N5bmNIb3N0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUvbm9kZSc7XG5pbXBvcnQgeyBkaXJuYW1lLCBpc0Fic29sdXRlLCBqb2luLCByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcy9PYnNlcnZhYmxlJztcbmltcG9ydCB7IGZyb20gYXMgb2JzZXJ2YWJsZUZyb20gfSBmcm9tICdyeGpzL29ic2VydmFibGUvZnJvbSc7XG5pbXBvcnQgeyBvZiBhcyBvYnNlcnZhYmxlT2YgfSBmcm9tICdyeGpzL29ic2VydmFibGUvb2YnO1xuaW1wb3J0IHsgX3Rocm93IH0gZnJvbSAncnhqcy9vYnNlcnZhYmxlL3Rocm93JztcbmltcG9ydCB7IG1lcmdlTWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMvbWVyZ2VNYXAnO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSAndXJsJztcbmltcG9ydCB7XG4gIEVuZ2luZUhvc3QsXG4gIEZpbGVTeXN0ZW1DcmVhdGVUcmVlLFxuICBSdWxlRmFjdG9yeSxcbiAgU291cmNlLFxuICBUYXNrRXhlY3V0b3IsXG4gIFRhc2tFeGVjdXRvckZhY3RvcnksXG4gIFVucmVnaXN0ZXJlZFRhc2tFeGNlcHRpb24sXG59IGZyb20gJy4uL3NyYyc7XG5pbXBvcnQge1xuICBGaWxlU3lzdGVtQ29sbGVjdGlvbixcbiAgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLFxuICBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2NyaXB0aW9uLFxuICBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCxcbiAgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MsXG4gIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbixcbn0gZnJvbSAnLi9kZXNjcmlwdGlvbic7XG5pbXBvcnQgeyByZWFkSnNvbkZpbGUgfSBmcm9tICcuL2ZpbGUtc3lzdGVtLXV0aWxpdHknO1xuXG5cbmRlY2xhcmUgY29uc3QgU3ltYm9sOiBTeW1ib2wgJiB7XG4gIHJlYWRvbmx5IG9ic2VydmFibGU6IHN5bWJvbDtcbn07XG5cblxuZXhwb3J0IGRlY2xhcmUgdHlwZSBPcHRpb25UcmFuc2Zvcm08VCBleHRlbmRzIG9iamVjdCwgUiBleHRlbmRzIG9iamVjdD5cbiAgICA9IChzY2hlbWF0aWM6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbiwgb3B0aW9uczogVCkgPT4gT2JzZXJ2YWJsZTxSPjtcblxuXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbkNhbm5vdEJlUmVzb2x2ZWRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENvbGxlY3Rpb24gJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gY2Fubm90IGJlIHJlc29sdmVkLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgSW52YWxpZENvbGxlY3Rpb25Kc29uRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKF9uYW1lOiBzdHJpbmcsIHBhdGg6IHN0cmluZykge1xuICAgIHN1cGVyKGBDb2xsZWN0aW9uIEpTT04gYXQgcGF0aCAke0pTT04uc3RyaW5naWZ5KHBhdGgpfSBpcyBpbnZhbGlkLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTWlzc2luZ0ZhY3RvcnlFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpYyAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBpcyBtaXNzaW5nIGEgZmFjdG9yeS5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEZhY3RvcnlDYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBTY2hlbWF0aWMgJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gY2Fubm90IHJlc29sdmUgdGhlIGZhY3RvcnkuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uTWlzc2luZ1NjaGVtYXRpY3NNYXBFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBDb2xsZWN0aW9uIFwiJHtuYW1lfVwiIGRvZXMgbm90IGhhdmUgYSBzY2hlbWF0aWNzIG1hcC5gKTsgfVxufVxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25NaXNzaW5nRmllbGRzRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykgeyBzdXBlcihgQ29sbGVjdGlvbiBcIiR7bmFtZX1cIiBpcyBtaXNzaW5nIGZpZWxkcy5gKTsgfVxufVxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY01pc3NpbmdGaWVsZHNFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBTY2hlbWF0aWMgXCIke25hbWV9XCIgaXMgbWlzc2luZyBmaWVsZHMuYCk7IH1cbn1cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNNaXNzaW5nRGVzY3JpcHRpb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBTY2hlbWF0aWNzIFwiJHtuYW1lfVwiIGRvZXMgbm90IGhhdmUgYSBkZXNjcmlwdGlvbi5gKTsgfVxufVxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY05hbWVDb2xsaXNpb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpY3MvYWxpYXMgJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gY29sbGlkZXMgd2l0aCBhbm90aGVyIGFsaWFzIG9yIHNjaGVtYXRpY2BcbiAgICAgICAgICArICcgbmFtZS4nKTtcbiAgfVxufVxuXG5cbi8qKlxuICogQSBFbmdpbmVIb3N0IGJhc2UgY2xhc3MgdGhhdCB1c2VzIHRoZSBmaWxlIHN5c3RlbSB0byByZXNvbHZlIGNvbGxlY3Rpb25zLiBUaGlzIGlzIHRoZSBiYXNlIG9mXG4gKiBhbGwgb3RoZXIgRW5naW5lSG9zdCBwcm92aWRlZCBieSB0aGUgdG9vbGluZyBwYXJ0IG9mIHRoZSBTY2hlbWF0aWNzIGxpYnJhcnkuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBGaWxlU3lzdGVtRW5naW5lSG9zdEJhc2UgaW1wbGVtZW50c1xuICAgIEVuZ2luZUhvc3Q8RmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjcmlwdGlvbiwgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uPiB7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBfcmVzb2x2ZUNvbGxlY3Rpb25QYXRoKG5hbWU6IHN0cmluZyk6IHN0cmluZztcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF9yZXNvbHZlUmVmZXJlbmNlU3RyaW5nKFxuICAgICAgbmFtZTogc3RyaW5nLCBwYXJlbnRQYXRoOiBzdHJpbmcpOiB7IHJlZjogUnVsZUZhY3Rvcnk8e30+LCBwYXRoOiBzdHJpbmcgfSB8IG51bGw7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBfdHJhbnNmb3JtQ29sbGVjdGlvbkRlc2NyaXB0aW9uKFxuICAgICAgbmFtZTogc3RyaW5nLCBkZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYz4pOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2M7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBfdHJhbnNmb3JtU2NoZW1hdGljRGVzY3JpcHRpb24oXG4gICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICBjb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICAgICBkZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjPik6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjO1xuXG4gIHByaXZhdGUgX3RyYW5zZm9ybXM6IE9wdGlvblRyYW5zZm9ybTx7fSwge30+W10gPSBbXTtcbiAgcHJpdmF0ZSBfdGFza0ZhY3RvcmllcyA9IG5ldyBNYXA8c3RyaW5nLCAoKSA9PiBPYnNlcnZhYmxlPFRhc2tFeGVjdXRvcj4+KCk7XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIFVzZSBgbGlzdFNjaGVtYXRpY05hbWVzYC5cbiAgICovXG4gIGxpc3RTY2hlbWF0aWNzKGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLmxpc3RTY2hlbWF0aWNOYW1lcyhjb2xsZWN0aW9uLmRlc2NyaXB0aW9uKTtcbiAgfVxuICBsaXN0U2NoZW1hdGljTmFtZXMoY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjKSB7XG4gICAgY29uc3Qgc2NoZW1hdGljczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhjb2xsZWN0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICBjb25zdCBzY2hlbWF0aWMgPSBjb2xsZWN0aW9uLnNjaGVtYXRpY3Nba2V5XTtcblxuICAgICAgaWYgKHNjaGVtYXRpYy5oaWRkZW4gfHwgc2NoZW1hdGljLnByaXZhdGUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGV4dGVuZHMgaXMgcHJlc2VudCB3aXRob3V0IGEgZmFjdG9yeSBpdCBpcyBhbiBhbGlhcywgZG8gbm90IHJldHVybiBpdFxuICAgICAgLy8gICB1bmxlc3MgaXQgaXMgZnJvbSBhbm90aGVyIGNvbGxlY3Rpb24uXG4gICAgICBpZiAoIXNjaGVtYXRpYy5leHRlbmRzIHx8IHNjaGVtYXRpYy5mYWN0b3J5KSB7XG4gICAgICAgIHNjaGVtYXRpY3MucHVzaChrZXkpO1xuICAgICAgfSBlbHNlIGlmIChzY2hlbWF0aWMuZXh0ZW5kcyAmJiBzY2hlbWF0aWMuZXh0ZW5kcy5pbmRleE9mKCc6JykgIT09IC0xKSB7XG4gICAgICAgIHNjaGVtYXRpY3MucHVzaChrZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzY2hlbWF0aWNzO1xuICB9XG5cbiAgcmVnaXN0ZXJPcHRpb25zVHJhbnNmb3JtPFQgZXh0ZW5kcyBvYmplY3QsIFIgZXh0ZW5kcyBvYmplY3Q+KHQ6IE9wdGlvblRyYW5zZm9ybTxULCBSPikge1xuICAgIHRoaXMuX3RyYW5zZm9ybXMucHVzaCh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZVxuICAgKiBAcmV0dXJuIHt7cGF0aDogc3RyaW5nfX1cbiAgICovXG4gIGNyZWF0ZUNvbGxlY3Rpb25EZXNjcmlwdGlvbihuYW1lOiBzdHJpbmcpOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2Mge1xuICAgIGNvbnN0IHBhdGggPSB0aGlzLl9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZSk7XG4gICAgY29uc3QganNvblZhbHVlID0gcmVhZEpzb25GaWxlKHBhdGgpO1xuICAgIGlmICghanNvblZhbHVlIHx8IHR5cGVvZiBqc29uVmFsdWUgIT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheShqc29uVmFsdWUpKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZENvbGxlY3Rpb25Kc29uRXhjZXB0aW9uKG5hbWUsIHBhdGgpO1xuICAgIH1cblxuICAgIC8vIG5vcm1hbGl6ZSBleHRlbmRzIHByb3BlcnR5IHRvIGFuIGFycmF5XG4gICAgaWYgKHR5cGVvZiBqc29uVmFsdWVbJ2V4dGVuZHMnXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGpzb25WYWx1ZVsnZXh0ZW5kcyddID0gW2pzb25WYWx1ZVsnZXh0ZW5kcyddXTtcbiAgICB9XG5cbiAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHRoaXMuX3RyYW5zZm9ybUNvbGxlY3Rpb25EZXNjcmlwdGlvbihuYW1lLCB7XG4gICAgICAuLi5qc29uVmFsdWUsXG4gICAgICBwYXRoLFxuICAgIH0pO1xuICAgIGlmICghZGVzY3JpcHRpb24gfHwgIWRlc2NyaXB0aW9uLm5hbWUpIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkQ29sbGVjdGlvbkpzb25FeGNlcHRpb24obmFtZSwgcGF0aCk7XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgYWxpYXNlcy5cbiAgICBjb25zdCBhbGxOYW1lcyA9IE9iamVjdC5rZXlzKGRlc2NyaXB0aW9uLnNjaGVtYXRpY3MpO1xuICAgIGZvciAoY29uc3Qgc2NoZW1hdGljTmFtZSBvZiBPYmplY3Qua2V5cyhkZXNjcmlwdGlvbi5zY2hlbWF0aWNzKSkge1xuICAgICAgY29uc3QgYWxpYXNlcyA9IGRlc2NyaXB0aW9uLnNjaGVtYXRpY3Nbc2NoZW1hdGljTmFtZV0uYWxpYXNlcyB8fCBbXTtcblxuICAgICAgZm9yIChjb25zdCBhbGlhcyBvZiBhbGlhc2VzKSB7XG4gICAgICAgIGlmIChhbGxOYW1lcy5pbmRleE9mKGFsaWFzKSAhPSAtMSkge1xuICAgICAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNOYW1lQ29sbGlzaW9uRXhjZXB0aW9uKGFsaWFzKTtcbiAgICAgICAgfVxuICAgICAgICBhbGxOYW1lcy5wdXNoKC4uLmFsaWFzZXMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZXNjcmlwdGlvbjtcbiAgfVxuXG4gIGNyZWF0ZVNjaGVtYXRpY0Rlc2NyaXB0aW9uKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBjb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICk6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjIHwgbnVsbCB7XG4gICAgLy8gUmVzb2x2ZSBhbGlhc2VzIGZpcnN0LlxuICAgIGZvciAoY29uc3Qgc2NoZW1hdGljTmFtZSBvZiBPYmplY3Qua2V5cyhjb2xsZWN0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICBjb25zdCBzY2hlbWF0aWNEZXNjcmlwdGlvbiA9IGNvbGxlY3Rpb24uc2NoZW1hdGljc1tzY2hlbWF0aWNOYW1lXTtcbiAgICAgIGlmIChzY2hlbWF0aWNEZXNjcmlwdGlvbi5hbGlhc2VzICYmIHNjaGVtYXRpY0Rlc2NyaXB0aW9uLmFsaWFzZXMuaW5kZXhPZihuYW1lKSAhPSAtMSkge1xuICAgICAgICBuYW1lID0gc2NoZW1hdGljTmFtZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCEobmFtZSBpbiBjb2xsZWN0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBjb2xsZWN0aW9uUGF0aCA9IGRpcm5hbWUoY29sbGVjdGlvbi5wYXRoKTtcbiAgICBjb25zdCBwYXJ0aWFsRGVzYzogUGFydGlhbDxGaWxlU3lzdGVtU2NoZW1hdGljRGVzYz4gfCBudWxsID0gY29sbGVjdGlvbi5zY2hlbWF0aWNzW25hbWVdO1xuICAgIGlmICghcGFydGlhbERlc2MpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChwYXJ0aWFsRGVzYy5leHRlbmRzKSB7XG4gICAgICBjb25zdCBpbmRleCA9IHBhcnRpYWxEZXNjLmV4dGVuZHMuaW5kZXhPZignOicpO1xuICAgICAgY29uc3QgY29sbGVjdGlvbk5hbWUgPSBpbmRleCAhPT0gLTEgPyBwYXJ0aWFsRGVzYy5leHRlbmRzLnN1YnN0cigwLCBpbmRleCkgOiBudWxsO1xuICAgICAgY29uc3Qgc2NoZW1hdGljTmFtZSA9IGluZGV4ID09PSAtMSA/XG4gICAgICAgIHBhcnRpYWxEZXNjLmV4dGVuZHMgOiBwYXJ0aWFsRGVzYy5leHRlbmRzLnN1YnN0cihpbmRleCArIDEpO1xuXG4gICAgICBpZiAoY29sbGVjdGlvbk5hbWUgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgZXh0ZW5kQ29sbGVjdGlvbiA9IHRoaXMuY3JlYXRlQ29sbGVjdGlvbkRlc2NyaXB0aW9uKGNvbGxlY3Rpb25OYW1lKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTY2hlbWF0aWNEZXNjcmlwdGlvbihzY2hlbWF0aWNOYW1lLCBleHRlbmRDb2xsZWN0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVNjaGVtYXRpY0Rlc2NyaXB0aW9uKHNjaGVtYXRpY05hbWUsIGNvbGxlY3Rpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBVc2UgYW55IG9uIHRoaXMgcmVmIGFzIHdlIGRvbid0IGhhdmUgdGhlIE9wdGlvblQgaGVyZSwgYnV0IHdlIGRvbid0IG5lZWQgaXQgKHdlIG9ubHkgbmVlZFxuICAgIC8vIHRoZSBwYXRoKS5cbiAgICBpZiAoIXBhcnRpYWxEZXNjLmZhY3RvcnkpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNNaXNzaW5nRmFjdG9yeUV4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG4gICAgY29uc3QgcmVzb2x2ZWRSZWYgPSB0aGlzLl9yZXNvbHZlUmVmZXJlbmNlU3RyaW5nKHBhcnRpYWxEZXNjLmZhY3RvcnksIGNvbGxlY3Rpb25QYXRoKTtcbiAgICBpZiAoIXJlc29sdmVkUmVmKSB7XG4gICAgICB0aHJvdyBuZXcgRmFjdG9yeUNhbm5vdEJlUmVzb2x2ZWRFeGNlcHRpb24obmFtZSk7XG4gICAgfVxuXG4gICAgY29uc3QgeyBwYXRoIH0gPSByZXNvbHZlZFJlZjtcbiAgICBsZXQgc2NoZW1hID0gcGFydGlhbERlc2Muc2NoZW1hO1xuICAgIGxldCBzY2hlbWFKc29uOiBKc29uT2JqZWN0IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGlmIChzY2hlbWEpIHtcbiAgICAgIGlmICghaXNBYnNvbHV0ZShzY2hlbWEpKSB7XG4gICAgICAgIHNjaGVtYSA9IGpvaW4oY29sbGVjdGlvblBhdGgsIHNjaGVtYSk7XG4gICAgICB9XG4gICAgICBzY2hlbWFKc29uID0gcmVhZEpzb25GaWxlKHNjaGVtYSkgYXMgSnNvbk9iamVjdDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fdHJhbnNmb3JtU2NoZW1hdGljRGVzY3JpcHRpb24obmFtZSwgY29sbGVjdGlvbiwge1xuICAgICAgLi4ucGFydGlhbERlc2MsXG4gICAgICBzY2hlbWEsXG4gICAgICBzY2hlbWFKc29uLFxuICAgICAgbmFtZSxcbiAgICAgIHBhdGgsXG4gICAgICBmYWN0b3J5Rm46IHJlc29sdmVkUmVmLnJlZixcbiAgICAgIGNvbGxlY3Rpb24sXG4gICAgfSk7XG4gIH1cblxuICBjcmVhdGVTb3VyY2VGcm9tVXJsKHVybDogVXJsKTogU291cmNlIHwgbnVsbCB7XG4gICAgc3dpdGNoICh1cmwucHJvdG9jb2wpIHtcbiAgICAgIGNhc2UgbnVsbDpcbiAgICAgIGNhc2UgJ2ZpbGU6JzpcbiAgICAgICAgcmV0dXJuIChjb250ZXh0OiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgICAgICAgIC8vIFJlc29sdmUgYWxsIGZpbGU6Ly8vYS9iL2MvZCBmcm9tIHRoZSBzY2hlbWF0aWMncyBvd24gcGF0aCwgYW5kIG5vdCB0aGUgY3VycmVudFxuICAgICAgICAgIC8vIHBhdGguXG4gICAgICAgICAgY29uc3Qgcm9vdCA9IG5vcm1hbGl6ZShcbiAgICAgICAgICAgIHJlc29sdmUoZGlybmFtZShjb250ZXh0LnNjaGVtYXRpYy5kZXNjcmlwdGlvbi5wYXRoKSwgdXJsLnBhdGggfHwgJycpLFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm4gbmV3IEZpbGVTeXN0ZW1DcmVhdGVUcmVlKG5ldyB2aXJ0dWFsRnMuU2NvcGVkSG9zdChuZXcgTm9kZUpzU3luY0hvc3QoKSwgcm9vdCkpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdHJhbnNmb3JtT3B0aW9uczxPcHRpb25UIGV4dGVuZHMgb2JqZWN0LCBSZXN1bHRUIGV4dGVuZHMgb2JqZWN0PihcbiAgICBzY2hlbWF0aWM6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjLFxuICAgIG9wdGlvbnM6IE9wdGlvblQsXG4gICk6IE9ic2VydmFibGU8UmVzdWx0VD4ge1xuICAgIHJldHVybiAob2JzZXJ2YWJsZU9mKG9wdGlvbnMpXG4gICAgICAucGlwZShcbiAgICAgICAgLi4udGhpcy5fdHJhbnNmb3Jtcy5tYXAodEZuID0+IG1lcmdlTWFwKG9wdCA9PiB7XG4gICAgICAgICAgY29uc3QgbmV3T3B0aW9ucyA9IHRGbihzY2hlbWF0aWMsIG9wdCk7XG4gICAgICAgICAgaWYgKFN5bWJvbC5vYnNlcnZhYmxlIGluIG5ld09wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXdPcHRpb25zO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKG5ld09wdGlvbnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkpLFxuICAgICAgKSkgYXMge30gYXMgT2JzZXJ2YWJsZTxSZXN1bHRUPjtcbiAgfVxuXG4gIHRyYW5zZm9ybUNvbnRleHQoY29udGV4dDogRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQpOiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCB7XG4gICAgcmV0dXJuIGNvbnRleHQ7XG4gIH1cblxuICBnZXRTY2hlbWF0aWNSdWxlRmFjdG9yeTxPcHRpb25UIGV4dGVuZHMgb2JqZWN0PihcbiAgICBzY2hlbWF0aWM6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjLFxuICAgIF9jb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MpOiBSdWxlRmFjdG9yeTxPcHRpb25UPiB7XG4gICAgcmV0dXJuIHNjaGVtYXRpYy5mYWN0b3J5Rm47XG4gIH1cblxuICByZWdpc3RlclRhc2tFeGVjdXRvcjxUPihmYWN0b3J5OiBUYXNrRXhlY3V0b3JGYWN0b3J5PFQ+LCBvcHRpb25zPzogVCk6IHZvaWQge1xuICAgIHRoaXMuX3Rhc2tGYWN0b3JpZXMuc2V0KGZhY3RvcnkubmFtZSwgKCkgPT4gb2JzZXJ2YWJsZUZyb20oZmFjdG9yeS5jcmVhdGUob3B0aW9ucykpKTtcbiAgfVxuXG4gIGNyZWF0ZVRhc2tFeGVjdXRvcihuYW1lOiBzdHJpbmcpOiBPYnNlcnZhYmxlPFRhc2tFeGVjdXRvcj4ge1xuICAgIGNvbnN0IGZhY3RvcnkgPSB0aGlzLl90YXNrRmFjdG9yaWVzLmdldChuYW1lKTtcbiAgICBpZiAoZmFjdG9yeSkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gX3Rocm93KG5ldyBVbnJlZ2lzdGVyZWRUYXNrRXhjZXB0aW9uKG5hbWUpKTtcbiAgfVxuXG4gIGhhc1Rhc2tFeGVjdXRvcihuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fdGFza0ZhY3Rvcmllcy5oYXMobmFtZSk7XG4gIH1cbn1cbiJdfQ==