"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MergeStrategy;
(function (MergeStrategy) {
    MergeStrategy[MergeStrategy["AllowOverwriteConflict"] = 2] = "AllowOverwriteConflict";
    MergeStrategy[MergeStrategy["AllowCreationConflict"] = 4] = "AllowCreationConflict";
    MergeStrategy[MergeStrategy["AllowDeleteConflict"] = 8] = "AllowDeleteConflict";
    // Uses the default strategy.
    MergeStrategy[MergeStrategy["Default"] = 0] = "Default";
    // Error out if 2 files have the same path. It is useful to have a different value than
    // Default in this case as the tooling Default might differ.
    MergeStrategy[MergeStrategy["Error"] = 1] = "Error";
    // Only content conflicts are overwritten.
    MergeStrategy[MergeStrategy["ContentOnly"] = 2] = "ContentOnly";
    // Overwrite everything with the latest change.
    MergeStrategy[MergeStrategy["Overwrite"] = 14] = "Overwrite";
})(MergeStrategy = exports.MergeStrategy || (exports.MergeStrategy = {}));
exports.FileVisitorCancelToken = Symbol();
exports.TreeSymbol = (function () {
    const globalSymbol = (typeof window == 'object' && window.window === window && window.Symbol)
        || (typeof self == 'object' && self.self === self && self.Symbol)
        || (typeof global == 'object' && global.global === global && global.Symbol);
    if (!globalSymbol) {
        return Symbol('schematic-tree');
    }
    if (!globalSymbol.schematicTree) {
        globalSymbol.schematicTree = Symbol('schematic-tree');
    }
    return globalSymbol.schematicTree;
})();
var Tree;
(function (Tree) {
    function isTree(maybeTree) {
        return exports.TreeSymbol in maybeTree;
    }
    Tree.isTree = isTree;
})(Tree || (Tree = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy90cmVlL2ludGVyZmFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVdBLElBQVksYUFtQlg7QUFuQkQsV0FBWSxhQUFhO0lBQ3ZCLHFGQUFrQyxDQUFBO0lBQ2xDLG1GQUFrQyxDQUFBO0lBQ2xDLCtFQUFrQyxDQUFBO0lBRWxDLDZCQUE2QjtJQUM3Qix1REFBNkIsQ0FBQTtJQUU3Qix1RkFBdUY7SUFDdkYsNERBQTREO0lBQzVELG1EQUFrQyxDQUFBO0lBRWxDLDBDQUEwQztJQUMxQywrREFBZ0UsQ0FBQTtJQUVoRSwrQ0FBK0M7SUFDL0MsNERBRTZELENBQUE7QUFDL0QsQ0FBQyxFQW5CVyxhQUFhLEdBQWIscUJBQWEsS0FBYixxQkFBYSxRQW1CeEI7QUFHWSxRQUFBLHNCQUFzQixHQUFXLE1BQU0sRUFBRSxDQUFDO0FBNkIxQyxRQUFBLFVBQVUsR0FBVyxDQUFDO0lBQ2pDLE1BQU0sWUFBWSxHQUFHLENBQUMsT0FBTyxNQUFNLElBQUksUUFBUSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUM7V0FDeEUsQ0FBQyxPQUFPLElBQUksSUFBSSxRQUFRLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztXQUM5RCxDQUFDLE9BQU8sTUFBTSxJQUFJLFFBQVEsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFOUYsSUFBSSxDQUFDLFlBQVksRUFBRTtRQUNqQixPQUFPLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0tBQ2pDO0lBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUU7UUFDL0IsWUFBWSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztLQUN2RDtJQUVELE9BQU8sWUFBWSxDQUFDLGFBQWEsQ0FBQztBQUNwQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBK0JMLElBQVUsSUFBSSxDQUliO0FBSkQsV0FBVSxJQUFJO0lBQ1osZ0JBQXVCLFNBQWlCO1FBQ3RDLE9BQU8sa0JBQVUsSUFBSSxTQUFTLENBQUM7SUFDakMsQ0FBQztJQUZlLFdBQU0sU0FFckIsQ0FBQTtBQUNILENBQUMsRUFKUyxJQUFJLEtBQUosSUFBSSxRQUliIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgUGF0aCwgUGF0aEZyYWdtZW50IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgQWN0aW9uIH0gZnJvbSAnLi9hY3Rpb24nO1xuXG5cbmV4cG9ydCBlbnVtIE1lcmdlU3RyYXRlZ3kge1xuICBBbGxvd092ZXJ3cml0ZUNvbmZsaWN0ICAgID0gMSA8PCAxLFxuICBBbGxvd0NyZWF0aW9uQ29uZmxpY3QgICAgID0gMSA8PCAyLFxuICBBbGxvd0RlbGV0ZUNvbmZsaWN0ICAgICAgID0gMSA8PCAzLFxuXG4gIC8vIFVzZXMgdGhlIGRlZmF1bHQgc3RyYXRlZ3kuXG4gIERlZmF1bHQgICAgICAgICAgICAgICAgICAgPSAwLFxuXG4gIC8vIEVycm9yIG91dCBpZiAyIGZpbGVzIGhhdmUgdGhlIHNhbWUgcGF0aC4gSXQgaXMgdXNlZnVsIHRvIGhhdmUgYSBkaWZmZXJlbnQgdmFsdWUgdGhhblxuICAvLyBEZWZhdWx0IGluIHRoaXMgY2FzZSBhcyB0aGUgdG9vbGluZyBEZWZhdWx0IG1pZ2h0IGRpZmZlci5cbiAgRXJyb3IgICAgICAgICAgICAgICAgICAgICA9IDEgPDwgMCxcblxuICAvLyBPbmx5IGNvbnRlbnQgY29uZmxpY3RzIGFyZSBvdmVyd3JpdHRlbi5cbiAgQ29udGVudE9ubHkgICAgICAgICAgICAgICA9IE1lcmdlU3RyYXRlZ3kuQWxsb3dPdmVyd3JpdGVDb25mbGljdCxcblxuICAvLyBPdmVyd3JpdGUgZXZlcnl0aGluZyB3aXRoIHRoZSBsYXRlc3QgY2hhbmdlLlxuICBPdmVyd3JpdGUgICAgICAgICAgICAgICAgID0gTWVyZ2VTdHJhdGVneS5BbGxvd092ZXJ3cml0ZUNvbmZsaWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBNZXJnZVN0cmF0ZWd5LkFsbG93Q3JlYXRpb25Db25mbGljdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgTWVyZ2VTdHJhdGVneS5BbGxvd0RlbGV0ZUNvbmZsaWN0LFxufVxuXG5cbmV4cG9ydCBjb25zdCBGaWxlVmlzaXRvckNhbmNlbFRva2VuOiBzeW1ib2wgPSBTeW1ib2woKTtcbmV4cG9ydCB0eXBlIEZpbGVWaXNpdG9yID0gRmlsZVByZWRpY2F0ZTx2b2lkPjtcblxuZXhwb3J0IGludGVyZmFjZSBGaWxlRW50cnkge1xuICByZWFkb25seSBwYXRoOiBQYXRoO1xuICByZWFkb25seSBjb250ZW50OiBCdWZmZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGlyRW50cnkge1xuICByZWFkb25seSBwYXJlbnQ6IERpckVudHJ5IHwgbnVsbDtcbiAgcmVhZG9ubHkgcGF0aDogUGF0aDtcblxuICByZWFkb25seSBzdWJkaXJzOiBQYXRoRnJhZ21lbnRbXTtcbiAgcmVhZG9ubHkgc3ViZmlsZXM6IFBhdGhGcmFnbWVudFtdO1xuXG4gIGRpcihuYW1lOiBQYXRoRnJhZ21lbnQpOiBEaXJFbnRyeTtcbiAgZmlsZShuYW1lOiBQYXRoRnJhZ21lbnQpOiBGaWxlRW50cnkgfCBudWxsO1xuXG4gIHZpc2l0KHZpc2l0b3I6IEZpbGVWaXNpdG9yKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGaWxlUHJlZGljYXRlPFQ+IHtcbiAgKHBhdGg6IFBhdGgsIGVudHJ5PzogUmVhZG9ubHk8RmlsZUVudHJ5PiB8IG51bGwpOiBUO1xufVxuXG5kZWNsYXJlIGNvbnN0IHdpbmRvdzogeyBTeW1ib2w6IHsgc2NoZW1hdGljVHJlZTogc3ltYm9sIH0sIHdpbmRvdzoge30gfTtcbmRlY2xhcmUgY29uc3Qgc2VsZjogeyBTeW1ib2w6IHsgc2NoZW1hdGljVHJlZTogc3ltYm9sIH0sIHNlbGY6IHt9IH07XG5kZWNsYXJlIGNvbnN0IGdsb2JhbDogeyBTeW1ib2w6IHsgc2NoZW1hdGljVHJlZTogc3ltYm9sIH0sIGdsb2JhbDoge30gfTtcblxuZXhwb3J0IGNvbnN0IFRyZWVTeW1ib2w6IHN5bWJvbCA9IChmdW5jdGlvbigpIHtcbiAgY29uc3QgZ2xvYmFsU3ltYm9sID0gKHR5cGVvZiB3aW5kb3cgPT0gJ29iamVjdCcgJiYgd2luZG93LndpbmRvdyA9PT0gd2luZG93ICYmIHdpbmRvdy5TeW1ib2wpXG4gICAgICAgICAgICAgICAgICAgIHx8ICh0eXBlb2Ygc2VsZiA9PSAnb2JqZWN0JyAmJiBzZWxmLnNlbGYgPT09IHNlbGYgJiYgc2VsZi5TeW1ib2wpXG4gICAgICAgICAgICAgICAgICAgIHx8ICh0eXBlb2YgZ2xvYmFsID09ICdvYmplY3QnICYmIGdsb2JhbC5nbG9iYWwgPT09IGdsb2JhbCAmJiBnbG9iYWwuU3ltYm9sKTtcblxuICBpZiAoIWdsb2JhbFN5bWJvbCkge1xuICAgIHJldHVybiBTeW1ib2woJ3NjaGVtYXRpYy10cmVlJyk7XG4gIH1cblxuICBpZiAoIWdsb2JhbFN5bWJvbC5zY2hlbWF0aWNUcmVlKSB7XG4gICAgZ2xvYmFsU3ltYm9sLnNjaGVtYXRpY1RyZWUgPSBTeW1ib2woJ3NjaGVtYXRpYy10cmVlJyk7XG4gIH1cblxuICByZXR1cm4gZ2xvYmFsU3ltYm9sLnNjaGVtYXRpY1RyZWU7XG59KSgpO1xuXG5cbmV4cG9ydCBpbnRlcmZhY2UgVHJlZSB7XG4gIGJyYW5jaCgpOiBUcmVlO1xuICBtZXJnZShvdGhlcjogVHJlZSwgc3RyYXRlZ3k/OiBNZXJnZVN0cmF0ZWd5KTogdm9pZDtcblxuICByZWFkb25seSByb290OiBEaXJFbnRyeTtcblxuICAvLyBSZWFkb25seS5cbiAgcmVhZChwYXRoOiBzdHJpbmcpOiBCdWZmZXIgfCBudWxsO1xuICBleGlzdHMocGF0aDogc3RyaW5nKTogYm9vbGVhbjtcbiAgZ2V0KHBhdGg6IHN0cmluZyk6IEZpbGVFbnRyeSB8IG51bGw7XG4gIGdldERpcihwYXRoOiBzdHJpbmcpOiBEaXJFbnRyeTtcbiAgdmlzaXQodmlzaXRvcjogRmlsZVZpc2l0b3IpOiB2b2lkO1xuXG4gIC8vIENoYW5nZSBjb250ZW50IG9mIGhvc3QgZmlsZXMuXG4gIG92ZXJ3cml0ZShwYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IEJ1ZmZlciB8IHN0cmluZyk6IHZvaWQ7XG4gIGJlZ2luVXBkYXRlKHBhdGg6IHN0cmluZyk6IFVwZGF0ZVJlY29yZGVyO1xuICBjb21taXRVcGRhdGUocmVjb3JkOiBVcGRhdGVSZWNvcmRlcik6IHZvaWQ7XG5cbiAgLy8gU3RydWN0dXJhbCBtZXRob2RzLlxuICBjcmVhdGUocGF0aDogc3RyaW5nLCBjb250ZW50OiBCdWZmZXIgfCBzdHJpbmcpOiB2b2lkO1xuICBkZWxldGUocGF0aDogc3RyaW5nKTogdm9pZDtcbiAgcmVuYW1lKGZyb206IHN0cmluZywgdG86IHN0cmluZyk6IHZvaWQ7XG5cbiAgYXBwbHkoYWN0aW9uOiBBY3Rpb24sIHN0cmF0ZWd5PzogTWVyZ2VTdHJhdGVneSk6IHZvaWQ7XG4gIHJlYWRvbmx5IGFjdGlvbnM6IEFjdGlvbltdO1xufVxuXG5cbm5hbWVzcGFjZSBUcmVlIHtcbiAgZXhwb3J0IGZ1bmN0aW9uIGlzVHJlZShtYXliZVRyZWU6IG9iamVjdCk6IG1heWJlVHJlZSBpcyBUcmVlIHtcbiAgICByZXR1cm4gVHJlZVN5bWJvbCBpbiBtYXliZVRyZWU7XG4gIH1cbn1cblxuXG5leHBvcnQgaW50ZXJmYWNlIFVwZGF0ZVJlY29yZGVyIHtcbiAgLy8gVGhlc2UganVzdCByZWNvcmQgY2hhbmdlcy5cbiAgaW5zZXJ0TGVmdChpbmRleDogbnVtYmVyLCBjb250ZW50OiBCdWZmZXIgfCBzdHJpbmcpOiBVcGRhdGVSZWNvcmRlcjtcbiAgaW5zZXJ0UmlnaHQoaW5kZXg6IG51bWJlciwgY29udGVudDogQnVmZmVyIHwgc3RyaW5nKTogVXBkYXRlUmVjb3JkZXI7XG4gIHJlbW92ZShpbmRleDogbnVtYmVyLCBsZW5ndGg6IG51bWJlcik6IFVwZGF0ZVJlY29yZGVyO1xufVxuIl19