"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOptionsWithSchema = exports.InvalidInputOptions = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class InvalidInputOptions extends core_1.schema.SchemaValidationException {
    constructor(options, errors) {
        super(errors, `Schematic input does not validate against the Schema: ${JSON.stringify(options)}\nErrors:\n`);
    }
}
exports.InvalidInputOptions = InvalidInputOptions;
// This can only be used in NodeJS.
function validateOptionsWithSchema(registry) {
    return (schematic, options, context) => {
        // Prevent a schematic from changing the options object by making a copy of it.
        options = (0, core_1.deepCopy)(options);
        const withPrompts = context ? context.interactive : true;
        if (schematic.schema && schematic.schemaJson) {
            // Make a deep copy of options.
            return registry.compile(schematic.schemaJson).pipe((0, operators_1.mergeMap)((validator) => validator(options, { withPrompts })), (0, operators_1.first)(), (0, operators_1.map)((result) => {
                if (!result.success) {
                    throw new InvalidInputOptions(options, result.errors || []);
                }
                return options;
            }));
        }
        return (0, rxjs_1.of)(options);
    };
}
exports.validateOptionsWithSchema = validateOptionsWithSchema;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rvb2xzL3NjaGVtYS1vcHRpb24tdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtDQUF3RDtBQUN4RCwrQkFBc0Q7QUFDdEQsOENBQXNEO0FBR3RELE1BQWEsbUJBQTRCLFNBQVEsYUFBTSxDQUFDLHlCQUF5QjtJQUMvRSxZQUFZLE9BQVUsRUFBRSxNQUFxQztRQUMzRCxLQUFLLENBQ0gsTUFBTSxFQUNOLHlEQUF5RCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQzlGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFQRCxrREFPQztBQUVELG1DQUFtQztBQUNuQyxTQUFnQix5QkFBeUIsQ0FBQyxRQUErQjtJQUN2RSxPQUFPLENBQ0wsU0FBeUMsRUFDekMsT0FBVSxFQUNWLE9BQW9DLEVBQ3JCLEVBQUU7UUFDakIsK0VBQStFO1FBQy9FLE9BQU8sR0FBRyxJQUFBLGVBQVEsRUFBQyxPQUFPLENBQUMsQ0FBQztRQUU1QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUV6RCxJQUFJLFNBQVMsQ0FBQyxNQUFNLElBQUksU0FBUyxDQUFDLFVBQVUsRUFBRTtZQUM1QywrQkFBK0I7WUFDL0IsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQ2hELElBQUEsb0JBQVEsRUFBQyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFDNUQsSUFBQSxpQkFBSyxHQUFFLEVBQ1AsSUFBQSxlQUFHLEVBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDYixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRTtvQkFDbkIsTUFBTSxJQUFJLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2lCQUM3RDtnQkFFRCxPQUFPLE9BQU8sQ0FBQztZQUNqQixDQUFDLENBQUMsQ0FDSCxDQUFDO1NBQ0g7UUFFRCxPQUFPLElBQUEsU0FBWSxFQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQy9CLENBQUMsQ0FBQztBQUNKLENBQUM7QUE1QkQsOERBNEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGRlZXBDb3B5LCBzY2hlbWEgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBvZiBhcyBvYnNlcnZhYmxlT2YgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGZpcnN0LCBtYXAsIG1lcmdlTWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQsIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbiB9IGZyb20gJy4vZGVzY3JpcHRpb24nO1xuXG5leHBvcnQgY2xhc3MgSW52YWxpZElucHV0T3B0aW9uczxUID0ge30+IGV4dGVuZHMgc2NoZW1hLlNjaGVtYVZhbGlkYXRpb25FeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBULCBlcnJvcnM6IHNjaGVtYS5TY2hlbWFWYWxpZGF0b3JFcnJvcltdKSB7XG4gICAgc3VwZXIoXG4gICAgICBlcnJvcnMsXG4gICAgICBgU2NoZW1hdGljIGlucHV0IGRvZXMgbm90IHZhbGlkYXRlIGFnYWluc3QgdGhlIFNjaGVtYTogJHtKU09OLnN0cmluZ2lmeShvcHRpb25zKX1cXG5FcnJvcnM6XFxuYCxcbiAgICApO1xuICB9XG59XG5cbi8vIFRoaXMgY2FuIG9ubHkgYmUgdXNlZCBpbiBOb2RlSlMuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVPcHRpb25zV2l0aFNjaGVtYShyZWdpc3RyeTogc2NoZW1hLlNjaGVtYVJlZ2lzdHJ5KSB7XG4gIHJldHVybiA8VCBleHRlbmRzIHt9PihcbiAgICBzY2hlbWF0aWM6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbixcbiAgICBvcHRpb25zOiBULFxuICAgIGNvbnRleHQ/OiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCxcbiAgKTogT2JzZXJ2YWJsZTxUPiA9PiB7XG4gICAgLy8gUHJldmVudCBhIHNjaGVtYXRpYyBmcm9tIGNoYW5naW5nIHRoZSBvcHRpb25zIG9iamVjdCBieSBtYWtpbmcgYSBjb3B5IG9mIGl0LlxuICAgIG9wdGlvbnMgPSBkZWVwQ29weShvcHRpb25zKTtcblxuICAgIGNvbnN0IHdpdGhQcm9tcHRzID0gY29udGV4dCA/IGNvbnRleHQuaW50ZXJhY3RpdmUgOiB0cnVlO1xuXG4gICAgaWYgKHNjaGVtYXRpYy5zY2hlbWEgJiYgc2NoZW1hdGljLnNjaGVtYUpzb24pIHtcbiAgICAgIC8vIE1ha2UgYSBkZWVwIGNvcHkgb2Ygb3B0aW9ucy5cbiAgICAgIHJldHVybiByZWdpc3RyeS5jb21waWxlKHNjaGVtYXRpYy5zY2hlbWFKc29uKS5waXBlKFxuICAgICAgICBtZXJnZU1hcCgodmFsaWRhdG9yKSA9PiB2YWxpZGF0b3Iob3B0aW9ucywgeyB3aXRoUHJvbXB0cyB9KSksXG4gICAgICAgIGZpcnN0KCksXG4gICAgICAgIG1hcCgocmVzdWx0KSA9PiB7XG4gICAgICAgICAgaWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRJbnB1dE9wdGlvbnMob3B0aW9ucywgcmVzdWx0LmVycm9ycyB8fCBbXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKG9wdGlvbnMpO1xuICB9O1xufVxuIl19