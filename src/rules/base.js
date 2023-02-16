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
    return async (initialTree, context) => {
        let intermediateTree;
        for await (const rule of rules) {
            intermediateTree = (0, call_1.callRule)(rule, intermediateTree !== null && intermediateTree !== void 0 ? intermediateTree : initialTree, context);
        }
        return () => intermediateTree;
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
        return (0, call_1.callSource)(source, context).pipe((0, rxjs_1.map)((sourceTree) => tree.merge(sourceTree, strategy || context.strategy)), (0, rxjs_1.mapTo)(tree));
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
        return (0, call_1.callRule)(rule, tree.branch(), context).pipe((0, rxjs_1.map)((branch) => tree.merge(branch, strategy || context.strategy)), (0, rxjs_1.mapTo)(tree));
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
        return (0, rxjs_1.concat)((0, call_1.callRule)(ruleYes, yes, context), (0, call_1.callRule)(ruleNo || noop(), no, context)).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)(([yesTree, noTree]) => {
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
        return (0, call_1.callRule)(chain(rules), scoped, context).pipe((0, rxjs_1.map)((result) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3J1bGVzL2Jhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0JBQStEO0FBRS9ELHNEQUE2RDtBQUM3RCxpREFBNkQ7QUFDN0QsaURBQWtGO0FBQ2xGLDJDQUE0QztBQUM1QywyQ0FBaUU7QUFDakUsaUNBQThDO0FBRTlDOztHQUVHO0FBQ0gsU0FBZ0IsTUFBTSxDQUFDLElBQVU7SUFDL0IsT0FBTyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7QUFDcEIsQ0FBQztBQUZELHdCQUVDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixLQUFLO0lBQ25CLE9BQU8sR0FBRyxFQUFFLENBQUMsSUFBQSxjQUFXLEdBQUUsQ0FBQztBQUM3QixDQUFDO0FBRkQsc0JBRUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLEtBQUssQ0FBQyxLQUEyQztJQUMvRCxPQUFPLEtBQUssRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLEVBQUU7UUFDcEMsSUFBSSxnQkFBOEMsQ0FBQztRQUNuRCxJQUFJLEtBQUssRUFBRSxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7WUFDOUIsZ0JBQWdCLEdBQUcsSUFBQSxlQUFRLEVBQUMsSUFBSSxFQUFFLGdCQUFnQixhQUFoQixnQkFBZ0IsY0FBaEIsZ0JBQWdCLEdBQUksV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzdFO1FBRUQsT0FBTyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQztJQUNoQyxDQUFDLENBQUM7QUFDSixDQUFDO0FBVEQsc0JBU0M7QUFFRDs7R0FFRztBQUNILFNBQWdCLEtBQUssQ0FBQyxNQUFjLEVBQUUsS0FBYTtJQUNqRCxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFBLGVBQVEsRUFBQyxLQUFL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QztBQUNKLENBQUM7QUF2QkQsMEJBdUJDO0FBRUQsU0FBZ0Isb0JBQW9CLENBQUMsU0FBeUI7SUFDNUQsT0FBTyxDQUFDLEtBQWdCLEVBQUUsRUFBRTtRQUMxQixJQUFJLE9BQU8sR0FBcUIsS0FBSyxDQUFDO1FBQ3RDLEtBQUssTUFBTSxFQUFFLElBQUksU0FBUyxFQUFFO1lBQzFCLE9BQU8sR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFdEIsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFO2dCQUNwQix3QkFBd0I7Z0JBQ3hCLE9BQU8sSUFBSSxDQUFDO2FBQ2I7U0FDRjtRQUVELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUMsQ0FBQztBQUNKLENBQUM7QUFkRCxvREFjQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxJQUFZLEVBQUUsS0FBYTtJQUN4RCxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFO1FBQ3ZCLE1BQU0sTUFBTSxHQUFHLElBQUksbUJBQVUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFMUMsT0FBTyxJQUFBLGVBQVEsRUFBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FDakQsSUFBQSxVQUFHLEVBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtZQUNiLElBQUksTUFBTSxLQUFLLE1BQU0sRUFBRTtnQkFDckIsT0FBTyxJQUFJLENBQUM7YUFDYjtpQkFBTTtnQkFDTCxNQUFNLElBQUksK0JBQW1CLENBQzNCLDRFQUE0RSxDQUM3RSxDQUFDO2FBQ0g7UUFDSCxDQUFDLENBQUMsQ0FDSCxDQUFDO0lBQ0osQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQWhCRCx3Q0FnQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgY29uY2F0LCBtYXAsIG1hcFRvLCB0b0FycmF5IH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBGaWxlT3BlcmF0b3IsIFJ1bGUsIFNvdXJjZSB9IGZyb20gJy4uL2VuZ2luZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgU2NoZW1hdGljc0V4Y2VwdGlvbiB9IGZyb20gJy4uL2V4Y2VwdGlvbi9leGNlcHRpb24nO1xuaW1wb3J0IHsgRmlsdGVySG9zdFRyZWUsIEhvc3RUcmVlIH0gZnJvbSAnLi4vdHJlZS9ob3N0LXRyZWUnO1xuaW1wb3J0IHsgRmlsZUVudHJ5LCBGaWxlUHJlZGljYXRlLCBNZXJnZVN0cmF0ZWd5LCBUcmVlIH0gZnJvbSAnLi4vdHJlZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgU2NvcGVkVHJlZSB9IGZyb20gJy4uL3RyZWUvc2NvcGVkJztcbmltcG9ydCB7IHBhcnRpdGlvbiwgZW1wdHkgYXMgc3RhdGljRW1wdHkgfSBmcm9tICcuLi90cmVlL3N0YXRpYyc7XG5pbXBvcnQgeyBjYWxsUnVsZSwgY2FsbFNvdXJjZSB9IGZyb20gJy4vY2FsbCc7XG5cbi8qKlxuICogQSBTb3VyY2UgdGhhdCByZXR1cm5zIGFuIHRyZWUgYXMgaXRzIHNpbmdsZSB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNvdXJjZSh0cmVlOiBUcmVlKTogU291cmNlIHtcbiAgcmV0dXJuICgpID0+IHRyZWU7XG59XG5cbi8qKlxuICogQSBzb3VyY2UgdGhhdCByZXR1cm5zIGFuIGVtcHR5IHRyZWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbXB0eSgpOiBTb3VyY2Uge1xuICByZXR1cm4gKCkgPT4gc3RhdGljRW1wdHkoKTtcbn1cblxuLyoqXG4gKiBDaGFpbiBtdWx0aXBsZSBydWxlcyBpbnRvIGEgc2luZ2xlIHJ1bGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGFpbihydWxlczogSXRlcmFibGU8UnVsZT4gfCBBc3luY0l0ZXJhYmxlPFJ1bGU+KTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAoaW5pdGlhbFRyZWUsIGNvbnRleHQpID0+IHtcbiAgICBsZXQgaW50ZXJtZWRpYXRlVHJlZTogT2JzZXJ2YWJsZTxUcmVlPiB8IHVuZGVmaW5lZDtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IHJ1bGUgb2YgcnVsZXMpIHtcbiAgICAgIGludGVybWVkaWF0ZVRyZWUgPSBjYWxsUnVsZShydWxlLCBpbnRlcm1lZGlhdGVUcmVlID8/IGluaXRpYWxUcmVlLCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gKCkgPT4gaW50ZXJtZWRpYXRlVHJlZTtcbiAgfTtcbn1cblxuLyoqXG4gKiBBcHBseSBtdWx0aXBsZSBydWxlcyB0byBhIHNvdXJjZSwgYW5kIHJldHVybnMgdGhlIHNvdXJjZSB0cmFuc2Zvcm1lZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5KHNvdXJjZTogU291cmNlLCBydWxlczogUnVsZVtdKTogU291cmNlIHtcbiAgcmV0dXJuIChjb250ZXh0KSA9PiBjYWxsUnVsZShjaGFpbihydWxlcyksIGNhbGxTb3VyY2Uoc291cmNlLCBjb250ZXh0KSwgY29udGV4dCk7XG59XG5cbi8qKlxuICogTWVyZ2UgYW4gaW5wdXQgdHJlZSB3aXRoIHRoZSBzb3VyY2UgcGFzc2VkIGluLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VXaXRoKHNvdXJjZTogU291cmNlLCBzdHJhdGVneTogTWVyZ2VTdHJhdGVneSA9IE1lcmdlU3RyYXRlZ3kuRGVmYXVsdCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWUsIGNvbnRleHQpID0+IHtcbiAgICByZXR1cm4gY2FsbFNvdXJjZShzb3VyY2UsIGNvbnRleHQpLnBpcGUoXG4gICAgICBtYXAoKHNvdXJjZVRyZWUpID0+IHRyZWUubWVyZ2Uoc291cmNlVHJlZSwgc3RyYXRlZ3kgfHwgY29udGV4dC5zdHJhdGVneSkpLFxuICAgICAgbWFwVG8odHJlZSksXG4gICAgKTtcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vb3AoKTogUnVsZSB7XG4gIHJldHVybiAoKSA9PiB7fTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlcihwcmVkaWNhdGU6IEZpbGVQcmVkaWNhdGU8Ym9vbGVhbj4pOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlOiBUcmVlKSA9PiB7XG4gICAgaWYgKEhvc3RUcmVlLmlzSG9zdFRyZWUodHJlZSkpIHtcbiAgICAgIHJldHVybiBuZXcgRmlsdGVySG9zdFRyZWUodHJlZSwgcHJlZGljYXRlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ1RyZWUgdHlwZSBpcyBub3Qgc3VwcG9ydGVkLicpO1xuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzU291cmNlKHJ1bGU6IFJ1bGUpOiBTb3VyY2Uge1xuICByZXR1cm4gKGNvbnRleHQpID0+IGNhbGxSdWxlKHJ1bGUsIHN0YXRpY0VtcHR5KCksIGNvbnRleHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnJhbmNoQW5kTWVyZ2UocnVsZTogUnVsZSwgc3RyYXRlZ3kgPSBNZXJnZVN0cmF0ZWd5LkRlZmF1bHQpOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlLCBjb250ZXh0KSA9PiB7XG4gICAgcmV0dXJuIGNhbGxSdWxlKHJ1bGUsIHRyZWUuYnJhbmNoKCksIGNvbnRleHQpLnBpcGUoXG4gICAgICBtYXAoKGJyYW5jaCkgPT4gdHJlZS5tZXJnZShicmFuY2gsIHN0cmF0ZWd5IHx8IGNvbnRleHQuc3RyYXRlZ3kpKSxcbiAgICAgIG1hcFRvKHRyZWUpLFxuICAgICk7XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3aGVuKHByZWRpY2F0ZTogRmlsZVByZWRpY2F0ZTxib29sZWFuPiwgb3BlcmF0b3I6IEZpbGVPcGVyYXRvcik6IEZpbGVPcGVyYXRvciB7XG4gIHJldHVybiAoZW50cnk6IEZpbGVFbnRyeSkgPT4ge1xuICAgIGlmIChwcmVkaWNhdGUoZW50cnkucGF0aCwgZW50cnkpKSB7XG4gICAgICByZXR1cm4gb3BlcmF0b3IoZW50cnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZW50cnk7XG4gICAgfVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFydGl0aW9uQXBwbHlNZXJnZShcbiAgcHJlZGljYXRlOiBGaWxlUHJlZGljYXRlPGJvb2xlYW4+LFxuICBydWxlWWVzOiBSdWxlLFxuICBydWxlTm8/OiBSdWxlLFxuKTogUnVsZSB7XG4gIHJldHVybiAodHJlZSwgY29udGV4dCkgPT4ge1xuICAgIGNvbnN0IFt5ZXMsIG5vXSA9IHBhcnRpdGlvbih0cmVlLCBwcmVkaWNhdGUpO1xuXG4gICAgcmV0dXJuIGNvbmNhdChjYWxsUnVsZShydWxlWWVzLCB5ZXMsIGNvbnRleHQpLCBjYWxsUnVsZShydWxlTm8gfHwgbm9vcCgpLCBubywgY29udGV4dCkpLnBpcGUoXG4gICAgICB0b0FycmF5KCksXG4gICAgICBtYXAoKFt5ZXNUcmVlLCBub1RyZWVdKSA9PiB7XG4gICAgICAgIHllc1RyZWUubWVyZ2Uobm9UcmVlLCBjb250ZXh0LnN0cmF0ZWd5KTtcblxuICAgICAgICByZXR1cm4geWVzVHJlZTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JFYWNoKG9wZXJhdG9yOiBGaWxlT3BlcmF0b3IpOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlOiBUcmVlKSA9PiB7XG4gICAgdHJlZS52aXNpdCgocGF0aCwgZW50cnkpID0+IHtcbiAgICAgIGlmICghZW50cnkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgbmV3RW50cnkgPSBvcGVyYXRvcihlbnRyeSk7XG4gICAgICBpZiAobmV3RW50cnkgPT09IGVudHJ5KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChuZXdFbnRyeSA9PT0gbnVsbCkge1xuICAgICAgICB0cmVlLmRlbGV0ZShwYXRoKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAobmV3RW50cnkucGF0aCAhPSBwYXRoKSB7XG4gICAgICAgIHRyZWUucmVuYW1lKHBhdGgsIG5ld0VudHJ5LnBhdGgpO1xuICAgICAgfVxuICAgICAgaWYgKCFuZXdFbnRyeS5jb250ZW50LmVxdWFscyhlbnRyeS5jb250ZW50KSkge1xuICAgICAgICB0cmVlLm92ZXJ3cml0ZShuZXdFbnRyeS5wYXRoLCBuZXdFbnRyeS5jb250ZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvc2VGaWxlT3BlcmF0b3JzKG9wZXJhdG9yczogRmlsZU9wZXJhdG9yW10pOiBGaWxlT3BlcmF0b3Ige1xuICByZXR1cm4gKGVudHJ5OiBGaWxlRW50cnkpID0+IHtcbiAgICBsZXQgY3VycmVudDogRmlsZUVudHJ5IHwgbnVsbCA9IGVudHJ5O1xuICAgIGZvciAoY29uc3Qgb3Agb2Ygb3BlcmF0b3JzKSB7XG4gICAgICBjdXJyZW50ID0gb3AoY3VycmVudCk7XG5cbiAgICAgIGlmIChjdXJyZW50ID09PSBudWxsKSB7XG4gICAgICAgIC8vIERlbGV0ZWQsIGp1c3QgcmV0dXJuLlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY3VycmVudDtcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5VG9TdWJ0cmVlKHBhdGg6IHN0cmluZywgcnVsZXM6IFJ1bGVbXSk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWUsIGNvbnRleHQpID0+IHtcbiAgICBjb25zdCBzY29wZWQgPSBuZXcgU2NvcGVkVHJlZSh0cmVlLCBwYXRoKTtcblxuICAgIHJldHVybiBjYWxsUnVsZShjaGFpbihydWxlcyksIHNjb3BlZCwgY29udGV4dCkucGlwZShcbiAgICAgIG1hcCgocmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IHNjb3BlZCkge1xuICAgICAgICAgIHJldHVybiB0cmVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgICAgJ09yaWdpbmFsIHRyZWUgbXVzdCBiZSByZXR1cm5lZCBmcm9tIGFsbCBydWxlcyB3aGVuIHVzaW5nIFwiYXBwbHlUb1N1YnRyZWVcIi4nLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICk7XG4gIH07XG59XG4iXX0=