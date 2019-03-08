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
const interface_1 = require("../tree/interface");
function _getTypeOfResult(value) {
    if (value === undefined) {
        return 'undefined';
    }
    else if (value === null) {
        return 'null';
    }
    else if (typeof value == 'function') {
        return `Function()`;
    }
    else if (typeof value != 'object') {
        return `${typeof value}(${JSON.stringify(value)})`;
    }
    else {
        if (Object.getPrototypeOf(value) == Object) {
            return `Object(${JSON.stringify(value)})`;
        }
        else if (value.constructor) {
            return `Instance of class ${value.constructor.name}`;
        }
        else {
            return 'Unknown Object';
        }
    }
}
/**
 * When a rule or source returns an invalid value.
 */
class InvalidRuleResultException extends core_1.BaseException {
    constructor(value) {
        super(`Invalid rule result: ${_getTypeOfResult(value)}.`);
    }
}
exports.InvalidRuleResultException = InvalidRuleResultException;
class InvalidSourceResultException extends core_1.BaseException {
    constructor(value) {
        super(`Invalid source result: ${_getTypeOfResult(value)}.`);
    }
}
exports.InvalidSourceResultException = InvalidSourceResultException;
function callSource(source, context) {
    const result = source(context);
    if (core_1.isObservable(result)) {
        // Only return the last Tree, and make sure it's a Tree.
        return result.pipe(operators_1.defaultIfEmpty(), operators_1.last(), operators_1.tap(inner => {
            if (!inner || !(interface_1.TreeSymbol in inner)) {
                throw new InvalidSourceResultException(inner);
            }
        }));
    }
    else if (result && interface_1.TreeSymbol in result) {
        return rxjs_1.of(result);
    }
    else {
        return rxjs_1.throwError(new InvalidSourceResultException(result));
    }
}
exports.callSource = callSource;
function callRule(rule, input, context) {
    return input.pipe(operators_1.mergeMap(inputTree => {
        const result = rule(inputTree, context);
        if (!result) {
            return rxjs_1.of(inputTree);
        }
        else if (typeof result == 'function') {
            // This is considered a Rule, chain the rule and return its output.
            return callRule(result, rxjs_1.of(inputTree), context);
        }
        else if (core_1.isObservable(result)) {
            // Only return the last Tree, and make sure it's a Tree.
            return result.pipe(operators_1.defaultIfEmpty(), operators_1.last(), operators_1.tap(inner => {
                if (!inner || !(interface_1.TreeSymbol in inner)) {
                    throw new InvalidRuleResultException(inner);
                }
            }));
        }
        else if (core_1.isPromise(result)) {
            return rxjs_1.from(result).pipe(operators_1.map(() => inputTree));
        }
        else if (interface_1.TreeSymbol in result) {
            return rxjs_1.of(result);
        }
        else {
            return rxjs_1.throwError(new InvalidRuleResultException(result));
        }
    }));
}
exports.callRule = callRule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvcnVsZXMvY2FsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQUE4RTtBQUM5RSwrQkFBd0U7QUFDeEUsOENBQTBFO0FBRTFFLGlEQUFxRDtBQUdyRCxTQUFTLGdCQUFnQixDQUFDLEtBQVU7SUFDbEMsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLE9BQU8sV0FBVyxDQUFDO0tBQ3BCO1NBQU0sSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO1FBQ3pCLE9BQU8sTUFBTSxDQUFDO0tBQ2Y7U0FBTSxJQUFJLE9BQU8sS0FBSyxJQUFJLFVBQVUsRUFBRTtRQUNyQyxPQUFPLFlBQVksQ0FBQztLQUNyQjtTQUFNLElBQUksT0FBTyxLQUFLLElBQUksUUFBUSxFQUFFO1FBQ25DLE9BQU8sR0FBRyxPQUFPLEtBQUssSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7S0FDcEQ7U0FBTTtRQUNMLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxNQUFNLEVBQUU7WUFDMUMsT0FBTyxVQUFVLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztTQUMzQzthQUFNLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRTtZQUM1QixPQUFPLHFCQUFxQixLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ3REO2FBQU07WUFDTCxPQUFPLGdCQUFnQixDQUFDO1NBQ3pCO0tBQ0Y7QUFDSCxDQUFDO0FBR0Q7O0dBRUc7QUFDSCxNQUFhLDBCQUEyQixTQUFRLG9CQUFhO0lBQzNELFlBQVksS0FBVTtRQUNwQixLQUFLLENBQUMsd0JBQXdCLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM1RCxDQUFDO0NBQ0Y7QUFKRCxnRUFJQztBQUdELE1BQWEsNEJBQTZCLFNBQVEsb0JBQWE7SUFDN0QsWUFBWSxLQUFVO1FBQ3BCLEtBQUssQ0FBQywwQkFBMEIsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzlELENBQUM7Q0FDRjtBQUpELG9FQUlDO0FBR0QsU0FBZ0IsVUFBVSxDQUFDLE1BQWMsRUFBRSxPQUF5QjtJQUNsRSxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFL0IsSUFBSSxtQkFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ3hCLHdEQUF3RDtRQUN4RCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQ2hCLDBCQUFjLEVBQUUsRUFDaEIsZ0JBQUksRUFBRSxFQUNOLGVBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNWLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLHNCQUFVLElBQUksS0FBSyxDQUFDLEVBQUU7Z0JBQ3BDLE1BQU0sSUFBSSw0QkFBNEIsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUMvQztRQUNILENBQUMsQ0FBQyxDQUNILENBQUM7S0FDSDtTQUFNLElBQUksTUFBTSxJQUFJLHNCQUFVLElBQUksTUFBTSxFQUFFO1FBQ3pDLE9BQU8sU0FBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQzdCO1NBQU07UUFDTCxPQUFPLGlCQUFVLENBQUMsSUFBSSw0QkFBNEIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0tBQzdEO0FBQ0gsQ0FBQztBQW5CRCxnQ0FtQkM7QUFHRCxTQUFnQixRQUFRLENBQ3RCLElBQVUsRUFDVixLQUF1QixFQUN2QixPQUF5QjtJQUV6QixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsb0JBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRTtRQUNyQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRXhDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxPQUFPLFNBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNoQzthQUFNLElBQUksT0FBTyxNQUFNLElBQUksVUFBVSxFQUFFO1lBQ3RDLG1FQUFtRTtZQUNuRSxPQUFPLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBWSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzNEO2FBQU0sSUFBSSxtQkFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQy9CLHdEQUF3RDtZQUN4RCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQ2hCLDBCQUFjLEVBQUUsRUFDaEIsZ0JBQUksRUFBRSxFQUNOLGVBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDVixJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxzQkFBVSxJQUFJLEtBQUssQ0FBQyxFQUFFO29CQUNwQyxNQUFNLElBQUksMEJBQTBCLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQzdDO1lBQ0gsQ0FBQyxDQUFDLENBQ0gsQ0FBQztTQUNIO2FBQU0sSUFBSSxnQkFBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQzVCLE9BQU8sV0FBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztTQUNoRDthQUFNLElBQUksc0JBQVUsSUFBSSxNQUFNLEVBQUU7WUFDL0IsT0FBTyxTQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDN0I7YUFBTTtZQUNMLE9BQU8saUJBQVUsQ0FBQyxJQUFJLDBCQUEwQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7U0FDM0Q7SUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ04sQ0FBQztBQWhDRCw0QkFnQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uLCBpc09ic2VydmFibGUsIGlzUHJvbWlzZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIGZyb20sIG9mIGFzIG9ic2VydmFibGVPZiwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgZGVmYXVsdElmRW1wdHksIGxhc3QsIG1hcCwgbWVyZ2VNYXAsIHRhcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IFJ1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNvdXJjZSB9IGZyb20gJy4uL2VuZ2luZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgVHJlZSwgVHJlZVN5bWJvbCB9IGZyb20gJy4uL3RyZWUvaW50ZXJmYWNlJztcblxuXG5mdW5jdGlvbiBfZ2V0VHlwZU9mUmVzdWx0KHZhbHVlPzoge30pOiBzdHJpbmcge1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiAndW5kZWZpbmVkJztcbiAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgIHJldHVybiAnbnVsbCc7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gYEZ1bmN0aW9uKClgO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSAhPSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBgJHt0eXBlb2YgdmFsdWV9KCR7SlNPTi5zdHJpbmdpZnkodmFsdWUpfSlgO1xuICB9IGVsc2Uge1xuICAgIGlmIChPYmplY3QuZ2V0UHJvdG90eXBlT2YodmFsdWUpID09IE9iamVjdCkge1xuICAgICAgcmV0dXJuIGBPYmplY3QoJHtKU09OLnN0cmluZ2lmeSh2YWx1ZSl9KWA7XG4gICAgfSBlbHNlIGlmICh2YWx1ZS5jb25zdHJ1Y3Rvcikge1xuICAgICAgcmV0dXJuIGBJbnN0YW5jZSBvZiBjbGFzcyAke3ZhbHVlLmNvbnN0cnVjdG9yLm5hbWV9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICdVbmtub3duIE9iamVjdCc7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBXaGVuIGEgcnVsZSBvciBzb3VyY2UgcmV0dXJucyBhbiBpbnZhbGlkIHZhbHVlLlxuICovXG5leHBvcnQgY2xhc3MgSW52YWxpZFJ1bGVSZXN1bHRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IodmFsdWU/OiB7fSkge1xuICAgIHN1cGVyKGBJbnZhbGlkIHJ1bGUgcmVzdWx0OiAke19nZXRUeXBlT2ZSZXN1bHQodmFsdWUpfS5gKTtcbiAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBJbnZhbGlkU291cmNlUmVzdWx0RXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHZhbHVlPzoge30pIHtcbiAgICBzdXBlcihgSW52YWxpZCBzb3VyY2UgcmVzdWx0OiAke19nZXRUeXBlT2ZSZXN1bHQodmFsdWUpfS5gKTtcbiAgfVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxsU291cmNlKHNvdXJjZTogU291cmNlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KTogT2JzZXJ2YWJsZTxUcmVlPiB7XG4gIGNvbnN0IHJlc3VsdCA9IHNvdXJjZShjb250ZXh0KTtcblxuICBpZiAoaXNPYnNlcnZhYmxlKHJlc3VsdCkpIHtcbiAgICAvLyBPbmx5IHJldHVybiB0aGUgbGFzdCBUcmVlLCBhbmQgbWFrZSBzdXJlIGl0J3MgYSBUcmVlLlxuICAgIHJldHVybiByZXN1bHQucGlwZShcbiAgICAgIGRlZmF1bHRJZkVtcHR5KCksXG4gICAgICBsYXN0KCksXG4gICAgICB0YXAoaW5uZXIgPT4ge1xuICAgICAgICBpZiAoIWlubmVyIHx8ICEoVHJlZVN5bWJvbCBpbiBpbm5lcikpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZFNvdXJjZVJlc3VsdEV4Y2VwdGlvbihpbm5lcik7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICk7XG4gIH0gZWxzZSBpZiAocmVzdWx0ICYmIFRyZWVTeW1ib2wgaW4gcmVzdWx0KSB7XG4gICAgcmV0dXJuIG9ic2VydmFibGVPZihyZXN1bHQpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0aHJvd0Vycm9yKG5ldyBJbnZhbGlkU291cmNlUmVzdWx0RXhjZXB0aW9uKHJlc3VsdCkpO1xuICB9XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGxSdWxlKFxuICBydWxlOiBSdWxlLFxuICBpbnB1dDogT2JzZXJ2YWJsZTxUcmVlPixcbiAgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCxcbik6IE9ic2VydmFibGU8VHJlZT4ge1xuICByZXR1cm4gaW5wdXQucGlwZShtZXJnZU1hcChpbnB1dFRyZWUgPT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IHJ1bGUoaW5wdXRUcmVlLCBjb250ZXh0KTtcblxuICAgIGlmICghcmVzdWx0KSB7XG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKGlucHV0VHJlZSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcmVzdWx0ID09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIFRoaXMgaXMgY29uc2lkZXJlZCBhIFJ1bGUsIGNoYWluIHRoZSBydWxlIGFuZCByZXR1cm4gaXRzIG91dHB1dC5cbiAgICAgIHJldHVybiBjYWxsUnVsZShyZXN1bHQsIG9ic2VydmFibGVPZihpbnB1dFRyZWUpLCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKGlzT2JzZXJ2YWJsZShyZXN1bHQpKSB7XG4gICAgICAvLyBPbmx5IHJldHVybiB0aGUgbGFzdCBUcmVlLCBhbmQgbWFrZSBzdXJlIGl0J3MgYSBUcmVlLlxuICAgICAgcmV0dXJuIHJlc3VsdC5waXBlKFxuICAgICAgICBkZWZhdWx0SWZFbXB0eSgpLFxuICAgICAgICBsYXN0KCksXG4gICAgICAgIHRhcChpbm5lciA9PiB7XG4gICAgICAgICAgaWYgKCFpbm5lciB8fCAhKFRyZWVTeW1ib2wgaW4gaW5uZXIpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZFJ1bGVSZXN1bHRFeGNlcHRpb24oaW5uZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSksXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAoaXNQcm9taXNlKHJlc3VsdCkpIHtcbiAgICAgIHJldHVybiBmcm9tKHJlc3VsdCkucGlwZShtYXAoKCkgPT4gaW5wdXRUcmVlKSk7XG4gICAgfSBlbHNlIGlmIChUcmVlU3ltYm9sIGluIHJlc3VsdCkge1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihyZXN1bHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhyb3dFcnJvcihuZXcgSW52YWxpZFJ1bGVSZXN1bHRFeGNlcHRpb24ocmVzdWx0KSk7XG4gICAgfVxuICB9KSk7XG59XG4iXX0=