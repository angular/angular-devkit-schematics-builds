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
        options = core_1.deepCopy(options);
        const withPrompts = context ? context.interactive : true;
        if (schematic.schema && schematic.schemaJson) {
            // Make a deep copy of options.
            return registry
                .compile(schematic.schemaJson)
                .pipe(operators_1.mergeMap(validator => validator(options, { withPrompts })), operators_1.first(), operators_1.map(result => {
                if (!result.success) {
                    throw new InvalidInputOptions(options, result.errors || []);
                }
                return options;
            }));
        }
        return rxjs_1.of(options);
    };
}
exports.validateOptionsWithSchema = validateOptionsWithSchema;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0uanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvc2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FBd0Q7QUFDeEQsK0JBQXNEO0FBQ3RELDhDQUFzRDtBQUd0RCx5QkFBeUMsU0FBUSxhQUFNLENBQUMseUJBQXlCO0lBQy9FLFlBQVksT0FBVSxFQUFFLE1BQXFDO1FBQzNELEtBQUssQ0FDSCxNQUFNLEVBQ04seURBQXlELElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FDOUYsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQVBELGtEQU9DO0FBRUQsbUNBQW1DO0FBQ25DLG1DQUEwQyxRQUErQjtJQUN2RSxPQUFPLENBQ0wsU0FBeUMsRUFDekMsT0FBVSxFQUNWLE9BQW9DLEVBQ3JCLEVBQUU7UUFDakIsK0VBQStFO1FBQy9FLE9BQU8sR0FBRyxlQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFNUIsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFFekQsSUFBSSxTQUFTLENBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxVQUFVLEVBQUU7WUFDNUMsK0JBQStCO1lBQy9CLE9BQU8sUUFBUTtpQkFDWixPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQztpQkFDN0IsSUFBSSxDQUNILG9CQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUMxRCxpQkFBSyxFQUFFLEVBQ1AsZUFBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNYLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO29CQUNuQixNQUFNLElBQUksbUJBQW1CLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUM7aUJBQzdEO2dCQUVELE9BQU8sT0FBTyxDQUFDO1lBQ2pCLENBQUMsQ0FBQyxDQUNILENBQUM7U0FDTDtRQUVELE9BQU8sU0FBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQy9CLENBQUMsQ0FBQztBQUNKLENBQUM7QUE5QkQsOERBOEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgZGVlcENvcHksIHNjaGVtYSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIG9mIGFzIG9ic2VydmFibGVPZiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgZmlyc3QsIG1hcCwgbWVyZ2VNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCwgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uIH0gZnJvbSAnLi9kZXNjcmlwdGlvbic7XG5cbmV4cG9ydCBjbGFzcyBJbnZhbGlkSW5wdXRPcHRpb25zPFQgPSB7fT4gZXh0ZW5kcyBzY2hlbWEuU2NoZW1hVmFsaWRhdGlvbkV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFQsIGVycm9yczogc2NoZW1hLlNjaGVtYVZhbGlkYXRvckVycm9yW10pIHtcbiAgICBzdXBlcihcbiAgICAgIGVycm9ycyxcbiAgICAgIGBTY2hlbWF0aWMgaW5wdXQgZG9lcyBub3QgdmFsaWRhdGUgYWdhaW5zdCB0aGUgU2NoZW1hOiAke0pTT04uc3RyaW5naWZ5KG9wdGlvbnMpfVxcbkVycm9yczpcXG5gLFxuICAgICk7XG4gIH1cbn1cblxuLy8gVGhpcyBjYW4gb25seSBiZSB1c2VkIGluIE5vZGVKUy5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZU9wdGlvbnNXaXRoU2NoZW1hKHJlZ2lzdHJ5OiBzY2hlbWEuU2NoZW1hUmVnaXN0cnkpIHtcbiAgcmV0dXJuIDxUIGV4dGVuZHMge30+KFxuICAgIHNjaGVtYXRpYzogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uLFxuICAgIG9wdGlvbnM6IFQsXG4gICAgY29udGV4dD86IEZpbGVTeXN0ZW1TY2hlbWF0aWNDb250ZXh0LFxuICApOiBPYnNlcnZhYmxlPFQ+ID0+IHtcbiAgICAvLyBQcmV2ZW50IGEgc2NoZW1hdGljIGZyb20gY2hhbmdpbmcgdGhlIG9wdGlvbnMgb2JqZWN0IGJ5IG1ha2luZyBhIGNvcHkgb2YgaXQuXG4gICAgb3B0aW9ucyA9IGRlZXBDb3B5KG9wdGlvbnMpO1xuXG4gICAgY29uc3Qgd2l0aFByb21wdHMgPSBjb250ZXh0ID8gY29udGV4dC5pbnRlcmFjdGl2ZSA6IHRydWU7XG5cbiAgICBpZiAoc2NoZW1hdGljLnNjaGVtYSAmJiBzY2hlbWF0aWMuc2NoZW1hSnNvbikge1xuICAgICAgLy8gTWFrZSBhIGRlZXAgY29weSBvZiBvcHRpb25zLlxuICAgICAgcmV0dXJuIHJlZ2lzdHJ5XG4gICAgICAgIC5jb21waWxlKHNjaGVtYXRpYy5zY2hlbWFKc29uKVxuICAgICAgICAucGlwZShcbiAgICAgICAgICBtZXJnZU1hcCh2YWxpZGF0b3IgPT4gdmFsaWRhdG9yKG9wdGlvbnMsIHsgd2l0aFByb21wdHMgfSkpLFxuICAgICAgICAgIGZpcnN0KCksXG4gICAgICAgICAgbWFwKHJlc3VsdCA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBJbnZhbGlkSW5wdXRPcHRpb25zKG9wdGlvbnMsIHJlc3VsdC5lcnJvcnMgfHwgW10pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucztcbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKG9wdGlvbnMpO1xuICB9O1xufVxuIl19