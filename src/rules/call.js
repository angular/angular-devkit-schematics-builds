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
    const result = source(context);
    if ((0, rxjs_1.isObservable)(result)) {
        // Only return the last Tree, and make sure it's a Tree.
        return result.pipe((0, operators_1.defaultIfEmpty)(), (0, operators_1.last)(), (0, operators_1.tap)((inner) => {
            if (!inner || !(interface_1.TreeSymbol in inner)) {
                throw new InvalidSourceResultException(inner);
            }
        }));
    }
    else if (result && interface_1.TreeSymbol in result) {
        return (0, rxjs_1.of)(result);
    }
    else {
        return (0, rxjs_1.throwError)(new InvalidSourceResultException(result));
    }
}
exports.callSource = callSource;
function callRule(rule, input, context) {
    return ((0, rxjs_1.isObservable)(input) ? input : (0, rxjs_1.of)(input)).pipe((0, operators_1.mergeMap)((inputTree) => {
        const result = rule(inputTree, context);
        if (!result) {
            return (0, rxjs_1.of)(inputTree);
        }
        else if (typeof result == 'function') {
            // This is considered a Rule, chain the rule and return its output.
            return callRule(result, inputTree, context);
        }
        else if ((0, rxjs_1.isObservable)(result)) {
            // Only return the last Tree, and make sure it's a Tree.
            return result.pipe((0, operators_1.defaultIfEmpty)(), (0, operators_1.last)(), (0, operators_1.tap)((inner) => {
                if (!inner || !(interface_1.TreeSymbol in inner)) {
                    throw new InvalidRuleResultException(inner);
                }
            }));
        }
        else if ((0, core_1.isPromise)(result)) {
            return (0, rxjs_1.from)(result).pipe((0, operators_1.mergeMap)((inner) => {
                if (typeof inner === 'function') {
                    // This is considered a Rule, chain the rule and return its output.
                    return callRule(inner, inputTree, context);
                }
                else {
                    return (0, rxjs_1.of)(inputTree);
                }
            }));
        }
        else if (interface_1.TreeSymbol in result) {
            return (0, rxjs_1.of)(result);
        }
        else {
            return (0, rxjs_1.throwError)(new InvalidRuleResultException(result));
        }
    }));
}
exports.callRule = callRule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3J1bGVzL2NhbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0NBQWdFO0FBQ2hFLCtCQUFzRjtBQUN0Riw4Q0FBcUU7QUFFckUsaURBQXFEO0FBRXJELFNBQVMsZ0JBQWdCLENBQUMsS0FBVTtJQUNsQyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDdkIsT0FBTyxXQUFXLENBQUM7S0FDcEI7U0FBTSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFDekIsT0FBTyxNQUFNLENBQUM7S0FDZjtTQUFNLElBQUksT0FBTyxLQUFLLElBQUksVUFBVSxFQUFFO1FBQ3JDLE9BQU8sWUFBWSxDQUFDO0tBQ3JCO1NBQU0sSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRLEVBQUU7UUFDbkMsT0FBTyxHQUFHLE9BQU8sS0FBSyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztLQUNwRDtTQUFNO1FBQ0wsSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLE1BQU0sRUFBRTtZQUMxQyxPQUFPLFVBQVUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO1NBQzNDO2FBQU0sSUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFO1lBQzVCLE9BQU8scUJBQXFCLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDdEQ7YUFBTTtZQUNMLE9BQU8sZ0JBQWdCLENBQUM7U0FDekI7S0FDRjtBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILE1BQWEsMEJBQTJCLFNBQVEsb0JBQWE7SUFDM0QsWUFBWSxLQUFVO1FBQ3BCLEtBQUssQ0FBQyx3QkFBd0IsZ0JBQWdCLENBQUMsS0FBSyxD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aEM7WUFDSCxDQUFDLENBQUMsQ0FDSCxDQUFDO1NBQ0g7YUFBTSxJQUFJLHNCQUFVLElBQUksTUFBTSxFQUFFO1lBQy9CLE9BQU8sSUFBQSxTQUFZLEVBQUMsTUFBTSxDQUFDLENBQUM7U0FDN0I7YUFBTTtZQUNMLE9BQU8sSUFBQSxpQkFBVSxFQUFDLElBQUksMEJBQTBCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztTQUMzRDtJQUNILENBQUMsQ0FBQyxDQUNILENBQUM7QUFDSixDQUFDO0FBM0NELDRCQTJDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uLCBpc1Byb21pc2UgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBmcm9tLCBpc09ic2VydmFibGUsIG9mIGFzIG9ic2VydmFibGVPZiwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgZGVmYXVsdElmRW1wdHksIGxhc3QsIG1lcmdlTWFwLCB0YXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTb3VyY2UgfSBmcm9tICcuLi9lbmdpbmUvaW50ZXJmYWNlJztcbmltcG9ydCB7IFRyZWUsIFRyZWVTeW1ib2wgfSBmcm9tICcuLi90cmVlL2ludGVyZmFjZSc7XG5cbmZ1bmN0aW9uIF9nZXRUeXBlT2ZSZXN1bHQodmFsdWU/OiB7fSk6IHN0cmluZyB7XG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuICd1bmRlZmluZWQnO1xuICB9IGVsc2UgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgcmV0dXJuICdudWxsJztcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBgRnVuY3Rpb24oKWA7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlICE9ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIGAke3R5cGVvZiB2YWx1ZX0oJHtKU09OLnN0cmluZ2lmeSh2YWx1ZSl9KWA7XG4gIH0gZWxzZSB7XG4gICAgaWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZih2YWx1ZSkgPT0gT2JqZWN0KSB7XG4gICAgICByZXR1cm4gYE9iamVjdCgke0pTT04uc3RyaW5naWZ5KHZhbHVlKX0pYDtcbiAgICB9IGVsc2UgaWYgKHZhbHVlLmNvbnN0cnVjdG9yKSB7XG4gICAgICByZXR1cm4gYEluc3RhbmNlIG9mIGNsYXNzICR7dmFsdWUuY29uc3RydWN0b3IubmFtZX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ1Vua25vd24gT2JqZWN0JztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBXaGVuIGEgcnVsZSBvciBzb3VyY2UgcmV0dXJucyBhbiBpbnZhbGlkIHZhbHVlLlxuICovXG5leHBvcnQgY2xhc3MgSW52YWxpZFJ1bGVSZXN1bHRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IodmFsdWU/OiB7fSkge1xuICAgIHN1cGVyKGBJbnZhbGlkIHJ1bGUgcmVzdWx0OiAke19nZXRUeXBlT2ZSZXN1bHQodmFsdWUpfS5gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSW52YWxpZFNvdXJjZVJlc3VsdEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3Rvcih2YWx1ZT86IHt9KSB7XG4gICAgc3VwZXIoYEludmFsaWQgc291cmNlIHJlc3VsdDogJHtfZ2V0VHlwZU9mUmVzdWx0KHZhbHVlKX0uYCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGxTb3VyY2Uoc291cmNlOiBTb3VyY2UsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpOiBPYnNlcnZhYmxlPFRyZWU+IHtcbiAgY29uc3QgcmVzdWx0ID0gc291cmNlKGNvbnRleHQpO1xuXG4gIGlmIChpc09ic2VydmFibGUocmVzdWx0KSkge1xuICAgIC8vIE9ubHkgcmV0dXJuIHRoZSBsYXN0IFRyZWUsIGFuZCBtYWtlIHN1cmUgaXQncyBhIFRyZWUuXG4gICAgcmV0dXJuIHJlc3VsdC5waXBlKFxuICAgICAgZGVmYXVsdElmRW1wdHkoKSxcbiAgICAgIGxhc3QoKSxcbiAgICAgIHRhcCgoaW5uZXIpID0+IHtcbiAgICAgICAgaWYgKCFpbm5lciB8fCAhKFRyZWVTeW1ib2wgaW4gaW5uZXIpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRTb3VyY2VSZXN1bHRFeGNlcHRpb24oaW5uZXIpO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICApO1xuICB9IGVsc2UgaWYgKHJlc3VsdCAmJiBUcmVlU3ltYm9sIGluIHJlc3VsdCkge1xuICAgIHJldHVybiBvYnNlcnZhYmxlT2YocmVzdWx0KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdGhyb3dFcnJvcihuZXcgSW52YWxpZFNvdXJjZVJlc3VsdEV4Y2VwdGlvbihyZXN1bHQpKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsbFJ1bGUoXG4gIHJ1bGU6IFJ1bGUsXG4gIGlucHV0OiBUcmVlIHwgT2JzZXJ2YWJsZTxUcmVlPixcbiAgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCxcbik6IE9ic2VydmFibGU8VHJlZT4ge1xuICByZXR1cm4gKGlzT2JzZXJ2YWJsZShpbnB1dCkgPyBpbnB1dCA6IG9ic2VydmFibGVPZihpbnB1dCkpLnBpcGUoXG4gICAgbWVyZ2VNYXAoKGlucHV0VHJlZSkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gcnVsZShpbnB1dFRyZWUsIGNvbnRleHQpO1xuXG4gICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKGlucHV0VHJlZSk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiByZXN1bHQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBUaGlzIGlzIGNvbnNpZGVyZWQgYSBSdWxlLCBjaGFpbiB0aGUgcnVsZSBhbmQgcmV0dXJuIGl0cyBvdXRwdXQuXG4gICAgICAgIHJldHVybiBjYWxsUnVsZShyZXN1bHQsIGlucHV0VHJlZSwgY29udGV4dCk7XG4gICAgICB9IGVsc2UgaWYgKGlzT2JzZXJ2YWJsZShyZXN1bHQpKSB7XG4gICAgICAgIC8vIE9ubHkgcmV0dXJuIHRoZSBsYXN0IFRyZWUsIGFuZCBtYWtlIHN1cmUgaXQncyBhIFRyZWUuXG4gICAgICAgIHJldHVybiByZXN1bHQucGlwZShcbiAgICAgICAgICBkZWZhdWx0SWZFbXB0eSgpLFxuICAgICAgICAgIGxhc3QoKSxcbiAgICAgICAgICB0YXAoKGlubmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWlubmVyIHx8ICEoVHJlZVN5bWJvbCBpbiBpbm5lcikpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRSdWxlUmVzdWx0RXhjZXB0aW9uKGlubmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNQcm9taXNlKHJlc3VsdCkpIHtcbiAgICAgICAgcmV0dXJuIGZyb20ocmVzdWx0KS5waXBlKFxuICAgICAgICAgIG1lcmdlTWFwKChpbm5lcikgPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbm5lciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAvLyBUaGlzIGlzIGNvbnNpZGVyZWQgYSBSdWxlLCBjaGFpbiB0aGUgcnVsZSBhbmQgcmV0dXJuIGl0cyBvdXRwdXQuXG4gICAgICAgICAgICAgIHJldHVybiBjYWxsUnVsZShpbm5lciwgaW5wdXRUcmVlLCBjb250ZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YoaW5wdXRUcmVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAoVHJlZVN5bWJvbCBpbiByZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihyZXN1bHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRocm93RXJyb3IobmV3IEludmFsaWRSdWxlUmVzdWx0RXhjZXB0aW9uKHJlc3VsdCkpO1xuICAgICAgfVxuICAgIH0pLFxuICApO1xufVxuIl19