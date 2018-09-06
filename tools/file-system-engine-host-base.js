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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90b29scy9maWxlLXN5c3RlbS1lbmdpbmUtaG9zdC1iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBUThCO0FBQzlCLG9EQUEyRDtBQUMzRCwyQkFBMEM7QUFDMUMsK0JBQTBEO0FBQzFELCtCQUEwRjtBQUMxRiw4Q0FBMEM7QUFFMUMsZ0NBUWdCO0FBU2hCLCtEQUFxRDtBQVdyRCxNQUFhLG1DQUFvQyxTQUFRLG9CQUFhO0lBQ3BFLFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsY0FBYyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7Q0FDRjtBQUpELGtGQUlDO0FBQ0QsTUFBYSw4QkFBK0IsU0FBUSxvQkFBYTtJQUMvRCxZQUNFLEtBQWEsRUFDYixJQUFZLEVBQ1osYUFBNkU7UUFFN0UsSUFBSSxHQUFHLEdBQUcsMkJBQTJCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUV4RSxJQUFJLGFBQWEsRUFBRTtZQUNqQixHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ3pDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsQ0FBQztDQUNGO0FBZEQsd0VBY0M7QUFDRCxNQUFhLGdDQUFpQyxTQUFRLG9CQUFhO0lBQ2pFLFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsYUFBYSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0lBQ25FLENBQUM7Q0FDRjtBQUpELDRFQUlDO0FBQ0QsTUFBYSxnQ0FBaUMsU0FBUSxvQkFBYTtJQUNqRSxZQUFZLElBQVk7UUFD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QUMsVUFBVSxDQUFDLEVBQUU7Z0JBQzVCLE9BQU8sVUFBVSxDQUFDO2FBQ25CO2lCQUFNO2dCQUNMLE9BQU8sU0FBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ2pDO1FBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FDSixDQUE4QixDQUFDO0lBQ3BDLENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxPQUFtQztRQUNsRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRUQsdUJBQXVCLENBQ3JCLFNBQWtDLEVBQ2xDLFdBQXFDO1FBQ3JDLE9BQU8sU0FBUyxDQUFDLFNBQVMsQ0FBQztJQUM3QixDQUFDO0lBRUQsb0JBQW9CLENBQUksT0FBK0IsRUFBRSxPQUFXO1FBQ2xFLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsV0FBYyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7SUFFRCxrQkFBa0IsQ0FBQyxJQUFZO1FBQzdCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlDLElBQUksT0FBTyxFQUFFO1lBQ1gsT0FBTyxPQUFPLEVBQUUsQ0FBQztTQUNsQjtRQUVELE9BQU8saUJBQVUsQ0FBQyxJQUFJLCtCQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELGVBQWUsQ0FBQyxJQUFZO1FBQzFCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztDQUNGO0FBaE9ELDREQWdPQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7XG4gIEJhc2VFeGNlcHRpb24sXG4gIEludmFsaWRKc29uQ2hhcmFjdGVyRXhjZXB0aW9uLFxuICBKc29uT2JqZWN0LFxuICBVbmV4cGVjdGVkRW5kT2ZJbnB1dEV4Y2VwdGlvbixcbiAgaXNPYnNlcnZhYmxlLFxuICBub3JtYWxpemUsXG4gIHZpcnR1YWxGcyxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgTm9kZUpzU3luY0hvc3QgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9ub2RlJztcbmltcG9ydCB7IGV4aXN0c1N5bmMsIHN0YXRTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgZGlybmFtZSwgaXNBYnNvbHV0ZSwgam9pbiwgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgZnJvbSBhcyBvYnNlcnZhYmxlRnJvbSwgb2YgYXMgb2JzZXJ2YWJsZU9mLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBtZXJnZU1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IFVybCB9IGZyb20gJ3VybCc7XG5pbXBvcnQge1xuICBFbmdpbmVIb3N0LFxuICBIb3N0Q3JlYXRlVHJlZSxcbiAgUnVsZUZhY3RvcnksXG4gIFNvdXJjZSxcbiAgVGFza0V4ZWN1dG9yLFxuICBUYXNrRXhlY3V0b3JGYWN0b3J5LFxuICBVbnJlZ2lzdGVyZWRUYXNrRXhjZXB0aW9uLFxufSBmcm9tICcuLi9zcmMnO1xuaW1wb3J0IHtcbiAgRmlsZVN5c3RlbUNvbGxlY3Rpb24sXG4gIEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjcmlwdGlvbixcbiAgRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQsXG4gIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjLFxuICBGaWxlU3lzdGVtU2NoZW1hdGljRGVzY3JpcHRpb24sXG59IGZyb20gJy4vZGVzY3JpcHRpb24nO1xuaW1wb3J0IHsgcmVhZEpzb25GaWxlIH0gZnJvbSAnLi9maWxlLXN5c3RlbS11dGlsaXR5JztcblxuXG5leHBvcnQgZGVjbGFyZSB0eXBlIE9wdGlvblRyYW5zZm9ybTxUIGV4dGVuZHMgb2JqZWN0LCBSIGV4dGVuZHMgb2JqZWN0PlxuICAgID0gKFxuICAgICAgc2NoZW1hdGljOiBGaWxlU3lzdGVtU2NoZW1hdGljRGVzY3JpcHRpb24sXG4gICAgICBvcHRpb25zOiBULFxuICAgICAgY29udGV4dD86IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0LFxuICAgICkgPT4gT2JzZXJ2YWJsZTxSPjtcblxuXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbkNhbm5vdEJlUmVzb2x2ZWRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENvbGxlY3Rpb24gJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gY2Fubm90IGJlIHJlc29sdmVkLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgSW52YWxpZENvbGxlY3Rpb25Kc29uRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIF9uYW1lOiBzdHJpbmcsXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGpzb25FeGNlcHRpb24/OiBVbmV4cGVjdGVkRW5kT2ZJbnB1dEV4Y2VwdGlvbiB8IEludmFsaWRKc29uQ2hhcmFjdGVyRXhjZXB0aW9uLFxuICApIHtcbiAgICBsZXQgbXNnID0gYENvbGxlY3Rpb24gSlNPTiBhdCBwYXRoICR7SlNPTi5zdHJpbmdpZnkocGF0aCl9IGlzIGludmFsaWQuYDtcblxuICAgIGlmIChqc29uRXhjZXB0aW9uKSB7XG4gICAgICBtc2cgPSBgJHttc2d9ICR7anNvbkV4Y2VwdGlvbi5tZXNzYWdlfWA7XG4gICAgfVxuXG4gICAgc3VwZXIobXNnKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY01pc3NpbmdGYWN0b3J5RXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBTY2hlbWF0aWMgJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gaXMgbWlzc2luZyBhIGZhY3RvcnkuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBGYWN0b3J5Q2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgU2NoZW1hdGljICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGNhbm5vdCByZXNvbHZlIHRoZSBmYWN0b3J5LmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbk1pc3NpbmdTY2hlbWF0aWNzTWFwRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykgeyBzdXBlcihgQ29sbGVjdGlvbiBcIiR7bmFtZX1cIiBkb2VzIG5vdCBoYXZlIGEgc2NoZW1hdGljcyBtYXAuYCk7IH1cbn1cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uTWlzc2luZ0ZpZWxkc0V4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYENvbGxlY3Rpb24gXCIke25hbWV9XCIgaXMgbWlzc2luZyBmaWVsZHMuYCk7IH1cbn1cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNNaXNzaW5nRmllbGRzRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykgeyBzdXBlcihgU2NoZW1hdGljIFwiJHtuYW1lfVwiIGlzIG1pc3NpbmcgZmllbGRzLmApOyB9XG59XG5leHBvcnQgY2xhc3MgU2NoZW1hdGljTWlzc2luZ0Rlc2NyaXB0aW9uRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykgeyBzdXBlcihgU2NoZW1hdGljcyBcIiR7bmFtZX1cIiBkb2VzIG5vdCBoYXZlIGEgZGVzY3JpcHRpb24uYCk7IH1cbn1cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNOYW1lQ29sbGlzaW9uRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBTY2hlbWF0aWNzL2FsaWFzICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGNvbGxpZGVzIHdpdGggYW5vdGhlciBhbGlhcyBvciBzY2hlbWF0aWNgXG4gICAgICAgICAgKyAnIG5hbWUuJyk7XG4gIH1cbn1cblxuXG4vKipcbiAqIEEgRW5naW5lSG9zdCBiYXNlIGNsYXNzIHRoYXQgdXNlcyB0aGUgZmlsZSBzeXN0ZW0gdG8gcmVzb2x2ZSBjb2xsZWN0aW9ucy4gVGhpcyBpcyB0aGUgYmFzZSBvZlxuICogYWxsIG90aGVyIEVuZ2luZUhvc3QgcHJvdmlkZWQgYnkgdGhlIHRvb2xpbmcgcGFydCBvZiB0aGUgU2NoZW1hdGljcyBsaWJyYXJ5LlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRmlsZVN5c3RlbUVuZ2luZUhvc3RCYXNlIGltcGxlbWVudHNcbiAgICBFbmdpbmVIb3N0PEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzY3JpcHRpb24sIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbj4ge1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgX3Jlc29sdmVDb2xsZWN0aW9uUGF0aChuYW1lOiBzdHJpbmcpOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBfcmVzb2x2ZVJlZmVyZW5jZVN0cmluZyhcbiAgICAgIG5hbWU6IHN0cmluZywgcGFyZW50UGF0aDogc3RyaW5nKTogeyByZWY6IFJ1bGVGYWN0b3J5PHt9PiwgcGF0aDogc3RyaW5nIH0gfCBudWxsO1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgX3RyYW5zZm9ybUNvbGxlY3Rpb25EZXNjcmlwdGlvbihcbiAgICAgIG5hbWU6IHN0cmluZywgZGVzYzogUGFydGlhbDxGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2M+KTogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjO1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgX3RyYW5zZm9ybVNjaGVtYXRpY0Rlc2NyaXB0aW9uKFxuICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLFxuICAgICAgZGVzYzogUGFydGlhbDxGaWxlU3lzdGVtU2NoZW1hdGljRGVzYz4pOiBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYztcblxuICBwcml2YXRlIF90cmFuc2Zvcm1zOiBPcHRpb25UcmFuc2Zvcm08e30sIHt9PltdID0gW107XG4gIHByaXZhdGUgX3Rhc2tGYWN0b3JpZXMgPSBuZXcgTWFwPHN0cmluZywgKCkgPT4gT2JzZXJ2YWJsZTxUYXNrRXhlY3V0b3I+PigpO1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBVc2UgYGxpc3RTY2hlbWF0aWNOYW1lc2AuXG4gICAqL1xuICBsaXN0U2NoZW1hdGljcyhjb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbik6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5saXN0U2NoZW1hdGljTmFtZXMoY29sbGVjdGlvbi5kZXNjcmlwdGlvbik7XG4gIH1cbiAgbGlzdFNjaGVtYXRpY05hbWVzKGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYykge1xuICAgIGNvbnN0IHNjaGVtYXRpY3M6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoY29sbGVjdGlvbi5zY2hlbWF0aWNzKSkge1xuICAgICAgY29uc3Qgc2NoZW1hdGljID0gY29sbGVjdGlvbi5zY2hlbWF0aWNzW2tleV07XG5cbiAgICAgIGlmIChzY2hlbWF0aWMuaGlkZGVuIHx8IHNjaGVtYXRpYy5wcml2YXRlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBleHRlbmRzIGlzIHByZXNlbnQgd2l0aG91dCBhIGZhY3RvcnkgaXQgaXMgYW4gYWxpYXMsIGRvIG5vdCByZXR1cm4gaXRcbiAgICAgIC8vICAgdW5sZXNzIGl0IGlzIGZyb20gYW5vdGhlciBjb2xsZWN0aW9uLlxuICAgICAgaWYgKCFzY2hlbWF0aWMuZXh0ZW5kcyB8fCBzY2hlbWF0aWMuZmFjdG9yeSkge1xuICAgICAgICBzY2hlbWF0aWNzLnB1c2goa2V5KTtcbiAgICAgIH0gZWxzZSBpZiAoc2NoZW1hdGljLmV4dGVuZHMgJiYgc2NoZW1hdGljLmV4dGVuZHMuaW5kZXhPZignOicpICE9PSAtMSkge1xuICAgICAgICBzY2hlbWF0aWNzLnB1c2goa2V5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2NoZW1hdGljcztcbiAgfVxuXG4gIHJlZ2lzdGVyT3B0aW9uc1RyYW5zZm9ybTxUIGV4dGVuZHMgb2JqZWN0LCBSIGV4dGVuZHMgb2JqZWN0Pih0OiBPcHRpb25UcmFuc2Zvcm08VCwgUj4pIHtcbiAgICB0aGlzLl90cmFuc2Zvcm1zLnB1c2godCk7XG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIG5hbWVcbiAgICogQHJldHVybiB7e3BhdGg6IHN0cmluZ319XG4gICAqL1xuICBjcmVhdGVDb2xsZWN0aW9uRGVzY3JpcHRpb24obmFtZTogc3RyaW5nKTogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjIHtcbiAgICBjb25zdCBwYXRoID0gdGhpcy5fcmVzb2x2ZUNvbGxlY3Rpb25QYXRoKG5hbWUpO1xuICAgIGNvbnN0IGpzb25WYWx1ZSA9IHJlYWRKc29uRmlsZShwYXRoKTtcbiAgICBpZiAoIWpzb25WYWx1ZSB8fCB0eXBlb2YganNvblZhbHVlICE9ICdvYmplY3QnIHx8IEFycmF5LmlzQXJyYXkoanNvblZhbHVlKSkge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRDb2xsZWN0aW9uSnNvbkV4Y2VwdGlvbihuYW1lLCBwYXRoKTtcbiAgICB9XG5cbiAgICAvLyBub3JtYWxpemUgZXh0ZW5kcyBwcm9wZXJ0eSB0byBhbiBhcnJheVxuICAgIGlmICh0eXBlb2YganNvblZhbHVlWydleHRlbmRzJ10gPT09ICdzdHJpbmcnKSB7XG4gICAgICBqc29uVmFsdWVbJ2V4dGVuZHMnXSA9IFtqc29uVmFsdWVbJ2V4dGVuZHMnXV07XG4gICAgfVxuXG4gICAgY29uc3QgZGVzY3JpcHRpb24gPSB0aGlzLl90cmFuc2Zvcm1Db2xsZWN0aW9uRGVzY3JpcHRpb24obmFtZSwge1xuICAgICAgLi4uanNvblZhbHVlLFxuICAgICAgcGF0aCxcbiAgICB9KTtcbiAgICBpZiAoIWRlc2NyaXB0aW9uIHx8ICFkZXNjcmlwdGlvbi5uYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZENvbGxlY3Rpb25Kc29uRXhjZXB0aW9uKG5hbWUsIHBhdGgpO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIGFsaWFzZXMuXG4gICAgY29uc3QgYWxsTmFtZXMgPSBPYmplY3Qua2V5cyhkZXNjcmlwdGlvbi5zY2hlbWF0aWNzKTtcbiAgICBmb3IgKGNvbnN0IHNjaGVtYXRpY05hbWUgb2YgT2JqZWN0LmtleXMoZGVzY3JpcHRpb24uc2NoZW1hdGljcykpIHtcbiAgICAgIGNvbnN0IGFsaWFzZXMgPSBkZXNjcmlwdGlvbi5zY2hlbWF0aWNzW3NjaGVtYXRpY05hbWVdLmFsaWFzZXMgfHwgW107XG5cbiAgICAgIGZvciAoY29uc3QgYWxpYXMgb2YgYWxpYXNlcykge1xuICAgICAgICBpZiAoYWxsTmFtZXMuaW5kZXhPZihhbGlhcykgIT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgU2NoZW1hdGljTmFtZUNvbGxpc2lvbkV4Y2VwdGlvbihhbGlhcyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYWxsTmFtZXMucHVzaCguLi5hbGlhc2VzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVzY3JpcHRpb247XG4gIH1cblxuICBjcmVhdGVTY2hlbWF0aWNEZXNjcmlwdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLFxuICApOiBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyB8IG51bGwge1xuICAgIC8vIFJlc29sdmUgYWxpYXNlcyBmaXJzdC5cbiAgICBmb3IgKGNvbnN0IHNjaGVtYXRpY05hbWUgb2YgT2JqZWN0LmtleXMoY29sbGVjdGlvbi5zY2hlbWF0aWNzKSkge1xuICAgICAgY29uc3Qgc2NoZW1hdGljRGVzY3JpcHRpb24gPSBjb2xsZWN0aW9uLnNjaGVtYXRpY3Nbc2NoZW1hdGljTmFtZV07XG4gICAgICBpZiAoc2NoZW1hdGljRGVzY3JpcHRpb24uYWxpYXNlcyAmJiBzY2hlbWF0aWNEZXNjcmlwdGlvbi5hbGlhc2VzLmluZGV4T2YobmFtZSkgIT0gLTEpIHtcbiAgICAgICAgbmFtZSA9IHNjaGVtYXRpY05hbWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghKG5hbWUgaW4gY29sbGVjdGlvbi5zY2hlbWF0aWNzKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgY29sbGVjdGlvblBhdGggPSBkaXJuYW1lKGNvbGxlY3Rpb24ucGF0aCk7XG4gICAgY29uc3QgcGFydGlhbERlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M+IHwgbnVsbCA9IGNvbGxlY3Rpb24uc2NoZW1hdGljc1tuYW1lXTtcbiAgICBpZiAoIXBhcnRpYWxEZXNjKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAocGFydGlhbERlc2MuZXh0ZW5kcykge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJ0aWFsRGVzYy5leHRlbmRzLmluZGV4T2YoJzonKTtcbiAgICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gaW5kZXggIT09IC0xID8gcGFydGlhbERlc2MuZXh0ZW5kcy5zdWJzdHIoMCwgaW5kZXgpIDogbnVsbDtcbiAgICAgIGNvbnN0IHNjaGVtYXRpY05hbWUgPSBpbmRleCA9PT0gLTEgP1xuICAgICAgICBwYXJ0aWFsRGVzYy5leHRlbmRzIDogcGFydGlhbERlc2MuZXh0ZW5kcy5zdWJzdHIoaW5kZXggKyAxKTtcblxuICAgICAgaWYgKGNvbGxlY3Rpb25OYW1lICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGV4dGVuZENvbGxlY3Rpb24gPSB0aGlzLmNyZWF0ZUNvbGxlY3Rpb25EZXNjcmlwdGlvbihjb2xsZWN0aW9uTmFtZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU2NoZW1hdGljRGVzY3JpcHRpb24oc2NoZW1hdGljTmFtZSwgZXh0ZW5kQ29sbGVjdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTY2hlbWF0aWNEZXNjcmlwdGlvbihzY2hlbWF0aWNOYW1lLCBjb2xsZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gVXNlIGFueSBvbiB0aGlzIHJlZiBhcyB3ZSBkb24ndCBoYXZlIHRoZSBPcHRpb25UIGhlcmUsIGJ1dCB3ZSBkb24ndCBuZWVkIGl0ICh3ZSBvbmx5IG5lZWRcbiAgICAvLyB0aGUgcGF0aCkuXG4gICAgaWYgKCFwYXJ0aWFsRGVzYy5mYWN0b3J5KSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljTWlzc2luZ0ZhY3RvcnlFeGNlcHRpb24obmFtZSk7XG4gICAgfVxuICAgIGNvbnN0IHJlc29sdmVkUmVmID0gdGhpcy5fcmVzb2x2ZVJlZmVyZW5jZVN0cmluZyhwYXJ0aWFsRGVzYy5mYWN0b3J5LCBjb2xsZWN0aW9uUGF0aCk7XG4gICAgaWYgKCFyZXNvbHZlZFJlZikge1xuICAgICAgdGhyb3cgbmV3IEZhY3RvcnlDYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cblxuICAgIGxldCBzY2hlbWEgPSBwYXJ0aWFsRGVzYy5zY2hlbWE7XG4gICAgbGV0IHNjaGVtYUpzb246IEpzb25PYmplY3QgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHNjaGVtYSkge1xuICAgICAgaWYgKCFpc0Fic29sdXRlKHNjaGVtYSkpIHtcbiAgICAgICAgc2NoZW1hID0gam9pbihjb2xsZWN0aW9uUGF0aCwgc2NoZW1hKTtcbiAgICAgIH1cbiAgICAgIHNjaGVtYUpzb24gPSByZWFkSnNvbkZpbGUoc2NoZW1hKSBhcyBKc29uT2JqZWN0O1xuICAgIH1cblxuICAgIC8vIFRoZSBzY2hlbWF0aWMgcGF0aCBpcyB1c2VkIHRvIHJlc29sdmUgVVJMcy5cbiAgICAvLyBXZSBzaG91bGQgYmUgYWJsZSB0byBqdXN0IGRvIGBkaXJuYW1lKHJlc29sdmVkUmVmLnBhdGgpYCBidXQgZm9yIGNvbXBhdGliaWxpdHkgd2l0aFxuICAgIC8vIEJhemVsIHVuZGVyIFdpbmRvd3MgdGhpcyBkaXJlY3RvcnkgbmVlZHMgdG8gYmUgcmVzb2x2ZWQgZnJvbSB0aGUgY29sbGVjdGlvbiBpbnN0ZWFkLlxuICAgIC8vIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2Ugb24gQmF6ZWwgdW5kZXIgV2luZG93cyB0aGUgZGF0YSBmaWxlcyAoc3VjaCBhcyB0aGUgY29sbGVjdGlvbiBvclxuICAgIC8vIHVybCBmaWxlcykgYXJlIG5vdCBpbiB0aGUgc2FtZSBwbGFjZSBhcyB0aGUgY29tcGlsZWQgSlMuXG4gICAgY29uc3QgbWF5YmVQYXRoID0gam9pbihjb2xsZWN0aW9uUGF0aCwgcGFydGlhbERlc2MuZmFjdG9yeSk7XG4gICAgY29uc3QgcGF0aCA9IGV4aXN0c1N5bmMobWF5YmVQYXRoKSAmJiBzdGF0U3luYyhtYXliZVBhdGgpLmlzRGlyZWN0b3J5KClcbiAgICAgID8gbWF5YmVQYXRoIDogZGlybmFtZShtYXliZVBhdGgpO1xuXG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybVNjaGVtYXRpY0Rlc2NyaXB0aW9uKG5hbWUsIGNvbGxlY3Rpb24sIHtcbiAgICAgIC4uLnBhcnRpYWxEZXNjLFxuICAgICAgc2NoZW1hLFxuICAgICAgc2NoZW1hSnNvbixcbiAgICAgIG5hbWUsXG4gICAgICBwYXRoLFxuICAgICAgZmFjdG9yeUZuOiByZXNvbHZlZFJlZi5yZWYsXG4gICAgICBjb2xsZWN0aW9uLFxuICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlU291cmNlRnJvbVVybCh1cmw6IFVybCk6IFNvdXJjZSB8IG51bGwge1xuICAgIHN3aXRjaCAodXJsLnByb3RvY29sKSB7XG4gICAgICBjYXNlIG51bGw6XG4gICAgICBjYXNlICdmaWxlOic6XG4gICAgICAgIHJldHVybiAoY29udGV4dDogRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICAgICAgICAvLyBSZXNvbHZlIGFsbCBmaWxlOi8vL2EvYi9jL2QgZnJvbSB0aGUgc2NoZW1hdGljJ3Mgb3duIHBhdGgsIGFuZCBub3QgdGhlIGN1cnJlbnRcbiAgICAgICAgICAvLyBwYXRoLlxuICAgICAgICAgIGNvbnN0IHJvb3QgPSBub3JtYWxpemUocmVzb2x2ZShjb250ZXh0LnNjaGVtYXRpYy5kZXNjcmlwdGlvbi5wYXRoLCB1cmwucGF0aCB8fCAnJykpO1xuXG4gICAgICAgICAgcmV0dXJuIG5ldyBIb3N0Q3JlYXRlVHJlZShuZXcgdmlydHVhbEZzLlNjb3BlZEhvc3QobmV3IE5vZGVKc1N5bmNIb3N0KCksIHJvb3QpKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHRyYW5zZm9ybU9wdGlvbnM8T3B0aW9uVCBleHRlbmRzIG9iamVjdCwgUmVzdWx0VCBleHRlbmRzIG9iamVjdD4oXG4gICAgc2NoZW1hdGljOiBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyxcbiAgICBvcHRpb25zOiBPcHRpb25ULFxuICAgIGNvbnRleHQ/OiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCxcbiAgKTogT2JzZXJ2YWJsZTxSZXN1bHRUPiB7XG4gICAgcmV0dXJuIChvYnNlcnZhYmxlT2Yob3B0aW9ucylcbiAgICAgIC5waXBlKFxuICAgICAgICAuLi50aGlzLl90cmFuc2Zvcm1zLm1hcCh0Rm4gPT4gbWVyZ2VNYXAob3B0ID0+IHtcbiAgICAgICAgICBjb25zdCBuZXdPcHRpb25zID0gdEZuKHNjaGVtYXRpYywgb3B0LCBjb250ZXh0KTtcbiAgICAgICAgICBpZiAoaXNPYnNlcnZhYmxlKG5ld09wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3T3B0aW9ucztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihuZXdPcHRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKSxcbiAgICAgICkpIGFzIHt9IGFzIE9ic2VydmFibGU8UmVzdWx0VD47XG4gIH1cblxuICB0cmFuc2Zvcm1Db250ZXh0KGNvbnRleHQ6IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0KTogRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQge1xuICAgIHJldHVybiBjb250ZXh0O1xuICB9XG5cbiAgZ2V0U2NoZW1hdGljUnVsZUZhY3Rvcnk8T3B0aW9uVCBleHRlbmRzIG9iamVjdD4oXG4gICAgc2NoZW1hdGljOiBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyxcbiAgICBfY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjKTogUnVsZUZhY3Rvcnk8T3B0aW9uVD4ge1xuICAgIHJldHVybiBzY2hlbWF0aWMuZmFjdG9yeUZuO1xuICB9XG5cbiAgcmVnaXN0ZXJUYXNrRXhlY3V0b3I8VD4oZmFjdG9yeTogVGFza0V4ZWN1dG9yRmFjdG9yeTxUPiwgb3B0aW9ucz86IFQpOiB2b2lkIHtcbiAgICB0aGlzLl90YXNrRmFjdG9yaWVzLnNldChmYWN0b3J5Lm5hbWUsICgpID0+IG9ic2VydmFibGVGcm9tKGZhY3RvcnkuY3JlYXRlKG9wdGlvbnMpKSk7XG4gIH1cblxuICBjcmVhdGVUYXNrRXhlY3V0b3IobmFtZTogc3RyaW5nKTogT2JzZXJ2YWJsZTxUYXNrRXhlY3V0b3I+IHtcbiAgICBjb25zdCBmYWN0b3J5ID0gdGhpcy5fdGFza0ZhY3Rvcmllcy5nZXQobmFtZSk7XG4gICAgaWYgKGZhY3RvcnkpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRocm93RXJyb3IobmV3IFVucmVnaXN0ZXJlZFRhc2tFeGNlcHRpb24obmFtZSkpO1xuICB9XG5cbiAgaGFzVGFza0V4ZWN1dG9yKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl90YXNrRmFjdG9yaWVzLmhhcyhuYW1lKTtcbiAgfVxufVxuIl19