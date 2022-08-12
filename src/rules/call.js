"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.callRule = exports.callSource = exports.InvalidSourceResultException = exports.InvalidRuleResultException = void 0;
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
    return (0, rxjs_1.defer)(async () => {
        let result = source(context);
        if ((0, rxjs_1.isObservable)(result)) {
            result = await result.pipe((0, operators_1.defaultIfEmpty)()).toPromise();
        }
        if (result && interface_1.TreeSymbol in result) {
            return result;
        }
        throw new InvalidSourceResultException(result);
    });
}
exports.callSource = callSource;
function callRule(rule, input, context) {
    if ((0, rxjs_1.isObservable)(input)) {
        return input.pipe((0, operators_1.mergeMap)((inputTree) => callRuleAsync(rule, inputTree, context)));
    }
    else {
        return (0, rxjs_1.defer)(() => callRuleAsync(rule, input, context));
    }
}
exports.callRule = callRule;
async function callRuleAsync(rule, tree, context) {
    let result = await rule(tree, context);
    while (typeof result === 'function') {
        // This is considered a Rule, chain the rule and return its output.
        result = await result(tree, context);
    }
    if (typeof result === 'undefined') {
        return tree;
    }
    if ((0, rxjs_1.isObservable)(result)) {
        result = await result.pipe((0, operators_1.defaultIfEmpty)(tree)).toPromise();
    }
    if (interface_1.TreeSymbol in result) {
        return result;
    }
    throw new InvalidRuleResultException(result);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3J1bGVzL2NhbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0NBQXFEO0FBQ3JELCtCQUF1RDtBQUN2RCw4Q0FBMEQ7QUFFMUQsaURBQXFEO0FBRXJELFNBQVMsZ0JBQWdCLENBQUMsS0FBVTtJQUNsQyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDdkIsT0FBTyxXQUFXLENBQUM7S0FDcEI7U0FBTSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFDekIsT0FBTyxNQUFNLENBQUM7S0FDZjtTQUFNLElBQUksT0FBTyxLQUFLLElBQUksVUFBVSxFQUFFO1FBQ3JDLE9BQU8sWUFBWSxDQUFDO0tBQ3JCO1NBQU0sSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRLEVBQUU7UUFDbkMsT0FBTyxHQUFHLE9BQU8sS0FBSyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztLQUNwRDtTQUFNO1FBQ0wsSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLE1BQU0sRUFBRTtZQUMxQyxPQUFPLFVBQVUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO1NBQzNDO2FBQU0sSUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFO1lBQzVCLE9BQU8scUJBQXFCLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDdEQ7YUFBTTtZQUNMLE9BQU8sZ0JBQWdCLENBQUM7U0FDekI7S0FDRjtBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILE1BQWEsMEJBQTJCLFNBQVEsb0JBQWE7SUFDM0QsWUFBWSxLQUFVO1FBQ3BCLEtBQUssQ0FBQyx3QkFBd0IsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzVELENBQUM7Q0FDRjtBQUpELGdFQUlDO0FBRUQsTUFBYSw0QkFBNkIsU0FBUSxvQkFBYTtJQUM3RCxZQUFZLEtBQVU7UUFDcEIsS0FBSyxDQUFDLDBCQUEwQixnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDOUQsQ0FBQztDQUNGO0FBSkQsb0VBSUM7QUFFRCxTQUFnQixVQUFVLENBQUMsTUFBYyxFQUFFLE9BQXlCO0lBQ2xFLE9BQU8sSUFBQSxZQUFLLEVBQUMsS0FBSyxJQUFJLEVBQUU7UUFDdEIsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTdCLElBQUksSUFBQSxtQkFBWSxFQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3hCLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBQSwwQkFBYyxHQUFFLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztTQUMxRDtRQUVELElBQUksTUFBTSxJQUFJLHNCQUFVLElBQUksTUFBTSxFQUFFO1lBQ2xDLE9BQU8sTUFBYyxDQUFDO1NBQ3ZCO1FBRUQsTUFBTSxJQUFJLDRCQUE0QixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2pELENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQWRELGdDQWNDO0FBRUQsU0FBZ0IsUUFBUSxDQUN0QixJQUFVLEVBQ1YsS0FBOEIsRUFDOUIsT0FBeUI7SUFFekIsSUFBSSxJQUFBLG1CQUFZLEVBQUMsS0FBSyxDQUFDLEVBQUU7UUFDdkIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUEsb0JBQVEsRUFBQyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3JGO1NBQU07UUFDTCxPQUFPLElBQUEsWUFBSyxFQUFDLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7S0FDekQ7QUFDSCxDQUFDO0FBVkQsNEJBVUM7QUFFRCxLQUFLLFVBQVUsYUFBYSxDQUFDLElBQVUsRUFBRSxJQUFVLEVBQUUsT0FBeUI7SUFDNUUsSUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRXZDLE9BQU8sT0FBTyxNQUFNLEtBQUssVUFBVSxFQUFFO1FBQ25DLG1FQUFtRTtRQUNuRSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3RDO0lBRUQsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUU7UUFDakMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELElBQUksSUFBQSxtQkFBWSxFQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ3hCLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBQSwwQkFBYyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7S0FDOUQ7SUFFRCxJQUFJLHNCQUFVLElBQUksTUFBTSxFQUFFO1FBQ3hCLE9BQU8sTUFBYyxDQUFDO0tBQ3ZCO0lBRUQsTUFBTSxJQUFJLDBCQUEwQixDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQy9DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIGRlZmVyLCBpc09ic2VydmFibGUgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGRlZmF1bHRJZkVtcHR5LCBtZXJnZU1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IFJ1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNvdXJjZSB9IGZyb20gJy4uL2VuZ2luZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgVHJlZSwgVHJlZVN5bWJvbCB9IGZyb20gJy4uL3RyZWUvaW50ZXJmYWNlJztcblxuZnVuY3Rpb24gX2dldFR5cGVPZlJlc3VsdCh2YWx1ZT86IHt9KTogc3RyaW5nIHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gJ3VuZGVmaW5lZCc7XG4gIH0gZWxzZSBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gJ251bGwnO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGBGdW5jdGlvbigpYDtcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gYCR7dHlwZW9mIHZhbHVlfSgke0pTT04uc3RyaW5naWZ5KHZhbHVlKX0pYDtcbiAgfSBlbHNlIHtcbiAgICBpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHZhbHVlKSA9PSBPYmplY3QpIHtcbiAgICAgIHJldHVybiBgT2JqZWN0KCR7SlNPTi5zdHJpbmdpZnkodmFsdWUpfSlgO1xuICAgIH0gZWxzZSBpZiAodmFsdWUuY29uc3RydWN0b3IpIHtcbiAgICAgIHJldHVybiBgSW5zdGFuY2Ugb2YgY2xhc3MgJHt2YWx1ZS5jb25zdHJ1Y3Rvci5uYW1lfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnVW5rbm93biBPYmplY3QnO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFdoZW4gYSBydWxlIG9yIHNvdXJjZSByZXR1cm5zIGFuIGludmFsaWQgdmFsdWUuXG4gKi9cbmV4cG9ydCBjbGFzcyBJbnZhbGlkUnVsZVJlc3VsdEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3Rvcih2YWx1ZT86IHt9KSB7XG4gICAgc3VwZXIoYEludmFsaWQgcnVsZSByZXN1bHQ6ICR7X2dldFR5cGVPZlJlc3VsdCh2YWx1ZSl9LmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnZhbGlkU291cmNlUmVzdWx0RXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHZhbHVlPzoge30pIHtcbiAgICBzdXBlcihgSW52YWxpZCBzb3VyY2UgcmVzdWx0OiAke19nZXRUeXBlT2ZSZXN1bHQodmFsdWUpfS5gKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsbFNvdXJjZShzb3VyY2U6IFNvdXJjZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCk6IE9ic2VydmFibGU8VHJlZT4ge1xuICByZXR1cm4gZGVmZXIoYXN5bmMgKCkgPT4ge1xuICAgIGxldCByZXN1bHQgPSBzb3VyY2UoY29udGV4dCk7XG5cbiAgICBpZiAoaXNPYnNlcnZhYmxlKHJlc3VsdCkpIHtcbiAgICAgIHJlc3VsdCA9IGF3YWl0IHJlc3VsdC5waXBlKGRlZmF1bHRJZkVtcHR5KCkpLnRvUHJvbWlzZSgpO1xuICAgIH1cblxuICAgIGlmIChyZXN1bHQgJiYgVHJlZVN5bWJvbCBpbiByZXN1bHQpIHtcbiAgICAgIHJldHVybiByZXN1bHQgYXMgVHJlZTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgSW52YWxpZFNvdXJjZVJlc3VsdEV4Y2VwdGlvbihyZXN1bHQpO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGxSdWxlKFxuICBydWxlOiBSdWxlLFxuICBpbnB1dDogVHJlZSB8IE9ic2VydmFibGU8VHJlZT4sXG4gIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQsXG4pOiBPYnNlcnZhYmxlPFRyZWU+IHtcbiAgaWYgKGlzT2JzZXJ2YWJsZShpbnB1dCkpIHtcbiAgICByZXR1cm4gaW5wdXQucGlwZShtZXJnZU1hcCgoaW5wdXRUcmVlKSA9PiBjYWxsUnVsZUFzeW5jKHJ1bGUsIGlucHV0VHJlZSwgY29udGV4dCkpKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZGVmZXIoKCkgPT4gY2FsbFJ1bGVBc3luYyhydWxlLCBpbnB1dCwgY29udGV4dCkpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhbGxSdWxlQXN5bmMocnVsZTogUnVsZSwgdHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCk6IFByb21pc2U8VHJlZT4ge1xuICBsZXQgcmVzdWx0ID0gYXdhaXQgcnVsZSh0cmVlLCBjb250ZXh0KTtcblxuICB3aGlsZSAodHlwZW9mIHJlc3VsdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIFRoaXMgaXMgY29uc2lkZXJlZCBhIFJ1bGUsIGNoYWluIHRoZSBydWxlIGFuZCByZXR1cm4gaXRzIG91dHB1dC5cbiAgICByZXN1bHQgPSBhd2FpdCByZXN1bHQodHJlZSwgY29udGV4dCk7XG4gIH1cblxuICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gdHJlZTtcbiAgfVxuXG4gIGlmIChpc09ic2VydmFibGUocmVzdWx0KSkge1xuICAgIHJlc3VsdCA9IGF3YWl0IHJlc3VsdC5waXBlKGRlZmF1bHRJZkVtcHR5KHRyZWUpKS50b1Byb21pc2UoKTtcbiAgfVxuXG4gIGlmIChUcmVlU3ltYm9sIGluIHJlc3VsdCkge1xuICAgIHJldHVybiByZXN1bHQgYXMgVHJlZTtcbiAgfVxuXG4gIHRocm93IG5ldyBJbnZhbGlkUnVsZVJlc3VsdEV4Y2VwdGlvbihyZXN1bHQpO1xufVxuIl19