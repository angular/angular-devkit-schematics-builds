"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const filtered_1 = require("../tree/filtered");
const interface_1 = require("../tree/interface");
const static_1 = require("../tree/static");
const virtual_1 = require("../tree/virtual");
const call_1 = require("./call");
/**
 * A Source that returns an tree as its single value.
 */
function source(tree) {
    return () => tree;
}
exports.source = source;
/**
 * A source that returns an empty tree.
 */
function empty() {
    return () => static_1.empty();
}
exports.empty = empty;
/**
 * Chain multiple rules into a single rule.
 */
function chain(rules) {
    return (tree, context) => {
        return rules.reduce((acc, curr) => {
            return call_1.callRule(curr, acc, context);
        }, rxjs_1.of(tree));
    };
}
exports.chain = chain;
/**
 * Apply multiple rules to a source, and returns the source transformed.
 */
function apply(source, rules) {
    return (context) => {
        return call_1.callRule(chain(rules), call_1.callSource(source, context), context);
    };
}
exports.apply = apply;
/**
 * Merge an input tree with the source passed in.
 */
function mergeWith(source, strategy = interface_1.MergeStrategy.Default) {
    return (tree, context) => {
        const result = call_1.callSource(source, context);
        return result.pipe(operators_1.map(other => virtual_1.VirtualTree.merge(tree, other, strategy || context.strategy)));
    };
}
exports.mergeWith = mergeWith;
function noop() {
    return (tree, _context) => tree;
}
exports.noop = noop;
function filter(predicate) {
    return (tree) => new filtered_1.FilteredTree(tree, predicate);
}
exports.filter = filter;
function asSource(rule) {
    return apply(empty(), [rule]);
}
exports.asSource = asSource;
function branchAndMerge(rule, strategy = interface_1.MergeStrategy.Default) {
    return (tree, context) => {
        const branchedTree = static_1.branch(tree);
        return call_1.callRule(rule, rxjs_1.of(branchedTree), context)
            .pipe(operators_1.map(t => static_1.merge(tree, t, strategy)));
    };
}
exports.branchAndMerge = branchAndMerge;
function when(predicate, operator) {
    return (entry) => {
        if (predicate(entry.path, entry)) {
            return operator(entry);
        }
        else {
            return entry;
        }
    };
}
exports.when = when;
function partitionApplyMerge(predicate, ruleYes, ruleNo) {
    return (tree, context) => {
        const [yes, no] = static_1.partition(tree, predicate);
        if (!ruleNo) {
            // Shortcut.
            return call_1.callRule(ruleYes, rxjs_1.of(static_1.partition(tree, predicate)[0]), context)
                .pipe(operators_1.map(yesTree => static_1.merge(yesTree, no, context.strategy)));
        }
        return call_1.callRule(ruleYes, rxjs_1.of(yes), context)
            .pipe(operators_1.concatMap(yesTree => {
            return call_1.callRule(ruleNo, rxjs_1.of(no), context)
                .pipe(operators_1.map(noTree => static_1.merge(yesTree, noTree, context.strategy)));
        }));
    };
}
exports.partitionApplyMerge = partitionApplyMerge;
function forEach(operator) {
    return (tree) => {
        tree.visit((path, entry) => {
            if (!entry) {
                return;
            }
            const newEntry = operator(entry);
            if (newEntry === entry) {
                return;
            }
            if (newEntry === null) {
                tree.delete(path);
                return;
            }
            if (newEntry.path != path) {
                tree.rename(path, newEntry.path);
            }
            if (!newEntry.content.equals(entry.content)) {
                tree.overwrite(newEntry.path, newEntry.content);
            }
        });
        return tree;
    };
}
exports.forEach = forEach;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvcnVsZXMvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtCQUFzRDtBQUN0RCw4Q0FBZ0Q7QUFFaEQsK0NBQWdEO0FBQ2hELGlEQUFrRjtBQUNsRiwyQ0FLd0I7QUFDeEIsNkNBQThDO0FBQzlDLGlDQUE4QztBQUc5Qzs7R0FFRztBQUNILGdCQUF1QixJQUFVO0lBQy9CLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7QUFDcEIsQ0FBQztBQUZELHdCQUVDO0FBR0Q7O0dBRUc7QUFDSDtJQUNFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxjQUFXLEVBQUUsQ0FBQztBQUM3QixDQUFDO0FBRkQsc0JBRUM7QUFHRDs7R0FFRztBQUNILGVBQXNCLEtBQWE7SUFDakMsTUFBTSxDQUFDLENBQUMsSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtRQUMvQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQXFCLEVBQUUsSUFBVSxFQUFFLEVBQUU7WUFDeEQsTUFBTSxDQUFDLGVBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3RDLENBQUMsRUFBRSxTQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN6QixDQUFDLENBQUM7QUFDSixDQUFDO0FBTkQsc0JBTUM7QUFHRDs7R0FFRztBQUNILGVBQXNCLE1BQWMsRUFBRSxLQUFhO0lBQ2pELE1BQU0sQ0FBQyxDQUFDLE9BQXlCLEVBQUUsRUFBRTtRQUNuQyxNQUFNLENBQUMsZUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxpQkFBVSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN0RSxDQUFDLENBQUM7QUFD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QyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbEQsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUMsQ0FBQztBQUNKLENBQUM7QUF6QkQsMEJBeUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjb25jYXRNYXAsIG1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IEZpbGVPcGVyYXRvciwgUnVsZSwgU2NoZW1hdGljQ29udGV4dCwgU291cmNlIH0gZnJvbSAnLi4vZW5naW5lL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBGaWx0ZXJlZFRyZWUgfSBmcm9tICcuLi90cmVlL2ZpbHRlcmVkJztcbmltcG9ydCB7IEZpbGVFbnRyeSwgRmlsZVByZWRpY2F0ZSwgTWVyZ2VTdHJhdGVneSwgVHJlZSB9IGZyb20gJy4uL3RyZWUvaW50ZXJmYWNlJztcbmltcG9ydCB7XG4gIGJyYW5jaCxcbiAgZW1wdHkgYXMgc3RhdGljRW1wdHksXG4gIG1lcmdlIGFzIHN0YXRpY01lcmdlLFxuICBwYXJ0aXRpb24gYXMgc3RhdGljUGFydGl0aW9uLFxufSBmcm9tICcuLi90cmVlL3N0YXRpYyc7XG5pbXBvcnQgeyBWaXJ0dWFsVHJlZSB9IGZyb20gJy4uL3RyZWUvdmlydHVhbCc7XG5pbXBvcnQgeyBjYWxsUnVsZSwgY2FsbFNvdXJjZSB9IGZyb20gJy4vY2FsbCc7XG5cblxuLyoqXG4gKiBBIFNvdXJjZSB0aGF0IHJldHVybnMgYW4gdHJlZSBhcyBpdHMgc2luZ2xlIHZhbHVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc291cmNlKHRyZWU6IFRyZWUpOiBTb3VyY2Uge1xuICByZXR1cm4gKCkgPT4gdHJlZTtcbn1cblxuXG4vKipcbiAqIEEgc291cmNlIHRoYXQgcmV0dXJucyBhbiBlbXB0eSB0cmVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZW1wdHkoKTogU291cmNlIHtcbiAgcmV0dXJuICgpID0+IHN0YXRpY0VtcHR5KCk7XG59XG5cblxuLyoqXG4gKiBDaGFpbiBtdWx0aXBsZSBydWxlcyBpbnRvIGEgc2luZ2xlIHJ1bGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGFpbihydWxlczogUnVsZVtdKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIHJldHVybiBydWxlcy5yZWR1Y2UoKGFjYzogT2JzZXJ2YWJsZTxUcmVlPiwgY3VycjogUnVsZSkgPT4ge1xuICAgICAgcmV0dXJuIGNhbGxSdWxlKGN1cnIsIGFjYywgY29udGV4dCk7XG4gICAgfSwgb2JzZXJ2YWJsZU9mKHRyZWUpKTtcbiAgfTtcbn1cblxuXG4vKipcbiAqIEFwcGx5IG11bHRpcGxlIHJ1bGVzIHRvIGEgc291cmNlLCBhbmQgcmV0dXJucyB0aGUgc291cmNlIHRyYW5zZm9ybWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHkoc291cmNlOiBTb3VyY2UsIHJ1bGVzOiBSdWxlW10pOiBTb3VyY2Uge1xuICByZXR1cm4gKGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICByZXR1cm4gY2FsbFJ1bGUoY2hhaW4ocnVsZXMpLCBjYWxsU291cmNlKHNvdXJjZSwgY29udGV4dCksIGNvbnRleHQpO1xuICB9O1xufVxuXG5cbi8qKlxuICogTWVyZ2UgYW4gaW5wdXQgdHJlZSB3aXRoIHRoZSBzb3VyY2UgcGFzc2VkIGluLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VXaXRoKHNvdXJjZTogU291cmNlLCBzdHJhdGVneTogTWVyZ2VTdHJhdGVneSA9IE1lcmdlU3RyYXRlZ3kuRGVmYXVsdCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCByZXN1bHQgPSBjYWxsU291cmNlKHNvdXJjZSwgY29udGV4dCk7XG5cbiAgICByZXR1cm4gcmVzdWx0LnBpcGUobWFwKG90aGVyID0+IFZpcnR1YWxUcmVlLm1lcmdlKHRyZWUsIG90aGVyLCBzdHJhdGVneSB8fCBjb250ZXh0LnN0cmF0ZWd5KSkpO1xuICB9O1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBub29wKCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIF9jb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB0cmVlO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXIocHJlZGljYXRlOiBGaWxlUHJlZGljYXRlPGJvb2xlYW4+KTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSkgPT4gbmV3IEZpbHRlcmVkVHJlZSh0cmVlLCBwcmVkaWNhdGUpO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhc1NvdXJjZShydWxlOiBSdWxlKTogU291cmNlIHtcbiAgcmV0dXJuIGFwcGx5KGVtcHR5KCksIFtydWxlXSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGJyYW5jaEFuZE1lcmdlKHJ1bGU6IFJ1bGUsIHN0cmF0ZWd5ID0gTWVyZ2VTdHJhdGVneS5EZWZhdWx0KTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IGJyYW5jaGVkVHJlZSA9IGJyYW5jaCh0cmVlKTtcblxuICAgIHJldHVybiBjYWxsUnVsZShydWxlLCBvYnNlcnZhYmxlT2YoYnJhbmNoZWRUcmVlKSwgY29udGV4dClcbiAgICAgIC5waXBlKG1hcCh0ID0+IHN0YXRpY01lcmdlKHRyZWUsIHQsIHN0cmF0ZWd5KSkpO1xuICB9O1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiB3aGVuKHByZWRpY2F0ZTogRmlsZVByZWRpY2F0ZTxib29sZWFuPiwgb3BlcmF0b3I6IEZpbGVPcGVyYXRvcik6IEZpbGVPcGVyYXRvciB7XG4gIHJldHVybiAoZW50cnk6IEZpbGVFbnRyeSkgPT4ge1xuICAgIGlmIChwcmVkaWNhdGUoZW50cnkucGF0aCwgZW50cnkpKSB7XG4gICAgICByZXR1cm4gb3BlcmF0b3IoZW50cnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZW50cnk7XG4gICAgfVxuICB9O1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJ0aXRpb25BcHBseU1lcmdlKFxuICBwcmVkaWNhdGU6IEZpbGVQcmVkaWNhdGU8Ym9vbGVhbj4sXG4gIHJ1bGVZZXM6IFJ1bGUsXG4gIHJ1bGVObz86IFJ1bGUsXG4pOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3QgW3llcywgbm9dID0gc3RhdGljUGFydGl0aW9uKHRyZWUsIHByZWRpY2F0ZSk7XG5cbiAgICBpZiAoIXJ1bGVObykge1xuICAgICAgLy8gU2hvcnRjdXQuXG4gICAgICByZXR1cm4gY2FsbFJ1bGUocnVsZVllcywgb2JzZXJ2YWJsZU9mKHN0YXRpY1BhcnRpdGlvbih0cmVlLCBwcmVkaWNhdGUpWzBdKSwgY29udGV4dClcbiAgICAgICAgLnBpcGUobWFwKHllc1RyZWUgPT4gc3RhdGljTWVyZ2UoeWVzVHJlZSwgbm8sIGNvbnRleHQuc3RyYXRlZ3kpKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNhbGxSdWxlKHJ1bGVZZXMsIG9ic2VydmFibGVPZih5ZXMpLCBjb250ZXh0KVxuICAgICAgLnBpcGUoY29uY2F0TWFwKHllc1RyZWUgPT4ge1xuICAgICAgICByZXR1cm4gY2FsbFJ1bGUocnVsZU5vLCBvYnNlcnZhYmxlT2Yobm8pLCBjb250ZXh0KVxuICAgICAgICAgIC5waXBlKG1hcChub1RyZWUgPT4gc3RhdGljTWVyZ2UoeWVzVHJlZSwgbm9UcmVlLCBjb250ZXh0LnN0cmF0ZWd5KSkpO1xuICAgICAgfSkpO1xuICB9O1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JFYWNoKG9wZXJhdG9yOiBGaWxlT3BlcmF0b3IpOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlOiBUcmVlKSA9PiB7XG4gICAgdHJlZS52aXNpdCgocGF0aCwgZW50cnkpID0+IHtcbiAgICAgIGlmICghZW50cnkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgbmV3RW50cnkgPSBvcGVyYXRvcihlbnRyeSk7XG4gICAgICBpZiAobmV3RW50cnkgPT09IGVudHJ5KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChuZXdFbnRyeSA9PT0gbnVsbCkge1xuICAgICAgICB0cmVlLmRlbGV0ZShwYXRoKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAobmV3RW50cnkucGF0aCAhPSBwYXRoKSB7XG4gICAgICAgIHRyZWUucmVuYW1lKHBhdGgsIG5ld0VudHJ5LnBhdGgpO1xuICAgICAgfVxuICAgICAgaWYgKCFuZXdFbnRyeS5jb250ZW50LmVxdWFscyhlbnRyeS5jb250ZW50KSkge1xuICAgICAgICB0cmVlLm92ZXJ3cml0ZShuZXdFbnRyeS5wYXRoLCBuZXdFbnRyeS5jb250ZW50KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0cmVlO1xuICB9O1xufVxuIl19