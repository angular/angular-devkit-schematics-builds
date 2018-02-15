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
const operators_1 = require("rxjs/operators");
function formatValidator(data, dataSchema, formats) {
    const registry = new core_1.schema.CoreSchemaRegistry();
    for (const format of formats) {
        registry.addFormat(format);
    }
    return registry
        .compile(dataSchema)
        .pipe(operators_1.mergeMap(validator => validator(data)));
}
exports.formatValidator = formatValidator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0LXZhbGlkYXRvci5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvZm9ybWF0cy9mb3JtYXQtdmFsaWRhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQXFFO0FBRXJFLDhDQUEwQztBQUcxQyx5QkFDRSxJQUFlLEVBQ2YsVUFBc0IsRUFDdEIsT0FBOEI7SUFFOUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxhQUFNLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztJQUVqRCxHQUFHLENBQUMsQ0FBQyxNQUFNLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzdCLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUFRO1NBQ1osT0FBTyxDQUFDLFVBQVUsQ0FBQztTQUNuQixJQUFJLENBQUMsb0JBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEQsQ0FBQztBQWRELDBDQWNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgSnNvbk9iamVjdCwgSnNvblZhbHVlLCBzY2hlbWEgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcy9PYnNlcnZhYmxlJztcbmltcG9ydCB7IG1lcmdlTWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRWYWxpZGF0b3IoXG4gIGRhdGE6IEpzb25WYWx1ZSxcbiAgZGF0YVNjaGVtYTogSnNvbk9iamVjdCxcbiAgZm9ybWF0czogc2NoZW1hLlNjaGVtYUZvcm1hdFtdLFxuKTogT2JzZXJ2YWJsZTxzY2hlbWEuU2NoZW1hVmFsaWRhdG9yUmVzdWx0PiB7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gbmV3IHNjaGVtYS5Db3JlU2NoZW1hUmVnaXN0cnkoKTtcblxuICBmb3IgKGNvbnN0IGZvcm1hdCBvZiBmb3JtYXRzKSB7XG4gICAgcmVnaXN0cnkuYWRkRm9ybWF0KGZvcm1hdCk7XG4gIH1cblxuICByZXR1cm4gcmVnaXN0cnlcbiAgICAuY29tcGlsZShkYXRhU2NoZW1hKVxuICAgIC5waXBlKG1lcmdlTWFwKHZhbGlkYXRvciA9PiB2YWxpZGF0b3IoZGF0YSkpKTtcbn1cbiJdfQ==