"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemEngineHost = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const src_1 = require("../src");
const export_ref_1 = require("./export-ref");
const file_system_engine_host_base_1 = require("./file-system-engine-host-base");
/**
 * A simple EngineHost that uses a root with one directory per collection inside of it. The
 * collection declaration follows the same rules as the regular FileSystemEngineHostBase.
 */
class FileSystemEngineHost extends file_system_engine_host_base_1.FileSystemEngineHostBase {
    constructor(_root) {
        super();
        this._root = _root;
    }
    _resolveCollectionPath(name) {
        try {
            // Allow `${_root}/${name}.json` as a collection.
            const maybePath = require.resolve((0, path_1.join)(this._root, name + '.json'));
            if ((0, fs_1.existsSync)(maybePath)) {
                return maybePath;
            }
        }
        catch (error) { }
        try {
            // Allow `${_root}/${name}/collection.json.
            const maybePath = require.resolve((0, path_1.join)(this._root, name, 'collection.json'));
            if ((0, fs_1.existsSync)(maybePath)) {
                return maybePath;
            }
        }
        catch (error) { }
        throw new file_system_engine_host_base_1.CollectionCannotBeResolvedException(name);
    }
    _resolveReferenceString(refString, parentPath) {
        // Use the same kind of export strings as NodeModule.
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
    hasTaskExecutor(name) {
        if (super.hasTaskExecutor(name)) {
            return true;
        }
        try {
            const maybePath = require.resolve((0, path_1.join)(this._root, name));
            if ((0, fs_1.existsSync)(maybePath)) {
                return true;
            }
        }
        catch (_a) { }
        return false;
    }
    createTaskExecutor(name) {
        if (!super.hasTaskExecutor(name)) {
            try {
                const path = require.resolve((0, path_1.join)(this._root, name));
                // Default handling code is for old tasks that incorrectly export `default` with non-ESM module
                return (0, rxjs_1.from)(Promise.resolve().then(() => __importStar(require(path))).then((mod) => { var _a; return (((_a = mod.default) === null || _a === void 0 ? void 0 : _a.default) || mod.default)(); })).pipe((0, operators_1.catchError)(() => (0, rxjs_1.throwError)(new src_1.UnregisteredTaskException(name))));
            }
            catch (_a) { }
        }
        return super.createTaskExecutor(name);
    }
}
exports.FileSystemEngineHost = FileSystemEngineHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rvb2xzL2ZpbGUtc3lzdGVtLWVuZ2luZS1ob3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwyQkFBZ0M7QUFDaEMsK0JBQTRCO0FBQzVCLCtCQUFvRDtBQUNwRCw4Q0FBNEM7QUFDNUMsZ0NBQThFO0FBRTlFLDZDQUErQztBQUMvQyxpRkFLd0M7QUFFeEM7OztHQUdHO0FBQ0gsTUFBYSxvQkFBcUIsU0FBUSx1REFBd0I7SUFDaEUsWUFBc0IsS0FBYTtRQUNqQyxLQUFLLEVBQUUsQ0FBQztRQURZLFVBQUssR0FBTCxLQUFLLENBQVE7SUFFbkMsQ0FBQztJQUVTLHNCQUFzQixDQUFDLElBQVk7UUFDM0MsSUFBSTtZQUNGLGlEQUFpRDtZQUNqRCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUEsV0FBSSxFQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDcEUsSUFBSSxJQUFBLGVBQVUsRUFBQyxTQUFTLENBQUMsRUFBRTtnQkFDekIsT0FBTyxTQUFTLENBQUM7YUFDbEI7U0FDRjtRQUFDLE9BQU8sS0FBSyxFQUFFLEdBQUU7UUFFbEIsSUFBSTtZQUNGLDJDQUEyQztZQUMzQyxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUEsV0FBSSxFQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUM3RSxJQUFJLElBQUEsZUFBVSxFQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUN6QixPQUFPLFNBQVMsQ0FBQzthQUNsQjtTQUNGO1FBQUMsT0FBTyxLQUFLLEVBQUUsR0FBRTtRQUVsQixNQUFNLElBQUksa0VBQW1DLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVTLHVCQUF1QixDQUFDLFNBQWlCLEVBQUUsVUFBa0I7UUFDckUscURBQXFEO1FBQ3JELE1BQU0sR0FBRyxHQUFHLElBQUksNEJBQWUsQ0FBa0IsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3hFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFO1lBQ1osT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzVDLENBQUM7SUFFUywrQkFBK0IsQ0FDdkMsSUFBWSxFQUNaLElBQXVDO1FBRXZDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLE9BQU8sSUFBSSxDQUFDLFVBQVUsSUFBSSxRQUFRLEVBQUU7WUFDMUQsTUFBTSxJQUFJLHNFQUF1QyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3pEO1FBRUQsT0FBTztZQUNMLEdBQUcsSUFBSTtZQUNQLElBQUk7U0FDdUIsQ0FBQztJQUNoQyxDQUFDO0lBRVMsOEJBQThCLENBQ3RDLElBQVksRUFDWixXQUFxQyxFQUNyQyxJQUFzQztRQUV0QyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3RELE1BQU0sSUFBSSw4REFBK0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNqRDtRQUVELE9BQU8sSUFBK0IsQ0FBQztJQUN6QyxDQUFDO0lBRVEsZUFBZSxDQUFDLElBQVk7UUFDbkMsSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQy9CLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxJQUFJO1lBQ0YsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFBLFdBQUksRUFBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDMUQsSUFBSSxJQUFBLGVBQVUsRUFBQyxTQUFTLENBQUMsRUFBRTtnQkFDekIsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO1FBQUMsV0FBTSxHQUFFO1FBRVYsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRVEsa0JBQWtCLENBQUMsSUFBWTtRQUN0QyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNoQyxJQUFJO2dCQUNGLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBQSxXQUFJLEVBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCwrRkFBK0Y7Z0JBQy9GLE9BQU8sSUFBQSxXQUFJLEVBQUMsa0RBQU8sSUFBSSxJQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLFdBQUMsT0FBQSxDQUFDLENBQUEsTUFBQSxHQUFHLENBQUMsT0FBTywwQ0FBRSxPQUFPLEtBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUEsRUFBQSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQ25GLElBQUEsc0JBQVUsRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLGlCQUFVLEVBQUMsSUFBSSwrQkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQ2xFLENBQUM7YUFDSDtZQUFDLFdBQU0sR0FBRTtTQUNYO1FBRUQsT0FBTyxLQUFLLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEMsQ0FBQztDQUNGO0FBMUZELG9EQTBGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgZnJvbSwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY2F0Y2hFcnJvciB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IFJ1bGVGYWN0b3J5LCBUYXNrRXhlY3V0b3IsIFVucmVnaXN0ZXJlZFRhc2tFeGNlcHRpb24gfSBmcm9tICcuLi9zcmMnO1xuaW1wb3J0IHsgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLCBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyB9IGZyb20gJy4vZGVzY3JpcHRpb24nO1xuaW1wb3J0IHsgRXhwb3J0U3RyaW5nUmVmIH0gZnJvbSAnLi9leHBvcnQtcmVmJztcbmltcG9ydCB7XG4gIENvbGxlY3Rpb25DYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uLFxuICBDb2xsZWN0aW9uTWlzc2luZ1NjaGVtYXRpY3NNYXBFeGNlcHRpb24sXG4gIEZpbGVTeXN0ZW1FbmdpbmVIb3N0QmFzZSxcbiAgU2NoZW1hdGljTWlzc2luZ0ZpZWxkc0V4Y2VwdGlvbixcbn0gZnJvbSAnLi9maWxlLXN5c3RlbS1lbmdpbmUtaG9zdC1iYXNlJztcblxuLyoqXG4gKiBBIHNpbXBsZSBFbmdpbmVIb3N0IHRoYXQgdXNlcyBhIHJvb3Qgd2l0aCBvbmUgZGlyZWN0b3J5IHBlciBjb2xsZWN0aW9uIGluc2lkZSBvZiBpdC4gVGhlXG4gKiBjb2xsZWN0aW9uIGRlY2xhcmF0aW9uIGZvbGxvd3MgdGhlIHNhbWUgcnVsZXMgYXMgdGhlIHJlZ3VsYXIgRmlsZVN5c3RlbUVuZ2luZUhvc3RCYXNlLlxuICovXG5leHBvcnQgY2xhc3MgRmlsZVN5c3RlbUVuZ2luZUhvc3QgZXh0ZW5kcyBGaWxlU3lzdGVtRW5naW5lSG9zdEJhc2Uge1xuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgX3Jvb3Q6IHN0cmluZykge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3Jlc29sdmVDb2xsZWN0aW9uUGF0aChuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHRyeSB7XG4gICAgICAvLyBBbGxvdyBgJHtfcm9vdH0vJHtuYW1lfS5qc29uYCBhcyBhIGNvbGxlY3Rpb24uXG4gICAgICBjb25zdCBtYXliZVBhdGggPSByZXF1aXJlLnJlc29sdmUoam9pbih0aGlzLl9yb290LCBuYW1lICsgJy5qc29uJykpO1xuICAgICAgaWYgKGV4aXN0c1N5bmMobWF5YmVQYXRoKSkge1xuICAgICAgICByZXR1cm4gbWF5YmVQYXRoO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7fVxuXG4gICAgdHJ5IHtcbiAgICAgIC8vIEFsbG93IGAke19yb290fS8ke25hbWV9L2NvbGxlY3Rpb24uanNvbi5cbiAgICAgIGNvbnN0IG1heWJlUGF0aCA9IHJlcXVpcmUucmVzb2x2ZShqb2luKHRoaXMuX3Jvb3QsIG5hbWUsICdjb2xsZWN0aW9uLmpzb24nKSk7XG4gICAgICBpZiAoZXhpc3RzU3luYyhtYXliZVBhdGgpKSB7XG4gICAgICAgIHJldHVybiBtYXliZVBhdGg7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHt9XG5cbiAgICB0aHJvdyBuZXcgQ29sbGVjdGlvbkNhbm5vdEJlUmVzb2x2ZWRFeGNlcHRpb24obmFtZSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3Jlc29sdmVSZWZlcmVuY2VTdHJpbmcocmVmU3RyaW5nOiBzdHJpbmcsIHBhcmVudFBhdGg6IHN0cmluZykge1xuICAgIC8vIFVzZSB0aGUgc2FtZSBraW5kIG9mIGV4cG9ydCBzdHJpbmdzIGFzIE5vZGVNb2R1bGUuXG4gICAgY29uc3QgcmVmID0gbmV3IEV4cG9ydFN0cmluZ1JlZjxSdWxlRmFjdG9yeTx7fT4+KHJlZlN0cmluZywgcGFyZW50UGF0aCk7XG4gICAgaWYgKCFyZWYucmVmKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4geyByZWY6IHJlZi5yZWYsIHBhdGg6IHJlZi5tb2R1bGUgfTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfdHJhbnNmb3JtQ29sbGVjdGlvbkRlc2NyaXB0aW9uKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBkZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYz4sXG4gICk6IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyB7XG4gICAgaWYgKCFkZXNjLnNjaGVtYXRpY3MgfHwgdHlwZW9mIGRlc2Muc2NoZW1hdGljcyAhPSAnb2JqZWN0Jykge1xuICAgICAgdGhyb3cgbmV3IENvbGxlY3Rpb25NaXNzaW5nU2NoZW1hdGljc01hcEV4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgLi4uZGVzYyxcbiAgICAgIG5hbWUsXG4gICAgfSBhcyBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2M7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3RyYW5zZm9ybVNjaGVtYXRpY0Rlc2NyaXB0aW9uKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBfY29sbGVjdGlvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLFxuICAgIGRlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M+LFxuICApOiBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyB7XG4gICAgaWYgKCFkZXNjLmZhY3RvcnlGbiB8fCAhZGVzYy5wYXRoIHx8ICFkZXNjLmRlc2NyaXB0aW9uKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljTWlzc2luZ0ZpZWxkc0V4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVzYyBhcyBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYztcbiAgfVxuXG4gIG92ZXJyaWRlIGhhc1Rhc2tFeGVjdXRvcihuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoc3VwZXIuaGFzVGFza0V4ZWN1dG9yKG5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgbWF5YmVQYXRoID0gcmVxdWlyZS5yZXNvbHZlKGpvaW4odGhpcy5fcm9vdCwgbmFtZSkpO1xuICAgICAgaWYgKGV4aXN0c1N5bmMobWF5YmVQYXRoKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBvdmVycmlkZSBjcmVhdGVUYXNrRXhlY3V0b3IobmFtZTogc3RyaW5nKTogT2JzZXJ2YWJsZTxUYXNrRXhlY3V0b3I+IHtcbiAgICBpZiAoIXN1cGVyLmhhc1Rhc2tFeGVjdXRvcihuYW1lKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUucmVzb2x2ZShqb2luKHRoaXMuX3Jvb3QsIG5hbWUpKTtcblxuICAgICAgICAvLyBEZWZhdWx0IGhhbmRsaW5nIGNvZGUgaXMgZm9yIG9sZCB0YXNrcyB0aGF0IGluY29ycmVjdGx5IGV4cG9ydCBgZGVmYXVsdGAgd2l0aCBub24tRVNNIG1vZHVsZVxuICAgICAgICByZXR1cm4gZnJvbShpbXBvcnQocGF0aCkudGhlbigobW9kKSA9PiAobW9kLmRlZmF1bHQ/LmRlZmF1bHQgfHwgbW9kLmRlZmF1bHQpKCkpKS5waXBlKFxuICAgICAgICAgIGNhdGNoRXJyb3IoKCkgPT4gdGhyb3dFcnJvcihuZXcgVW5yZWdpc3RlcmVkVGFza0V4Y2VwdGlvbihuYW1lKSkpLFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH1cblxuICAgIHJldHVybiBzdXBlci5jcmVhdGVUYXNrRXhlY3V0b3IobmFtZSk7XG4gIH1cbn1cbiJdfQ==