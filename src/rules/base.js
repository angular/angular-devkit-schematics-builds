"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyToSubtree = exports.composeFileOperators = exports.forEach = exports.partitionApplyMerge = exports.when = exports.branchAndMerge = exports.asSource = exports.filter = exports.noop = exports.mergeWith = exports.apply = exports.chain = exports.empty = exports.source = void 0;
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
    return () => (0, static_1.empty)();
}
exports.empty = empty;
/**
 * Chain multiple rules into a single rule.
 */
function chain(rules) {
    return (tree, context) => {
        return rules.reduce((acc, curr) => (0, call_1.callRule)(curr, acc, context), tree);
    };
}
exports.chain = chain;
/**
 * Apply multiple rules to a source, and returns the source transformed.
 */
function apply(source, rules) {
    return (context) => (0, call_1.callRule)(chain(rules), (0, call_1.callSource)(source, context), context);
}
exports.apply = apply;
/**
 * Merge an input tree with the source passed in.
 */
function mergeWith(source, strategy = interface_1.MergeStrategy.Default) {
    return (tree, context) => {
        return (0, call_1.callSource)(source, context).pipe((0, operators_1.map)((sourceTree) => tree.merge(sourceTree, strategy || context.strategy)), (0, operators_1.mapTo)(tree));
    };
}
exports.mergeWith = mergeWith;
function noop() {
    return () => { };
}
exports.noop = noop;
function filter(predicate) {
    return (tree) => {
        if (host_tree_1.HostTree.isHostTree(tree)) {
            return new host_tree_1.FilterHostTree(tree, predicate);
        }
        else {
            throw new exception_1.SchematicsException('Tree type is not supported.');
        }
    };
}
exports.filter = filter;
function asSource(rule) {
    return (context) => (0, call_1.callRule)(rule, (0, static_1.empty)(), context);
}
exports.asSource = asSource;
function branchAndMerge(rule, strategy = interface_1.MergeStrategy.Default) {
    return (tree, context) => {
        return (0, call_1.callRule)(rule, tree.branch(), context).pipe((0, operators_1.map)((branch) => tree.merge(branch, strategy || context.strategy)), (0, operators_1.mapTo)(tree));
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
        const [yes, no] = (0, static_1.partition)(tree, predicate);
        return (0, rxjs_1.concat)((0, call_1.callRule)(ruleYes, yes, context), (0, call_1.callRule)(ruleNo || noop(), no, context)).pipe((0, operators_1.toArray)(), (0, operators_1.map)(([yesTree, noTree]) => {
            yesTree.merge(noTree, context.strategy);
            return yesTree;
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
        return (0, call_1.callRule)(chain(rules), scoped, context).pipe((0, operators_1.map)((result) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3J1bGVzL2Jhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0JBQTBDO0FBQzFDLDhDQUFxRDtBQUVyRCxzREFBNkQ7QUFDN0QsaURBQTZEO0FBQzdELGlEQUFrRjtBQUNsRiwyQ0FBNEM7QUFDNUMsMkNBQWlFO0FBQ2pFLGlDQUE4QztBQUU5Qzs7R0FFRztBQUNILFNBQWdCLE1BQU0sQ0FBQyxJQUFVO0lBQy9CLE9BQU8sR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO0FBQ3BCLENBQUM7QUFGRCx3QkFFQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsS0FBSztJQUNuQixPQUFPLEdBQUcsRUFBRSxDQUFDLElBQUEsY0FBVyxHQUFFLENBQUM7QUFDN0IsQ0FBQztBQUZELHNCQUVDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixLQUFLLENBQUMsS0FBYTtJQUNqQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFO1FBQ3ZCLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBMEIsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFBLGVBQVEsRUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2xHLENBQUMsQ0FBQztBQUNKLENBQUM7QUFKRCxzQkFJQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsS0FBSyxDQUFDLE1BQWMsRUFBRSxLQUFhO0lBQ2pELE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLElBQUEsZUFBUSxFQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFBLGlCQUFVLEVBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FB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RUFBRSxFQUFFO1FBQzFCLElBQUksT0FBTyxHQUFxQixLQUFLLENBQUM7UUFDdEMsS0FBSyxNQUFNLEVBQUUsSUFBSSxTQUFTLEVBQUU7WUFDMUIsT0FBTyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUV0QixJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7Z0JBQ3BCLHdCQUF3QjtnQkFDeEIsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO1FBRUQsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQWRELG9EQWNDO0FBRUQsU0FBZ0IsY0FBYyxDQUFDLElBQVksRUFBRSxLQUFhO0lBQ3hELE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUU7UUFDdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxtQkFBVSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUxQyxPQUFPLElBQUEsZUFBUSxFQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUNqRCxJQUFBLGVBQUcsRUFBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ2IsSUFBSSxNQUFNLEtBQUssTUFBTSxFQUFFO2dCQUNyQixPQUFPLElBQUksQ0FBQzthQUNiO2lCQUFNO2dCQUNMLE1BQU0sSUFBSSwrQkFBbUIsQ0FDM0IsNEVBQTRFLENBQzdFLENBQUM7YUFDSDtRQUNILENBQUMsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDLENBQUM7QUFDSixDQUFDO0FBaEJELHdDQWdCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBjb25jYXQgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IG1hcCwgbWFwVG8sIHRvQXJyYXkgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBGaWxlT3BlcmF0b3IsIFJ1bGUsIFNvdXJjZSB9IGZyb20gJy4uL2VuZ2luZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgU2NoZW1hdGljc0V4Y2VwdGlvbiB9IGZyb20gJy4uL2V4Y2VwdGlvbi9leGNlcHRpb24nO1xuaW1wb3J0IHsgRmlsdGVySG9zdFRyZWUsIEhvc3RUcmVlIH0gZnJvbSAnLi4vdHJlZS9ob3N0LXRyZWUnO1xuaW1wb3J0IHsgRmlsZUVudHJ5LCBGaWxlUHJlZGljYXRlLCBNZXJnZVN0cmF0ZWd5LCBUcmVlIH0gZnJvbSAnLi4vdHJlZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgU2NvcGVkVHJlZSB9IGZyb20gJy4uL3RyZWUvc2NvcGVkJztcbmltcG9ydCB7IHBhcnRpdGlvbiwgZW1wdHkgYXMgc3RhdGljRW1wdHkgfSBmcm9tICcuLi90cmVlL3N0YXRpYyc7XG5pbXBvcnQgeyBjYWxsUnVsZSwgY2FsbFNvdXJjZSB9IGZyb20gJy4vY2FsbCc7XG5cbi8qKlxuICogQSBTb3VyY2UgdGhhdCByZXR1cm5zIGFuIHRyZWUgYXMgaXRzIHNpbmdsZSB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNvdXJjZSh0cmVlOiBUcmVlKTogU291cmNlIHtcbiAgcmV0dXJuICgpID0+IHRyZWU7XG59XG5cbi8qKlxuICogQSBzb3VyY2UgdGhhdCByZXR1cm5zIGFuIGVtcHR5IHRyZWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbXB0eSgpOiBTb3VyY2Uge1xuICByZXR1cm4gKCkgPT4gc3RhdGljRW1wdHkoKTtcbn1cblxuLyoqXG4gKiBDaGFpbiBtdWx0aXBsZSBydWxlcyBpbnRvIGEgc2luZ2xlIHJ1bGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGFpbihydWxlczogUnVsZVtdKTogUnVsZSB7XG4gIHJldHVybiAodHJlZSwgY29udGV4dCkgPT4ge1xuICAgIHJldHVybiBydWxlcy5yZWR1Y2U8VHJlZSB8IE9ic2VydmFibGU8VHJlZT4+KChhY2MsIGN1cnIpID0+IGNhbGxSdWxlKGN1cnIsIGFjYywgY29udGV4dCksIHRyZWUpO1xuICB9O1xufVxuXG4vKipcbiAqIEFwcGx5IG11bHRpcGxlIHJ1bGVzIHRvIGEgc291cmNlLCBhbmQgcmV0dXJucyB0aGUgc291cmNlIHRyYW5zZm9ybWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHkoc291cmNlOiBTb3VyY2UsIHJ1bGVzOiBSdWxlW10pOiBTb3VyY2Uge1xuICByZXR1cm4gKGNvbnRleHQpID0+IGNhbGxSdWxlKGNoYWluKHJ1bGVzKSwgY2FsbFNvdXJjZShzb3VyY2UsIGNvbnRleHQpLCBjb250ZXh0KTtcbn1cblxuLyoqXG4gKiBNZXJnZSBhbiBpbnB1dCB0cmVlIHdpdGggdGhlIHNvdXJjZSBwYXNzZWQgaW4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVdpdGgoc291cmNlOiBTb3VyY2UsIHN0cmF0ZWd5OiBNZXJnZVN0cmF0ZWd5ID0gTWVyZ2VTdHJhdGVneS5EZWZhdWx0KTogUnVsZSB7XG4gIHJldHVybiAodHJlZSwgY29udGV4dCkgPT4ge1xuICAgIHJldHVybiBjYWxsU291cmNlKHNvdXJjZSwgY29udGV4dCkucGlwZShcbiAgICAgIG1hcCgoc291cmNlVHJlZSkgPT4gdHJlZS5tZXJnZShzb3VyY2VUcmVlLCBzdHJhdGVneSB8fCBjb250ZXh0LnN0cmF0ZWd5KSksXG4gICAgICBtYXBUbyh0cmVlKSxcbiAgICApO1xuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9vcCgpOiBSdWxlIHtcbiAgcmV0dXJuICgpID0+IHt9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyKHByZWRpY2F0ZTogRmlsZVByZWRpY2F0ZTxib29sZWFuPik6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUpID0+IHtcbiAgICBpZiAoSG9zdFRyZWUuaXNIb3N0VHJlZSh0cmVlKSkge1xuICAgICAgcmV0dXJuIG5ldyBGaWx0ZXJIb3N0VHJlZSh0cmVlLCBwcmVkaWNhdGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignVHJlZSB0eXBlIGlzIG5vdCBzdXBwb3J0ZWQuJyk7XG4gICAgfVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNTb3VyY2UocnVsZTogUnVsZSk6IFNvdXJjZSB7XG4gIHJldHVybiAoY29udGV4dCkgPT4gY2FsbFJ1bGUocnVsZSwgc3RhdGljRW1wdHkoKSwgY29udGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBicmFuY2hBbmRNZXJnZShydWxlOiBSdWxlLCBzdHJhdGVneSA9IE1lcmdlU3RyYXRlZ3kuRGVmYXVsdCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWUsIGNvbnRleHQpID0+IHtcbiAgICByZXR1cm4gY2FsbFJ1bGUocnVsZSwgdHJlZS5icmFuY2goKSwgY29udGV4dCkucGlwZShcbiAgICAgIG1hcCgoYnJhbmNoKSA9PiB0cmVlLm1lcmdlKGJyYW5jaCwgc3RyYXRlZ3kgfHwgY29udGV4dC5zdHJhdGVneSkpLFxuICAgICAgbWFwVG8odHJlZSksXG4gICAgKTtcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdoZW4ocHJlZGljYXRlOiBGaWxlUHJlZGljYXRlPGJvb2xlYW4+LCBvcGVyYXRvcjogRmlsZU9wZXJhdG9yKTogRmlsZU9wZXJhdG9yIHtcbiAgcmV0dXJuIChlbnRyeTogRmlsZUVudHJ5KSA9PiB7XG4gICAgaWYgKHByZWRpY2F0ZShlbnRyeS5wYXRoLCBlbnRyeSkpIHtcbiAgICAgIHJldHVybiBvcGVyYXRvcihlbnRyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBlbnRyeTtcbiAgICB9XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJ0aXRpb25BcHBseU1lcmdlKFxuICBwcmVkaWNhdGU6IEZpbGVQcmVkaWNhdGU8Ym9vbGVhbj4sXG4gIHJ1bGVZZXM6IFJ1bGUsXG4gIHJ1bGVObz86IFJ1bGUsXG4pOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlLCBjb250ZXh0KSA9PiB7XG4gICAgY29uc3QgW3llcywgbm9dID0gcGFydGl0aW9uKHRyZWUsIHByZWRpY2F0ZSk7XG5cbiAgICByZXR1cm4gY29uY2F0KGNhbGxSdWxlKHJ1bGVZZXMsIHllcywgY29udGV4dCksIGNhbGxSdWxlKHJ1bGVObyB8fCBub29wKCksIG5vLCBjb250ZXh0KSkucGlwZShcbiAgICAgIHRvQXJyYXkoKSxcbiAgICAgIG1hcCgoW3llc1RyZWUsIG5vVHJlZV0pID0+IHtcbiAgICAgICAgeWVzVHJlZS5tZXJnZShub1RyZWUsIGNvbnRleHQuc3RyYXRlZ3kpO1xuXG4gICAgICAgIHJldHVybiB5ZXNUcmVlO1xuICAgICAgfSksXG4gICAgKTtcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvckVhY2gob3BlcmF0b3I6IEZpbGVPcGVyYXRvcik6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUpID0+IHtcbiAgICB0cmVlLnZpc2l0KChwYXRoLCBlbnRyeSkgPT4ge1xuICAgICAgaWYgKCFlbnRyeSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBuZXdFbnRyeSA9IG9wZXJhdG9yKGVudHJ5KTtcbiAgICAgIGlmIChuZXdFbnRyeSA9PT0gZW50cnkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKG5ld0VudHJ5ID09PSBudWxsKSB7XG4gICAgICAgIHRyZWUuZGVsZXRlKHBhdGgpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChuZXdFbnRyeS5wYXRoICE9IHBhdGgpIHtcbiAgICAgICAgdHJlZS5yZW5hbWUocGF0aCwgbmV3RW50cnkucGF0aCk7XG4gICAgICB9XG4gICAgICBpZiAoIW5ld0VudHJ5LmNvbnRlbnQuZXF1YWxzKGVudHJ5LmNvbnRlbnQpKSB7XG4gICAgICAgIHRyZWUub3ZlcndyaXRlKG5ld0VudHJ5LnBhdGgsIG5ld0VudHJ5LmNvbnRlbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcG9zZUZpbGVPcGVyYXRvcnMob3BlcmF0b3JzOiBGaWxlT3BlcmF0b3JbXSk6IEZpbGVPcGVyYXRvciB7XG4gIHJldHVybiAoZW50cnk6IEZpbGVFbnRyeSkgPT4ge1xuICAgIGxldCBjdXJyZW50OiBGaWxlRW50cnkgfCBudWxsID0gZW50cnk7XG4gICAgZm9yIChjb25zdCBvcCBvZiBvcGVyYXRvcnMpIHtcbiAgICAgIGN1cnJlbnQgPSBvcChjdXJyZW50KTtcblxuICAgICAgaWYgKGN1cnJlbnQgPT09IG51bGwpIHtcbiAgICAgICAgLy8gRGVsZXRlZCwganVzdCByZXR1cm4uXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjdXJyZW50O1xuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlUb1N1YnRyZWUocGF0aDogc3RyaW5nLCBydWxlczogUnVsZVtdKTogUnVsZSB7XG4gIHJldHVybiAodHJlZSwgY29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHNjb3BlZCA9IG5ldyBTY29wZWRUcmVlKHRyZWUsIHBhdGgpO1xuXG4gICAgcmV0dXJuIGNhbGxSdWxlKGNoYWluKHJ1bGVzKSwgc2NvcGVkLCBjb250ZXh0KS5waXBlKFxuICAgICAgbWFwKChyZXN1bHQpID0+IHtcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gc2NvcGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRyZWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgICAnT3JpZ2luYWwgdHJlZSBtdXN0IGJlIHJldHVybmVkIGZyb20gYWxsIHJ1bGVzIHdoZW4gdXNpbmcgXCJhcHBseVRvU3VidHJlZVwiLicsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKTtcbiAgfTtcbn1cbiJdfQ==