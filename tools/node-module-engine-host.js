"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeModulesEngineHost = exports.NodePackageDoesNotSupportSchematics = void 0;
const core_1 = require("@angular-devkit/core");
const path_1 = require("path");
const export_ref_1 = require("./export-ref");
const file_system_engine_host_base_1 = require("./file-system-engine-host-base");
const file_system_utility_1 = require("./file-system-utility");
class NodePackageDoesNotSupportSchematics extends core_1.BaseException {
    constructor(name) {
        super(`Package ${JSON.stringify(name)} was found but does not support schematics.`);
    }
}
exports.NodePackageDoesNotSupportSchematics = NodePackageDoesNotSupportSchematics;
/**
 * A simple EngineHost that uses NodeModules to resolve collections.
 */
class NodeModulesEngineHost extends file_system_engine_host_base_1.FileSystemEngineHostBase {
    constructor(paths) {
        super();
        this.paths = paths;
    }
    resolve(name, requester, references = new Set()) {
        if (requester) {
            if (references.has(requester)) {
                references.add(requester);
                throw new Error('Circular schematic reference detected: ' + JSON.stringify(Array.from(references)));
            }
            else {
                references.add(requester);
            }
        }
        const relativeBase = requester ? (0, path_1.dirname)(requester) : process.cwd();
        let collectionPath = undefined;
        if (name.startsWith('.')) {
            name = (0, path_1.resolve)(relativeBase, name);
        }
        const resolveOptions = {
            paths: requester ? [(0, path_1.dirname)(requester), ...(this.paths || [])] : this.paths,
        };
        // Try to resolve as a package
        try {
            const packageJsonPath = require.resolve((0, path_1.join)(name, 'package.json'), resolveOptions);
            const { schematics } = require(packageJsonPath);
            if (!schematics || typeof schematics !== 'string') {
                throw new NodePackageDoesNotSupportSchematics(name);
            }
            collectionPath = this.resolve(schematics, packageJsonPath, references);
        }
        catch (e) {
            if (e.code !== 'MODULE_NOT_FOUND') {
                throw e;
            }
        }
        // If not a package, try to resolve as a file
        if (!collectionPath) {
            try {
                collectionPath = require.resolve(name, resolveOptions);
            }
            catch (e) {
                if (e.code !== 'MODULE_NOT_FOUND') {
                    throw e;
                }
            }
        }
        // If not a package or a file, error
        if (!collectionPath) {
            throw new file_system_engine_host_base_1.CollectionCannotBeResolvedException(name);
        }
        return collectionPath;
    }
    _resolveCollectionPath(name, requester) {
        const collectionPath = this.resolve(name, requester);
        (0, file_system_utility_1.readJsonFile)(collectionPath);
        return collectionPath;
    }
    _resolveReferenceString(refString, parentPath, collectionDescription) {
        const ref = new export_ref_1.ExportStringRef(refString, parentPath);
        if (!ref.ref) {
            return null;
        }
        return { ref: ref.ref, path: ref.module };
    }
    _transformCollectionDescription(name, desc) {
        if (!desc.schematics || typeof desc.schematics != 'object') {
            throw new file_system_engine_host_base_1.CollectionMissingSchematicsMapException(name);
        }
        return {
            ...desc,
            name,
        };
    }
    _transformSchematicDescription(name, _collection, desc) {
        if (!desc.factoryFn || !desc.path || !desc.description) {
            throw new file_system_engine_host_base_1.SchematicMissingFieldsException(name);
        }
        return desc;
    }
}
exports.NodeModulesEngineHost = NodeModulesEngineHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS1tb2R1bGUtZW5naW5lLWhvc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rvb2xzL25vZGUtbW9kdWxlLWVuZ2luZS1ob3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtDQUFxRDtBQUNyRCwrQkFBOEM7QUFHOUMsNkNBQStDO0FBQy9DLGlGQUt3QztBQUN4QywrREFBcUQ7QUFFckQsTUFBYSxtQ0FBb0MsU0FBUSxvQkFBYTtJQUNwRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLFdBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsNkNBQTZDLENBQUMsQ0FBQztJQUN0RixDQUFDO0NBQ0Y7QUFKRCxrRkFJQztBQUVEOztHQUVHO0FBQ0gsTUFBYSxxQkFBc0IsU0FBUSx1REFBd0I7SUFDakUsWUFBNkIsS0FBZ0I7UUFDM0MsS0FBSyxFQUFFLENBQUM7UUFEbUIsVUFBSyxHQUFMLEtBQUssQ0FBVztJQUU3QyxDQUFDO0lBRU8sT0FBTyxDQUFDLElBQVksRUFBRSxTQUFrQixFQUFFLGFBQWEsSUFBSSxHQUFHLEVBQVU7UUFDOUUsSUFBSSxTQUFTLEVBQUU7WUFDYixJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQzdCLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzFCLE1BQU0sSUFBSSxLQUFLLENBQ2IseUNBQXlDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQ25GLENBQUM7YUFDSDtpQkFBTTtnQkFDTCxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQzNCO1NBQ0Y7UUFFRCxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFD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LENBQUM7SUFFUyw4QkFBOEIsQ0FDdEMsSUFBWSxFQUNaLFdBQXFDLEVBQ3JDLElBQXNDO1FBRXRDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDdEQsTUFBTSxJQUFJLDhEQUErQixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2pEO1FBRUQsT0FBTyxJQUErQixDQUFDO0lBQ3pDLENBQUM7Q0FDRjtBQTVHRCxzREE0R0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IGRpcm5hbWUsIGpvaW4sIHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IFJ1bGVGYWN0b3J5IH0gZnJvbSAnLi4vc3JjJztcbmltcG9ydCB7IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYywgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MgfSBmcm9tICcuL2Rlc2NyaXB0aW9uJztcbmltcG9ydCB7IEV4cG9ydFN0cmluZ1JlZiB9IGZyb20gJy4vZXhwb3J0LXJlZic7XG5pbXBvcnQge1xuICBDb2xsZWN0aW9uQ2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbixcbiAgQ29sbGVjdGlvbk1pc3NpbmdTY2hlbWF0aWNzTWFwRXhjZXB0aW9uLFxuICBGaWxlU3lzdGVtRW5naW5lSG9zdEJhc2UsXG4gIFNjaGVtYXRpY01pc3NpbmdGaWVsZHNFeGNlcHRpb24sXG59IGZyb20gJy4vZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZSc7XG5pbXBvcnQgeyByZWFkSnNvbkZpbGUgfSBmcm9tICcuL2ZpbGUtc3lzdGVtLXV0aWxpdHknO1xuXG5leHBvcnQgY2xhc3MgTm9kZVBhY2thZ2VEb2VzTm90U3VwcG9ydFNjaGVtYXRpY3MgZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFBhY2thZ2UgJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gd2FzIGZvdW5kIGJ1dCBkb2VzIG5vdCBzdXBwb3J0IHNjaGVtYXRpY3MuYCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHNpbXBsZSBFbmdpbmVIb3N0IHRoYXQgdXNlcyBOb2RlTW9kdWxlcyB0byByZXNvbHZlIGNvbGxlY3Rpb25zLlxuICovXG5leHBvcnQgY2xhc3MgTm9kZU1vZHVsZXNFbmdpbmVIb3N0IGV4dGVuZHMgRmlsZVN5c3RlbUVuZ2luZUhvc3RCYXNlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBwYXRocz86IHN0cmluZ1tdKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVzb2x2ZShuYW1lOiBzdHJpbmcsIHJlcXVlc3Rlcj86IHN0cmluZywgcmVmZXJlbmNlcyA9IG5ldyBTZXQ8c3RyaW5nPigpKTogc3RyaW5nIHtcbiAgICBpZiAocmVxdWVzdGVyKSB7XG4gICAgICBpZiAocmVmZXJlbmNlcy5oYXMocmVxdWVzdGVyKSkge1xuICAgICAgICByZWZlcmVuY2VzLmFkZChyZXF1ZXN0ZXIpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ0NpcmN1bGFyIHNjaGVtYXRpYyByZWZlcmVuY2UgZGV0ZWN0ZWQ6ICcgKyBKU09OLnN0cmluZ2lmeShBcnJheS5mcm9tKHJlZmVyZW5jZXMpKSxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlZmVyZW5jZXMuYWRkKHJlcXVlc3Rlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcmVsYXRpdmVCYXNlID0gcmVxdWVzdGVyID8gZGlybmFtZShyZXF1ZXN0ZXIpIDogcHJvY2Vzcy5jd2QoKTtcbiAgICBsZXQgY29sbGVjdGlvblBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgIGlmIChuYW1lLnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgICAgbmFtZSA9IHJlc29sdmUocmVsYXRpdmVCYXNlLCBuYW1lKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXNvbHZlT3B0aW9ucyA9IHtcbiAgICAgIHBhdGhzOiByZXF1ZXN0ZXIgPyBbZGlybmFtZShyZXF1ZXN0ZXIpLCAuLi4odGhpcy5wYXRocyB8fCBbXSldIDogdGhpcy5wYXRocyxcbiAgICB9O1xuXG4gICAgLy8gVHJ5IHRvIHJlc29sdmUgYXMgYSBwYWNrYWdlXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhY2thZ2VKc29uUGF0aCA9IHJlcXVpcmUucmVzb2x2ZShqb2luKG5hbWUsICdwYWNrYWdlLmpzb24nKSwgcmVzb2x2ZU9wdGlvbnMpO1xuICAgICAgY29uc3QgeyBzY2hlbWF0aWNzIH0gPSByZXF1aXJlKHBhY2thZ2VKc29uUGF0aCk7XG5cbiAgICAgIGlmICghc2NoZW1hdGljcyB8fCB0eXBlb2Ygc2NoZW1hdGljcyAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IE5vZGVQYWNrYWdlRG9lc05vdFN1cHBvcnRTY2hlbWF0aWNzKG5hbWUpO1xuICAgICAgfVxuXG4gICAgICBjb2xsZWN0aW9uUGF0aCA9IHRoaXMucmVzb2x2ZShzY2hlbWF0aWNzLCBwYWNrYWdlSnNvblBhdGgsIHJlZmVyZW5jZXMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlLmNvZGUgIT09ICdNT0RVTEVfTk9UX0ZPVU5EJykge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIG5vdCBhIHBhY2thZ2UsIHRyeSB0byByZXNvbHZlIGFzIGEgZmlsZVxuICAgIGlmICghY29sbGVjdGlvblBhdGgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbGxlY3Rpb25QYXRoID0gcmVxdWlyZS5yZXNvbHZlKG5hbWUsIHJlc29sdmVPcHRpb25zKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKGUuY29kZSAhPT0gJ01PRFVMRV9OT1RfRk9VTkQnKSB7XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIG5vdCBhIHBhY2thZ2Ugb3IgYSBmaWxlLCBlcnJvclxuICAgIGlmICghY29sbGVjdGlvblBhdGgpIHtcbiAgICAgIHRocm93IG5ldyBDb2xsZWN0aW9uQ2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29sbGVjdGlvblBhdGg7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3Jlc29sdmVDb2xsZWN0aW9uUGF0aChuYW1lOiBzdHJpbmcsIHJlcXVlc3Rlcj86IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgY29sbGVjdGlvblBhdGggPSB0aGlzLnJlc29sdmUobmFtZSwgcmVxdWVzdGVyKTtcbiAgICByZWFkSnNvbkZpbGUoY29sbGVjdGlvblBhdGgpO1xuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb25QYXRoO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9yZXNvbHZlUmVmZXJlbmNlU3RyaW5nKFxuICAgIHJlZlN0cmluZzogc3RyaW5nLFxuICAgIHBhcmVudFBhdGg6IHN0cmluZyxcbiAgICBjb2xsZWN0aW9uRGVzY3JpcHRpb24/OiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICkge1xuICAgIGNvbnN0IHJlZiA9IG5ldyBFeHBvcnRTdHJpbmdSZWY8UnVsZUZhY3Rvcnk8e30+PihyZWZTdHJpbmcsIHBhcmVudFBhdGgpO1xuICAgIGlmICghcmVmLnJlZikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcmVmOiByZWYucmVmLCBwYXRoOiByZWYubW9kdWxlIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgX3RyYW5zZm9ybUNvbGxlY3Rpb25EZXNjcmlwdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZGVzYzogUGFydGlhbDxGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2M+LFxuICApOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2Mge1xuICAgIGlmICghZGVzYy5zY2hlbWF0aWNzIHx8IHR5cGVvZiBkZXNjLnNjaGVtYXRpY3MgIT0gJ29iamVjdCcpIHtcbiAgICAgIHRocm93IG5ldyBDb2xsZWN0aW9uTWlzc2luZ1NjaGVtYXRpY3NNYXBFeGNlcHRpb24obmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmRlc2MsXG4gICAgICBuYW1lLFxuICAgIH0gYXMgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjO1xuICB9XG5cbiAgcHJvdGVjdGVkIF90cmFuc2Zvcm1TY2hlbWF0aWNEZXNjcmlwdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgX2NvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgICBkZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjPixcbiAgKTogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2Mge1xuICAgIGlmICghZGVzYy5mYWN0b3J5Rm4gfHwgIWRlc2MucGF0aCB8fCAhZGVzYy5kZXNjcmlwdGlvbikge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY01pc3NpbmdGaWVsZHNFeGNlcHRpb24obmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc2MgYXMgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M7XG4gIH1cbn1cbiJdfQ==