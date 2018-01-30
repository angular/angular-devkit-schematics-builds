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
const schematics_1 = require("@angular-devkit/schematics");
const path_1 = require("path");
const from_1 = require("rxjs/observable/from");
const of_1 = require("rxjs/observable/of");
const throw_1 = require("rxjs/observable/throw");
const mergeMap_1 = require("rxjs/operators/mergeMap");
const file_system_host_1 = require("./file-system-host");
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
            throw new schematics_1.UnknownSchematicException(name, collection);
        }
        const collectionPath = path_1.dirname(collection.path);
        const partialDesc = collection.schematics[name];
        if (!partialDesc) {
            throw new schematics_1.UnknownSchematicException(name, collection);
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
                    const root = path_1.resolve(path_1.dirname(context.schematic.description.path), url.path || '');
                    return new schematics_1.FileSystemCreateTree(new file_system_host_1.FileSystemHost(root));
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
        return throw_1._throw(new schematics_1.UnregisteredTaskException(name));
    }
    hasTaskExecutor(name) {
        return this._taskFactories.has(name);
    }
}
exports.FileSystemEngineHostBase = FileSystemEngineHostBase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90b29scy9maWxlLXN5c3RlbS1lbmdpbmUtaG9zdC1iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQWlFO0FBQ2pFLDJEQVNvQztBQUNwQywrQkFBMEQ7QUFFMUQsK0NBQThEO0FBQzlELDJDQUF3RDtBQUN4RCxpREFBK0M7QUFDL0Msc0RBQW1EO0FBVW5ELHlEQUFvRDtBQUNwRCwrREFBcUQ7QUFZckQseUNBQWlELFNBQVEsb0JBQWE7SUFDcEUsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyxjQUFjLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7SUFDbEUsQ0FBQztDQUNGO0FBSkQsa0ZBSUM7QUFDRCxvQ0FBNEMsU0FBUSxvQkFBYTtJQUMvRCxZQUFZLEtBQWEsRUFBRSxJQUFZO1FBQ3JDLEtBQUssQ0FBQywyQkFBMkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDdkUsQ0FBQztDQUNGO0FBSkQsd0VBSUM7QUFDRCxzQ0FBOEMsU0FBUSxvQkFBYTtJQUNqRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztJQUNuRSxDQUFDO0NBQ0Y7QUFKRCw0RUFJQztBQUNELHNDQUE4QyxTQUFRLG9CQUFhO0lBQ2pFLFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsYUFBYSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7Q0FDRjtBQUpELDRFQUlDO0FBQ0QsNkNBQXFELFNBQVEsb0JBQWE7SUFDeEUsWUFBWSxJQUFZ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LENBQUMsQ0FBQztnQkFDcEMsTUFBTSxDQUFDLFVBQVUsQ0FBQztZQUNwQixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sTUFBTSxDQUFDLE9BQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNsQyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FDSixDQUE4QixDQUFDO0lBQ3BDLENBQUM7SUFFRCx1QkFBdUIsQ0FDckIsU0FBa0MsRUFDbEMsV0FBcUM7UUFDckMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7SUFDN0IsQ0FBQztJQUVELG9CQUFvQixDQUFJLE9BQStCLEVBQUUsT0FBVztRQUNsRSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLFdBQWMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RixDQUFDO0lBRUQsa0JBQWtCLENBQUMsSUFBWTtRQUM3QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ1osTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ25CLENBQUM7UUFFRCxNQUFNLENBQUMsY0FBTSxDQUFDLElBQUksc0NBQXlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRUQsZUFBZSxDQUFDLElBQVk7UUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Q0FDRjtBQXpNRCw0REF5TUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uLCBKc29uT2JqZWN0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtcbiAgRW5naW5lSG9zdCxcbiAgRmlsZVN5c3RlbUNyZWF0ZVRyZWUsXG4gIFJ1bGVGYWN0b3J5LFxuICBTb3VyY2UsXG4gIFRhc2tFeGVjdXRvcixcbiAgVGFza0V4ZWN1dG9yRmFjdG9yeSxcbiAgVW5rbm93blNjaGVtYXRpY0V4Y2VwdGlvbixcbiAgVW5yZWdpc3RlcmVkVGFza0V4Y2VwdGlvbixcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgZGlybmFtZSwgaXNBYnNvbHV0ZSwgam9pbiwgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMvT2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBmcm9tIGFzIG9ic2VydmFibGVGcm9tIH0gZnJvbSAncnhqcy9vYnNlcnZhYmxlL2Zyb20nO1xuaW1wb3J0IHsgb2YgYXMgb2JzZXJ2YWJsZU9mIH0gZnJvbSAncnhqcy9vYnNlcnZhYmxlL29mJztcbmltcG9ydCB7IF90aHJvdyB9IGZyb20gJ3J4anMvb2JzZXJ2YWJsZS90aHJvdyc7XG5pbXBvcnQgeyBtZXJnZU1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzL21lcmdlTWFwJztcbmltcG9ydCB7IFVybCB9IGZyb20gJ3VybCc7XG5pbXBvcnQge1xuICBGaWxlU3lzdGVtQ29sbGVjdGlvbixcbiAgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLFxuICBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2NyaXB0aW9uLFxuICBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCxcbiAgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MsXG4gIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbixcbn0gZnJvbSAnLi9kZXNjcmlwdGlvbic7XG5pbXBvcnQgeyBGaWxlU3lzdGVtSG9zdCB9IGZyb20gJy4vZmlsZS1zeXN0ZW0taG9zdCc7XG5pbXBvcnQgeyByZWFkSnNvbkZpbGUgfSBmcm9tICcuL2ZpbGUtc3lzdGVtLXV0aWxpdHknO1xuXG5cbmRlY2xhcmUgY29uc3QgU3ltYm9sOiBTeW1ib2wgJiB7XG4gIHJlYWRvbmx5IG9ic2VydmFibGU6IHN5bWJvbDtcbn07XG5cblxuZXhwb3J0IGRlY2xhcmUgdHlwZSBPcHRpb25UcmFuc2Zvcm08VCBleHRlbmRzIG9iamVjdCwgUiBleHRlbmRzIG9iamVjdD5cbiAgICA9IChzY2hlbWF0aWM6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbiwgb3B0aW9uczogVCkgPT4gT2JzZXJ2YWJsZTxSPjtcblxuXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbkNhbm5vdEJlUmVzb2x2ZWRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENvbGxlY3Rpb24gJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gY2Fubm90IGJlIHJlc29sdmVkLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgSW52YWxpZENvbGxlY3Rpb25Kc29uRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKF9uYW1lOiBzdHJpbmcsIHBhdGg6IHN0cmluZykge1xuICAgIHN1cGVyKGBDb2xsZWN0aW9uIEpTT04gYXQgcGF0aCAke0pTT04uc3RyaW5naWZ5KHBhdGgpfSBpcyBpbnZhbGlkLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTWlzc2luZ0ZhY3RvcnlFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpYyAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBpcyBtaXNzaW5nIGEgZmFjdG9yeS5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEZhY3RvcnlDYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBTY2hlbWF0aWMgJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gY2Fubm90IHJlc29sdmUgdGhlIGZhY3RvcnkuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uTWlzc2luZ1NjaGVtYXRpY3NNYXBFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBDb2xsZWN0aW9uIFwiJHtuYW1lfVwiIGRvZXMgbm90IGhhdmUgYSBzY2hlbWF0aWNzIG1hcC5gKTsgfVxufVxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25NaXNzaW5nRmllbGRzRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykgeyBzdXBlcihgQ29sbGVjdGlvbiBcIiR7bmFtZX1cIiBpcyBtaXNzaW5nIGZpZWxkcy5gKTsgfVxufVxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY01pc3NpbmdGaWVsZHNFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBTY2hlbWF0aWMgXCIke25hbWV9XCIgaXMgbWlzc2luZyBmaWVsZHMuYCk7IH1cbn1cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNNaXNzaW5nRGVzY3JpcHRpb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBTY2hlbWF0aWNzIFwiJHtuYW1lfVwiIGRvZXMgbm90IGhhdmUgYSBkZXNjcmlwdGlvbi5gKTsgfVxufVxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY05hbWVDb2xsaXNpb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpY3MvYWxpYXMgJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gY29sbGlkZXMgd2l0aCBhbm90aGVyIGFsaWFzIG9yIHNjaGVtYXRpY2BcbiAgICAgICAgICArICcgbmFtZS4nKTtcbiAgfVxufVxuXG5cbi8qKlxuICogQSBFbmdpbmVIb3N0IGJhc2UgY2xhc3MgdGhhdCB1c2VzIHRoZSBmaWxlIHN5c3RlbSB0byByZXNvbHZlIGNvbGxlY3Rpb25zLiBUaGlzIGlzIHRoZSBiYXNlIG9mXG4gKiBhbGwgb3RoZXIgRW5naW5lSG9zdCBwcm92aWRlZCBieSB0aGUgdG9vbGluZyBwYXJ0IG9mIHRoZSBTY2hlbWF0aWNzIGxpYnJhcnkuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBGaWxlU3lzdGVtRW5naW5lSG9zdEJhc2UgaW1wbGVtZW50c1xuICAgIEVuZ2luZUhvc3Q8RmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjcmlwdGlvbiwgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uPiB7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBfcmVzb2x2ZUNvbGxlY3Rpb25QYXRoKG5hbWU6IHN0cmluZyk6IHN0cmluZztcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF9yZXNvbHZlUmVmZXJlbmNlU3RyaW5nKFxuICAgICAgbmFtZTogc3RyaW5nLCBwYXJlbnRQYXRoOiBzdHJpbmcpOiB7IHJlZjogUnVsZUZhY3Rvcnk8e30+LCBwYXRoOiBzdHJpbmcgfSB8IG51bGw7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBfdHJhbnNmb3JtQ29sbGVjdGlvbkRlc2NyaXB0aW9uKFxuICAgICAgbmFtZTogc3RyaW5nLCBkZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYz4pOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2M7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBfdHJhbnNmb3JtU2NoZW1hdGljRGVzY3JpcHRpb24oXG4gICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICBjb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICAgICBkZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjPik6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjO1xuXG4gIHByaXZhdGUgX3RyYW5zZm9ybXM6IE9wdGlvblRyYW5zZm9ybTx7fSwge30+W10gPSBbXTtcbiAgcHJpdmF0ZSBfdGFza0ZhY3RvcmllcyA9IG5ldyBNYXA8c3RyaW5nLCAoKSA9PiBPYnNlcnZhYmxlPFRhc2tFeGVjdXRvcj4+KCk7XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIFVzZSBgbGlzdFNjaGVtYXRpY05hbWVzYC5cbiAgICovXG4gIGxpc3RTY2hlbWF0aWNzKGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLmxpc3RTY2hlbWF0aWNOYW1lcyhjb2xsZWN0aW9uLmRlc2NyaXB0aW9uKTtcbiAgfVxuICBsaXN0U2NoZW1hdGljTmFtZXMoY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjcmlwdGlvbikge1xuICAgIGNvbnN0IHNjaGVtYXRpY3M6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoY29sbGVjdGlvbi5zY2hlbWF0aWNzKSkge1xuICAgICAgY29uc3Qgc2NoZW1hdGljID0gY29sbGVjdGlvbi5zY2hlbWF0aWNzW2tleV07XG5cbiAgICAgIC8vIElmIGV4dGVuZHMgaXMgcHJlc2VudCB3aXRob3V0IGEgZmFjdG9yeSBpdCBpcyBhbiBhbGlhcywgZG8gbm90IHJldHVybiBpdFxuICAgICAgLy8gICB1bmxlc3MgaXQgaXMgZnJvbSBhbm90aGVyIGNvbGxlY3Rpb24uXG4gICAgICBpZiAoIXNjaGVtYXRpYy5leHRlbmRzIHx8IHNjaGVtYXRpYy5mYWN0b3J5KSB7XG4gICAgICAgIHNjaGVtYXRpY3MucHVzaChrZXkpO1xuICAgICAgfSBlbHNlIGlmIChzY2hlbWF0aWMuZXh0ZW5kcyAmJiBzY2hlbWF0aWMuZXh0ZW5kcy5pbmRleE9mKCc6JykgIT09IC0xKSB7XG4gICAgICAgIHNjaGVtYXRpY3MucHVzaChrZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzY2hlbWF0aWNzO1xuICB9XG5cbiAgcmVnaXN0ZXJPcHRpb25zVHJhbnNmb3JtPFQgZXh0ZW5kcyBvYmplY3QsIFIgZXh0ZW5kcyBvYmplY3Q+KHQ6IE9wdGlvblRyYW5zZm9ybTxULCBSPikge1xuICAgIHRoaXMuX3RyYW5zZm9ybXMucHVzaCh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZVxuICAgKiBAcmV0dXJuIHt7cGF0aDogc3RyaW5nfX1cbiAgICovXG4gIGNyZWF0ZUNvbGxlY3Rpb25EZXNjcmlwdGlvbihuYW1lOiBzdHJpbmcpOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2Mge1xuICAgIGNvbnN0IHBhdGggPSB0aGlzLl9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZSk7XG4gICAgY29uc3QganNvblZhbHVlID0gcmVhZEpzb25GaWxlKHBhdGgpO1xuICAgIGlmICghanNvblZhbHVlIHx8IHR5cGVvZiBqc29uVmFsdWUgIT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheShqc29uVmFsdWUpKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZENvbGxlY3Rpb25Kc29uRXhjZXB0aW9uKG5hbWUsIHBhdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGhpcy5fdHJhbnNmb3JtQ29sbGVjdGlvbkRlc2NyaXB0aW9uKG5hbWUsIHtcbiAgICAgIC4uLmpzb25WYWx1ZSxcbiAgICAgIHBhdGgsXG4gICAgfSk7XG4gICAgaWYgKCFkZXNjcmlwdGlvbiB8fCAhZGVzY3JpcHRpb24ubmFtZSkge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRDb2xsZWN0aW9uSnNvbkV4Y2VwdGlvbihuYW1lLCBwYXRoKTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBhbGlhc2VzLlxuICAgIGNvbnN0IGFsbE5hbWVzID0gT2JqZWN0LmtleXMoZGVzY3JpcHRpb24uc2NoZW1hdGljcyk7XG4gICAgZm9yIChjb25zdCBzY2hlbWF0aWNOYW1lIG9mIE9iamVjdC5rZXlzKGRlc2NyaXB0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICBjb25zdCBhbGlhc2VzID0gZGVzY3JpcHRpb24uc2NoZW1hdGljc1tzY2hlbWF0aWNOYW1lXS5hbGlhc2VzIHx8IFtdO1xuXG4gICAgICBmb3IgKGNvbnN0IGFsaWFzIG9mIGFsaWFzZXMpIHtcbiAgICAgICAgaWYgKGFsbE5hbWVzLmluZGV4T2YoYWxpYXMpICE9IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY05hbWVDb2xsaXNpb25FeGNlcHRpb24oYWxpYXMpO1xuICAgICAgICB9XG4gICAgICAgIGFsbE5hbWVzLnB1c2goLi4uYWxpYXNlcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc2NyaXB0aW9uO1xuICB9XG5cbiAgY3JlYXRlU2NoZW1hdGljRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgKTogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2Mge1xuICAgIC8vIFJlc29sdmUgYWxpYXNlcyBmaXJzdC5cbiAgICBmb3IgKGNvbnN0IHNjaGVtYXRpY05hbWUgb2YgT2JqZWN0LmtleXMoY29sbGVjdGlvbi5zY2hlbWF0aWNzKSkge1xuICAgICAgY29uc3Qgc2NoZW1hdGljRGVzY3JpcHRpb24gPSBjb2xsZWN0aW9uLnNjaGVtYXRpY3Nbc2NoZW1hdGljTmFtZV07XG4gICAgICBpZiAoc2NoZW1hdGljRGVzY3JpcHRpb24uYWxpYXNlcyAmJiBzY2hlbWF0aWNEZXNjcmlwdGlvbi5hbGlhc2VzLmluZGV4T2YobmFtZSkgIT0gLTEpIHtcbiAgICAgICAgbmFtZSA9IHNjaGVtYXRpY05hbWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghKG5hbWUgaW4gY29sbGVjdGlvbi5zY2hlbWF0aWNzKSkge1xuICAgICAgdGhyb3cgbmV3IFVua25vd25TY2hlbWF0aWNFeGNlcHRpb24obmFtZSwgY29sbGVjdGlvbik7XG4gICAgfVxuXG4gICAgY29uc3QgY29sbGVjdGlvblBhdGggPSBkaXJuYW1lKGNvbGxlY3Rpb24ucGF0aCk7XG4gICAgY29uc3QgcGFydGlhbERlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M+IHwgbnVsbCA9IGNvbGxlY3Rpb24uc2NoZW1hdGljc1tuYW1lXTtcbiAgICBpZiAoIXBhcnRpYWxEZXNjKSB7XG4gICAgICB0aHJvdyBuZXcgVW5rbm93blNjaGVtYXRpY0V4Y2VwdGlvbihuYW1lLCBjb2xsZWN0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAocGFydGlhbERlc2MuZXh0ZW5kcykge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJ0aWFsRGVzYy5leHRlbmRzLmluZGV4T2YoJzonKTtcbiAgICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gaW5kZXggIT09IC0xID8gcGFydGlhbERlc2MuZXh0ZW5kcy5zdWJzdHIoMCwgaW5kZXgpIDogbnVsbDtcbiAgICAgIGNvbnN0IHNjaGVtYXRpY05hbWUgPSBpbmRleCA9PT0gLTEgP1xuICAgICAgICBwYXJ0aWFsRGVzYy5leHRlbmRzIDogcGFydGlhbERlc2MuZXh0ZW5kcy5zdWJzdHIoaW5kZXggKyAxKTtcblxuICAgICAgaWYgKGNvbGxlY3Rpb25OYW1lICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGV4dGVuZENvbGxlY3Rpb24gPSB0aGlzLmNyZWF0ZUNvbGxlY3Rpb25EZXNjcmlwdGlvbihjb2xsZWN0aW9uTmFtZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU2NoZW1hdGljRGVzY3JpcHRpb24oc2NoZW1hdGljTmFtZSwgZXh0ZW5kQ29sbGVjdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTY2hlbWF0aWNEZXNjcmlwdGlvbihzY2hlbWF0aWNOYW1lLCBjb2xsZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gVXNlIGFueSBvbiB0aGlzIHJlZiBhcyB3ZSBkb24ndCBoYXZlIHRoZSBPcHRpb25UIGhlcmUsIGJ1dCB3ZSBkb24ndCBuZWVkIGl0ICh3ZSBvbmx5IG5lZWRcbiAgICAvLyB0aGUgcGF0aCkuXG4gICAgaWYgKCFwYXJ0aWFsRGVzYy5mYWN0b3J5KSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljTWlzc2luZ0ZhY3RvcnlFeGNlcHRpb24obmFtZSk7XG4gICAgfVxuICAgIGNvbnN0IHJlc29sdmVkUmVmID0gdGhpcy5fcmVzb2x2ZVJlZmVyZW5jZVN0cmluZyhwYXJ0aWFsRGVzYy5mYWN0b3J5LCBjb2xsZWN0aW9uUGF0aCk7XG4gICAgaWYgKCFyZXNvbHZlZFJlZikge1xuICAgICAgdGhyb3cgbmV3IEZhY3RvcnlDYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cblxuICAgIGNvbnN0IHsgcGF0aCB9ID0gcmVzb2x2ZWRSZWY7XG4gICAgbGV0IHNjaGVtYSA9IHBhcnRpYWxEZXNjLnNjaGVtYTtcbiAgICBsZXQgc2NoZW1hSnNvbjogSnNvbk9iamVjdCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAoc2NoZW1hKSB7XG4gICAgICBpZiAoIWlzQWJzb2x1dGUoc2NoZW1hKSkge1xuICAgICAgICBzY2hlbWEgPSBqb2luKGNvbGxlY3Rpb25QYXRoLCBzY2hlbWEpO1xuICAgICAgfVxuICAgICAgc2NoZW1hSnNvbiA9IHJlYWRKc29uRmlsZShzY2hlbWEpIGFzIEpzb25PYmplY3Q7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybVNjaGVtYXRpY0Rlc2NyaXB0aW9uKG5hbWUsIGNvbGxlY3Rpb24sIHtcbiAgICAgIC4uLnBhcnRpYWxEZXNjLFxuICAgICAgc2NoZW1hLFxuICAgICAgc2NoZW1hSnNvbixcbiAgICAgIG5hbWUsXG4gICAgICBwYXRoLFxuICAgICAgZmFjdG9yeUZuOiByZXNvbHZlZFJlZi5yZWYsXG4gICAgICBjb2xsZWN0aW9uLFxuICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlU291cmNlRnJvbVVybCh1cmw6IFVybCk6IFNvdXJjZSB8IG51bGwge1xuICAgIHN3aXRjaCAodXJsLnByb3RvY29sKSB7XG4gICAgICBjYXNlIG51bGw6XG4gICAgICBjYXNlICdmaWxlOic6XG4gICAgICAgIHJldHVybiAoY29udGV4dDogRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICAgICAgICAvLyBSZXNvbHZlIGFsbCBmaWxlOi8vL2EvYi9jL2QgZnJvbSB0aGUgc2NoZW1hdGljJ3Mgb3duIHBhdGgsIGFuZCBub3QgdGhlIGN1cnJlbnRcbiAgICAgICAgICAvLyBwYXRoLlxuICAgICAgICAgIGNvbnN0IHJvb3QgPSByZXNvbHZlKGRpcm5hbWUoY29udGV4dC5zY2hlbWF0aWMuZGVzY3JpcHRpb24ucGF0aCksIHVybC5wYXRoIHx8ICcnKTtcblxuICAgICAgICAgIHJldHVybiBuZXcgRmlsZVN5c3RlbUNyZWF0ZVRyZWUobmV3IEZpbGVTeXN0ZW1Ib3N0KHJvb3QpKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHRyYW5zZm9ybU9wdGlvbnM8T3B0aW9uVCBleHRlbmRzIG9iamVjdCwgUmVzdWx0VCBleHRlbmRzIG9iamVjdD4oXG4gICAgc2NoZW1hdGljOiBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyxcbiAgICBvcHRpb25zOiBPcHRpb25ULFxuICApOiBPYnNlcnZhYmxlPFJlc3VsdFQ+IHtcbiAgICByZXR1cm4gKG9ic2VydmFibGVPZihvcHRpb25zKVxuICAgICAgLnBpcGUoXG4gICAgICAgIC4uLnRoaXMuX3RyYW5zZm9ybXMubWFwKHRGbiA9PiBtZXJnZU1hcChvcHQgPT4ge1xuICAgICAgICAgIGNvbnN0IG5ld09wdGlvbnMgPSB0Rm4oc2NoZW1hdGljLCBvcHQpO1xuICAgICAgICAgIGlmIChTeW1ib2wub2JzZXJ2YWJsZSBpbiBuZXdPcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3T3B0aW9ucztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihuZXdPcHRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKSxcbiAgICAgICkpIGFzIHt9IGFzIE9ic2VydmFibGU8UmVzdWx0VD47XG4gIH1cblxuICBnZXRTY2hlbWF0aWNSdWxlRmFjdG9yeTxPcHRpb25UIGV4dGVuZHMgb2JqZWN0PihcbiAgICBzY2hlbWF0aWM6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjLFxuICAgIF9jb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MpOiBSdWxlRmFjdG9yeTxPcHRpb25UPiB7XG4gICAgcmV0dXJuIHNjaGVtYXRpYy5mYWN0b3J5Rm47XG4gIH1cblxuICByZWdpc3RlclRhc2tFeGVjdXRvcjxUPihmYWN0b3J5OiBUYXNrRXhlY3V0b3JGYWN0b3J5PFQ+LCBvcHRpb25zPzogVCk6IHZvaWQge1xuICAgIHRoaXMuX3Rhc2tGYWN0b3JpZXMuc2V0KGZhY3RvcnkubmFtZSwgKCkgPT4gb2JzZXJ2YWJsZUZyb20oZmFjdG9yeS5jcmVhdGUob3B0aW9ucykpKTtcbiAgfVxuXG4gIGNyZWF0ZVRhc2tFeGVjdXRvcihuYW1lOiBzdHJpbmcpOiBPYnNlcnZhYmxlPFRhc2tFeGVjdXRvcj4ge1xuICAgIGNvbnN0IGZhY3RvcnkgPSB0aGlzLl90YXNrRmFjdG9yaWVzLmdldChuYW1lKTtcbiAgICBpZiAoZmFjdG9yeSkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gX3Rocm93KG5ldyBVbnJlZ2lzdGVyZWRUYXNrRXhjZXB0aW9uKG5hbWUpKTtcbiAgfVxuXG4gIGhhc1Rhc2tFeGVjdXRvcihuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fdGFza0ZhY3Rvcmllcy5oYXMobmFtZSk7XG4gIH1cbn1cbiJdfQ==