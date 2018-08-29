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
const fs_1 = require("fs");
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
        let schema = partialDesc.schema;
        let schemaJson = undefined;
        if (schema) {
            if (!path_1.isAbsolute(schema)) {
                schema = path_1.join(collectionPath, schema);
            }
            schemaJson = file_system_utility_1.readJsonFile(schema);
        }
        // The schematic path is used to resolve URLs.
        // We should be able to just do `dirname(resolvedRef.path)` but for compatibility with
        // Bazel under Windows this directory needs to be resolved from the collection instead.
        // This is needed because on Bazel under Windows the data files (such as the collection or
        // url files) are not in the same place as the compiled JS.
        const maybePath = path_1.join(collectionPath, partialDesc.factory);
        const path = fs_1.existsSync(maybePath) && fs_1.statSync(maybePath).isDirectory()
            ? maybePath : path_1.dirname(maybePath);
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
                    const root = core_1.normalize(path_1.resolve(context.schematic.description.path, url.path || ''));
                    return new src_1.HostCreateTree(new core_1.virtualFs.ScopedHost(new node_1.NodeJsSyncHost(), root));
                };
        }
        return null;
    }
    transformOptions(schematic, options, context) {
        return (rxjs_1.of(options)
            .pipe(...this._transforms.map(tFn => operators_1.mergeMap(opt => {
            const newOptions = tFn(schematic, opt, context);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90b29scy9maWxlLXN5c3RlbS1lbmdpbmUtaG9zdC1iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBTThCO0FBQzlCLG9EQUEyRDtBQUMzRCwyQkFBMEM7QUFDMUMsK0JBQTBEO0FBQzFELCtCQUEwRjtBQUMxRiw4Q0FBMEM7QUFFMUMsZ0NBUWdCO0FBU2hCLCtEQUFxRDtBQVdyRCx5Q0FBaUQsU0FBUSxvQkFBYTtJQUNwRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGNBQWMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUNsRSxDQUFDO0NBQ0Y7QUFKRCxrRkFJQztBQUNELG9DQUE0QyxTQUFRLG9CQUFhO0lBQy9ELFlBQVksS0FBYSxFQUFFLElBQVk7UUFDckMsS0FBSyxDQUFDLDJCQUEyQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUN2RSxDQUFDO0NBQ0Y7QUFKRCx3RUFJQztBQUNELHNDQUE4QyxTQUFRLG9CQUFhO0lBQ2pFLFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsYUFBYSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0lBQ25FLENBQUM7Q0FDRjtBQUpELDRFQUlDO0FBQ0Qsc0NBQThDLFNBQVEsb0JBQWE7SUFDakUsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyxhQUFhLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUM7SUFDekUsQ0FBQztDQUNGO0FBSkQsNEVBSUM7QUFDRCw2Q0FBcUQsU0FBUSxvQkFBYTtJQUN4RSxZQUFZLElBQVksSUFBSSxLQUFLLENB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QUM7SUFDakIsQ0FBQztJQUVELHVCQUF1QixDQUNyQixTQUFrQyxFQUNsQyxXQUFxQztRQUNyQyxPQUFPLFNBQVMsQ0FBQyxTQUFTLENBQUM7SUFDN0IsQ0FBQztJQUVELG9CQUFvQixDQUFJLE9BQStCLEVBQUUsT0FBVztRQUNsRSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLFdBQWMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RixDQUFDO0lBRUQsa0JBQWtCLENBQUMsSUFBWTtRQUM3QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxJQUFJLE9BQU8sRUFBRTtZQUNYLE9BQU8sT0FBTyxFQUFFLENBQUM7U0FDbEI7UUFFRCxPQUFPLGlCQUFVLENBQUMsSUFBSSwrQkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxlQUFlLENBQUMsSUFBWTtRQUMxQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Q0FDRjtBQWhPRCw0REFnT0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1xuICBCYXNlRXhjZXB0aW9uLFxuICBKc29uT2JqZWN0LFxuICBpc09ic2VydmFibGUsXG4gIG5vcm1hbGl6ZSxcbiAgdmlydHVhbEZzLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBOb2RlSnNTeW5jSG9zdCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlL25vZGUnO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgc3RhdFN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBkaXJuYW1lLCBpc0Fic29sdXRlLCBqb2luLCByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBmcm9tIGFzIG9ic2VydmFibGVGcm9tLCBvZiBhcyBvYnNlcnZhYmxlT2YsIHRocm93RXJyb3IgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IG1lcmdlTWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSAndXJsJztcbmltcG9ydCB7XG4gIEVuZ2luZUhvc3QsXG4gIEhvc3RDcmVhdGVUcmVlLFxuICBSdWxlRmFjdG9yeSxcbiAgU291cmNlLFxuICBUYXNrRXhlY3V0b3IsXG4gIFRhc2tFeGVjdXRvckZhY3RvcnksXG4gIFVucmVnaXN0ZXJlZFRhc2tFeGNlcHRpb24sXG59IGZyb20gJy4uL3NyYyc7XG5pbXBvcnQge1xuICBGaWxlU3lzdGVtQ29sbGVjdGlvbixcbiAgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLFxuICBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2NyaXB0aW9uLFxuICBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCxcbiAgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MsXG4gIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbixcbn0gZnJvbSAnLi9kZXNjcmlwdGlvbic7XG5pbXBvcnQgeyByZWFkSnNvbkZpbGUgfSBmcm9tICcuL2ZpbGUtc3lzdGVtLXV0aWxpdHknO1xuXG5cbmV4cG9ydCBkZWNsYXJlIHR5cGUgT3B0aW9uVHJhbnNmb3JtPFQgZXh0ZW5kcyBvYmplY3QsIFIgZXh0ZW5kcyBvYmplY3Q+XG4gICAgPSAoXG4gICAgICBzY2hlbWF0aWM6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbixcbiAgICAgIG9wdGlvbnM6IFQsXG4gICAgICBjb250ZXh0PzogRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQsXG4gICAgKSA9PiBPYnNlcnZhYmxlPFI+O1xuXG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uQ2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgQ29sbGVjdGlvbiAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBjYW5ub3QgYmUgcmVzb2x2ZWQuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBJbnZhbGlkQ29sbGVjdGlvbkpzb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IoX25hbWU6IHN0cmluZywgcGF0aDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENvbGxlY3Rpb24gSlNPTiBhdCBwYXRoICR7SlNPTi5zdHJpbmdpZnkocGF0aCl9IGlzIGludmFsaWQuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNNaXNzaW5nRmFjdG9yeUV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgU2NoZW1hdGljICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGlzIG1pc3NpbmcgYSBmYWN0b3J5LmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRmFjdG9yeUNhbm5vdEJlUmVzb2x2ZWRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpYyAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBjYW5ub3QgcmVzb2x2ZSB0aGUgZmFjdG9yeS5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25NaXNzaW5nU2NoZW1hdGljc01hcEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYENvbGxlY3Rpb24gXCIke25hbWV9XCIgZG9lcyBub3QgaGF2ZSBhIHNjaGVtYXRpY3MgbWFwLmApOyB9XG59XG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbk1pc3NpbmdGaWVsZHNFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBDb2xsZWN0aW9uIFwiJHtuYW1lfVwiIGlzIG1pc3NpbmcgZmllbGRzLmApOyB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTWlzc2luZ0ZpZWxkc0V4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYFNjaGVtYXRpYyBcIiR7bmFtZX1cIiBpcyBtaXNzaW5nIGZpZWxkcy5gKTsgfVxufVxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY01pc3NpbmdEZXNjcmlwdGlvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYFNjaGVtYXRpY3MgXCIke25hbWV9XCIgZG9lcyBub3QgaGF2ZSBhIGRlc2NyaXB0aW9uLmApOyB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTmFtZUNvbGxpc2lvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgU2NoZW1hdGljcy9hbGlhcyAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBjb2xsaWRlcyB3aXRoIGFub3RoZXIgYWxpYXMgb3Igc2NoZW1hdGljYFxuICAgICAgICAgICsgJyBuYW1lLicpO1xuICB9XG59XG5cblxuLyoqXG4gKiBBIEVuZ2luZUhvc3QgYmFzZSBjbGFzcyB0aGF0IHVzZXMgdGhlIGZpbGUgc3lzdGVtIHRvIHJlc29sdmUgY29sbGVjdGlvbnMuIFRoaXMgaXMgdGhlIGJhc2Ugb2ZcbiAqIGFsbCBvdGhlciBFbmdpbmVIb3N0IHByb3ZpZGVkIGJ5IHRoZSB0b29saW5nIHBhcnQgb2YgdGhlIFNjaGVtYXRpY3MgbGlicmFyeS5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEZpbGVTeXN0ZW1FbmdpbmVIb3N0QmFzZSBpbXBsZW1lbnRzXG4gICAgRW5naW5lSG9zdDxGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2NyaXB0aW9uLCBGaWxlU3lzdGVtU2NoZW1hdGljRGVzY3JpcHRpb24+IHtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZTogc3RyaW5nKTogc3RyaW5nO1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgX3Jlc29sdmVSZWZlcmVuY2VTdHJpbmcoXG4gICAgICBuYW1lOiBzdHJpbmcsIHBhcmVudFBhdGg6IHN0cmluZyk6IHsgcmVmOiBSdWxlRmFjdG9yeTx7fT4sIHBhdGg6IHN0cmluZyB9IHwgbnVsbDtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF90cmFuc2Zvcm1Db2xsZWN0aW9uRGVzY3JpcHRpb24oXG4gICAgICBuYW1lOiBzdHJpbmcsIGRlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjPik6IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYztcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF90cmFuc2Zvcm1TY2hlbWF0aWNEZXNjcmlwdGlvbihcbiAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgIGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgICAgIGRlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M+KTogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M7XG5cbiAgcHJpdmF0ZSBfdHJhbnNmb3JtczogT3B0aW9uVHJhbnNmb3JtPHt9LCB7fT5bXSA9IFtdO1xuICBwcml2YXRlIF90YXNrRmFjdG9yaWVzID0gbmV3IE1hcDxzdHJpbmcsICgpID0+IE9ic2VydmFibGU8VGFza0V4ZWN1dG9yPj4oKTtcblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgVXNlIGBsaXN0U2NoZW1hdGljTmFtZXNgLlxuICAgKi9cbiAgbGlzdFNjaGVtYXRpY3MoY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb24pOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdFNjaGVtYXRpY05hbWVzKGNvbGxlY3Rpb24uZGVzY3JpcHRpb24pO1xuICB9XG4gIGxpc3RTY2hlbWF0aWNOYW1lcyhjb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MpIHtcbiAgICBjb25zdCBzY2hlbWF0aWNzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGNvbGxlY3Rpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIGNvbnN0IHNjaGVtYXRpYyA9IGNvbGxlY3Rpb24uc2NoZW1hdGljc1trZXldO1xuXG4gICAgICBpZiAoc2NoZW1hdGljLmhpZGRlbiB8fCBzY2hlbWF0aWMucHJpdmF0ZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgZXh0ZW5kcyBpcyBwcmVzZW50IHdpdGhvdXQgYSBmYWN0b3J5IGl0IGlzIGFuIGFsaWFzLCBkbyBub3QgcmV0dXJuIGl0XG4gICAgICAvLyAgIHVubGVzcyBpdCBpcyBmcm9tIGFub3RoZXIgY29sbGVjdGlvbi5cbiAgICAgIGlmICghc2NoZW1hdGljLmV4dGVuZHMgfHwgc2NoZW1hdGljLmZhY3RvcnkpIHtcbiAgICAgICAgc2NoZW1hdGljcy5wdXNoKGtleSk7XG4gICAgICB9IGVsc2UgaWYgKHNjaGVtYXRpYy5leHRlbmRzICYmIHNjaGVtYXRpYy5leHRlbmRzLmluZGV4T2YoJzonKSAhPT0gLTEpIHtcbiAgICAgICAgc2NoZW1hdGljcy5wdXNoKGtleSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjaGVtYXRpY3M7XG4gIH1cblxuICByZWdpc3Rlck9wdGlvbnNUcmFuc2Zvcm08VCBleHRlbmRzIG9iamVjdCwgUiBleHRlbmRzIG9iamVjdD4odDogT3B0aW9uVHJhbnNmb3JtPFQsIFI+KSB7XG4gICAgdGhpcy5fdHJhbnNmb3Jtcy5wdXNoKHQpO1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lXG4gICAqIEByZXR1cm4ge3twYXRoOiBzdHJpbmd9fVxuICAgKi9cbiAgY3JlYXRlQ29sbGVjdGlvbkRlc2NyaXB0aW9uKG5hbWU6IHN0cmluZyk6IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyB7XG4gICAgY29uc3QgcGF0aCA9IHRoaXMuX3Jlc29sdmVDb2xsZWN0aW9uUGF0aChuYW1lKTtcbiAgICBjb25zdCBqc29uVmFsdWUgPSByZWFkSnNvbkZpbGUocGF0aCk7XG4gICAgaWYgKCFqc29uVmFsdWUgfHwgdHlwZW9mIGpzb25WYWx1ZSAhPSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KGpzb25WYWx1ZSkpIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkQ29sbGVjdGlvbkpzb25FeGNlcHRpb24obmFtZSwgcGF0aCk7XG4gICAgfVxuXG4gICAgLy8gbm9ybWFsaXplIGV4dGVuZHMgcHJvcGVydHkgdG8gYW4gYXJyYXlcbiAgICBpZiAodHlwZW9mIGpzb25WYWx1ZVsnZXh0ZW5kcyddID09PSAnc3RyaW5nJykge1xuICAgICAganNvblZhbHVlWydleHRlbmRzJ10gPSBbanNvblZhbHVlWydleHRlbmRzJ11dO1xuICAgIH1cblxuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGhpcy5fdHJhbnNmb3JtQ29sbGVjdGlvbkRlc2NyaXB0aW9uKG5hbWUsIHtcbiAgICAgIC4uLmpzb25WYWx1ZSxcbiAgICAgIHBhdGgsXG4gICAgfSk7XG4gICAgaWYgKCFkZXNjcmlwdGlvbiB8fCAhZGVzY3JpcHRpb24ubmFtZSkge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRDb2xsZWN0aW9uSnNvbkV4Y2VwdGlvbihuYW1lLCBwYXRoKTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBhbGlhc2VzLlxuICAgIGNvbnN0IGFsbE5hbWVzID0gT2JqZWN0LmtleXMoZGVzY3JpcHRpb24uc2NoZW1hdGljcyk7XG4gICAgZm9yIChjb25zdCBzY2hlbWF0aWNOYW1lIG9mIE9iamVjdC5rZXlzKGRlc2NyaXB0aW9uLnNjaGVtYXRpY3MpKSB7XG4gICAgICBjb25zdCBhbGlhc2VzID0gZGVzY3JpcHRpb24uc2NoZW1hdGljc1tzY2hlbWF0aWNOYW1lXS5hbGlhc2VzIHx8IFtdO1xuXG4gICAgICBmb3IgKGNvbnN0IGFsaWFzIG9mIGFsaWFzZXMpIHtcbiAgICAgICAgaWYgKGFsbE5hbWVzLmluZGV4T2YoYWxpYXMpICE9IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY05hbWVDb2xsaXNpb25FeGNlcHRpb24oYWxpYXMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGFsbE5hbWVzLnB1c2goLi4uYWxpYXNlcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc2NyaXB0aW9uO1xuICB9XG5cbiAgY3JlYXRlU2NoZW1hdGljRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgKTogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MgfCBudWxsIHtcbiAgICAvLyBSZXNvbHZlIGFsaWFzZXMgZmlyc3QuXG4gICAgZm9yIChjb25zdCBzY2hlbWF0aWNOYW1lIG9mIE9iamVjdC5rZXlzKGNvbGxlY3Rpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIGNvbnN0IHNjaGVtYXRpY0Rlc2NyaXB0aW9uID0gY29sbGVjdGlvbi5zY2hlbWF0aWNzW3NjaGVtYXRpY05hbWVdO1xuICAgICAgaWYgKHNjaGVtYXRpY0Rlc2NyaXB0aW9uLmFsaWFzZXMgJiYgc2NoZW1hdGljRGVzY3JpcHRpb24uYWxpYXNlcy5pbmRleE9mKG5hbWUpICE9IC0xKSB7XG4gICAgICAgIG5hbWUgPSBzY2hlbWF0aWNOYW1lO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIShuYW1lIGluIGNvbGxlY3Rpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbGxlY3Rpb25QYXRoID0gZGlybmFtZShjb2xsZWN0aW9uLnBhdGgpO1xuICAgIGNvbnN0IHBhcnRpYWxEZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjPiB8IG51bGwgPSBjb2xsZWN0aW9uLnNjaGVtYXRpY3NbbmFtZV07XG4gICAgaWYgKCFwYXJ0aWFsRGVzYykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHBhcnRpYWxEZXNjLmV4dGVuZHMpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gcGFydGlhbERlc2MuZXh0ZW5kcy5pbmRleE9mKCc6Jyk7XG4gICAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IGluZGV4ICE9PSAtMSA/IHBhcnRpYWxEZXNjLmV4dGVuZHMuc3Vic3RyKDAsIGluZGV4KSA6IG51bGw7XG4gICAgICBjb25zdCBzY2hlbWF0aWNOYW1lID0gaW5kZXggPT09IC0xID9cbiAgICAgICAgcGFydGlhbERlc2MuZXh0ZW5kcyA6IHBhcnRpYWxEZXNjLmV4dGVuZHMuc3Vic3RyKGluZGV4ICsgMSk7XG5cbiAgICAgIGlmIChjb2xsZWN0aW9uTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICBjb25zdCBleHRlbmRDb2xsZWN0aW9uID0gdGhpcy5jcmVhdGVDb2xsZWN0aW9uRGVzY3JpcHRpb24oY29sbGVjdGlvbk5hbWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVNjaGVtYXRpY0Rlc2NyaXB0aW9uKHNjaGVtYXRpY05hbWUsIGV4dGVuZENvbGxlY3Rpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU2NoZW1hdGljRGVzY3JpcHRpb24oc2NoZW1hdGljTmFtZSwgY29sbGVjdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFVzZSBhbnkgb24gdGhpcyByZWYgYXMgd2UgZG9uJ3QgaGF2ZSB0aGUgT3B0aW9uVCBoZXJlLCBidXQgd2UgZG9uJ3QgbmVlZCBpdCAod2Ugb25seSBuZWVkXG4gICAgLy8gdGhlIHBhdGgpLlxuICAgIGlmICghcGFydGlhbERlc2MuZmFjdG9yeSkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY01pc3NpbmdGYWN0b3J5RXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cbiAgICBjb25zdCByZXNvbHZlZFJlZiA9IHRoaXMuX3Jlc29sdmVSZWZlcmVuY2VTdHJpbmcocGFydGlhbERlc2MuZmFjdG9yeSwgY29sbGVjdGlvblBhdGgpO1xuICAgIGlmICghcmVzb2x2ZWRSZWYpIHtcbiAgICAgIHRocm93IG5ldyBGYWN0b3J5Q2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG5cbiAgICBsZXQgc2NoZW1hID0gcGFydGlhbERlc2Muc2NoZW1hO1xuICAgIGxldCBzY2hlbWFKc29uOiBKc29uT2JqZWN0IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGlmIChzY2hlbWEpIHtcbiAgICAgIGlmICghaXNBYnNvbHV0ZShzY2hlbWEpKSB7XG4gICAgICAgIHNjaGVtYSA9IGpvaW4oY29sbGVjdGlvblBhdGgsIHNjaGVtYSk7XG4gICAgICB9XG4gICAgICBzY2hlbWFKc29uID0gcmVhZEpzb25GaWxlKHNjaGVtYSkgYXMgSnNvbk9iamVjdDtcbiAgICB9XG5cbiAgICAvLyBUaGUgc2NoZW1hdGljIHBhdGggaXMgdXNlZCB0byByZXNvbHZlIFVSTHMuXG4gICAgLy8gV2Ugc2hvdWxkIGJlIGFibGUgdG8ganVzdCBkbyBgZGlybmFtZShyZXNvbHZlZFJlZi5wYXRoKWAgYnV0IGZvciBjb21wYXRpYmlsaXR5IHdpdGhcbiAgICAvLyBCYXplbCB1bmRlciBXaW5kb3dzIHRoaXMgZGlyZWN0b3J5IG5lZWRzIHRvIGJlIHJlc29sdmVkIGZyb20gdGhlIGNvbGxlY3Rpb24gaW5zdGVhZC5cbiAgICAvLyBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIG9uIEJhemVsIHVuZGVyIFdpbmRvd3MgdGhlIGRhdGEgZmlsZXMgKHN1Y2ggYXMgdGhlIGNvbGxlY3Rpb24gb3JcbiAgICAvLyB1cmwgZmlsZXMpIGFyZSBub3QgaW4gdGhlIHNhbWUgcGxhY2UgYXMgdGhlIGNvbXBpbGVkIEpTLlxuICAgIGNvbnN0IG1heWJlUGF0aCA9IGpvaW4oY29sbGVjdGlvblBhdGgsIHBhcnRpYWxEZXNjLmZhY3RvcnkpO1xuICAgIGNvbnN0IHBhdGggPSBleGlzdHNTeW5jKG1heWJlUGF0aCkgJiYgc3RhdFN5bmMobWF5YmVQYXRoKS5pc0RpcmVjdG9yeSgpXG4gICAgICA/IG1heWJlUGF0aCA6IGRpcm5hbWUobWF5YmVQYXRoKTtcblxuICAgIHJldHVybiB0aGlzLl90cmFuc2Zvcm1TY2hlbWF0aWNEZXNjcmlwdGlvbihuYW1lLCBjb2xsZWN0aW9uLCB7XG4gICAgICAuLi5wYXJ0aWFsRGVzYyxcbiAgICAgIHNjaGVtYSxcbiAgICAgIHNjaGVtYUpzb24sXG4gICAgICBuYW1lLFxuICAgICAgcGF0aCxcbiAgICAgIGZhY3RvcnlGbjogcmVzb2x2ZWRSZWYucmVmLFxuICAgICAgY29sbGVjdGlvbixcbiAgICB9KTtcbiAgfVxuXG4gIGNyZWF0ZVNvdXJjZUZyb21VcmwodXJsOiBVcmwpOiBTb3VyY2UgfCBudWxsIHtcbiAgICBzd2l0Y2ggKHVybC5wcm90b2NvbCkge1xuICAgICAgY2FzZSBudWxsOlxuICAgICAgY2FzZSAnZmlsZTonOlxuICAgICAgICByZXR1cm4gKGNvbnRleHQ6IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgICAgICAgLy8gUmVzb2x2ZSBhbGwgZmlsZTovLy9hL2IvYy9kIGZyb20gdGhlIHNjaGVtYXRpYydzIG93biBwYXRoLCBhbmQgbm90IHRoZSBjdXJyZW50XG4gICAgICAgICAgLy8gcGF0aC5cbiAgICAgICAgICBjb25zdCByb290ID0gbm9ybWFsaXplKHJlc29sdmUoY29udGV4dC5zY2hlbWF0aWMuZGVzY3JpcHRpb24ucGF0aCwgdXJsLnBhdGggfHwgJycpKTtcblxuICAgICAgICAgIHJldHVybiBuZXcgSG9zdENyZWF0ZVRyZWUobmV3IHZpcnR1YWxGcy5TY29wZWRIb3N0KG5ldyBOb2RlSnNTeW5jSG9zdCgpLCByb290KSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB0cmFuc2Zvcm1PcHRpb25zPE9wdGlvblQgZXh0ZW5kcyBvYmplY3QsIFJlc3VsdFQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgIHNjaGVtYXRpYzogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MsXG4gICAgb3B0aW9uczogT3B0aW9uVCxcbiAgICBjb250ZXh0PzogRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQsXG4gICk6IE9ic2VydmFibGU8UmVzdWx0VD4ge1xuICAgIHJldHVybiAob2JzZXJ2YWJsZU9mKG9wdGlvbnMpXG4gICAgICAucGlwZShcbiAgICAgICAgLi4udGhpcy5fdHJhbnNmb3Jtcy5tYXAodEZuID0+IG1lcmdlTWFwKG9wdCA9PiB7XG4gICAgICAgICAgY29uc3QgbmV3T3B0aW9ucyA9IHRGbihzY2hlbWF0aWMsIG9wdCwgY29udGV4dCk7XG4gICAgICAgICAgaWYgKGlzT2JzZXJ2YWJsZShuZXdPcHRpb25zKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ld09wdGlvbnM7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YobmV3T3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KSksXG4gICAgICApKSBhcyB7fSBhcyBPYnNlcnZhYmxlPFJlc3VsdFQ+O1xuICB9XG5cbiAgdHJhbnNmb3JtQ29udGV4dChjb250ZXh0OiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCk6IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0IHtcbiAgICByZXR1cm4gY29udGV4dDtcbiAgfVxuXG4gIGdldFNjaGVtYXRpY1J1bGVGYWN0b3J5PE9wdGlvblQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgIHNjaGVtYXRpYzogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MsXG4gICAgX2NvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyk6IFJ1bGVGYWN0b3J5PE9wdGlvblQ+IHtcbiAgICByZXR1cm4gc2NoZW1hdGljLmZhY3RvcnlGbjtcbiAgfVxuXG4gIHJlZ2lzdGVyVGFza0V4ZWN1dG9yPFQ+KGZhY3Rvcnk6IFRhc2tFeGVjdXRvckZhY3Rvcnk8VD4sIG9wdGlvbnM/OiBUKTogdm9pZCB7XG4gICAgdGhpcy5fdGFza0ZhY3Rvcmllcy5zZXQoZmFjdG9yeS5uYW1lLCAoKSA9PiBvYnNlcnZhYmxlRnJvbShmYWN0b3J5LmNyZWF0ZShvcHRpb25zKSkpO1xuICB9XG5cbiAgY3JlYXRlVGFza0V4ZWN1dG9yKG5hbWU6IHN0cmluZyk6IE9ic2VydmFibGU8VGFza0V4ZWN1dG9yPiB7XG4gICAgY29uc3QgZmFjdG9yeSA9IHRoaXMuX3Rhc2tGYWN0b3JpZXMuZ2V0KG5hbWUpO1xuICAgIGlmIChmYWN0b3J5KSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aHJvd0Vycm9yKG5ldyBVbnJlZ2lzdGVyZWRUYXNrRXhjZXB0aW9uKG5hbWUpKTtcbiAgfVxuXG4gIGhhc1Rhc2tFeGVjdXRvcihuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fdGFza0ZhY3Rvcmllcy5oYXMobmFtZSk7XG4gIH1cbn1cbiJdfQ==