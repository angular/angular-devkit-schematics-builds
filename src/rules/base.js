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
const exception_1 = require("../exception/exception");
const host_tree_1 = require("../tree/host-tree");
const interface_1 = require("../tree/interface");
const scoped_1 = require("../tree/scoped");
const static_1 = require("../tree/static");
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
    return context => call_1.callRule(chain(rules), call_1.callSource(source, context), context);
}
exports.apply = apply;
/**
 * Merge an input tree with the source passed in.
 */
function mergeWith(source, strategy = interface_1.MergeStrategy.Default) {
    return (tree, context) => {
        const result = call_1.callSource(source, context);
        return result.pipe(operators_1.map(other => static_1.merge(tree, other, strategy || context.strategy)));
    };
}
exports.mergeWith = mergeWith;
function noop() {
    return (tree, _context) => tree;
}
exports.noop = noop;
function filter(predicate) {
    return ((tree) => {
        if (host_tree_1.HostTree.isHostTree(tree)) {
            return new host_tree_1.FilterHostTree(tree, predicate);
        }
        else {
            throw new exception_1.SchematicsException('Tree type is not supported.');
        }
    });
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
            .pipe(operators_1.last(), operators_1.map(t => static_1.merge(tree, t, strategy)));
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
function composeFileOperators(operators) {
    return (entry) => {
        let current = entry;
        for (const op of operators) {
            current = op(current);
            if (current === null) {
                // Deleted, just return.
                return null;
            }
        }
        return current;
    };
}
exports.composeFileOperators = composeFileOperators;
function applyToSubtree(path, rules) {
    return (tree, context) => {
        const scoped = new scoped_1.ScopedTree(tree, path);
        return call_1.callRule(chain(rules), rxjs_1.of(scoped), context).pipe(operators_1.map(result => {
            if (result === scoped) {
                return tree;
            }
            else {
                throw new exception_1.SchematicsException('Original tree must be returned from all rules when using "applyToSubtree".');
            }
        }));
    };
}
exports.applyToSubtree = applyToSubtree;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvcnVsZXMvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtCQUFzRDtBQUN0RCw4Q0FBc0Q7QUFFdEQsc0RBQTZEO0FBQzdELGlEQUE2RDtBQUM3RCxpREFBa0Y7QUFDbEYsMkNBQTRDO0FBQzVDLDJDQUt3QjtBQUN4QixpQ0FBOEM7QUFHOUM7O0dBRUc7QUFDSCxTQUFnQixNQUFNLENBQUMsSUFBVTtJQUMvQixPQUFPLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQztBQUNwQixDQUFDO0FBRkQsd0JBRUM7QUFHRDs7R0FFRztBQUNILFNBQWdCLEtBQUs7SUFDbkIsT0FBTyxHQUFHLEVBQUUsQ0FBQyxjQUFXLEVBQUUsQ0FBQztBQUM3QixDQUFDO0FBRkQsc0JBRUM7QUFHRDs7R0FFRztBQUNILFNBQWdCLEtBQUssQ0FBQyxLQUFhO0lBQ2pDLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1FBQy9DLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQXFCLEVBQUUsSUFBVSxFQUFFLEVBQUU7WUFDeEQsT0FBTyxlQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN0QyxDQUFDLEVBQUUsU0FBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDekIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQU5ELHNCQU1DO0FBR0Q7O0dBRUc7QUFDSCxTQUFnQixLQUFLLENBQUMsTUFBYyxFQUFFLEtBQWE7SUFDakQsT0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDLGVBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsaUJBQVUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDakYsQ0FBQztB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Q0FnQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBvZiBhcyBvYnNlcnZhYmxlT2YgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGNvbmNhdE1hcCwgbGFzdCwgbWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgRmlsZU9wZXJhdG9yLCBSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTb3VyY2UgfSBmcm9tICcuLi9lbmdpbmUvaW50ZXJmYWNlJztcbmltcG9ydCB7IFNjaGVtYXRpY3NFeGNlcHRpb24gfSBmcm9tICcuLi9leGNlcHRpb24vZXhjZXB0aW9uJztcbmltcG9ydCB7IEZpbHRlckhvc3RUcmVlLCBIb3N0VHJlZSB9IGZyb20gJy4uL3RyZWUvaG9zdC10cmVlJztcbmltcG9ydCB7IEZpbGVFbnRyeSwgRmlsZVByZWRpY2F0ZSwgTWVyZ2VTdHJhdGVneSwgVHJlZSB9IGZyb20gJy4uL3RyZWUvaW50ZXJmYWNlJztcbmltcG9ydCB7IFNjb3BlZFRyZWUgfSBmcm9tICcuLi90cmVlL3Njb3BlZCc7XG5pbXBvcnQge1xuICBicmFuY2gsXG4gIGVtcHR5IGFzIHN0YXRpY0VtcHR5LFxuICBtZXJnZSBhcyBzdGF0aWNNZXJnZSxcbiAgcGFydGl0aW9uIGFzIHN0YXRpY1BhcnRpdGlvbixcbn0gZnJvbSAnLi4vdHJlZS9zdGF0aWMnO1xuaW1wb3J0IHsgY2FsbFJ1bGUsIGNhbGxTb3VyY2UgfSBmcm9tICcuL2NhbGwnO1xuXG5cbi8qKlxuICogQSBTb3VyY2UgdGhhdCByZXR1cm5zIGFuIHRyZWUgYXMgaXRzIHNpbmdsZSB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNvdXJjZSh0cmVlOiBUcmVlKTogU291cmNlIHtcbiAgcmV0dXJuICgpID0+IHRyZWU7XG59XG5cblxuLyoqXG4gKiBBIHNvdXJjZSB0aGF0IHJldHVybnMgYW4gZW1wdHkgdHJlZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtcHR5KCk6IFNvdXJjZSB7XG4gIHJldHVybiAoKSA9PiBzdGF0aWNFbXB0eSgpO1xufVxuXG5cbi8qKlxuICogQ2hhaW4gbXVsdGlwbGUgcnVsZXMgaW50byBhIHNpbmdsZSBydWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hhaW4ocnVsZXM6IFJ1bGVbXSk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICByZXR1cm4gcnVsZXMucmVkdWNlKChhY2M6IE9ic2VydmFibGU8VHJlZT4sIGN1cnI6IFJ1bGUpID0+IHtcbiAgICAgIHJldHVybiBjYWxsUnVsZShjdXJyLCBhY2MsIGNvbnRleHQpO1xuICAgIH0sIG9ic2VydmFibGVPZih0cmVlKSk7XG4gIH07XG59XG5cblxuLyoqXG4gKiBBcHBseSBtdWx0aXBsZSBydWxlcyB0byBhIHNvdXJjZSwgYW5kIHJldHVybnMgdGhlIHNvdXJjZSB0cmFuc2Zvcm1lZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5KHNvdXJjZTogU291cmNlLCBydWxlczogUnVsZVtdKTogU291cmNlIHtcbiAgcmV0dXJuIGNvbnRleHQgPT4gY2FsbFJ1bGUoY2hhaW4ocnVsZXMpLCBjYWxsU291cmNlKHNvdXJjZSwgY29udGV4dCksIGNvbnRleHQpO1xufVxuXG5cbi8qKlxuICogTWVyZ2UgYW4gaW5wdXQgdHJlZSB3aXRoIHRoZSBzb3VyY2UgcGFzc2VkIGluLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VXaXRoKHNvdXJjZTogU291cmNlLCBzdHJhdGVneTogTWVyZ2VTdHJhdGVneSA9IE1lcmdlU3RyYXRlZ3kuRGVmYXVsdCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCByZXN1bHQgPSBjYWxsU291cmNlKHNvdXJjZSwgY29udGV4dCk7XG5cbiAgICByZXR1cm4gcmVzdWx0LnBpcGUobWFwKG90aGVyID0+IHN0YXRpY01lcmdlKHRyZWUsIG90aGVyLCBzdHJhdGVneSB8fCBjb250ZXh0LnN0cmF0ZWd5KSkpO1xuICB9O1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBub29wKCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIF9jb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB0cmVlO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXIocHJlZGljYXRlOiBGaWxlUHJlZGljYXRlPGJvb2xlYW4+KTogUnVsZSB7XG4gIHJldHVybiAoKHRyZWU6IFRyZWUpID0+IHtcbiAgICBpZiAoSG9zdFRyZWUuaXNIb3N0VHJlZSh0cmVlKSkge1xuICAgICAgcmV0dXJuIG5ldyBGaWx0ZXJIb3N0VHJlZSh0cmVlLCBwcmVkaWNhdGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignVHJlZSB0eXBlIGlzIG5vdCBzdXBwb3J0ZWQuJyk7XG4gICAgfVxuICB9KTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYXNTb3VyY2UocnVsZTogUnVsZSk6IFNvdXJjZSB7XG4gIHJldHVybiBhcHBseShlbXB0eSgpLCBbcnVsZV0pO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBicmFuY2hBbmRNZXJnZShydWxlOiBSdWxlLCBzdHJhdGVneSA9IE1lcmdlU3RyYXRlZ3kuRGVmYXVsdCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCBicmFuY2hlZFRyZWUgPSBicmFuY2godHJlZSk7XG5cbiAgICByZXR1cm4gY2FsbFJ1bGUocnVsZSwgb2JzZXJ2YWJsZU9mKGJyYW5jaGVkVHJlZSksIGNvbnRleHQpXG4gICAgICAucGlwZShcbiAgICAgICAgbGFzdCgpLFxuICAgICAgICBtYXAodCA9PiBzdGF0aWNNZXJnZSh0cmVlLCB0LCBzdHJhdGVneSkpLFxuICAgICAgKTtcbiAgfTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gd2hlbihwcmVkaWNhdGU6IEZpbGVQcmVkaWNhdGU8Ym9vbGVhbj4sIG9wZXJhdG9yOiBGaWxlT3BlcmF0b3IpOiBGaWxlT3BlcmF0b3Ige1xuICByZXR1cm4gKGVudHJ5OiBGaWxlRW50cnkpID0+IHtcbiAgICBpZiAocHJlZGljYXRlKGVudHJ5LnBhdGgsIGVudHJ5KSkge1xuICAgICAgcmV0dXJuIG9wZXJhdG9yKGVudHJ5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGVudHJ5O1xuICAgIH1cbiAgfTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gcGFydGl0aW9uQXBwbHlNZXJnZShcbiAgcHJlZGljYXRlOiBGaWxlUHJlZGljYXRlPGJvb2xlYW4+LFxuICBydWxlWWVzOiBSdWxlLFxuICBydWxlTm8/OiBSdWxlLFxuKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IFt5ZXMsIG5vXSA9IHN0YXRpY1BhcnRpdGlvbih0cmVlLCBwcmVkaWNhdGUpO1xuXG4gICAgaWYgKCFydWxlTm8pIHtcbiAgICAgIC8vIFNob3J0Y3V0LlxuICAgICAgcmV0dXJuIGNhbGxSdWxlKHJ1bGVZZXMsIG9ic2VydmFibGVPZihzdGF0aWNQYXJ0aXRpb24odHJlZSwgcHJlZGljYXRlKVswXSksIGNvbnRleHQpXG4gICAgICAgIC5waXBlKG1hcCh5ZXNUcmVlID0+IHN0YXRpY01lcmdlKHllc1RyZWUsIG5vLCBjb250ZXh0LnN0cmF0ZWd5KSkpO1xuICAgIH1cblxuICAgIHJldHVybiBjYWxsUnVsZShydWxlWWVzLCBvYnNlcnZhYmxlT2YoeWVzKSwgY29udGV4dClcbiAgICAgIC5waXBlKGNvbmNhdE1hcCh5ZXNUcmVlID0+IHtcbiAgICAgICAgcmV0dXJuIGNhbGxSdWxlKHJ1bGVObywgb2JzZXJ2YWJsZU9mKG5vKSwgY29udGV4dClcbiAgICAgICAgICAucGlwZShtYXAobm9UcmVlID0+IHN0YXRpY01lcmdlKHllc1RyZWUsIG5vVHJlZSwgY29udGV4dC5zdHJhdGVneSkpKTtcbiAgICAgIH0pKTtcbiAgfTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZm9yRWFjaChvcGVyYXRvcjogRmlsZU9wZXJhdG9yKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSkgPT4ge1xuICAgIHRyZWUudmlzaXQoKHBhdGgsIGVudHJ5KSA9PiB7XG4gICAgICBpZiAoIWVudHJ5KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5ld0VudHJ5ID0gb3BlcmF0b3IoZW50cnkpO1xuICAgICAgaWYgKG5ld0VudHJ5ID09PSBlbnRyeSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAobmV3RW50cnkgPT09IG51bGwpIHtcbiAgICAgICAgdHJlZS5kZWxldGUocGF0aCk7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKG5ld0VudHJ5LnBhdGggIT0gcGF0aCkge1xuICAgICAgICB0cmVlLnJlbmFtZShwYXRoLCBuZXdFbnRyeS5wYXRoKTtcbiAgICAgIH1cbiAgICAgIGlmICghbmV3RW50cnkuY29udGVudC5lcXVhbHMoZW50cnkuY29udGVudCkpIHtcbiAgICAgICAgdHJlZS5vdmVyd3JpdGUobmV3RW50cnkucGF0aCwgbmV3RW50cnkuY29udGVudCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdHJlZTtcbiAgfTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY29tcG9zZUZpbGVPcGVyYXRvcnMob3BlcmF0b3JzOiBGaWxlT3BlcmF0b3JbXSk6IEZpbGVPcGVyYXRvciB7XG4gIHJldHVybiAoZW50cnk6IEZpbGVFbnRyeSkgPT4ge1xuICAgIGxldCBjdXJyZW50OiBGaWxlRW50cnkgfCBudWxsID0gZW50cnk7XG4gICAgZm9yIChjb25zdCBvcCBvZiBvcGVyYXRvcnMpIHtcbiAgICAgIGN1cnJlbnQgPSBvcChjdXJyZW50KTtcblxuICAgICAgaWYgKGN1cnJlbnQgPT09IG51bGwpIHtcbiAgICAgICAgLy8gRGVsZXRlZCwganVzdCByZXR1cm4uXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjdXJyZW50O1xuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlUb1N1YnRyZWUocGF0aDogc3RyaW5nLCBydWxlczogUnVsZVtdKTogUnVsZSB7XG4gIHJldHVybiAodHJlZSwgY29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHNjb3BlZCA9IG5ldyBTY29wZWRUcmVlKHRyZWUsIHBhdGgpO1xuXG4gICAgcmV0dXJuIGNhbGxSdWxlKGNoYWluKHJ1bGVzKSwgb2JzZXJ2YWJsZU9mKHNjb3BlZCksIGNvbnRleHQpLnBpcGUoXG4gICAgICBtYXAocmVzdWx0ID0+IHtcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gc2NvcGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRyZWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgICAnT3JpZ2luYWwgdHJlZSBtdXN0IGJlIHJldHVybmVkIGZyb20gYWxsIHJ1bGVzIHdoZW4gdXNpbmcgXCJhcHBseVRvU3VidHJlZVwiLicsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKTtcbiAgfTtcbn1cbiJdfQ==