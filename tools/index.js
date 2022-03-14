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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOptionsWithSchema = exports.NodeModulesTestEngineHost = exports.NodePackageDoesNotSupportSchematics = exports.NodeModulesEngineHost = exports.FileSystemEngineHost = void 0;
__exportStar(require("./description"), exports);
__exportStar(require("./export-ref"), exports);
__exportStar(require("./file-system-engine-host-base"), exports);
__exportStar(require("./workflow/node-workflow"), exports);
var file_system_engine_host_1 = require("./file-system-engine-host");
Object.defineProperty(exports, "FileSystemEngineHost", { enumerable: true, get: function () { return file_system_engine_host_1.FileSystemEngineHost; } });
var node_module_engine_host_1 = require("./node-module-engine-host");
Object.defineProperty(exports, "NodeModulesEngineHost", { enumerable: true, get: function () { return node_module_engine_host_1.NodeModulesEngineHost; } });
Object.defineProperty(exports, "NodePackageDoesNotSupportSchematics", { enumerable: true, get: function () { return node_module_engine_host_1.NodePackageDoesNotSupportSchematics; } });
var node_modules_test_engine_host_1 = require("./node-modules-test-engine-host");
Object.defineProperty(exports, "NodeModulesTestEngineHost", { enumerable: true, get: function () { return node_modules_test_engine_host_1.NodeModulesTestEngineHost; } });
var schema_option_transform_1 = require("./schema-option-transform");
Object.defineProperty(exports, "validateOptionsWithSchema", { enumerable: true, get: function () { return schema_option_transform_1.validateOptionsWithSchema; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rvb2xzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7QUFFSCxnREFBOEI7QUFDOUIsK0NBQTZCO0FBQzdCLGlFQUErQztBQUUvQywyREFBeUM7QUFFekMscUVBQWlFO0FBQXhELCtIQUFBLG9CQUFvQixPQUFBO0FBQzdCLHFFQUdtQztBQUZqQyxnSUFBQSxxQkFBcUIsT0FBQTtBQUNyQiw4SUFBQSxtQ0FBbUMsT0FBQTtBQUVyQyxpRkFBNEU7QUFBbkUsMElBQUEseUJBQXlCLE9BQUE7QUFFbEMscUVBQXNFO0FBQTdELG9JQUFBLHlCQUF5QixPQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmV4cG9ydCAqIGZyb20gJy4vZGVzY3JpcHRpb24nO1xuZXhwb3J0ICogZnJvbSAnLi9leHBvcnQtcmVmJztcbmV4cG9ydCAqIGZyb20gJy4vZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZSc7XG5cbmV4cG9ydCAqIGZyb20gJy4vd29ya2Zsb3cvbm9kZS13b3JrZmxvdyc7XG5cbmV4cG9ydCB7IEZpbGVTeXN0ZW1FbmdpbmVIb3N0IH0gZnJvbSAnLi9maWxlLXN5c3RlbS1lbmdpbmUtaG9zdCc7XG5leHBvcnQge1xuICBOb2RlTW9kdWxlc0VuZ2luZUhvc3QsXG4gIE5vZGVQYWNrYWdlRG9lc05vdFN1cHBvcnRTY2hlbWF0aWNzLFxufSBmcm9tICcuL25vZGUtbW9kdWxlLWVuZ2luZS1ob3N0JztcbmV4cG9ydCB7IE5vZGVNb2R1bGVzVGVzdEVuZ2luZUhvc3QgfSBmcm9tICcuL25vZGUtbW9kdWxlcy10ZXN0LWVuZ2luZS1ob3N0JztcblxuZXhwb3J0IHsgdmFsaWRhdGVPcHRpb25zV2l0aFNjaGVtYSB9IGZyb20gJy4vc2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0nO1xuIl19