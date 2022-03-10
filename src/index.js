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
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tree = exports.workflow = exports.formats = exports.SchematicsException = void 0;
const formats = __importStar(require("./formats/index"));
exports.formats = formats;
const interface_1 = require("./tree/interface");
const static_1 = require("./tree/static");
const workflow = __importStar(require("./workflow/index"));
exports.workflow = workflow;
var exception_1 = require("./exception/exception");
Object.defineProperty(exports, "SchematicsException", { enumerable: true, get: function () { return exception_1.SchematicsException; } });
__exportStar(require("./tree/action"), exports);
__exportStar(require("./engine/index"), exports);
__exportStar(require("./exception/exception"), exports);
__exportStar(require("./tree/interface"), exports);
__exportStar(require("./rules/base"), exports);
__exportStar(require("./rules/call"), exports);
__exportStar(require("./rules/move"), exports);
__exportStar(require("./rules/random"), exports);
__exportStar(require("./rules/schematic"), exports);
__exportStar(require("./rules/template"), exports);
__exportStar(require("./rules/url"), exports);
__exportStar(require("./tree/delegate"), exports);
__exportStar(require("./tree/empty"), exports);
__exportStar(require("./tree/host-tree"), exports);
__exportStar(require("./engine/schematic"), exports);
__exportStar(require("./sink/dryrun"), exports);
__exportStar(require("./sink/host"), exports);
__exportStar(require("./sink/sink"), exports);
exports.Tree = {
    empty() {
        return (0, static_1.empty)();
    },
    branch(tree) {
        return (0, static_1.branch)(tree);
    },
    merge(tree, other, strategy = interface_1.MergeStrategy.Default) {
        return (0, static_1.merge)(tree, other, strategy);
    },
    partition(tree, predicate) {
        return (0, static_1.partition)(tree, predicate);
    },
    optimize(tree) {
        return tree;
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHlEQUEyQztBQTJCbEMsMEJBQU87QUExQmhCLGdEQUF1RjtBQUN2RiwwQ0FBZ0U7QUFFaEUsMkRBQTZDO0FBd0JwQyw0QkFBUTtBQXRCakIsbURBQTREO0FBQW5ELGdIQUFBLG1CQUFtQixPQUFBO0FBRTVCLGdEQUE4QjtBQUM5QixpREFBK0I7QUFDL0Isd0RBQXNDO0FBQ3RDLG1EQUFpQztBQUNqQywrQ0FBNkI7QUFDN0IsK0NBQTZCO0FBQzdCLCtDQUE2QjtBQUM3QixpREFBK0I7QUFDL0Isb0RBQWtDO0FBQ2xDLG1EQUFpQztBQUNqQyw4Q0FBNEI7QUFDNUIsa0RBQWdDO0FBQ2hDLCtDQUE2QjtBQUM3QixtREFBaUM7QUFFakMscURBQW1DO0FBQ25DLGdEQUE4QjtBQUM5Qiw4Q0FBNEI7QUFDNUIsOENBQTRCO0FBYWYsUUFBQSxJQUFJLEdBQW9CO0lBQ25DLEtBQUs7UUFDSCxPQUFPLElBQUEsY0FBSyxHQUFFLENBQUM7SUFDakIsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFtQjtRQUN4QixPQUFPLElBQUEsZUFBTSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RCLENBQUM7SUFDRCxLQUFLLENBQ0gsSUFBbUIsRUFDbkIsS0FBb0IsRUFDcEIsV0FBMEIseUJBQWEsQ0FBQyxPQUFPO1FBRS9DLE9BQU8sSUFBQSxjQUFLLEVBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBQ0QsU0FBUyxDQUFDLElBQW1CLEVBQUUsU0FBaUM7UUFDOUQsT0FBTyxJQUFBLGtCQUFTLEVBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFDRCxRQUFRLENBQUMsSUFBbUI7UUFDMUIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBmb3JtYXRzIGZyb20gJy4vZm9ybWF0cy9pbmRleCc7XG5pbXBvcnQgeyBGaWxlUHJlZGljYXRlLCBNZXJnZVN0cmF0ZWd5LCBUcmVlIGFzIFRyZWVJbnRlcmZhY2UgfSBmcm9tICcuL3RyZWUvaW50ZXJmYWNlJztcbmltcG9ydCB7IGJyYW5jaCwgZW1wdHksIG1lcmdlLCBwYXJ0aXRpb24gfSBmcm9tICcuL3RyZWUvc3RhdGljJztcblxuaW1wb3J0ICogYXMgd29ya2Zsb3cgZnJvbSAnLi93b3JrZmxvdy9pbmRleCc7XG5cbmV4cG9ydCB7IFNjaGVtYXRpY3NFeGNlcHRpb24gfSBmcm9tICcuL2V4Y2VwdGlvbi9leGNlcHRpb24nO1xuXG5leHBvcnQgKiBmcm9tICcuL3RyZWUvYWN0aW9uJztcbmV4cG9ydCAqIGZyb20gJy4vZW5naW5lL2luZGV4JztcbmV4cG9ydCAqIGZyb20gJy4vZXhjZXB0aW9uL2V4Y2VwdGlvbic7XG5leHBvcnQgKiBmcm9tICcuL3RyZWUvaW50ZXJmYWNlJztcbmV4cG9ydCAqIGZyb20gJy4vcnVsZXMvYmFzZSc7XG5leHBvcnQgKiBmcm9tICcuL3J1bGVzL2NhbGwnO1xuZXhwb3J0ICogZnJvbSAnLi9ydWxlcy9tb3ZlJztcbmV4cG9ydCAqIGZyb20gJy4vcnVsZXMvcmFuZG9tJztcbmV4cG9ydCAqIGZyb20gJy4vcnVsZXMvc2NoZW1hdGljJztcbmV4cG9ydCAqIGZyb20gJy4vcnVsZXMvdGVtcGxhdGUnO1xuZXhwb3J0ICogZnJvbSAnLi9ydWxlcy91cmwnO1xuZXhwb3J0ICogZnJvbSAnLi90cmVlL2RlbGVnYXRlJztcbmV4cG9ydCAqIGZyb20gJy4vdHJlZS9lbXB0eSc7XG5leHBvcnQgKiBmcm9tICcuL3RyZWUvaG9zdC10cmVlJztcbmV4cG9ydCB7IFVwZGF0ZVJlY29yZGVyIH0gZnJvbSAnLi90cmVlL2ludGVyZmFjZSc7XG5leHBvcnQgKiBmcm9tICcuL2VuZ2luZS9zY2hlbWF0aWMnO1xuZXhwb3J0ICogZnJvbSAnLi9zaW5rL2RyeXJ1bic7XG5leHBvcnQgKiBmcm9tICcuL3NpbmsvaG9zdCc7XG5leHBvcnQgKiBmcm9tICcuL3Npbmsvc2luayc7XG5leHBvcnQgeyBmb3JtYXRzIH07XG5leHBvcnQgeyB3b3JrZmxvdyB9O1xuXG5leHBvcnQgaW50ZXJmYWNlIFRyZWVDb25zdHJ1Y3RvciB7XG4gIGVtcHR5KCk6IFRyZWVJbnRlcmZhY2U7XG4gIGJyYW5jaCh0cmVlOiBUcmVlSW50ZXJmYWNlKTogVHJlZUludGVyZmFjZTtcbiAgbWVyZ2UodHJlZTogVHJlZUludGVyZmFjZSwgb3RoZXI6IFRyZWVJbnRlcmZhY2UsIHN0cmF0ZWd5PzogTWVyZ2VTdHJhdGVneSk6IFRyZWVJbnRlcmZhY2U7XG4gIHBhcnRpdGlvbih0cmVlOiBUcmVlSW50ZXJmYWNlLCBwcmVkaWNhdGU6IEZpbGVQcmVkaWNhdGU8Ym9vbGVhbj4pOiBbVHJlZUludGVyZmFjZSwgVHJlZUludGVyZmFjZV07XG4gIG9wdGltaXplKHRyZWU6IFRyZWVJbnRlcmZhY2UpOiBUcmVlSW50ZXJmYWNlO1xufVxuXG5leHBvcnQgdHlwZSBUcmVlID0gVHJlZUludGVyZmFjZTtcbmV4cG9ydCBjb25zdCBUcmVlOiBUcmVlQ29uc3RydWN0b3IgPSB7XG4gIGVtcHR5KCkge1xuICAgIHJldHVybiBlbXB0eSgpO1xuICB9LFxuICBicmFuY2godHJlZTogVHJlZUludGVyZmFjZSkge1xuICAgIHJldHVybiBicmFuY2godHJlZSk7XG4gIH0sXG4gIG1lcmdlKFxuICAgIHRyZWU6IFRyZWVJbnRlcmZhY2UsXG4gICAgb3RoZXI6IFRyZWVJbnRlcmZhY2UsXG4gICAgc3RyYXRlZ3k6IE1lcmdlU3RyYXRlZ3kgPSBNZXJnZVN0cmF0ZWd5LkRlZmF1bHQsXG4gICkge1xuICAgIHJldHVybiBtZXJnZSh0cmVlLCBvdGhlciwgc3RyYXRlZ3kpO1xuICB9LFxuICBwYXJ0aXRpb24odHJlZTogVHJlZUludGVyZmFjZSwgcHJlZGljYXRlOiBGaWxlUHJlZGljYXRlPGJvb2xlYW4+KSB7XG4gICAgcmV0dXJuIHBhcnRpdGlvbih0cmVlLCBwcmVkaWNhdGUpO1xuICB9LFxuICBvcHRpbWl6ZSh0cmVlOiBUcmVlSW50ZXJmYWNlKSB7XG4gICAgcmV0dXJuIHRyZWU7XG4gIH0sXG59O1xuIl19