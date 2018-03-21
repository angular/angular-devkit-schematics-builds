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
const of_1 = require("rxjs/observable/of");
const first_1 = require("rxjs/operators/first");
const map_1 = require("rxjs/operators/map");
const mergeMap_1 = require("rxjs/operators/mergeMap");
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
                .pipe(mergeMap_1.mergeMap(validator => validator(options)), first_1.first(), map_1.map(result => {
                if (!result.success) {
                    throw new InvalidInputOptions(options, result.errors || ['Unknown reason.']);
                }
                return options;
            }));
        }
        return of_1.of(options);
    };
}
exports.validateOptionsWithSchema = validateOptionsWithSchema;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0uanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvc2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FHOEI7QUFFOUIsMkNBQXdEO0FBQ3hELGdEQUE2QztBQUM3Qyw0Q0FBeUM7QUFDekMsc0RBQW1EO0FBUW5ELHlCQUFpQyxTQUFRLG9CQUFhO0lBQ3BELGtDQUFrQztJQUNsQyxZQUFZLE9BQVksRUFBRSxNQUFnQjtRQUN4QyxLQUFLLENBQUMseURBQXlELElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUk7Y0FDcEYsY0FBYyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM3QyxDQUFDO0NBQ0Y7QUFORCxrREFNQztBQUdELGtDQUFrQztBQUNsQyxtQkFBbUQsTUFBUztJQUMxRCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDMUMsd0JBQXdCO0lBQ3hCLDJDQUEyQztJQUMzQywwQ0FBMEM7SUFDMUMsMENBQTBDO0lBQzFDLGFBQWE7SUFDYixhQUFhO0lBQ2IsaUNBQWlDO0lBQ2pDLE1BQU07SUFDTixJQUFJO0lBRUosZUFBZTtBQUNqQixDQUFDO0FBR0QsbUNBQW1DO0FBQ25DLG1DQUEwQyxRQUErQjtJQUN2RSxNQUFNLENBQUMsQ0FBZSxTQUF3QixFQUFFLE9BQVUsRUFBaUIsRUFBRTtRQUMzRSwrRUFBK0U7UUFDL0UsT0FBTyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUU3QixFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQzdDLCtCQUErQjtZQUMvQixNQUFNLENBQUMsUUFBUTtpQkFDWixPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQztpQkFDN0IsSUFBSSxDQUNILG1CQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsRUFDekMsYUFBSyxFQUFFLEVBQ1AsU0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNYLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQ3BCLE1BQU0sSUFBSSxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDL0UsQ0FBQztnQkFFRCxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQ2pCLENBQUMsQ0FBQyxDQUNILENBQUM7UUFDTixDQUFDO1FBRUQsTUFBTSxDQUFDLE9BQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMvQixDQUFDLENBQUM7QUFDSixDQUFDO0FBeEJELDhEQXdCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7XG4gIEJhc2VFeGNlcHRpb24sXG4gIHNjaGVtYSxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMvT2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBvZiBhcyBvYnNlcnZhYmxlT2YgfSBmcm9tICdyeGpzL29ic2VydmFibGUvb2YnO1xuaW1wb3J0IHsgZmlyc3QgfSBmcm9tICdyeGpzL29wZXJhdG9ycy9maXJzdCc7XG5pbXBvcnQgeyBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycy9tYXAnO1xuaW1wb3J0IHsgbWVyZ2VNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycy9tZXJnZU1hcCc7XG5pbXBvcnQgeyBTY2hlbWF0aWNEZXNjcmlwdGlvbiB9IGZyb20gJy4uL3NyYyc7XG5pbXBvcnQgeyBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2NyaXB0aW9uLCBGaWxlU3lzdGVtU2NoZW1hdGljRGVzY3JpcHRpb24gfSBmcm9tICcuL2Rlc2NyaXB0aW9uJztcblxuZXhwb3J0IHR5cGUgU2NoZW1hdGljRGVzYyA9XG4gIFNjaGVtYXRpY0Rlc2NyaXB0aW9uPEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzY3JpcHRpb24sIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbj47XG5cblxuZXhwb3J0IGNsYXNzIEludmFsaWRJbnB1dE9wdGlvbnMgZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBhbnksIGVycm9yczogc3RyaW5nW10pIHtcbiAgICBzdXBlcihgU2NoZW1hdGljIGlucHV0IGRvZXMgbm90IHZhbGlkYXRlIGFnYWluc3QgdGhlIFNjaGVtYTogJHtKU09OLnN0cmluZ2lmeShvcHRpb25zKX1cXG5gXG4gICAgICAgICsgYEVycm9yczpcXG4gICR7ZXJyb3JzLmpvaW4oJ1xcbiAgJyl9YCk7XG4gIH1cbn1cblxuXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG5mdW5jdGlvbiBfZGVlcENvcHk8VCBleHRlbmRzIHtba2V5OiBzdHJpbmddOiBhbnl9PihvYmplY3Q6IFQpOiBUIHtcbiAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkob2JqZWN0KSk7XG4gIC8vIGNvbnN0IGNvcHkgPSB7fSBhcyBUO1xuICAvLyBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhvYmplY3QpKSB7XG4gIC8vICAgaWYgKHR5cGVvZiBvYmplY3Rba2V5XSA9PSAnb2JqZWN0Jykge1xuICAvLyAgICAgY29weVtrZXldID0gX2RlZXBDb3B5KG9iamVjdFtrZXldKTtcbiAgLy8gICAgIGJyZWFrO1xuICAvLyAgIH0gZWxzZSB7XG4gIC8vICAgICAgIGNvcHlba2V5XSA9IG9iamVjdFtrZXldO1xuICAvLyAgIH1cbiAgLy8gfVxuXG4gIC8vIHJldHVybiBjb3B5O1xufVxuXG5cbi8vIFRoaXMgY2FuIG9ubHkgYmUgdXNlZCBpbiBOb2RlSlMuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVPcHRpb25zV2l0aFNjaGVtYShyZWdpc3RyeTogc2NoZW1hLlNjaGVtYVJlZ2lzdHJ5KSB7XG4gIHJldHVybiA8VCBleHRlbmRzIHt9PihzY2hlbWF0aWM6IFNjaGVtYXRpY0Rlc2MsIG9wdGlvbnM6IFQpOiBPYnNlcnZhYmxlPFQ+ID0+IHtcbiAgICAvLyBQcmV2ZW50IGEgc2NoZW1hdGljIGZyb20gY2hhbmdpbmcgdGhlIG9wdGlvbnMgb2JqZWN0IGJ5IG1ha2luZyBhIGNvcHkgb2YgaXQuXG4gICAgb3B0aW9ucyA9IF9kZWVwQ29weShvcHRpb25zKTtcblxuICAgIGlmIChzY2hlbWF0aWMuc2NoZW1hICYmIHNjaGVtYXRpYy5zY2hlbWFKc29uKSB7XG4gICAgICAvLyBNYWtlIGEgZGVlcCBjb3B5IG9mIG9wdGlvbnMuXG4gICAgICByZXR1cm4gcmVnaXN0cnlcbiAgICAgICAgLmNvbXBpbGUoc2NoZW1hdGljLnNjaGVtYUpzb24pXG4gICAgICAgIC5waXBlKFxuICAgICAgICAgIG1lcmdlTWFwKHZhbGlkYXRvciA9PiB2YWxpZGF0b3Iob3B0aW9ucykpLFxuICAgICAgICAgIGZpcnN0KCksXG4gICAgICAgICAgbWFwKHJlc3VsdCA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBJbnZhbGlkSW5wdXRPcHRpb25zKG9wdGlvbnMsIHJlc3VsdC5lcnJvcnMgfHwgWydVbmtub3duIHJlYXNvbi4nXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zO1xuICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBvYnNlcnZhYmxlT2Yob3B0aW9ucyk7XG4gIH07XG59XG4iXX0=