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
// This can only be used in NodeJS.
function validateOptionsWithSchema(registry) {
    return (schematic, options) => {
        // Prevent a schematic from changing the options object by making a copy of it.
        options = core_1.deepCopy(options);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0uanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvc2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FJOEI7QUFDOUIsK0JBQXNEO0FBQ3RELDhDQUFzRDtBQVF0RCx5QkFBaUMsU0FBUSxvQkFBYTtJQUNwRCxrQ0FBa0M7SUFDbEMsWUFBWSxPQUFZLEVBQWtCLE1BQXFDO1FBQzdFLEtBQUssQ0FBQyx5REFBeUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSTtjQUNwRixjQUFjLGFBQU0sQ0FBQyx5QkFBeUIsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUZwRCxXQUFNLEdBQU4sTUFBTSxDQUErQjtJQUcvRSxDQUFDO0NBQ0Y7QUFORCxrREFNQztBQUVELG1DQUFtQztBQUNuQyxtQ0FBMEMsUUFBK0I7SUFDdkUsTUFBTSxDQUFDLENBQWUsU0FBd0IsRUFBRSxPQUFVLEVBQWlCLEVBQUU7UUFDM0UsK0VBQStFO1FBQy9FLE9BQU8sR0FBRyxlQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFNUIsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUM3QywrQkFBK0I7WUFDL0IsTUFBTSxDQUFDLFFBQVE7aUJBQ1osT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7aUJBQzdCLElBQUksQ0FDSCxvQkFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQ3pDLGlCQUFLLEVBQUUsRUFDUCxlQUFHLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ1gsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFDcEIsTUFBTSxJQUFJLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUM5RCxDQUFDO2dCQUVELE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDakIsQ0FBQyxDQUFDLENBQ0gsQ0FBQztRQUNOLENBQUM7UUFFRCxNQUFNLENBQUMsU0FBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQy9CLENBQUMsQ0FBQztBQUNKLENBQUM7QUF4QkQsOERBd0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgQmFzZUV4Y2VwdGlvbixcbiAgZGVlcENvcHksXG4gIHNjaGVtYSxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBmaXJzdCwgbWFwLCBtZXJnZU1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IFNjaGVtYXRpY0Rlc2NyaXB0aW9uIH0gZnJvbSAnLi4vc3JjJztcbmltcG9ydCB7IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzY3JpcHRpb24sIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbiB9IGZyb20gJy4vZGVzY3JpcHRpb24nO1xuXG5leHBvcnQgdHlwZSBTY2hlbWF0aWNEZXNjID1cbiAgU2NoZW1hdGljRGVzY3JpcHRpb248RmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjcmlwdGlvbiwgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uPjtcblxuXG5leHBvcnQgY2xhc3MgSW52YWxpZElucHV0T3B0aW9ucyBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IGFueSwgcHVibGljIHJlYWRvbmx5IGVycm9yczogc2NoZW1hLlNjaGVtYVZhbGlkYXRvckVycm9yW10pIHtcbiAgICBzdXBlcihgU2NoZW1hdGljIGlucHV0IGRvZXMgbm90IHZhbGlkYXRlIGFnYWluc3QgdGhlIFNjaGVtYTogJHtKU09OLnN0cmluZ2lmeShvcHRpb25zKX1cXG5gXG4gICAgICAgICsgYEVycm9yczpcXG4gICR7c2NoZW1hLlNjaGVtYVZhbGlkYXRpb25FeGNlcHRpb24uY3JlYXRlTWVzc2FnZXMoZXJyb3JzKS5qb2luKCdcXG4gICcpfWApO1xuICB9XG59XG5cbi8vIFRoaXMgY2FuIG9ubHkgYmUgdXNlZCBpbiBOb2RlSlMuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVPcHRpb25zV2l0aFNjaGVtYShyZWdpc3RyeTogc2NoZW1hLlNjaGVtYVJlZ2lzdHJ5KSB7XG4gIHJldHVybiA8VCBleHRlbmRzIHt9PihzY2hlbWF0aWM6IFNjaGVtYXRpY0Rlc2MsIG9wdGlvbnM6IFQpOiBPYnNlcnZhYmxlPFQ+ID0+IHtcbiAgICAvLyBQcmV2ZW50IGEgc2NoZW1hdGljIGZyb20gY2hhbmdpbmcgdGhlIG9wdGlvbnMgb2JqZWN0IGJ5IG1ha2luZyBhIGNvcHkgb2YgaXQuXG4gICAgb3B0aW9ucyA9IGRlZXBDb3B5KG9wdGlvbnMpO1xuXG4gICAgaWYgKHNjaGVtYXRpYy5zY2hlbWEgJiYgc2NoZW1hdGljLnNjaGVtYUpzb24pIHtcbiAgICAgIC8vIE1ha2UgYSBkZWVwIGNvcHkgb2Ygb3B0aW9ucy5cbiAgICAgIHJldHVybiByZWdpc3RyeVxuICAgICAgICAuY29tcGlsZShzY2hlbWF0aWMuc2NoZW1hSnNvbilcbiAgICAgICAgLnBpcGUoXG4gICAgICAgICAgbWVyZ2VNYXAodmFsaWRhdG9yID0+IHZhbGlkYXRvcihvcHRpb25zKSksXG4gICAgICAgICAgZmlyc3QoKSxcbiAgICAgICAgICBtYXAocmVzdWx0ID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRJbnB1dE9wdGlvbnMob3B0aW9ucywgcmVzdWx0LmVycm9ycyB8fCBbXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zO1xuICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBvYnNlcnZhYmxlT2Yob3B0aW9ucyk7XG4gIH07XG59XG4iXX0=