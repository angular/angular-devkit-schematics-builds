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
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
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
        return (rxjs_1.of(options)
            .pipe(...this._transforms.map(tFn => operators_1.mergeMap(opt => {
            const newOptions = tFn(schematic, opt);
            if (core_1.isObservable(newOptions)) {
                return newOptions;
            }
            else {
                return rxjs_1.of(newOptions);
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
        this._taskFactories.set(factory.name, () => rxjs_1.from(factory.create(options)));
    }
    createTaskExecutor(name) {
        const factory = this._taskFactories.get(name);
        if (factory) {
            return factory();
        }
        return rxjs_1.throwError(new src_1.UnregisteredTaskException(name));
    }
    hasTaskExecutor(name) {
        return this._taskFactories.has(name);
    }
}
exports.FileSystemEngineHostBase = FileSystemEngineHostBase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90b29scy9maWxlLXN5c3RlbS1lbmdpbmUtaG9zdC1iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBTThCO0FBQzlCLG9EQUEyRDtBQUMzRCwrQkFBMEQ7QUFDMUQsK0JBQTBGO0FBQzFGLDhDQUEwQztBQUUxQyxnQ0FRZ0I7QUFTaEIsK0RBQXFEO0FBT3JELHlDQUFpRCxTQUFRLG9CQUFhO0lBQ3BFLFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsY0FBYyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7Q0FDRjtBQUpELGtGQUlDO0FBQ0Qsb0NBQTRDLFNBQVEsb0JBQWE7SUFDL0QsWUFBWSxLQUFhLEVBQUUsSUFBWTtRQUNyQyxLQUFLLENBQUMsMkJBQTJCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7Q0FDRjtBQUpELHdFQUlDO0FBQ0Qsc0NBQThDLFNBQVEsb0JBQWE7SUFDakUsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyxhQUFhLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFDbkUsQ0FBQztDQUNGO0FBSkQsNEVBSUM7QUFDRCxzQ0FBOEMsU0FBUSxvQkFBYTtJQUNqRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsOEJBQThCLENBQUMsQ0FBQztJQUN6RSxDQUFDO0NBQ0Y7QUFKRCw0RUFJQztBQUNELDZDQUFxRCxTQUFRLG9CQUFhO0lBQ3hFLFlBQVksSUFBWSxJQUFJLEtBQUssQ0FBQyxlQUFlLElBQUks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LCtCQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELGVBQWUsQ0FBQyxJQUFZO1FBQzFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0NBQ0Y7QUF4TkQsNERBd05DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgQmFzZUV4Y2VwdGlvbixcbiAgSnNvbk9iamVjdCxcbiAgaXNPYnNlcnZhYmxlLFxuICBub3JtYWxpemUsXG4gIHZpcnR1YWxGcyxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgTm9kZUpzU3luY0hvc3QgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9ub2RlJztcbmltcG9ydCB7IGRpcm5hbWUsIGlzQWJzb2x1dGUsIGpvaW4sIHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IE9ic2VydmFibGUsIGZyb20gYXMgb2JzZXJ2YWJsZUZyb20sIG9mIGFzIG9ic2VydmFibGVPZiwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgbWVyZ2VNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBVcmwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHtcbiAgRW5naW5lSG9zdCxcbiAgRmlsZVN5c3RlbUNyZWF0ZVRyZWUsXG4gIFJ1bGVGYWN0b3J5LFxuICBTb3VyY2UsXG4gIFRhc2tFeGVjdXRvcixcbiAgVGFza0V4ZWN1dG9yRmFjdG9yeSxcbiAgVW5yZWdpc3RlcmVkVGFza0V4Y2VwdGlvbixcbn0gZnJvbSAnLi4vc3JjJztcbmltcG9ydCB7XG4gIEZpbGVTeXN0ZW1Db2xsZWN0aW9uLFxuICBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gIEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzY3JpcHRpb24sXG4gIEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0LFxuICBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyxcbiAgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uLFxufSBmcm9tICcuL2Rlc2NyaXB0aW9uJztcbmltcG9ydCB7IHJlYWRKc29uRmlsZSB9IGZyb20gJy4vZmlsZS1zeXN0ZW0tdXRpbGl0eSc7XG5cblxuZXhwb3J0IGRlY2xhcmUgdHlwZSBPcHRpb25UcmFuc2Zvcm08VCBleHRlbmRzIG9iamVjdCwgUiBleHRlbmRzIG9iamVjdD5cbiAgICA9IChzY2hlbWF0aWM6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbiwgb3B0aW9uczogVCkgPT4gT2JzZXJ2YWJsZTxSPjtcblxuXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbkNhbm5vdEJlUmVzb2x2ZWRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENvbGxlY3Rpb24gJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gY2Fubm90IGJlIHJlc29sdmVkLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgSW52YWxpZENvbGxlY3Rpb25Kc29uRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKF9uYW1lOiBzdHJpbmcsIHBhdGg6IHN0cmluZykge1xuICAgIHN1cGVyKGBDb2xsZWN0aW9uIEpTT04gYXQgcGF0aCAke0pTT04uc3RyaW5naWZ5KHBhdGgpfSBpcyBpbnZhbGlkLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTWlzc2luZ0ZhY3RvcnlFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpYyAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBpcyBtaXNzaW5nIGEgZmFjdG9yeS5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEZhY3RvcnlDYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBTY2hlbWF0aWMgJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gY2Fubm90IHJlc29sdmUgdGhlIGZhY3RvcnkuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uTWlzc2luZ1NjaGVtYXRpY3NNYXBFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBDb2xsZWN0aW9uIFwiJHtuYW1lfVwiIGRvZXMgbm90IGhhdmUgYSBzY2hlbWF0aWNzIG1hcC5gKTsgfVxufVxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25NaXNzaW5nRmllbGRzRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykgeyBzdXBlcihgQ29sbGVjdGlvbiBcIiR7bmFtZX1cIiBpcyBtaXNzaW5nIGZpZWxkcy5gKTsgfVxufVxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY01pc3NpbmdGaWVsZHNFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBTY2hlbWF0aWMgXCIke25hbWV9XCIgaXMgbWlzc2luZyBmaWVsZHMuYCk7IH1cbn1cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNNaXNzaW5nRGVzY3JpcHRpb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBTY2hlbWF0aWNzIFwiJHtuYW1lfVwiIGRvZXMgbm90IGhhdmUgYSBkZXNjcmlwdGlvbi5gKTsgfVxufVxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY05hbWVDb2xsaXNpb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpY3MvYWxpYXMgJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gY29sbGlkZXMgd2l0aCBhbm90aGVyIGFsaWFzIG9yIHNjaGVtYXRpY2BcbiAgICAgICAgICArICcgbmFtZS4nKTtcbiAgfVxufVxuXG5cbi8qKlxuICogQSBFbmdpbmVIb3N0IGJhc2UgY2xhc3MgdGhhdCB1c2VzIHRoZSBmaWxlIHN5c3RlbSB0byByZXNvbHZlIGNvbGxlY3Rpb25zLiBUaGlzIGlzIHRoZSBiYXNlIG9mXG4gKiBhbGwgb3RoZXIgRW5naW5lSG9zdCBwcm92aWRlZCBieSB0aGUgdG9vbGluZyBwYXJ0IG9mIHRoZSBTY2hlbWF0aWNzIGxpYnJhcnkuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBGaWxlU3lzdGVtRW5naW5lSG9zdEJhc2UgaW1wbGVtZW50c1xuICAgIEVuZ2luZUhvc3Q8RmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjcmlwdGlvbiwgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uPiB7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBfcmVzb2x2ZUNvbGxlY3Rpb25QYXRoKG5hbWU6IHN0cmluZyk6IHN0cmluZztcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF9yZXNvbHZlUmVmZXJlbmNlU3RyaW5nKFxuICAgICAgbmFtZTogc3RyaW5nLCBwYXJlbnRQYXRoOiBzdHJpbmcpOiB7IHJlZjogUnVsZUZhY3Rvcnk8e30+LCBwYXRoOiBzdHJpbmcgfSB8IG51bGw7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBfdHJhbnNmb3JtQ29sbGVjdGlvbkRlc2NyaXB0aW9uKFxuICAgICAgbmFtZTogc3RyaW5nLCBkZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYz4pOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2M7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBfdHJhbnNmb3JtU2NoZW1hdGljRGVzY3JpcHRpb24oXG4gICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICBjb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICAgICBkZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjPik6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjO1xuXG4gIHByaXZhdGUgX3RyYW5zZm9ybXM6IE9wdGlvblRyYW5zZm9ybTx7fSwge30+W10gPSBbXTtcbiAgcHJpdmF0ZSBfdGFza0ZhY3RvcmllcyA9IG5ldyBNYXA8c3RyaW5nLCAoKSA9PiBPYnNlcnZhYmxlPFRhc2tFeGVjdXRvcj4+KCk7XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIFVzZSBgbGlzdFNjaGVtYXRpY05hbWVzYC5cbiAgICovXG4gIGxpc3RTY2hlbWF0aWNzKGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLmxpc3RTY2hlbWF0aWNOYW1lcyhjb2xsZWN0aW9uLmRlc2NyaXB0aW9uKTtcbiAgfVxuICBsaXN0U2NoZW1hdGljTmFtZXMoY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjKSB7XG4gICAgY29uc3Qgc2NoZW1hdGljczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhjb2xsZWN0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICBjb25zdCBzY2hlbWF0aWMgPSBjb2xsZWN0aW9uLnNjaGVtYXRpY3Nba2V5XTtcblxuICAgICAgaWYgKHNjaGVtYXRpYy5oaWRkZW4gfHwgc2NoZW1hdGljLnByaXZhdGUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGV4dGVuZHMgaXMgcHJlc2VudCB3aXRob3V0IGEgZmFjdG9yeSBpdCBpcyBhbiBhbGlhcywgZG8gbm90IHJldHVybiBpdFxuICAgICAgLy8gICB1bmxlc3MgaXQgaXMgZnJvbSBhbm90aGVyIGNvbGxlY3Rpb24uXG4gICAgICBpZiAoIXNjaGVtYXRpYy5leHRlbmRzIHx8IHNjaGVtYXRpYy5mYWN0b3J5KSB7XG4gICAgICAgIHNjaGVtYXRpY3MucHVzaChrZXkpO1xuICAgICAgfSBlbHNlIGlmIChzY2hlbWF0aWMuZXh0ZW5kcyAmJiBzY2hlbWF0aWMuZXh0ZW5kcy5pbmRleE9mKCc6JykgIT09IC0xKSB7XG4gICAgICAgIHNjaGVtYXRpY3MucHVzaChrZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzY2hlbWF0aWNzO1xuICB9XG5cbiAgcmVnaXN0ZXJPcHRpb25zVHJhbnNmb3JtPFQgZXh0ZW5kcyBvYmplY3QsIFIgZXh0ZW5kcyBvYmplY3Q+KHQ6IE9wdGlvblRyYW5zZm9ybTxULCBSPikge1xuICAgIHRoaXMuX3RyYW5zZm9ybXMucHVzaCh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZVxuICAgKiBAcmV0dXJuIHt7cGF0aDogc3RyaW5nfX1cbiAgICovXG4gIGNyZWF0ZUNvbGxlY3Rpb25EZXNjcmlwdGlvbihuYW1lOiBzdHJpbmcpOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2Mge1xuICAgIGNvbnN0IHBhdGggPSB0aGlzLl9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZSk7XG4gICAgY29uc3QganNvblZhbHVlID0gcmVhZEpzb25GaWxlKHBhdGgpO1xuICAgIGlmICghanNvblZhbHVlIHx8IHR5cGVvZiBqc29uVmFsdWUgIT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheShqc29uVmFsdWUpKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZENvbGxlY3Rpb25Kc29uRXhjZXB0aW9uKG5hbWUsIHBhdGgpO1xuICAgIH1cblxuICAgIC8vIG5vcm1hbGl6ZSBleHRlbmRzIHByb3BlcnR5IHRvIGFuIGFycmF5XG4gICAgaWYgKHR5cGVvZiBqc29uVmFsdWVbJ2V4dGVuZHMnXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGpzb25WYWx1ZVsnZXh0ZW5kcyddID0gW2pzb25WYWx1ZVsnZXh0ZW5kcyddXTtcbiAgICB9XG5cbiAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHRoaXMuX3RyYW5zZm9ybUNvbGxlY3Rpb25EZXNjcmlwdGlvbihuYW1lLCB7XG4gICAgICAuLi5qc29uVmFsdWUsXG4gICAgICBwYXRoLFxuICAgIH0pO1xuICAgIGlmICghZGVzY3JpcHRpb24gfHwgIWRlc2NyaXB0aW9uLm5hbWUpIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkQ29sbGVjdGlvbkpzb25FeGNlcHRpb24obmFtZSwgcGF0aCk7XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgYWxpYXNlcy5cbiAgICBjb25zdCBhbGxOYW1lcyA9IE9iamVjdC5rZXlzKGRlc2NyaXB0aW9uLnNjaGVtYXRpY3MpO1xuICAgIGZvciAoY29uc3Qgc2NoZW1hdGljTmFtZSBvZiBPYmplY3Qua2V5cyhkZXNjcmlwdGlvbi5zY2hlbWF0aWNzKSkge1xuICAgICAgY29uc3QgYWxpYXNlcyA9IGRlc2NyaXB0aW9uLnNjaGVtYXRpY3Nbc2NoZW1hdGljTmFtZV0uYWxpYXNlcyB8fCBbXTtcblxuICAgICAgZm9yIChjb25zdCBhbGlhcyBvZiBhbGlhc2VzKSB7XG4gICAgICAgIGlmIChhbGxOYW1lcy5pbmRleE9mKGFsaWFzKSAhPSAtMSkge1xuICAgICAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNOYW1lQ29sbGlzaW9uRXhjZXB0aW9uKGFsaWFzKTtcbiAgICAgICAgfVxuICAgICAgICBhbGxOYW1lcy5wdXNoKC4uLmFsaWFzZXMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZXNjcmlwdGlvbjtcbiAgfVxuXG4gIGNyZWF0ZVNjaGVtYXRpY0Rlc2NyaXB0aW9uKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBjb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICk6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjIHwgbnVsbCB7XG4gICAgLy8gUmVzb2x2ZSBhbGlhc2VzIGZpcnN0LlxuICAgIGZvciAoY29uc3Qgc2NoZW1hdGljTmFtZSBvZiBPYmplY3Qua2V5cyhjb2xsZWN0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICBjb25zdCBzY2hlbWF0aWNEZXNjcmlwdGlvbiA9IGNvbGxlY3Rpb24uc2NoZW1hdGljc1tzY2hlbWF0aWNOYW1lXTtcbiAgICAgIGlmIChzY2hlbWF0aWNEZXNjcmlwdGlvbi5hbGlhc2VzICYmIHNjaGVtYXRpY0Rlc2NyaXB0aW9uLmFsaWFzZXMuaW5kZXhPZihuYW1lKSAhPSAtMSkge1xuICAgICAgICBuYW1lID0gc2NoZW1hdGljTmFtZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCEobmFtZSBpbiBjb2xsZWN0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBjb2xsZWN0aW9uUGF0aCA9IGRpcm5hbWUoY29sbGVjdGlvbi5wYXRoKTtcbiAgICBjb25zdCBwYXJ0aWFsRGVzYzogUGFydGlhbDxGaWxlU3lzdGVtU2NoZW1hdGljRGVzYz4gfCBudWxsID0gY29sbGVjdGlvbi5zY2hlbWF0aWNzW25hbWVdO1xuICAgIGlmICghcGFydGlhbERlc2MpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChwYXJ0aWFsRGVzYy5leHRlbmRzKSB7XG4gICAgICBjb25zdCBpbmRleCA9IHBhcnRpYWxEZXNjLmV4dGVuZHMuaW5kZXhPZignOicpO1xuICAgICAgY29uc3QgY29sbGVjdGlvbk5hbWUgPSBpbmRleCAhPT0gLTEgPyBwYXJ0aWFsRGVzYy5leHRlbmRzLnN1YnN0cigwLCBpbmRleCkgOiBudWxsO1xuICAgICAgY29uc3Qgc2NoZW1hdGljTmFtZSA9IGluZGV4ID09PSAtMSA/XG4gICAgICAgIHBhcnRpYWxEZXNjLmV4dGVuZHMgOiBwYXJ0aWFsRGVzYy5leHRlbmRzLnN1YnN0cihpbmRleCArIDEpO1xuXG4gICAgICBpZiAoY29sbGVjdGlvbk5hbWUgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgZXh0ZW5kQ29sbGVjdGlvbiA9IHRoaXMuY3JlYXRlQ29sbGVjdGlvbkRlc2NyaXB0aW9uKGNvbGxlY3Rpb25OYW1lKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTY2hlbWF0aWNEZXNjcmlwdGlvbihzY2hlbWF0aWNOYW1lLCBleHRlbmRDb2xsZWN0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVNjaGVtYXRpY0Rlc2NyaXB0aW9uKHNjaGVtYXRpY05hbWUsIGNvbGxlY3Rpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBVc2UgYW55IG9uIHRoaXMgcmVmIGFzIHdlIGRvbid0IGhhdmUgdGhlIE9wdGlvblQgaGVyZSwgYnV0IHdlIGRvbid0IG5lZWQgaXQgKHdlIG9ubHkgbmVlZFxuICAgIC8vIHRoZSBwYXRoKS5cbiAgICBpZiAoIXBhcnRpYWxEZXNjLmZhY3RvcnkpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNNaXNzaW5nRmFjdG9yeUV4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG4gICAgY29uc3QgcmVzb2x2ZWRSZWYgPSB0aGlzLl9yZXNvbHZlUmVmZXJlbmNlU3RyaW5nKHBhcnRpYWxEZXNjLmZhY3RvcnksIGNvbGxlY3Rpb25QYXRoKTtcbiAgICBpZiAoIXJlc29sdmVkUmVmKSB7XG4gICAgICB0aHJvdyBuZXcgRmFjdG9yeUNhbm5vdEJlUmVzb2x2ZWRFeGNlcHRpb24obmFtZSk7XG4gICAgfVxuXG4gICAgY29uc3QgeyBwYXRoIH0gPSByZXNvbHZlZFJlZjtcbiAgICBsZXQgc2NoZW1hID0gcGFydGlhbERlc2Muc2NoZW1hO1xuICAgIGxldCBzY2hlbWFKc29uOiBKc29uT2JqZWN0IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGlmIChzY2hlbWEpIHtcbiAgICAgIGlmICghaXNBYnNvbHV0ZShzY2hlbWEpKSB7XG4gICAgICAgIHNjaGVtYSA9IGpvaW4oY29sbGVjdGlvblBhdGgsIHNjaGVtYSk7XG4gICAgICB9XG4gICAgICBzY2hlbWFKc29uID0gcmVhZEpzb25GaWxlKHNjaGVtYSkgYXMgSnNvbk9iamVjdDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fdHJhbnNmb3JtU2NoZW1hdGljRGVzY3JpcHRpb24obmFtZSwgY29sbGVjdGlvbiwge1xuICAgICAgLi4ucGFydGlhbERlc2MsXG4gICAgICBzY2hlbWEsXG4gICAgICBzY2hlbWFKc29uLFxuICAgICAgbmFtZSxcbiAgICAgIHBhdGgsXG4gICAgICBmYWN0b3J5Rm46IHJlc29sdmVkUmVmLnJlZixcbiAgICAgIGNvbGxlY3Rpb24sXG4gICAgfSk7XG4gIH1cblxuICBjcmVhdGVTb3VyY2VGcm9tVXJsKHVybDogVXJsKTogU291cmNlIHwgbnVsbCB7XG4gICAgc3dpdGNoICh1cmwucHJvdG9jb2wpIHtcbiAgICAgIGNhc2UgbnVsbDpcbiAgICAgIGNhc2UgJ2ZpbGU6JzpcbiAgICAgICAgcmV0dXJuIChjb250ZXh0OiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgICAgICAgIC8vIFJlc29sdmUgYWxsIGZpbGU6Ly8vYS9iL2MvZCBmcm9tIHRoZSBzY2hlbWF0aWMncyBvd24gcGF0aCwgYW5kIG5vdCB0aGUgY3VycmVudFxuICAgICAgICAgIC8vIHBhdGguXG4gICAgICAgICAgY29uc3Qgcm9vdCA9IG5vcm1hbGl6ZShcbiAgICAgICAgICAgIHJlc29sdmUoZGlybmFtZShjb250ZXh0LnNjaGVtYXRpYy5kZXNjcmlwdGlvbi5wYXRoKSwgdXJsLnBhdGggfHwgJycpLFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm4gbmV3IEZpbGVTeXN0ZW1DcmVhdGVUcmVlKG5ldyB2aXJ0dWFsRnMuU2NvcGVkSG9zdChuZXcgTm9kZUpzU3luY0hvc3QoKSwgcm9vdCkpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdHJhbnNmb3JtT3B0aW9uczxPcHRpb25UIGV4dGVuZHMgb2JqZWN0LCBSZXN1bHRUIGV4dGVuZHMgb2JqZWN0PihcbiAgICBzY2hlbWF0aWM6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjLFxuICAgIG9wdGlvbnM6IE9wdGlvblQsXG4gICk6IE9ic2VydmFibGU8UmVzdWx0VD4ge1xuICAgIHJldHVybiAob2JzZXJ2YWJsZU9mKG9wdGlvbnMpXG4gICAgICAucGlwZShcbiAgICAgICAgLi4udGhpcy5fdHJhbnNmb3Jtcy5tYXAodEZuID0+IG1lcmdlTWFwKG9wdCA9PiB7XG4gICAgICAgICAgY29uc3QgbmV3T3B0aW9ucyA9IHRGbihzY2hlbWF0aWMsIG9wdCk7XG4gICAgICAgICAgaWYgKGlzT2JzZXJ2YWJsZShuZXdPcHRpb25zKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ld09wdGlvbnM7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YobmV3T3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KSksXG4gICAgICApKSBhcyB7fSBhcyBPYnNlcnZhYmxlPFJlc3VsdFQ+O1xuICB9XG5cbiAgdHJhbnNmb3JtQ29udGV4dChjb250ZXh0OiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCk6IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0IHtcbiAgICByZXR1cm4gY29udGV4dDtcbiAgfVxuXG4gIGdldFNjaGVtYXRpY1J1bGVGYWN0b3J5PE9wdGlvblQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgIHNjaGVtYXRpYzogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MsXG4gICAgX2NvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyk6IFJ1bGVGYWN0b3J5PE9wdGlvblQ+IHtcbiAgICByZXR1cm4gc2NoZW1hdGljLmZhY3RvcnlGbjtcbiAgfVxuXG4gIHJlZ2lzdGVyVGFza0V4ZWN1dG9yPFQ+KGZhY3Rvcnk6IFRhc2tFeGVjdXRvckZhY3Rvcnk8VD4sIG9wdGlvbnM/OiBUKTogdm9pZCB7XG4gICAgdGhpcy5fdGFza0ZhY3Rvcmllcy5zZXQoZmFjdG9yeS5uYW1lLCAoKSA9PiBvYnNlcnZhYmxlRnJvbShmYWN0b3J5LmNyZWF0ZShvcHRpb25zKSkpO1xuICB9XG5cbiAgY3JlYXRlVGFza0V4ZWN1dG9yKG5hbWU6IHN0cmluZyk6IE9ic2VydmFibGU8VGFza0V4ZWN1dG9yPiB7XG4gICAgY29uc3QgZmFjdG9yeSA9IHRoaXMuX3Rhc2tGYWN0b3JpZXMuZ2V0KG5hbWUpO1xuICAgIGlmIChmYWN0b3J5KSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aHJvd0Vycm9yKG5ldyBVbnJlZ2lzdGVyZWRUYXNrRXhjZXB0aW9uKG5hbWUpKTtcbiAgfVxuXG4gIGhhc1Rhc2tFeGVjdXRvcihuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fdGFza0ZhY3Rvcmllcy5oYXMobmFtZSk7XG4gIH1cbn1cbiJdfQ==