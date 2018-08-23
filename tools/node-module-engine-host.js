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
const core = require("@angular-devkit/core/node");
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
    constructor() { super(); }
    _resolvePackageJson(name, basedir = process.cwd()) {
        return core.resolve(name, {
            basedir,
            checkLocal: true,
            checkGlobal: true,
            resolvePackageJson: true,
        });
    }
    _resolvePath(name, basedir = process.cwd()) {
        // Allow relative / absolute paths.
        if (name.startsWith('.') || name.startsWith('/')) {
            return path_1.resolve(basedir, name);
        }
        else {
            // If it's a file inside a package, resolve the package then return the file...
            if (name.split('/').length > (name[0] == '@' ? 2 : 1)) {
                const rest = name.split('/');
                const packageName = rest.shift() + (name[0] == '@' ? '/' + rest.shift() : '');
                return path_1.resolve(core.resolve(packageName, {
                    basedir,
                    checkLocal: true,
                    checkGlobal: true,
                    resolvePackageJson: true,
                }), '..', ...rest);
            }
            return core.resolve(name, {
                basedir,
                checkLocal: true,
                checkGlobal: true,
            });
        }
    }
    _resolveCollectionPath(name) {
        let collectionPath = undefined;
        if (name.replace(/\\/, '/').split('/').length > (name[0] == '@' ? 2 : 1)) {
            try {
                collectionPath = this._resolvePath(name, process.cwd());
            }
            catch (_) {
            }
        }
        if (!collectionPath) {
            let packageJsonPath = this._resolvePackageJson(name, process.cwd());
            // If it's a file, use it as is. Otherwise append package.json to it.
            if (!core.fs.isFile(packageJsonPath)) {
                packageJsonPath = path_1.join(packageJsonPath, 'package.json');
            }
            const pkgJsonSchematics = require(packageJsonPath)['schematics'];
            if (!pkgJsonSchematics || typeof pkgJsonSchematics != 'string') {
                throw new NodePackageDoesNotSupportSchematics(name);
            }
            collectionPath = this._resolvePath(pkgJsonSchematics, path_1.dirname(packageJsonPath));
        }
        try {
            if (collectionPath) {
                file_system_utility_1.readJsonFile(collectionPath);
                return collectionPath;
            }
        }
        catch (e) {
        }
        throw new file_system_engine_host_base_1.CollectionCannotBeResolvedException(name);
    }
    _resolveReferenceString(refString, parentPath) {
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
        return Object.assign({}, desc, { name });
    }
    _transformSchematicDescription(name, _collection, desc) {
        if (!desc.factoryFn || !desc.path || !desc.description) {
            throw new file_system_engine_host_base_1.SchematicMissingFieldsException(name);
        }
        return desc;
    }
}
exports.NodeModulesEngineHost = NodeModulesEngineHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS1tb2R1bGUtZW5naW5lLWhvc3QuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvbm9kZS1tb2R1bGUtZW5naW5lLWhvc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FBcUQ7QUFDckQsa0RBQWtEO0FBQ2xELCtCQUE2RDtBQU03RCw2Q0FBK0M7QUFDL0MsaUZBS3dDO0FBQ3hDLCtEQUFxRDtBQUdyRCx5Q0FBaUQsU0FBUSxvQkFBYTtJQUNwRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLFdBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsNkNBQTZDLENBQUMsQ0FBQztJQUN0RixDQUFDO0NBQ0Y7QUFKRCxrRkFJQztBQUdEOztHQUVHO0FBQ0gsMkJBQW1DLFNBQVEsdURBQXdCO0lBQ2pFLGdCQUFnQixLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFaEIsbUJBQW1CLENBQUMsSUFBWSxFQUFFLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFO1FBQ2pFLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUU7WUFDeEIsT0FBTztZQUNQLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLGtCQUFrQixFQUFFLElBQUk7U0FDekIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVTLFlBQVksQ0FBQyxJQUFZLEVBQUUsT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUU7UUFDMUQsbUNBQW1DO1FBQ25DLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ2hELE9BQU8sY0FBVyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNuQzthQUFNO1lBQ0wsK0VBQStFO1lBQy9FLElB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RyxFQUFFO1lBQ1osT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzVDLENBQUM7SUFFUywrQkFBK0IsQ0FDdkMsSUFBWSxFQUNaLElBQXVDO1FBRXZDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLE9BQU8sSUFBSSxDQUFDLFVBQVUsSUFBSSxRQUFRLEVBQUU7WUFDMUQsTUFBTSxJQUFJLHNFQUF1QyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3pEO1FBRUQsT0FBTyxrQkFDRixJQUFJLElBQ1AsSUFBSSxHQUN1QixDQUFDO0lBQ2hDLENBQUM7SUFFUyw4QkFBOEIsQ0FDdEMsSUFBWSxFQUNaLFdBQXFDLEVBQ3JDLElBQXNDO1FBRXRDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDdEQsTUFBTSxJQUFJLDhEQUErQixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2pEO1FBRUQsT0FBTyxJQUErQixDQUFDO0lBQ3pDLENBQUM7Q0FDRjtBQTNHRCxzREEyR0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0ICogYXMgY29yZSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9ub2RlJztcbmltcG9ydCB7IGRpcm5hbWUsIGpvaW4sIHJlc29sdmUgYXMgcmVzb2x2ZVBhdGggfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IFJ1bGVGYWN0b3J5IH0gZnJvbSAnLi4vc3JjJztcbmltcG9ydCB7XG4gIEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MsXG59IGZyb20gJy4vZGVzY3JpcHRpb24nO1xuaW1wb3J0IHsgRXhwb3J0U3RyaW5nUmVmIH0gZnJvbSAnLi9leHBvcnQtcmVmJztcbmltcG9ydCB7XG4gIENvbGxlY3Rpb25DYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uLFxuICBDb2xsZWN0aW9uTWlzc2luZ1NjaGVtYXRpY3NNYXBFeGNlcHRpb24sXG4gIEZpbGVTeXN0ZW1FbmdpbmVIb3N0QmFzZSxcbiAgU2NoZW1hdGljTWlzc2luZ0ZpZWxkc0V4Y2VwdGlvbixcbn0gZnJvbSAnLi9maWxlLXN5c3RlbS1lbmdpbmUtaG9zdC1iYXNlJztcbmltcG9ydCB7IHJlYWRKc29uRmlsZSB9IGZyb20gJy4vZmlsZS1zeXN0ZW0tdXRpbGl0eSc7XG5cblxuZXhwb3J0IGNsYXNzIE5vZGVQYWNrYWdlRG9lc05vdFN1cHBvcnRTY2hlbWF0aWNzIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBQYWNrYWdlICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IHdhcyBmb3VuZCBidXQgZG9lcyBub3Qgc3VwcG9ydCBzY2hlbWF0aWNzLmApO1xuICB9XG59XG5cblxuLyoqXG4gKiBBIHNpbXBsZSBFbmdpbmVIb3N0IHRoYXQgdXNlcyBOb2RlTW9kdWxlcyB0byByZXNvbHZlIGNvbGxlY3Rpb25zLlxuICovXG5leHBvcnQgY2xhc3MgTm9kZU1vZHVsZXNFbmdpbmVIb3N0IGV4dGVuZHMgRmlsZVN5c3RlbUVuZ2luZUhvc3RCYXNlIHtcbiAgY29uc3RydWN0b3IoKSB7IHN1cGVyKCk7IH1cblxuICBwcm90ZWN0ZWQgX3Jlc29sdmVQYWNrYWdlSnNvbihuYW1lOiBzdHJpbmcsIGJhc2VkaXIgPSBwcm9jZXNzLmN3ZCgpKSB7XG4gICAgcmV0dXJuIGNvcmUucmVzb2x2ZShuYW1lLCB7XG4gICAgICBiYXNlZGlyLFxuICAgICAgY2hlY2tMb2NhbDogdHJ1ZSxcbiAgICAgIGNoZWNrR2xvYmFsOiB0cnVlLFxuICAgICAgcmVzb2x2ZVBhY2thZ2VKc29uOiB0cnVlLFxuICAgIH0pO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9yZXNvbHZlUGF0aChuYW1lOiBzdHJpbmcsIGJhc2VkaXIgPSBwcm9jZXNzLmN3ZCgpKSB7XG4gICAgLy8gQWxsb3cgcmVsYXRpdmUgLyBhYnNvbHV0ZSBwYXRocy5cbiAgICBpZiAobmFtZS5zdGFydHNXaXRoKCcuJykgfHwgbmFtZS5zdGFydHNXaXRoKCcvJykpIHtcbiAgICAgIHJldHVybiByZXNvbHZlUGF0aChiYXNlZGlyLCBuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgaXQncyBhIGZpbGUgaW5zaWRlIGEgcGFja2FnZSwgcmVzb2x2ZSB0aGUgcGFja2FnZSB0aGVuIHJldHVybiB0aGUgZmlsZS4uLlxuICAgICAgaWYgKG5hbWUuc3BsaXQoJy8nKS5sZW5ndGggPiAobmFtZVswXSA9PSAnQCcgPyAyIDogMSkpIHtcbiAgICAgICAgY29uc3QgcmVzdCA9IG5hbWUuc3BsaXQoJy8nKTtcbiAgICAgICAgY29uc3QgcGFja2FnZU5hbWUgPSByZXN0LnNoaWZ0KCkgKyAobmFtZVswXSA9PSAnQCcgPyAnLycgKyByZXN0LnNoaWZ0KCkgOiAnJyk7XG5cbiAgICAgICAgcmV0dXJuIHJlc29sdmVQYXRoKGNvcmUucmVzb2x2ZShwYWNrYWdlTmFtZSwge1xuICAgICAgICAgIGJhc2VkaXIsXG4gICAgICAgICAgY2hlY2tMb2NhbDogdHJ1ZSxcbiAgICAgICAgICBjaGVja0dsb2JhbDogdHJ1ZSxcbiAgICAgICAgICByZXNvbHZlUGFja2FnZUpzb246IHRydWUsXG4gICAgICAgIH0pLCAnLi4nLCAuLi5yZXN0KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNvcmUucmVzb2x2ZShuYW1lLCB7XG4gICAgICAgIGJhc2VkaXIsXG4gICAgICAgIGNoZWNrTG9jYWw6IHRydWUsXG4gICAgICAgIGNoZWNrR2xvYmFsOiB0cnVlLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIF9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgY29sbGVjdGlvblBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgIGlmIChuYW1lLnJlcGxhY2UoL1xcXFwvLCAnLycpLnNwbGl0KCcvJykubGVuZ3RoID4gKG5hbWVbMF0gPT0gJ0AnID8gMiA6IDEpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb2xsZWN0aW9uUGF0aCA9IHRoaXMuX3Jlc29sdmVQYXRoKG5hbWUsIHByb2Nlc3MuY3dkKCkpO1xuICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghY29sbGVjdGlvblBhdGgpIHtcbiAgICAgIGxldCBwYWNrYWdlSnNvblBhdGggPSB0aGlzLl9yZXNvbHZlUGFja2FnZUpzb24obmFtZSwgcHJvY2Vzcy5jd2QoKSk7XG4gICAgICAvLyBJZiBpdCdzIGEgZmlsZSwgdXNlIGl0IGFzIGlzLiBPdGhlcndpc2UgYXBwZW5kIHBhY2thZ2UuanNvbiB0byBpdC5cbiAgICAgIGlmICghY29yZS5mcy5pc0ZpbGUocGFja2FnZUpzb25QYXRoKSkge1xuICAgICAgICBwYWNrYWdlSnNvblBhdGggPSBqb2luKHBhY2thZ2VKc29uUGF0aCwgJ3BhY2thZ2UuanNvbicpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwa2dKc29uU2NoZW1hdGljcyA9IHJlcXVpcmUocGFja2FnZUpzb25QYXRoKVsnc2NoZW1hdGljcyddO1xuICAgICAgaWYgKCFwa2dKc29uU2NoZW1hdGljcyB8fCB0eXBlb2YgcGtnSnNvblNjaGVtYXRpY3MgIT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IE5vZGVQYWNrYWdlRG9lc05vdFN1cHBvcnRTY2hlbWF0aWNzKG5hbWUpO1xuICAgICAgfVxuICAgICAgY29sbGVjdGlvblBhdGggPSB0aGlzLl9yZXNvbHZlUGF0aChwa2dKc29uU2NoZW1hdGljcywgZGlybmFtZShwYWNrYWdlSnNvblBhdGgpKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgaWYgKGNvbGxlY3Rpb25QYXRoKSB7XG4gICAgICAgIHJlYWRKc29uRmlsZShjb2xsZWN0aW9uUGF0aCk7XG5cbiAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25QYXRoO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICB9XG4gICAgdGhyb3cgbmV3IENvbGxlY3Rpb25DYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uKG5hbWUpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9yZXNvbHZlUmVmZXJlbmNlU3RyaW5nKHJlZlN0cmluZzogc3RyaW5nLCBwYXJlbnRQYXRoOiBzdHJpbmcpIHtcbiAgICBjb25zdCByZWYgPSBuZXcgRXhwb3J0U3RyaW5nUmVmPFJ1bGVGYWN0b3J5PHt9Pj4ocmVmU3RyaW5nLCBwYXJlbnRQYXRoKTtcbiAgICBpZiAoIXJlZi5yZWYpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB7IHJlZjogcmVmLnJlZiwgcGF0aDogcmVmLm1vZHVsZSB9O1xuICB9XG5cbiAgcHJvdGVjdGVkIF90cmFuc2Zvcm1Db2xsZWN0aW9uRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGRlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjPixcbiAgKTogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjIHtcbiAgICBpZiAoIWRlc2Muc2NoZW1hdGljcyB8fCB0eXBlb2YgZGVzYy5zY2hlbWF0aWNzICE9ICdvYmplY3QnKSB7XG4gICAgICB0aHJvdyBuZXcgQ29sbGVjdGlvbk1pc3NpbmdTY2hlbWF0aWNzTWFwRXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAuLi5kZXNjLFxuICAgICAgbmFtZSxcbiAgICB9IGFzIEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYztcbiAgfVxuXG4gIHByb3RlY3RlZCBfdHJhbnNmb3JtU2NoZW1hdGljRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIF9jb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICAgZGVzYzogUGFydGlhbDxGaWxlU3lzdGVtU2NoZW1hdGljRGVzYz4sXG4gICk6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjIHtcbiAgICBpZiAoIWRlc2MuZmFjdG9yeUZuIHx8ICFkZXNjLnBhdGggfHwgIWRlc2MuZGVzY3JpcHRpb24pIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNNaXNzaW5nRmllbGRzRXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiBkZXNjIGFzIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjO1xuICB9XG59XG4iXX0=