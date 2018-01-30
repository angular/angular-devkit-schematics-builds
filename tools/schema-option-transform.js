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
    const copy = {};
    for (const key of Object.keys(object)) {
        if (typeof object[key] == 'object') {
            copy[key] = _deepCopy(object[key]);
            break;
        }
        else {
            copy[key] = object[key];
        }
    }
    return copy;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0uanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvc2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FHOEI7QUFHOUIsMkNBQXdEO0FBQ3hELGdEQUE2QztBQUM3Qyw0Q0FBeUM7QUFDekMsc0RBQW1EO0FBT25ELHlCQUFpQyxTQUFRLG9CQUFhO0lBQ3BELGtDQUFrQztJQUNsQyxZQUFZLE9BQVksRUFBRSxNQUFnQjtRQUN4QyxLQUFLLENBQUMseURBQXlELElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUk7Y0FDcEYsY0FBYyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM3QyxDQUFDO0NBQ0Y7QUFORCxrREFNQztBQUdELGtDQUFrQztBQUNsQyxtQkFBbUQsTUFBUztJQUMxRCxNQUFNLElBQUksR0FBRyxFQUFPLENBQUM7SUFDckIsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEMsRUFBRSxDQUFDLENBQUMsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNuQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ25DLEtBQUssQ0FBQztRQUNSLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUIsQ0FBQztJQUNILENBQUM7SUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUdELG1DQUFtQztBQUNuQyxtQ0FBMEMsUUFBK0I7SUFDdkUsTUFBTSxDQUFDLENBQWUsU0FBd0IsRUFBRSxPQUFVLEVBQWlCLEVBQUU7UUFDM0UsK0VBQStFO1FBQy9FLE9BQU8sR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFN0IsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUM3QywrQkFBK0I7WUFDL0IsTUFBTSxDQUFDLFFBQVE7aUJBQ1osT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7aUJBQzdCLElBQUksQ0FDSCxtQkFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQ3pDLGFBQUssRUFBRSxFQUNQLFNBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDWCxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUNwQixNQUFNLElBQUksbUJBQW1CLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7Z0JBQy9FLENBQUM7Z0JBRUQsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUNqQixDQUFDLENBQUMsQ0FDSCxDQUFDO1FBQ04sQ0FBQztRQUVELE1BQU0sQ0FBQyxPQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDL0IsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQXhCRCw4REF3QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1xuICBCYXNlRXhjZXB0aW9uLFxuICBzY2hlbWEsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IFNjaGVtYXRpY0Rlc2NyaXB0aW9uIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMvT2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBvZiBhcyBvYnNlcnZhYmxlT2YgfSBmcm9tICdyeGpzL29ic2VydmFibGUvb2YnO1xuaW1wb3J0IHsgZmlyc3QgfSBmcm9tICdyeGpzL29wZXJhdG9ycy9maXJzdCc7XG5pbXBvcnQgeyBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycy9tYXAnO1xuaW1wb3J0IHsgbWVyZ2VNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycy9tZXJnZU1hcCc7XG5pbXBvcnQgeyBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2NyaXB0aW9uLCBGaWxlU3lzdGVtU2NoZW1hdGljRGVzY3JpcHRpb24gfSBmcm9tICcuL2Rlc2NyaXB0aW9uJztcblxuZXhwb3J0IHR5cGUgU2NoZW1hdGljRGVzYyA9XG4gIFNjaGVtYXRpY0Rlc2NyaXB0aW9uPEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzY3JpcHRpb24sIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbj47XG5cblxuZXhwb3J0IGNsYXNzIEludmFsaWRJbnB1dE9wdGlvbnMgZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBhbnksIGVycm9yczogc3RyaW5nW10pIHtcbiAgICBzdXBlcihgU2NoZW1hdGljIGlucHV0IGRvZXMgbm90IHZhbGlkYXRlIGFnYWluc3QgdGhlIFNjaGVtYTogJHtKU09OLnN0cmluZ2lmeShvcHRpb25zKX1cXG5gXG4gICAgICAgICsgYEVycm9yczpcXG4gICR7ZXJyb3JzLmpvaW4oJ1xcbiAgJyl9YCk7XG4gIH1cbn1cblxuXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG5mdW5jdGlvbiBfZGVlcENvcHk8VCBleHRlbmRzIHtba2V5OiBzdHJpbmddOiBhbnl9PihvYmplY3Q6IFQpOiBUIHtcbiAgY29uc3QgY29weSA9IHt9IGFzIFQ7XG4gIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKG9iamVjdCkpIHtcbiAgICBpZiAodHlwZW9mIG9iamVjdFtrZXldID09ICdvYmplY3QnKSB7XG4gICAgICBjb3B5W2tleV0gPSBfZGVlcENvcHkob2JqZWN0W2tleV0pO1xuICAgICAgYnJlYWs7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29weVtrZXldID0gb2JqZWN0W2tleV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvcHk7XG59XG5cblxuLy8gVGhpcyBjYW4gb25seSBiZSB1c2VkIGluIE5vZGVKUy5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZU9wdGlvbnNXaXRoU2NoZW1hKHJlZ2lzdHJ5OiBzY2hlbWEuU2NoZW1hUmVnaXN0cnkpIHtcbiAgcmV0dXJuIDxUIGV4dGVuZHMge30+KHNjaGVtYXRpYzogU2NoZW1hdGljRGVzYywgb3B0aW9uczogVCk6IE9ic2VydmFibGU8VD4gPT4ge1xuICAgIC8vIFByZXZlbnQgYSBzY2hlbWF0aWMgZnJvbSBjaGFuZ2luZyB0aGUgb3B0aW9ucyBvYmplY3QgYnkgbWFraW5nIGEgY29weSBvZiBpdC5cbiAgICBvcHRpb25zID0gX2RlZXBDb3B5KG9wdGlvbnMpO1xuXG4gICAgaWYgKHNjaGVtYXRpYy5zY2hlbWEgJiYgc2NoZW1hdGljLnNjaGVtYUpzb24pIHtcbiAgICAgIC8vIE1ha2UgYSBkZWVwIGNvcHkgb2Ygb3B0aW9ucy5cbiAgICAgIHJldHVybiByZWdpc3RyeVxuICAgICAgICAuY29tcGlsZShzY2hlbWF0aWMuc2NoZW1hSnNvbilcbiAgICAgICAgLnBpcGUoXG4gICAgICAgICAgbWVyZ2VNYXAodmFsaWRhdG9yID0+IHZhbGlkYXRvcihvcHRpb25zKSksXG4gICAgICAgICAgZmlyc3QoKSxcbiAgICAgICAgICBtYXAocmVzdWx0ID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRJbnB1dE9wdGlvbnMob3B0aW9ucywgcmVzdWx0LmVycm9ycyB8fCBbJ1Vua25vd24gcmVhc29uLiddKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9ic2VydmFibGVPZihvcHRpb25zKTtcbiAgfTtcbn1cbiJdfQ==