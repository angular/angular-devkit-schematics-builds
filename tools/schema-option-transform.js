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
            + `Errors:\n  ${core_1.schema.SchemaValidationException.createMessages(errors).join('\n  ')}`);
        this.errors = errors;
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
                    throw new InvalidInputOptions(options, result.errors || []);
                }
                return options;
            }));
        }
        return rxjs_1.of(options);
    };
}
exports.validateOptionsWithSchema = validateOptionsWithSchema;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0uanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvc2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FHOEI7QUFDOUIsK0JBQXNEO0FBQ3RELDhDQUFzRDtBQVF0RCx5QkFBaUMsU0FBUSxvQkFBYTtJQUNwRCxrQ0FBa0M7SUFDbEMsWUFBWSxPQUFZLEVBQWtCLE1BQXFDO1FBQzdFLEtBQUssQ0FBQyx5REFBeUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSTtjQUNwRixjQUFjLGFBQU0sQ0FBQyx5QkFBeUIsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUZwRCxXQUFNLEdBQU4sTUFBTSxDQUErQjtJQUcvRSxDQUFDO0NBQ0Y7QUFORCxrREFNQztBQUdELGtDQUFrQztBQUNsQyxtQkFBbUQsTUFBUztJQUMxRCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDMUMsd0JBQXdCO0lBQ3hCLDJDQUEyQztJQUMzQywwQ0FBMEM7SUFDMUMsMENBQTBDO0lBQzFDLGFBQWE7SUFDYixhQUFhO0lBQ2IsaUNBQWlDO0lBQ2pDLE1BQU07SUFDTixJQUFJO0lBRUosZUFBZTtBQUNqQixDQUFDO0FBR0QsbUNBQW1DO0FBQ25DLG1DQUEwQyxRQUErQjtJQUN2RSxNQUFNLENBQUMsQ0FBZSxTQUF3QixFQUFFLE9BQVUsRUFBaUIsRUFBRTtRQUMzRSwrRUFBK0U7UUFDL0UsT0FBTyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUU3QixFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQzdDLCtCQUErQjtZQUMvQixNQUFNLENBQUMsUUFBUTtpQkFDWixPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQztpQkFDN0IsSUFBSSxDQUNILG9CQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsRUFDekMsaUJBQUssRUFBRSxFQUNQLGVBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDWCxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUNwQixNQUFNLElBQUksbUJBQW1CLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQzlELENBQUM7Z0JBRUQsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUNqQixDQUFDLENBQUMsQ0FDSCxDQUFDO1FBQ04sQ0FBQztRQUVELE1BQU0sQ0FBQyxTQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDL0IsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQXhCRCw4REF3QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1xuICBCYXNlRXhjZXB0aW9uLFxuICBzY2hlbWEsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIG9mIGFzIG9ic2VydmFibGVPZiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgZmlyc3QsIG1hcCwgbWVyZ2VNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBTY2hlbWF0aWNEZXNjcmlwdGlvbiB9IGZyb20gJy4uL3NyYyc7XG5pbXBvcnQgeyBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2NyaXB0aW9uLCBGaWxlU3lzdGVtU2NoZW1hdGljRGVzY3JpcHRpb24gfSBmcm9tICcuL2Rlc2NyaXB0aW9uJztcblxuZXhwb3J0IHR5cGUgU2NoZW1hdGljRGVzYyA9XG4gIFNjaGVtYXRpY0Rlc2NyaXB0aW9uPEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzY3JpcHRpb24sIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbj47XG5cblxuZXhwb3J0IGNsYXNzIEludmFsaWRJbnB1dE9wdGlvbnMgZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBhbnksIHB1YmxpYyByZWFkb25seSBlcnJvcnM6IHNjaGVtYS5TY2hlbWFWYWxpZGF0b3JFcnJvcltdKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpYyBpbnB1dCBkb2VzIG5vdCB2YWxpZGF0ZSBhZ2FpbnN0IHRoZSBTY2hlbWE6ICR7SlNPTi5zdHJpbmdpZnkob3B0aW9ucyl9XFxuYFxuICAgICAgICArIGBFcnJvcnM6XFxuICAke3NjaGVtYS5TY2hlbWFWYWxpZGF0aW9uRXhjZXB0aW9uLmNyZWF0ZU1lc3NhZ2VzKGVycm9ycykuam9pbignXFxuICAnKX1gKTtcbiAgfVxufVxuXG5cbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbmZ1bmN0aW9uIF9kZWVwQ29weTxUIGV4dGVuZHMge1trZXk6IHN0cmluZ106IGFueX0+KG9iamVjdDogVCk6IFQge1xuICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvYmplY3QpKTtcbiAgLy8gY29uc3QgY29weSA9IHt9IGFzIFQ7XG4gIC8vIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKG9iamVjdCkpIHtcbiAgLy8gICBpZiAodHlwZW9mIG9iamVjdFtrZXldID09ICdvYmplY3QnKSB7XG4gIC8vICAgICBjb3B5W2tleV0gPSBfZGVlcENvcHkob2JqZWN0W2tleV0pO1xuICAvLyAgICAgYnJlYWs7XG4gIC8vICAgfSBlbHNlIHtcbiAgLy8gICAgICAgY29weVtrZXldID0gb2JqZWN0W2tleV07XG4gIC8vICAgfVxuICAvLyB9XG5cbiAgLy8gcmV0dXJuIGNvcHk7XG59XG5cblxuLy8gVGhpcyBjYW4gb25seSBiZSB1c2VkIGluIE5vZGVKUy5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZU9wdGlvbnNXaXRoU2NoZW1hKHJlZ2lzdHJ5OiBzY2hlbWEuU2NoZW1hUmVnaXN0cnkpIHtcbiAgcmV0dXJuIDxUIGV4dGVuZHMge30+KHNjaGVtYXRpYzogU2NoZW1hdGljRGVzYywgb3B0aW9uczogVCk6IE9ic2VydmFibGU8VD4gPT4ge1xuICAgIC8vIFByZXZlbnQgYSBzY2hlbWF0aWMgZnJvbSBjaGFuZ2luZyB0aGUgb3B0aW9ucyBvYmplY3QgYnkgbWFraW5nIGEgY29weSBvZiBpdC5cbiAgICBvcHRpb25zID0gX2RlZXBDb3B5KG9wdGlvbnMpO1xuXG4gICAgaWYgKHNjaGVtYXRpYy5zY2hlbWEgJiYgc2NoZW1hdGljLnNjaGVtYUpzb24pIHtcbiAgICAgIC8vIE1ha2UgYSBkZWVwIGNvcHkgb2Ygb3B0aW9ucy5cbiAgICAgIHJldHVybiByZWdpc3RyeVxuICAgICAgICAuY29tcGlsZShzY2hlbWF0aWMuc2NoZW1hSnNvbilcbiAgICAgICAgLnBpcGUoXG4gICAgICAgICAgbWVyZ2VNYXAodmFsaWRhdG9yID0+IHZhbGlkYXRvcihvcHRpb25zKSksXG4gICAgICAgICAgZmlyc3QoKSxcbiAgICAgICAgICBtYXAocmVzdWx0ID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRJbnB1dE9wdGlvbnMob3B0aW9ucywgcmVzdWx0LmVycm9ycyB8fCBbXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zO1xuICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBvYnNlcnZhYmxlT2Yob3B0aW9ucyk7XG4gIH07XG59XG4iXX0=