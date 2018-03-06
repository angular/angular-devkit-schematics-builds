"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("./options");
class RunSchematicTask {
    constructor(_collection, _schematic, _options) {
        this._collection = _collection;
        this._schematic = _schematic;
        this._options = _options;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC10YXNrLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL3J1bi1zY2hlbWF0aWMvaW5pdC10YXNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBUUEsdUNBQXNFO0FBR3RFO0lBQ0UsWUFDWSxXQUFtQixFQUNuQixVQUFrQixFQUNsQixRQUFnQjtRQUZoQixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtRQUNuQixlQUFVLEdBQVYsVUFBVSxDQUFRO1FBQ2xCLGFBQVEsR0FBUixRQUFRLENBQVE7SUFDekIsQ0FBQztJQUVKLGVBQWU7UUFDYixNQUFNLENBQUM7WUFDTCxJQUFJLEVBQUUsMEJBQWdCO1lBQ3RCLE9BQU8sRUFBRTtnQkFDUCxVQUFVLEVBQUUsSUFBSSxDQUFDLFdBQVc7Z0JBQzVCLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVTtnQkFDckIsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRO2FBQ3ZCO1NBQ0YsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQWpCRCw0Q0FpQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBUYXNrQ29uZmlndXJhdGlvbiwgVGFza0NvbmZpZ3VyYXRpb25HZW5lcmF0b3IgfSBmcm9tICcuLi8uLi9zcmMnO1xuaW1wb3J0IHsgUnVuU2NoZW1hdGljTmFtZSwgUnVuU2NoZW1hdGljVGFza09wdGlvbnMgfSBmcm9tICcuL29wdGlvbnMnO1xuXG5cbmV4cG9ydCBjbGFzcyBSdW5TY2hlbWF0aWNUYXNrIGltcGxlbWVudHMgVGFza0NvbmZpZ3VyYXRpb25HZW5lcmF0b3I8UnVuU2NoZW1hdGljVGFza09wdGlvbnM+IHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJvdGVjdGVkIF9jb2xsZWN0aW9uOiBzdHJpbmcsXG4gICAgcHJvdGVjdGVkIF9zY2hlbWF0aWM6IHN0cmluZyxcbiAgICBwcm90ZWN0ZWQgX29wdGlvbnM6IG9iamVjdCxcbiAgKSB7fVxuXG4gIHRvQ29uZmlndXJhdGlvbigpOiBUYXNrQ29uZmlndXJhdGlvbjxSdW5TY2hlbWF0aWNUYXNrT3B0aW9ucz4ge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBSdW5TY2hlbWF0aWNOYW1lLFxuICAgICAgb3B0aW9uczoge1xuICAgICAgICBjb2xsZWN0aW9uOiB0aGlzLl9jb2xsZWN0aW9uLFxuICAgICAgICBuYW1lOiB0aGlzLl9zY2hlbWF0aWMsXG4gICAgICAgIG9wdGlvbnM6IHRoaXMuX29wdGlvbnMsXG4gICAgICB9LFxuICAgIH07XG4gIH1cbn1cbiJdfQ==