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
class InvalidInputOptions extends core_1.BaseException {
    // tslint:disable-next-line:no-any
    constructor(options, errors) {
        super(`Schematic input does not validate against the Schema: ${JSON.stringify(options)}\n`
            + `Errors:\n  ${errors.join('\n  ')}`);
    }
}
exports.InvalidInputOptions = InvalidInputOptions;
// tslint:disable-next-line:no-any
function _deepCopy(object) {
    return JSON.parse(JSON.stringify(object));
    // const copy = {} as T;
    // for (const key of Object.keys(object)) {
    //   if (typeof object[key] == 'object') {
    //     copy[key] = _deepCopy(object[key]);
    //     break;
    //   } else {
    //       copy[key] = object[key];
    //   }
    // }
    // return copy;
}
// This can only be used in NodeJS.
function validateOptionsWithSchema(registry) {
    return (schematic, options) => {
        // Prevent a schematic from changing the options object by making a copy of it.
        options = _deepCopy(options);
        if (schematic.schema && schematic.schemaJson) {
            // Make a deep copy of options.
            return registry
                .compile(schematic.schemaJson)
                .pipe(operators_1.mergeMap(validator => validator(options)), operators_1.first(), operators_1.map(result => {
                if (!result.success) {
                    throw new InvalidInputOptions(options, result.errors || ['Unknown reason.']);
                }
                return options;
            }));
        }
        return rxjs_1.of(options);
    };
}
exports.validateOptionsWithSchema = validateOptionsWithSchema;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0uanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvc2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FHOEI7QUFDOUIsK0JBQXNEO0FBQ3RELDhDQUFzRDtBQVF0RCx5QkFBaUMsU0FBUSxvQkFBYTtJQUNwRCxrQ0FBa0M7SUFDbEMsWUFBWSxPQUFZLEVBQUUsTUFBZ0I7UUFDeEMsS0FBSyxDQUFDLHlEQUF5RCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJO2NBQ3BGLGNBQWMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDN0MsQ0FBQztDQUNGO0FBTkQsa0RBTUM7QUFHRCxrQ0FBa0M7QUFDbEMsbUJBQW1ELE1BQVM7SUFDMUQsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQzFDLHdCQUF3QjtJQUN4QiwyQ0FBMkM7SUFDM0MsMENBQTBDO0lBQzFDLDBDQUEwQztJQUMxQyxhQUFhO0lBQ2IsYUFBYTtJQUNiLGlDQUFpQztJQUNqQyxNQUFNO0lBQ04sSUFBSTtJQUVKLGVBQWU7QUFDakIsQ0FBQztBQUdELG1DQUFtQztBQUNuQyxtQ0FBMEMsUUFBK0I7SUFDdkUsTUFBTSxDQUFDLENBQWUsU0FBd0IsRUFBRSxPQUFVLEVBQWlCLEVBQUU7UUFDM0UsK0VBQStFO1FBQy9FLE9BQU8sR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFN0IsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUM3QywrQkFBK0I7WUFDL0IsTUFBTSxDQUFDLFFBQVE7aUJBQ1osT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7aUJBQzdCLElBQUksQ0FDSCxvQkFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQ3pDLGlCQUFLLEVBQUUsRUFDUCxlQUFHLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ1gsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFDcEIsTUFBTSxJQUFJLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO2dCQUMvRSxDQUFDO2dCQUVELE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDakIsQ0FBQyxDQUFDLENBQ0gsQ0FBQztRQUNOLENBQUM7UUFFRCxNQUFNLENBQUMsU0FBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQy9CLENBQUMsQ0FBQztBQUNKLENBQUM7QUF4QkQsOERBd0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgQmFzZUV4Y2VwdGlvbixcbiAgc2NoZW1hLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBvZiBhcyBvYnNlcnZhYmxlT2YgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGZpcnN0LCBtYXAsIG1lcmdlTWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgU2NoZW1hdGljRGVzY3JpcHRpb24gfSBmcm9tICcuLi9zcmMnO1xuaW1wb3J0IHsgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjcmlwdGlvbiwgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uIH0gZnJvbSAnLi9kZXNjcmlwdGlvbic7XG5cbmV4cG9ydCB0eXBlIFNjaGVtYXRpY0Rlc2MgPVxuICBTY2hlbWF0aWNEZXNjcmlwdGlvbjxGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2NyaXB0aW9uLCBGaWxlU3lzdGVtU2NoZW1hdGljRGVzY3JpcHRpb24+O1xuXG5cbmV4cG9ydCBjbGFzcyBJbnZhbGlkSW5wdXRPcHRpb25zIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgY29uc3RydWN0b3Iob3B0aW9uczogYW55LCBlcnJvcnM6IHN0cmluZ1tdKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpYyBpbnB1dCBkb2VzIG5vdCB2YWxpZGF0ZSBhZ2FpbnN0IHRoZSBTY2hlbWE6ICR7SlNPTi5zdHJpbmdpZnkob3B0aW9ucyl9XFxuYFxuICAgICAgICArIGBFcnJvcnM6XFxuICAke2Vycm9ycy5qb2luKCdcXG4gICcpfWApO1xuICB9XG59XG5cblxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuZnVuY3Rpb24gX2RlZXBDb3B5PFQgZXh0ZW5kcyB7W2tleTogc3RyaW5nXTogYW55fT4ob2JqZWN0OiBUKTogVCB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iamVjdCkpO1xuICAvLyBjb25zdCBjb3B5ID0ge30gYXMgVDtcbiAgLy8gZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMob2JqZWN0KSkge1xuICAvLyAgIGlmICh0eXBlb2Ygb2JqZWN0W2tleV0gPT0gJ29iamVjdCcpIHtcbiAgLy8gICAgIGNvcHlba2V5XSA9IF9kZWVwQ29weShvYmplY3Rba2V5XSk7XG4gIC8vICAgICBicmVhaztcbiAgLy8gICB9IGVsc2Uge1xuICAvLyAgICAgICBjb3B5W2tleV0gPSBvYmplY3Rba2V5XTtcbiAgLy8gICB9XG4gIC8vIH1cblxuICAvLyByZXR1cm4gY29weTtcbn1cblxuXG4vLyBUaGlzIGNhbiBvbmx5IGJlIHVzZWQgaW4gTm9kZUpTLlxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlT3B0aW9uc1dpdGhTY2hlbWEocmVnaXN0cnk6IHNjaGVtYS5TY2hlbWFSZWdpc3RyeSkge1xuICByZXR1cm4gPFQgZXh0ZW5kcyB7fT4oc2NoZW1hdGljOiBTY2hlbWF0aWNEZXNjLCBvcHRpb25zOiBUKTogT2JzZXJ2YWJsZTxUPiA9PiB7XG4gICAgLy8gUHJldmVudCBhIHNjaGVtYXRpYyBmcm9tIGNoYW5naW5nIHRoZSBvcHRpb25zIG9iamVjdCBieSBtYWtpbmcgYSBjb3B5IG9mIGl0LlxuICAgIG9wdGlvbnMgPSBfZGVlcENvcHkob3B0aW9ucyk7XG5cbiAgICBpZiAoc2NoZW1hdGljLnNjaGVtYSAmJiBzY2hlbWF0aWMuc2NoZW1hSnNvbikge1xuICAgICAgLy8gTWFrZSBhIGRlZXAgY29weSBvZiBvcHRpb25zLlxuICAgICAgcmV0dXJuIHJlZ2lzdHJ5XG4gICAgICAgIC5jb21waWxlKHNjaGVtYXRpYy5zY2hlbWFKc29uKVxuICAgICAgICAucGlwZShcbiAgICAgICAgICBtZXJnZU1hcCh2YWxpZGF0b3IgPT4gdmFsaWRhdG9yKG9wdGlvbnMpKSxcbiAgICAgICAgICBmaXJzdCgpLFxuICAgICAgICAgIG1hcChyZXN1bHQgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZElucHV0T3B0aW9ucyhvcHRpb25zLCByZXN1bHQuZXJyb3JzIHx8IFsnVW5rbm93biByZWFzb24uJ10pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucztcbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKG9wdGlvbnMpO1xuICB9O1xufVxuIl19