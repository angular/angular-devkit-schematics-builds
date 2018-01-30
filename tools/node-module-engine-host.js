"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core = require("@angular-devkit/core/node");
const tools_1 = require("@angular-devkit/schematics/tools");
const path_1 = require("path");
const export_ref_1 = require("./export-ref");
const file_system_engine_host_base_1 = require("./file-system-engine-host-base");
const file_system_utility_1 = require("./file-system-utility");
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
            return core.resolve(name, {
                basedir,
                checkLocal: true,
                checkGlobal: true,
            });
        }
    }
    _resolveCollectionPath(name) {
        let packageJsonPath = this._resolvePackageJson(name, process.cwd());
        // If it's a file, use it as is. Otherwise append package.json to it.
        if (!core.fs.isFile(packageJsonPath)) {
            packageJsonPath = path_1.join(packageJsonPath, 'package.json');
        }
        try {
            const pkgJsonSchematics = require(packageJsonPath)['schematics'];
            if (pkgJsonSchematics) {
                const resolvedPath = this._resolvePath(pkgJsonSchematics, path_1.dirname(packageJsonPath));
                file_system_utility_1.readJsonFile(resolvedPath);
                return resolvedPath;
            }
        }
        catch (e) {
        }
        throw new tools_1.CollectionCannotBeResolvedException(name);
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
            throw new tools_1.CollectionMissingSchematicsMapException(name);
        }
        return Object.assign({}, desc, { name });
    }
    _transformSchematicDescription(name, _collection, desc) {
        if (!desc.factoryFn || !desc.path || !desc.description) {
            throw new tools_1.SchematicMissingFieldsException(name);
        }
        return desc;
    }
}
exports.NodeModulesEngineHost = NodeModulesEngineHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS1tb2R1bGUtZW5naW5lLWhvc3QuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvbm9kZS1tb2R1bGUtZW5naW5lLWhvc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCxrREFBa0Q7QUFFbEQsNERBSTBDO0FBQzFDLCtCQUE2RDtBQUs3RCw2Q0FBK0M7QUFDL0MsaUZBQTBFO0FBQzFFLCtEQUFxRDtBQUdyRDs7R0FFRztBQUNILDJCQUFtQyxTQUFRLHVEQUF3QjtJQUNqRSxnQkFBZ0IsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRWhCLG1CQUFtQixDQUFDLElBQVksRUFBRSxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRTtRQUNqRSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUU7WUFDeEIsT0FBTztZQUNQLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLGtCQUFrQixFQUFFLElBQUk7U0FDekIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVTLFlBQVksQ0FBQyxJQUFZLEVBQUUsT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUU7UUFDMUQsbUNBQW1DO1FBQ25DLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLGNBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFO2dCQUN4QixPQUFPO2dCQUNQLFVBQVUsRUFBRSxJQUFJO2dCQUNoQixXQUFXLEVBQUUsSUFBSTthQUNsQixDQUFDLENBQUM7UUFDTCxDQUFDO0lBQ0gsQ0FBQztJQUVTLHNCQUFzQixDQUFDLElBQVk7UUFDM0MsSUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNwRSxxRUFBcUU7UUFDckUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckMsZUFBZSxHQUFHLFdBQUksQ0FBQyxlQUFlLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUVELElBQUksQ0FBQztZQUNILE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2pFLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDdEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxjQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztnQkFDcEYsa0NBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFFM0IsTUFBTSxDQUFDLFlBQVksQ0FBQztZQUN0QixDQUFDO1FBQ0gsQ0FBQztRQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDYixDQUFDO1FBQ0QsTUFBTSxJQUFJLDJDQUFtQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFUyx1QkFBdUIsQ0FBQyxTQUFpQixFQUFFLFVBQWtCO1FBQ3JFLE1BQU0sR0FBRyxHQUFHLElBQUksNEJBQWUsQ0FBa0IsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3hFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDYixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUVELE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDNUMsQ0FBQztJQUVTLCtCQUErQixDQUN2QyxJQUFZLEVBQ1osSUFBdUM7UUFFdkMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLE9BQU8sSUFBSSxDQUFDLFVBQVUsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzNELE1BQU0sSUFBSSwrQ0FBdUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQsTUFBTSxDQUFDLGtCQUNGLElBQUksSUFDUCxJQUFJLEdBQ3VCLENBQUM7SUFDaEMsQ0FBQztJQUVTLDhCQUE4QixDQUN0QyxJQUFZLEVBQ1osV0FBcUMsRUFDckMsSUFBc0M7UUFFdEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sSUFBSSx1Q0FBK0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRUQsTUFBTSxDQUFDLElBQStCLENBQUM7SUFDekMsQ0FBQztDQUNGO0FBL0VELHNEQStFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAqIGFzIGNvcmUgZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUvbm9kZSc7XG5pbXBvcnQgeyBSdWxlRmFjdG9yeSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7XG4gIENvbGxlY3Rpb25DYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uLFxuICBDb2xsZWN0aW9uTWlzc2luZ1NjaGVtYXRpY3NNYXBFeGNlcHRpb24sXG4gIFNjaGVtYXRpY01pc3NpbmdGaWVsZHNFeGNlcHRpb24sXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzL3Rvb2xzJztcbmltcG9ydCB7IGRpcm5hbWUsIGpvaW4sIHJlc29sdmUgYXMgcmVzb2x2ZVBhdGggfSBmcm9tICdwYXRoJztcbmltcG9ydCB7XG4gIEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MsXG59IGZyb20gJy4vZGVzY3JpcHRpb24nO1xuaW1wb3J0IHsgRXhwb3J0U3RyaW5nUmVmIH0gZnJvbSAnLi9leHBvcnQtcmVmJztcbmltcG9ydCB7IEZpbGVTeXN0ZW1FbmdpbmVIb3N0QmFzZSB9IGZyb20gJy4vZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZSc7XG5pbXBvcnQgeyByZWFkSnNvbkZpbGUgfSBmcm9tICcuL2ZpbGUtc3lzdGVtLXV0aWxpdHknO1xuXG5cbi8qKlxuICogQSBzaW1wbGUgRW5naW5lSG9zdCB0aGF0IHVzZXMgTm9kZU1vZHVsZXMgdG8gcmVzb2x2ZSBjb2xsZWN0aW9ucy5cbiAqL1xuZXhwb3J0IGNsYXNzIE5vZGVNb2R1bGVzRW5naW5lSG9zdCBleHRlbmRzIEZpbGVTeXN0ZW1FbmdpbmVIb3N0QmFzZSB7XG4gIGNvbnN0cnVjdG9yKCkgeyBzdXBlcigpOyB9XG5cbiAgcHJvdGVjdGVkIF9yZXNvbHZlUGFja2FnZUpzb24obmFtZTogc3RyaW5nLCBiYXNlZGlyID0gcHJvY2Vzcy5jd2QoKSkge1xuICAgIHJldHVybiBjb3JlLnJlc29sdmUobmFtZSwge1xuICAgICAgYmFzZWRpcixcbiAgICAgIGNoZWNrTG9jYWw6IHRydWUsXG4gICAgICBjaGVja0dsb2JhbDogdHJ1ZSxcbiAgICAgIHJlc29sdmVQYWNrYWdlSnNvbjogdHJ1ZSxcbiAgICB9KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfcmVzb2x2ZVBhdGgobmFtZTogc3RyaW5nLCBiYXNlZGlyID0gcHJvY2Vzcy5jd2QoKSkge1xuICAgIC8vIEFsbG93IHJlbGF0aXZlIC8gYWJzb2x1dGUgcGF0aHMuXG4gICAgaWYgKG5hbWUuc3RhcnRzV2l0aCgnLicpIHx8IG5hbWUuc3RhcnRzV2l0aCgnLycpKSB7XG4gICAgICByZXR1cm4gcmVzb2x2ZVBhdGgoYmFzZWRpciwgbmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjb3JlLnJlc29sdmUobmFtZSwge1xuICAgICAgICBiYXNlZGlyLFxuICAgICAgICBjaGVja0xvY2FsOiB0cnVlLFxuICAgICAgICBjaGVja0dsb2JhbDogdHJ1ZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBfcmVzb2x2ZUNvbGxlY3Rpb25QYXRoKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgbGV0IHBhY2thZ2VKc29uUGF0aCA9IHRoaXMuX3Jlc29sdmVQYWNrYWdlSnNvbihuYW1lLCBwcm9jZXNzLmN3ZCgpKTtcbiAgICAvLyBJZiBpdCdzIGEgZmlsZSwgdXNlIGl0IGFzIGlzLiBPdGhlcndpc2UgYXBwZW5kIHBhY2thZ2UuanNvbiB0byBpdC5cbiAgICBpZiAoIWNvcmUuZnMuaXNGaWxlKHBhY2thZ2VKc29uUGF0aCkpIHtcbiAgICAgIHBhY2thZ2VKc29uUGF0aCA9IGpvaW4ocGFja2FnZUpzb25QYXRoLCAncGFja2FnZS5qc29uJyk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBrZ0pzb25TY2hlbWF0aWNzID0gcmVxdWlyZShwYWNrYWdlSnNvblBhdGgpWydzY2hlbWF0aWNzJ107XG4gICAgICBpZiAocGtnSnNvblNjaGVtYXRpY3MpIHtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gdGhpcy5fcmVzb2x2ZVBhdGgocGtnSnNvblNjaGVtYXRpY3MsIGRpcm5hbWUocGFja2FnZUpzb25QYXRoKSk7XG4gICAgICAgIHJlYWRKc29uRmlsZShyZXNvbHZlZFBhdGgpO1xuXG4gICAgICAgIHJldHVybiByZXNvbHZlZFBhdGg7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgIH1cbiAgICB0aHJvdyBuZXcgQ29sbGVjdGlvbkNhbm5vdEJlUmVzb2x2ZWRFeGNlcHRpb24obmFtZSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3Jlc29sdmVSZWZlcmVuY2VTdHJpbmcocmVmU3RyaW5nOiBzdHJpbmcsIHBhcmVudFBhdGg6IHN0cmluZykge1xuICAgIGNvbnN0IHJlZiA9IG5ldyBFeHBvcnRTdHJpbmdSZWY8UnVsZUZhY3Rvcnk8e30+PihyZWZTdHJpbmcsIHBhcmVudFBhdGgpO1xuICAgIGlmICghcmVmLnJlZikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcmVmOiByZWYucmVmLCBwYXRoOiByZWYubW9kdWxlIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgX3RyYW5zZm9ybUNvbGxlY3Rpb25EZXNjcmlwdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZGVzYzogUGFydGlhbDxGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2M+LFxuICApOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2Mge1xuICAgIGlmICghZGVzYy5zY2hlbWF0aWNzIHx8IHR5cGVvZiBkZXNjLnNjaGVtYXRpY3MgIT0gJ29iamVjdCcpIHtcbiAgICAgIHRocm93IG5ldyBDb2xsZWN0aW9uTWlzc2luZ1NjaGVtYXRpY3NNYXBFeGNlcHRpb24obmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmRlc2MsXG4gICAgICBuYW1lLFxuICAgIH0gYXMgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjO1xuICB9XG5cbiAgcHJvdGVjdGVkIF90cmFuc2Zvcm1TY2hlbWF0aWNEZXNjcmlwdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgX2NvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgICBkZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjPixcbiAgKTogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2Mge1xuICAgIGlmICghZGVzYy5mYWN0b3J5Rm4gfHwgIWRlc2MucGF0aCB8fCAhZGVzYy5kZXNjcmlwdGlvbikge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY01pc3NpbmdGaWVsZHNFeGNlcHRpb24obmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc2MgYXMgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M7XG4gIH1cbn1cbiJdfQ==