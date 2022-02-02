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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgseURBQTJDO0FBMkJsQywwQkFBTztBQTFCaEIsZ0RBQXVGO0FBQ3ZGLDBDQUFnRTtBQUVoRSwyREFBNkM7QUF3QnBDLDRCQUFRO0FBdEJqQixtREFBNEQ7QUFBbkQsZ0hBQUEsbUJBQW1CLE9BQUE7QUFFNUIsZ0RBQThCO0FBQzlCLGlEQUErQjtBQUMvQix3REFBc0M7QUFDdEMsbURBQWlDO0FBQ2pDLCtDQUE2QjtBQUM3QiwrQ0FBNkI7QUFDN0IsK0NBQTZCO0FBQzdCLGlEQUErQjtBQUMvQixvREFBa0M7QUFDbEMsbURBQWlDO0FBQ2pDLDhDQUE0QjtBQUM1QixrREFBZ0M7QUFDaEMsK0NBQTZCO0FBQzdCLG1EQUFpQztBQUVqQyxxREFBbUM7QUFDbkMsZ0RBQThCO0FBQzlCLDhDQUE0QjtBQUM1Qiw4Q0FBNEI7QUFhZixRQUFBLElBQUksR0FBb0I7SUFDbkMsS0FBSztRQUNILE9BQU8sSUFBQSxjQUFLLEdBQUUsQ0FBQztJQUNqQixDQUFDO0lBQ0QsTUFBTSxDQUFDLElBQW1CO1FBQ3hCLE9BQU8sSUFBQSxlQUFNLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUNELEtBQUssQ0FDSCxJQUFtQixFQUNuQixLQUFvQixFQUNwQixXQUEwQix5QkFBYSxDQUFDLE9BQU87UUFFL0MsT0FBTyxJQUFBLGNBQUssRUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFDRCxTQUFTLENBQUMsSUFBbUIsRUFBRSxTQUFpQztRQUM5RCxPQUFPLElBQUEsa0JBQVMsRUFBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUNELFFBQVEsQ0FBQyxJQUFtQjtRQUMxQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIGZvcm1hdHMgZnJvbSAnLi9mb3JtYXRzL2luZGV4JztcbmltcG9ydCB7IEZpbGVQcmVkaWNhdGUsIE1lcmdlU3RyYXRlZ3ksIFRyZWUgYXMgVHJlZUludGVyZmFjZSB9IGZyb20gJy4vdHJlZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgYnJhbmNoLCBlbXB0eSwgbWVyZ2UsIHBhcnRpdGlvbiB9IGZyb20gJy4vdHJlZS9zdGF0aWMnO1xuXG5pbXBvcnQgKiBhcyB3b3JrZmxvdyBmcm9tICcuL3dvcmtmbG93L2luZGV4JztcblxuZXhwb3J0IHsgU2NoZW1hdGljc0V4Y2VwdGlvbiB9IGZyb20gJy4vZXhjZXB0aW9uL2V4Y2VwdGlvbic7XG5cbmV4cG9ydCAqIGZyb20gJy4vdHJlZS9hY3Rpb24nO1xuZXhwb3J0ICogZnJvbSAnLi9lbmdpbmUvaW5kZXgnO1xuZXhwb3J0ICogZnJvbSAnLi9leGNlcHRpb24vZXhjZXB0aW9uJztcbmV4cG9ydCAqIGZyb20gJy4vdHJlZS9pbnRlcmZhY2UnO1xuZXhwb3J0ICogZnJvbSAnLi9ydWxlcy9iYXNlJztcbmV4cG9ydCAqIGZyb20gJy4vcnVsZXMvY2FsbCc7XG5leHBvcnQgKiBmcm9tICcuL3J1bGVzL21vdmUnO1xuZXhwb3J0ICogZnJvbSAnLi9ydWxlcy9yYW5kb20nO1xuZXhwb3J0ICogZnJvbSAnLi9ydWxlcy9zY2hlbWF0aWMnO1xuZXhwb3J0ICogZnJvbSAnLi9ydWxlcy90ZW1wbGF0ZSc7XG5leHBvcnQgKiBmcm9tICcuL3J1bGVzL3VybCc7XG5leHBvcnQgKiBmcm9tICcuL3RyZWUvZGVsZWdhdGUnO1xuZXhwb3J0ICogZnJvbSAnLi90cmVlL2VtcHR5JztcbmV4cG9ydCAqIGZyb20gJy4vdHJlZS9ob3N0LXRyZWUnO1xuZXhwb3J0IHsgVXBkYXRlUmVjb3JkZXIgfSBmcm9tICcuL3RyZWUvaW50ZXJmYWNlJztcbmV4cG9ydCAqIGZyb20gJy4vZW5naW5lL3NjaGVtYXRpYyc7XG5leHBvcnQgKiBmcm9tICcuL3NpbmsvZHJ5cnVuJztcbmV4cG9ydCAqIGZyb20gJy4vc2luay9ob3N0JztcbmV4cG9ydCAqIGZyb20gJy4vc2luay9zaW5rJztcbmV4cG9ydCB7IGZvcm1hdHMgfTtcbmV4cG9ydCB7IHdvcmtmbG93IH07XG5cbmV4cG9ydCBpbnRlcmZhY2UgVHJlZUNvbnN0cnVjdG9yIHtcbiAgZW1wdHkoKTogVHJlZUludGVyZmFjZTtcbiAgYnJhbmNoKHRyZWU6IFRyZWVJbnRlcmZhY2UpOiBUcmVlSW50ZXJmYWNlO1xuICBtZXJnZSh0cmVlOiBUcmVlSW50ZXJmYWNlLCBvdGhlcjogVHJlZUludGVyZmFjZSwgc3RyYXRlZ3k/OiBNZXJnZVN0cmF0ZWd5KTogVHJlZUludGVyZmFjZTtcbiAgcGFydGl0aW9uKHRyZWU6IFRyZWVJbnRlcmZhY2UsIHByZWRpY2F0ZTogRmlsZVByZWRpY2F0ZTxib29sZWFuPik6IFtUcmVlSW50ZXJmYWNlLCBUcmVlSW50ZXJmYWNlXTtcbiAgb3B0aW1pemUodHJlZTogVHJlZUludGVyZmFjZSk6IFRyZWVJbnRlcmZhY2U7XG59XG5cbmV4cG9ydCB0eXBlIFRyZWUgPSBUcmVlSW50ZXJmYWNlO1xuZXhwb3J0IGNvbnN0IFRyZWU6IFRyZWVDb25zdHJ1Y3RvciA9IHtcbiAgZW1wdHkoKSB7XG4gICAgcmV0dXJuIGVtcHR5KCk7XG4gIH0sXG4gIGJyYW5jaCh0cmVlOiBUcmVlSW50ZXJmYWNlKSB7XG4gICAgcmV0dXJuIGJyYW5jaCh0cmVlKTtcbiAgfSxcbiAgbWVyZ2UoXG4gICAgdHJlZTogVHJlZUludGVyZmFjZSxcbiAgICBvdGhlcjogVHJlZUludGVyZmFjZSxcbiAgICBzdHJhdGVneTogTWVyZ2VTdHJhdGVneSA9IE1lcmdlU3RyYXRlZ3kuRGVmYXVsdCxcbiAgKSB7XG4gICAgcmV0dXJuIG1lcmdlKHRyZWUsIG90aGVyLCBzdHJhdGVneSk7XG4gIH0sXG4gIHBhcnRpdGlvbih0cmVlOiBUcmVlSW50ZXJmYWNlLCBwcmVkaWNhdGU6IEZpbGVQcmVkaWNhdGU8Ym9vbGVhbj4pIHtcbiAgICByZXR1cm4gcGFydGl0aW9uKHRyZWUsIHByZWRpY2F0ZSk7XG4gIH0sXG4gIG9wdGltaXplKHRyZWU6IFRyZWVJbnRlcmZhY2UpIHtcbiAgICByZXR1cm4gdHJlZTtcbiAgfSxcbn07XG4iXX0=