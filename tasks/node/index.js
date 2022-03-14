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
exports.BuiltinTaskExecutor = void 0;
const options_1 = require("../package-manager/options");
const options_2 = require("../repo-init/options");
const options_3 = require("../run-schematic/options");
class BuiltinTaskExecutor {
}
exports.BuiltinTaskExecutor = BuiltinTaskExecutor;
BuiltinTaskExecutor.NodePackage = {
    name: options_1.NodePackageName,
    create: (options) => Promise.resolve().then(() => __importStar(require('../package-manager/executor'))).then((mod) => mod.default(options)),
};
BuiltinTaskExecutor.RepositoryInitializer = {
    name: options_2.RepositoryInitializerName,
    create: (options) => Promise.resolve().then(() => __importStar(require('../repo-init/executor'))).then((mod) => mod.default(options)),
};
BuiltinTaskExecutor.RunSchematic = {
    name: options_3.RunSchematicName,
    create: () => Promise.resolve().then(() => __importStar(require('../run-schematic/executor'))).then((mod) => mod.default()),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL25vZGUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdILHdEQUE0RjtBQUM1RixrREFHOEI7QUFDOUIsc0RBQTREO0FBRTVELE1BQWEsbUJBQW1COztBQUFoQyxrREFrQkM7QUFqQmlCLCtCQUFXLEdBQXVEO0lBQ2hGLElBQUksRUFBRSx5QkFBZTtJQUNyQixNQUFNLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUNsQixrREFBTyw2QkFBNkIsSUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBRXZFO0NBQ0osQ0FBQztBQUNjLHlDQUFxQixHQUNuQztJQUNFLElBQUksRUFBRSxtQ0FBeUI7SUFDL0IsTUFBTSxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxrREFBTyx1QkFBdUIsSUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7Q0FDekYsQ0FBQztBQUNZLGdDQUFZLEdBQTRCO0lBQ3RELElBQUksRUFBRSwwQkFBZ0I7SUFDdEIsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUNYLGtEQUFPLDJCQUEyQixJQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUE4QjtDQUNoRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IFRhc2tFeGVjdXRvciwgVGFza0V4ZWN1dG9yRmFjdG9yeSB9IGZyb20gJy4uLy4uL3NyYyc7XG5pbXBvcnQgeyBOb2RlUGFja2FnZU5hbWUsIE5vZGVQYWNrYWdlVGFza0ZhY3RvcnlPcHRpb25zIH0gZnJvbSAnLi4vcGFja2FnZS1tYW5hZ2VyL29wdGlvbnMnO1xuaW1wb3J0IHtcbiAgUmVwb3NpdG9yeUluaXRpYWxpemVyTmFtZSxcbiAgUmVwb3NpdG9yeUluaXRpYWxpemVyVGFza0ZhY3RvcnlPcHRpb25zLFxufSBmcm9tICcuLi9yZXBvLWluaXQvb3B0aW9ucyc7XG5pbXBvcnQgeyBSdW5TY2hlbWF0aWNOYW1lIH0gZnJvbSAnLi4vcnVuLXNjaGVtYXRpYy9vcHRpb25zJztcblxuZXhwb3J0IGNsYXNzIEJ1aWx0aW5UYXNrRXhlY3V0b3Ige1xuICBzdGF0aWMgcmVhZG9ubHkgTm9kZVBhY2thZ2U6IFRhc2tFeGVjdXRvckZhY3Rvcnk8Tm9kZVBhY2thZ2VUYXNrRmFjdG9yeU9wdGlvbnM+ID0ge1xuICAgIG5hbWU6IE5vZGVQYWNrYWdlTmFtZSxcbiAgICBjcmVhdGU6IChvcHRpb25zKSA9PlxuICAgICAgaW1wb3J0KCcuLi9wYWNrYWdlLW1hbmFnZXIvZXhlY3V0b3InKS50aGVuKChtb2QpID0+IG1vZC5kZWZhdWx0KG9wdGlvbnMpKSBhcyBQcm9taXNlPFxuICAgICAgICBUYXNrRXhlY3V0b3I8e30+XG4gICAgICA+LFxuICB9O1xuICBzdGF0aWMgcmVhZG9ubHkgUmVwb3NpdG9yeUluaXRpYWxpemVyOiBUYXNrRXhlY3V0b3JGYWN0b3J5PFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2tGYWN0b3J5T3B0aW9ucz4gPVxuICAgIHtcbiAgICAgIG5hbWU6IFJlcG9zaXRvcnlJbml0aWFsaXplck5hbWUsXG4gICAgICBjcmVhdGU6IChvcHRpb25zKSA9PiBpbXBvcnQoJy4uL3JlcG8taW5pdC9leGVjdXRvcicpLnRoZW4oKG1vZCkgPT4gbW9kLmRlZmF1bHQob3B0aW9ucykpLFxuICAgIH07XG4gIHN0YXRpYyByZWFkb25seSBSdW5TY2hlbWF0aWM6IFRhc2tFeGVjdXRvckZhY3Rvcnk8e30+ID0ge1xuICAgIG5hbWU6IFJ1blNjaGVtYXRpY05hbWUsXG4gICAgY3JlYXRlOiAoKSA9PlxuICAgICAgaW1wb3J0KCcuLi9ydW4tc2NoZW1hdGljL2V4ZWN1dG9yJykudGhlbigobW9kKSA9PiBtb2QuZGVmYXVsdCgpKSBhcyBQcm9taXNlPFRhc2tFeGVjdXRvcjx7fT4+LFxuICB9O1xufVxuIl19