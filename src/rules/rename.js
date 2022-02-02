"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rename = void 0;
const core_1 = require("@angular-devkit/core");
const base_1 = require("./base");
function rename(match, to) {
    return (0, base_1.forEach)((entry) => {
        if (match(entry.path, entry)) {
            return {
                content: entry.content,
                path: (0, core_1.normalize)(to(entry.path, entry)),
            };
        }
        else {
            return entry;
        }
    });
}
exports.rename = rename;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuYW1lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvcnVsZXMvcmVuYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtDQUFpRDtBQUdqRCxpQ0FBaUM7QUFFakMsU0FBZ0IsTUFBTSxDQUFDLEtBQTZCLEVBQUUsRUFBeUI7SUFDN0UsT0FBTyxJQUFBLGNBQU8sRUFBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQ3ZCLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUU7WUFDNUIsT0FBTztnQkFDTCxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87Z0JBQ3RCLElBQUksRUFBRSxJQUFBLGdCQUFTLEVBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDdkMsQ0FBQztTQUNIO2FBQU07WUFDTCxPQUFPLEtBQUssQ0FBQztTQUNkO0lBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBWEQsd0JBV0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgbm9ybWFsaXplIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgUnVsZSB9IGZyb20gJy4uL2VuZ2luZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgRmlsZVByZWRpY2F0ZSB9IGZyb20gJy4uL3RyZWUvaW50ZXJmYWNlJztcbmltcG9ydCB7IGZvckVhY2ggfSBmcm9tICcuL2Jhc2UnO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVuYW1lKG1hdGNoOiBGaWxlUHJlZGljYXRlPGJvb2xlYW4+LCB0bzogRmlsZVByZWRpY2F0ZTxzdHJpbmc+KTogUnVsZSB7XG4gIHJldHVybiBmb3JFYWNoKChlbnRyeSkgPT4ge1xuICAgIGlmIChtYXRjaChlbnRyeS5wYXRoLCBlbnRyeSkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbnRlbnQ6IGVudHJ5LmNvbnRlbnQsXG4gICAgICAgIHBhdGg6IG5vcm1hbGl6ZSh0byhlbnRyeS5wYXRoLCBlbnRyeSkpLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGVudHJ5O1xuICAgIH1cbiAgfSk7XG59XG4iXX0=