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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90b29scy9maWxlLXN5c3RlbS1lbmdpbmUtaG9zdC1iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBTThCO0FBQzlCLG9EQUEyRDtBQUMzRCwrQkFBMEQ7QUFDMUQsK0JBQTBGO0FBQzFGLDhDQUEwQztBQUUxQyxnQ0FRZ0I7QUFTaEIsK0RBQXFEO0FBT3JELHlDQUFpRCxTQUFRLG9CQUFhO0lBQ3BFLFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsY0FBYyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7Q0FDRjtBQUpELGtGQUlDO0FBQ0Qsb0NBQTRDLFNBQVEsb0JBQWE7SUFDL0QsWUFBWSxLQUFhLEVBQUUsSUFBWTtRQUNyQyxLQUFLLENBQUMsMkJBQTJCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7Q0FDRjtBQUpELHdFQUlDO0FBQ0Qsc0NBQThDLFNBQVEsb0JBQWE7SUFDakUsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyxhQUFhLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFDbkUsQ0FBQztDQUNGO0FBSkQsNEVBSUM7QUFDRCxzQ0FBOEMsU0FBUSxvQkFBYTtJQUNqRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsOEJBQThCLENBQUMsQ0FBQztJQUN6RSxDQUFDO0NBQ0Y7QUFKRCw0RUFJQztBQUNELDZDQUFxRCxTQUFRLG9CQUFhO0lBQ3hFLFlBQVksSUFBWSxJQUFJLEtBQUssQ0FBQyxlQUFlLElBQUks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K0JBQXlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRUQsZUFBZSxDQUFDLElBQVk7UUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Q0FDRjtBQXpORCw0REF5TkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1xuICBCYXNlRXhjZXB0aW9uLFxuICBKc29uT2JqZWN0LFxuICBpc09ic2VydmFibGUsXG4gIG5vcm1hbGl6ZSxcbiAgdmlydHVhbEZzLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBOb2RlSnNTeW5jSG9zdCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlL25vZGUnO1xuaW1wb3J0IHsgZGlybmFtZSwgaXNBYnNvbHV0ZSwgam9pbiwgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgZnJvbSBhcyBvYnNlcnZhYmxlRnJvbSwgb2YgYXMgb2JzZXJ2YWJsZU9mLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBtZXJnZU1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IFVybCB9IGZyb20gJ3VybCc7XG5pbXBvcnQge1xuICBFbmdpbmVIb3N0LFxuICBGaWxlU3lzdGVtQ3JlYXRlVHJlZSxcbiAgUnVsZUZhY3RvcnksXG4gIFNvdXJjZSxcbiAgVGFza0V4ZWN1dG9yLFxuICBUYXNrRXhlY3V0b3JGYWN0b3J5LFxuICBVbnJlZ2lzdGVyZWRUYXNrRXhjZXB0aW9uLFxufSBmcm9tICcuLi9zcmMnO1xuaW1wb3J0IHtcbiAgRmlsZVN5c3RlbUNvbGxlY3Rpb24sXG4gIEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjcmlwdGlvbixcbiAgRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQsXG4gIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjLFxuICBGaWxlU3lzdGVtU2NoZW1hdGljRGVzY3JpcHRpb24sXG59IGZyb20gJy4vZGVzY3JpcHRpb24nO1xuaW1wb3J0IHsgcmVhZEpzb25GaWxlIH0gZnJvbSAnLi9maWxlLXN5c3RlbS11dGlsaXR5JztcblxuXG5leHBvcnQgZGVjbGFyZSB0eXBlIE9wdGlvblRyYW5zZm9ybTxUIGV4dGVuZHMgb2JqZWN0LCBSIGV4dGVuZHMgb2JqZWN0PlxuICAgID0gKHNjaGVtYXRpYzogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uLCBvcHRpb25zOiBUKSA9PiBPYnNlcnZhYmxlPFI+O1xuXG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uQ2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgQ29sbGVjdGlvbiAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBjYW5ub3QgYmUgcmVzb2x2ZWQuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBJbnZhbGlkQ29sbGVjdGlvbkpzb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IoX25hbWU6IHN0cmluZywgcGF0aDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENvbGxlY3Rpb24gSlNPTiBhdCBwYXRoICR7SlNPTi5zdHJpbmdpZnkocGF0aCl9IGlzIGludmFsaWQuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNNaXNzaW5nRmFjdG9yeUV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgU2NoZW1hdGljICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGlzIG1pc3NpbmcgYSBmYWN0b3J5LmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRmFjdG9yeUNhbm5vdEJlUmVzb2x2ZWRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpYyAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBjYW5ub3QgcmVzb2x2ZSB0aGUgZmFjdG9yeS5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25NaXNzaW5nU2NoZW1hdGljc01hcEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYENvbGxlY3Rpb24gXCIke25hbWV9XCIgZG9lcyBub3QgaGF2ZSBhIHNjaGVtYXRpY3MgbWFwLmApOyB9XG59XG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbk1pc3NpbmdGaWVsZHNFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBDb2xsZWN0aW9uIFwiJHtuYW1lfVwiIGlzIG1pc3NpbmcgZmllbGRzLmApOyB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTWlzc2luZ0ZpZWxkc0V4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYFNjaGVtYXRpYyBcIiR7bmFtZX1cIiBpcyBtaXNzaW5nIGZpZWxkcy5gKTsgfVxufVxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY01pc3NpbmdEZXNjcmlwdGlvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYFNjaGVtYXRpY3MgXCIke25hbWV9XCIgZG9lcyBub3QgaGF2ZSBhIGRlc2NyaXB0aW9uLmApOyB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTmFtZUNvbGxpc2lvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgU2NoZW1hdGljcy9hbGlhcyAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBjb2xsaWRlcyB3aXRoIGFub3RoZXIgYWxpYXMgb3Igc2NoZW1hdGljYFxuICAgICAgICAgICsgJyBuYW1lLicpO1xuICB9XG59XG5cblxuLyoqXG4gKiBBIEVuZ2luZUhvc3QgYmFzZSBjbGFzcyB0aGF0IHVzZXMgdGhlIGZpbGUgc3lzdGVtIHRvIHJlc29sdmUgY29sbGVjdGlvbnMuIFRoaXMgaXMgdGhlIGJhc2Ugb2ZcbiAqIGFsbCBvdGhlciBFbmdpbmVIb3N0IHByb3ZpZGVkIGJ5IHRoZSB0b29saW5nIHBhcnQgb2YgdGhlIFNjaGVtYXRpY3MgbGlicmFyeS5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEZpbGVTeXN0ZW1FbmdpbmVIb3N0QmFzZSBpbXBsZW1lbnRzXG4gICAgRW5naW5lSG9zdDxGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2NyaXB0aW9uLCBGaWxlU3lzdGVtU2NoZW1hdGljRGVzY3JpcHRpb24+IHtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZTogc3RyaW5nKTogc3RyaW5nO1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgX3Jlc29sdmVSZWZlcmVuY2VTdHJpbmcoXG4gICAgICBuYW1lOiBzdHJpbmcsIHBhcmVudFBhdGg6IHN0cmluZyk6IHsgcmVmOiBSdWxlRmFjdG9yeTx7fT4sIHBhdGg6IHN0cmluZyB9IHwgbnVsbDtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF90cmFuc2Zvcm1Db2xsZWN0aW9uRGVzY3JpcHRpb24oXG4gICAgICBuYW1lOiBzdHJpbmcsIGRlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjPik6IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYztcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF90cmFuc2Zvcm1TY2hlbWF0aWNEZXNjcmlwdGlvbihcbiAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgIGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgICAgIGRlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M+KTogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M7XG5cbiAgcHJpdmF0ZSBfdHJhbnNmb3JtczogT3B0aW9uVHJhbnNmb3JtPHt9LCB7fT5bXSA9IFtdO1xuICBwcml2YXRlIF90YXNrRmFjdG9yaWVzID0gbmV3IE1hcDxzdHJpbmcsICgpID0+IE9ic2VydmFibGU8VGFza0V4ZWN1dG9yPj4oKTtcblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgVXNlIGBsaXN0U2NoZW1hdGljTmFtZXNgLlxuICAgKi9cbiAgbGlzdFNjaGVtYXRpY3MoY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb24pOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdFNjaGVtYXRpY05hbWVzKGNvbGxlY3Rpb24uZGVzY3JpcHRpb24pO1xuICB9XG4gIGxpc3RTY2hlbWF0aWNOYW1lcyhjb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MpIHtcbiAgICBjb25zdCBzY2hlbWF0aWNzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGNvbGxlY3Rpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIGNvbnN0IHNjaGVtYXRpYyA9IGNvbGxlY3Rpb24uc2NoZW1hdGljc1trZXldO1xuXG4gICAgICBpZiAoc2NoZW1hdGljLmhpZGRlbiB8fCBzY2hlbWF0aWMucHJpdmF0ZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgZXh0ZW5kcyBpcyBwcmVzZW50IHdpdGhvdXQgYSBmYWN0b3J5IGl0IGlzIGFuIGFsaWFzLCBkbyBub3QgcmV0dXJuIGl0XG4gICAgICAvLyAgIHVubGVzcyBpdCBpcyBmcm9tIGFub3RoZXIgY29sbGVjdGlvbi5cbiAgICAgIGlmICghc2NoZW1hdGljLmV4dGVuZHMgfHwgc2NoZW1hdGljLmZhY3RvcnkpIHtcbiAgICAgICAgc2NoZW1hdGljcy5wdXNoKGtleSk7XG4gICAgICB9IGVsc2UgaWYgKHNjaGVtYXRpYy5leHRlbmRzICYmIHNjaGVtYXRpYy5leHRlbmRzLmluZGV4T2YoJzonKSAhPT0gLTEpIHtcbiAgICAgICAgc2NoZW1hdGljcy5wdXNoKGtleSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjaGVtYXRpY3M7XG4gIH1cblxuICByZWdpc3Rlck9wdGlvbnNUcmFuc2Zvcm08VCBleHRlbmRzIG9iamVjdCwgUiBleHRlbmRzIG9iamVjdD4odDogT3B0aW9uVHJhbnNmb3JtPFQsIFI+KSB7XG4gICAgdGhpcy5fdHJhbnNmb3Jtcy5wdXNoKHQpO1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lXG4gICAqIEByZXR1cm4ge3twYXRoOiBzdHJpbmd9fVxuICAgKi9cbiAgY3JlYXRlQ29sbGVjdGlvbkRlc2NyaXB0aW9uKG5hbWU6IHN0cmluZyk6IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyB7XG4gICAgY29uc3QgcGF0aCA9IHRoaXMuX3Jlc29sdmVDb2xsZWN0aW9uUGF0aChuYW1lKTtcbiAgICBjb25zdCBqc29uVmFsdWUgPSByZWFkSnNvbkZpbGUocGF0aCk7XG4gICAgaWYgKCFqc29uVmFsdWUgfHwgdHlwZW9mIGpzb25WYWx1ZSAhPSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KGpzb25WYWx1ZSkpIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkQ29sbGVjdGlvbkpzb25FeGNlcHRpb24obmFtZSwgcGF0aCk7XG4gICAgfVxuXG4gICAgLy8gbm9ybWFsaXplIGV4dGVuZHMgcHJvcGVydHkgdG8gYW4gYXJyYXlcbiAgICBpZiAodHlwZW9mIGpzb25WYWx1ZVsnZXh0ZW5kcyddID09PSAnc3RyaW5nJykge1xuICAgICAganNvblZhbHVlWydleHRlbmRzJ10gPSBbanNvblZhbHVlWydleHRlbmRzJ11dO1xuICAgIH1cblxuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGhpcy5fdHJhbnNmb3JtQ29sbGVjdGlvbkRlc2NyaXB0aW9uKG5hbWUsIHtcbiAgICAgIC4uLmpzb25WYWx1ZSxcbiAgICAgIHBhdGgsXG4gICAgfSk7XG4gICAgaWYgKCFkZXNjcmlwdGlvbiB8fCAhZGVzY3JpcHRpb24ubmFtZSkge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRDb2xsZWN0aW9uSnNvbkV4Y2VwdGlvbihuYW1lLCBwYXRoKTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBhbGlhc2VzLlxuICAgIGNvbnN0IGFsbE5hbWVzID0gT2JqZWN0LmtleXMoZGVzY3JpcHRpb24uc2NoZW1hdGljcyk7XG4gICAgZm9yIChjb25zdCBzY2hlbWF0aWNOYW1lIG9mIE9iamVjdC5rZXlzKGRlc2NyaXB0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICBjb25zdCBhbGlhc2VzID0gZGVzY3JpcHRpb24uc2NoZW1hdGljc1tzY2hlbWF0aWNOYW1lXS5hbGlhc2VzIHx8IFtdO1xuXG4gICAgICBmb3IgKGNvbnN0IGFsaWFzIG9mIGFsaWFzZXMpIHtcbiAgICAgICAgaWYgKGFsbE5hbWVzLmluZGV4T2YoYWxpYXMpICE9IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY05hbWVDb2xsaXNpb25FeGNlcHRpb24oYWxpYXMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGFsbE5hbWVzLnB1c2goLi4uYWxpYXNlcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc2NyaXB0aW9uO1xuICB9XG5cbiAgY3JlYXRlU2NoZW1hdGljRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgKTogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MgfCBudWxsIHtcbiAgICAvLyBSZXNvbHZlIGFsaWFzZXMgZmlyc3QuXG4gICAgZm9yIChjb25zdCBzY2hlbWF0aWNOYW1lIG9mIE9iamVjdC5rZXlzKGNvbGxlY3Rpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIGNvbnN0IHNjaGVtYXRpY0Rlc2NyaXB0aW9uID0gY29sbGVjdGlvbi5zY2hlbWF0aWNzW3NjaGVtYXRpY05hbWVdO1xuICAgICAgaWYgKHNjaGVtYXRpY0Rlc2NyaXB0aW9uLmFsaWFzZXMgJiYgc2NoZW1hdGljRGVzY3JpcHRpb24uYWxpYXNlcy5pbmRleE9mKG5hbWUpICE9IC0xKSB7XG4gICAgICAgIG5hbWUgPSBzY2hlbWF0aWNOYW1lO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIShuYW1lIGluIGNvbGxlY3Rpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbGxlY3Rpb25QYXRoID0gZGlybmFtZShjb2xsZWN0aW9uLnBhdGgpO1xuICAgIGNvbnN0IHBhcnRpYWxEZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjPiB8IG51bGwgPSBjb2xsZWN0aW9uLnNjaGVtYXRpY3NbbmFtZV07XG4gICAgaWYgKCFwYXJ0aWFsRGVzYykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHBhcnRpYWxEZXNjLmV4dGVuZHMpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gcGFydGlhbERlc2MuZXh0ZW5kcy5pbmRleE9mKCc6Jyk7XG4gICAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IGluZGV4ICE9PSAtMSA/IHBhcnRpYWxEZXNjLmV4dGVuZHMuc3Vic3RyKDAsIGluZGV4KSA6IG51bGw7XG4gICAgICBjb25zdCBzY2hlbWF0aWNOYW1lID0gaW5kZXggPT09IC0xID9cbiAgICAgICAgcGFydGlhbERlc2MuZXh0ZW5kcyA6IHBhcnRpYWxEZXNjLmV4dGVuZHMuc3Vic3RyKGluZGV4ICsgMSk7XG5cbiAgICAgIGlmIChjb2xsZWN0aW9uTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICBjb25zdCBleHRlbmRDb2xsZWN0aW9uID0gdGhpcy5jcmVhdGVDb2xsZWN0aW9uRGVzY3JpcHRpb24oY29sbGVjdGlvbk5hbWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVNjaGVtYXRpY0Rlc2NyaXB0aW9uKHNjaGVtYXRpY05hbWUsIGV4dGVuZENvbGxlY3Rpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU2NoZW1hdGljRGVzY3JpcHRpb24oc2NoZW1hdGljTmFtZSwgY29sbGVjdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFVzZSBhbnkgb24gdGhpcyByZWYgYXMgd2UgZG9uJ3QgaGF2ZSB0aGUgT3B0aW9uVCBoZXJlLCBidXQgd2UgZG9uJ3QgbmVlZCBpdCAod2Ugb25seSBuZWVkXG4gICAgLy8gdGhlIHBhdGgpLlxuICAgIGlmICghcGFydGlhbERlc2MuZmFjdG9yeSkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY01pc3NpbmdGYWN0b3J5RXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cbiAgICBjb25zdCByZXNvbHZlZFJlZiA9IHRoaXMuX3Jlc29sdmVSZWZlcmVuY2VTdHJpbmcocGFydGlhbERlc2MuZmFjdG9yeSwgY29sbGVjdGlvblBhdGgpO1xuICAgIGlmICghcmVzb2x2ZWRSZWYpIHtcbiAgICAgIHRocm93IG5ldyBGYWN0b3J5Q2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHBhdGggfSA9IHJlc29sdmVkUmVmO1xuICAgIGxldCBzY2hlbWEgPSBwYXJ0aWFsRGVzYy5zY2hlbWE7XG4gICAgbGV0IHNjaGVtYUpzb246IEpzb25PYmplY3QgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHNjaGVtYSkge1xuICAgICAgaWYgKCFpc0Fic29sdXRlKHNjaGVtYSkpIHtcbiAgICAgICAgc2NoZW1hID0gam9pbihjb2xsZWN0aW9uUGF0aCwgc2NoZW1hKTtcbiAgICAgIH1cbiAgICAgIHNjaGVtYUpzb24gPSByZWFkSnNvbkZpbGUoc2NoZW1hKSBhcyBKc29uT2JqZWN0O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl90cmFuc2Zvcm1TY2hlbWF0aWNEZXNjcmlwdGlvbihuYW1lLCBjb2xsZWN0aW9uLCB7XG4gICAgICAuLi5wYXJ0aWFsRGVzYyxcbiAgICAgIHNjaGVtYSxcbiAgICAgIHNjaGVtYUpzb24sXG4gICAgICBuYW1lLFxuICAgICAgcGF0aCxcbiAgICAgIGZhY3RvcnlGbjogcmVzb2x2ZWRSZWYucmVmLFxuICAgICAgY29sbGVjdGlvbixcbiAgICB9KTtcbiAgfVxuXG4gIGNyZWF0ZVNvdXJjZUZyb21VcmwodXJsOiBVcmwpOiBTb3VyY2UgfCBudWxsIHtcbiAgICBzd2l0Y2ggKHVybC5wcm90b2NvbCkge1xuICAgICAgY2FzZSBudWxsOlxuICAgICAgY2FzZSAnZmlsZTonOlxuICAgICAgICByZXR1cm4gKGNvbnRleHQ6IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgICAgICAgLy8gUmVzb2x2ZSBhbGwgZmlsZTovLy9hL2IvYy9kIGZyb20gdGhlIHNjaGVtYXRpYydzIG93biBwYXRoLCBhbmQgbm90IHRoZSBjdXJyZW50XG4gICAgICAgICAgLy8gcGF0aC5cbiAgICAgICAgICBjb25zdCByb290ID0gbm9ybWFsaXplKFxuICAgICAgICAgICAgcmVzb2x2ZShkaXJuYW1lKGNvbnRleHQuc2NoZW1hdGljLmRlc2NyaXB0aW9uLnBhdGgpLCB1cmwucGF0aCB8fCAnJyksXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiBuZXcgRmlsZVN5c3RlbUNyZWF0ZVRyZWUobmV3IHZpcnR1YWxGcy5TY29wZWRIb3N0KG5ldyBOb2RlSnNTeW5jSG9zdCgpLCByb290KSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB0cmFuc2Zvcm1PcHRpb25zPE9wdGlvblQgZXh0ZW5kcyBvYmplY3QsIFJlc3VsdFQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgIHNjaGVtYXRpYzogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MsXG4gICAgb3B0aW9uczogT3B0aW9uVCxcbiAgKTogT2JzZXJ2YWJsZTxSZXN1bHRUPiB7XG4gICAgcmV0dXJuIChvYnNlcnZhYmxlT2Yob3B0aW9ucylcbiAgICAgIC5waXBlKFxuICAgICAgICAuLi50aGlzLl90cmFuc2Zvcm1zLm1hcCh0Rm4gPT4gbWVyZ2VNYXAob3B0ID0+IHtcbiAgICAgICAgICBjb25zdCBuZXdPcHRpb25zID0gdEZuKHNjaGVtYXRpYywgb3B0KTtcbiAgICAgICAgICBpZiAoaXNPYnNlcnZhYmxlKG5ld09wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3T3B0aW9ucztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihuZXdPcHRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKSxcbiAgICAgICkpIGFzIHt9IGFzIE9ic2VydmFibGU8UmVzdWx0VD47XG4gIH1cblxuICB0cmFuc2Zvcm1Db250ZXh0KGNvbnRleHQ6IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0KTogRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQge1xuICAgIHJldHVybiBjb250ZXh0O1xuICB9XG5cbiAgZ2V0U2NoZW1hdGljUnVsZUZhY3Rvcnk8T3B0aW9uVCBleHRlbmRzIG9iamVjdD4oXG4gICAgc2NoZW1hdGljOiBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyxcbiAgICBfY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjKTogUnVsZUZhY3Rvcnk8T3B0aW9uVD4ge1xuICAgIHJldHVybiBzY2hlbWF0aWMuZmFjdG9yeUZuO1xuICB9XG5cbiAgcmVnaXN0ZXJUYXNrRXhlY3V0b3I8VD4oZmFjdG9yeTogVGFza0V4ZWN1dG9yRmFjdG9yeTxUPiwgb3B0aW9ucz86IFQpOiB2b2lkIHtcbiAgICB0aGlzLl90YXNrRmFjdG9yaWVzLnNldChmYWN0b3J5Lm5hbWUsICgpID0+IG9ic2VydmFibGVGcm9tKGZhY3RvcnkuY3JlYXRlKG9wdGlvbnMpKSk7XG4gIH1cblxuICBjcmVhdGVUYXNrRXhlY3V0b3IobmFtZTogc3RyaW5nKTogT2JzZXJ2YWJsZTxUYXNrRXhlY3V0b3I+IHtcbiAgICBjb25zdCBmYWN0b3J5ID0gdGhpcy5fdGFza0ZhY3Rvcmllcy5nZXQobmFtZSk7XG4gICAgaWYgKGZhY3RvcnkpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRocm93RXJyb3IobmV3IFVucmVnaXN0ZXJlZFRhc2tFeGNlcHRpb24obmFtZSkpO1xuICB9XG5cbiAgaGFzVGFza0V4ZWN1dG9yKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl90YXNrRmFjdG9yaWVzLmhhcyhuYW1lKTtcbiAgfVxufVxuIl19