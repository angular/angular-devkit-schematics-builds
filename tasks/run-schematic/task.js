"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunSchematicTask = void 0;
const options_1 = require("./options");
class RunSchematicTask {
    _collection;
    _schematic;
    _options;
    constructor(c, s, o) {
        if (arguments.length == 2 || typeof s !== 'string') {
            o = s;
            s = c;
            c = null;
        }
        this._collection = c;
        this._schematic = s;
        this._options = o;
    }
    toConfiguration() {
        return {
            name: options_1.RunSchematicName,
            options: {
                collection: this._collection,
                name: this._schematic,
                options: this._options,
            },
        };
    }
}
exports.RunSchematicTask = RunSchematicTask;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFzay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MvcnVuLXNjaGVtYXRpYy90YXNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUdILHVDQUFzRTtBQUV0RSxNQUFhLGdCQUFnQjtJQUNqQixXQUFXLENBQWdCO0lBQzNCLFVBQVUsQ0FBUztJQUNuQixRQUFRLENBQUk7SUFLdEIsWUFBWSxDQUFnQixFQUFFLENBQWEsRUFBRSxDQUFLO1FBQ2hELElBQUksU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxFQUFFO1lBQ2xELENBQUMsR0FBRyxDQUFNLENBQUM7WUFDWCxDQUFDLEdBQUcsQ0FBVyxDQUFDO1lBQ2hCLENBQUMsR0FBRyxJQUFJLENBQUM7U0FDVjtRQUVELElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBTSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxlQUFlO1FBQ2IsT0FBTztZQUNMLElBQUksRUFBRSwwQkFBZ0I7WUFDdEIsT0FBTyxFQUFFO2dCQUNQLFVBQVUsRUFBRSxJQUFJLENBQUMsV0FBVztnQkFDNUIsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVO2dCQUNyQixPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVE7YUFDdkI7U0FDRixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBOUJELDRDQThCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBUYXNrQ29uZmlndXJhdGlvbiwgVGFza0NvbmZpZ3VyYXRpb25HZW5lcmF0b3IgfSBmcm9tICcuLi8uLi9zcmMnO1xuaW1wb3J0IHsgUnVuU2NoZW1hdGljTmFtZSwgUnVuU2NoZW1hdGljVGFza09wdGlvbnMgfSBmcm9tICcuL29wdGlvbnMnO1xuXG5leHBvcnQgY2xhc3MgUnVuU2NoZW1hdGljVGFzazxUPiBpbXBsZW1lbnRzIFRhc2tDb25maWd1cmF0aW9uR2VuZXJhdG9yPFJ1blNjaGVtYXRpY1Rhc2tPcHRpb25zPFQ+PiB7XG4gIHByb3RlY3RlZCBfY29sbGVjdGlvbjogc3RyaW5nIHwgbnVsbDtcbiAgcHJvdGVjdGVkIF9zY2hlbWF0aWM6IHN0cmluZztcbiAgcHJvdGVjdGVkIF9vcHRpb25zOiBUO1xuXG4gIGNvbnN0cnVjdG9yKHM6IHN0cmluZywgbzogVCk7XG4gIGNvbnN0cnVjdG9yKGM6IHN0cmluZywgczogc3RyaW5nLCBvOiBUKTtcblxuICBjb25zdHJ1Y3RvcihjOiBzdHJpbmcgfCBudWxsLCBzOiBzdHJpbmcgfCBULCBvPzogVCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDIgfHwgdHlwZW9mIHMgIT09ICdzdHJpbmcnKSB7XG4gICAgICBvID0gcyBhcyBUO1xuICAgICAgcyA9IGMgYXMgc3RyaW5nO1xuICAgICAgYyA9IG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5fY29sbGVjdGlvbiA9IGM7XG4gICAgdGhpcy5fc2NoZW1hdGljID0gcztcbiAgICB0aGlzLl9vcHRpb25zID0gbyBhcyBUO1xuICB9XG5cbiAgdG9Db25maWd1cmF0aW9uKCk6IFRhc2tDb25maWd1cmF0aW9uPFJ1blNjaGVtYXRpY1Rhc2tPcHRpb25zPFQ+PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IFJ1blNjaGVtYXRpY05hbWUsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIGNvbGxlY3Rpb246IHRoaXMuX2NvbGxlY3Rpb24sXG4gICAgICAgIG5hbWU6IHRoaXMuX3NjaGVtYXRpYyxcbiAgICAgICAgb3B0aW9uczogdGhpcy5fb3B0aW9ucyxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxufVxuIl19