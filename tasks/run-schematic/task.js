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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFzay5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90YXNrcy9ydW4tc2NoZW1hdGljL3Rhc2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSx1Q0FBc0U7QUFHdEU7SUFDRSxZQUNZLFdBQW1CLEVBQ25CLFVBQWtCLEVBQ2xCLFFBQWdCO1FBRmhCLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1FBQ25CLGVBQVUsR0FBVixVQUFVLENBQVE7UUFDbEIsYUFBUSxHQUFSLFFBQVEsQ0FBUTtJQUN6QixDQUFDO0lBRUosZUFBZTtRQUNiLE1BQU0sQ0FBQztZQUNMLElBQUksRUFBRSwwQkFBZ0I7WUFDdEIsT0FBTyxFQUFFO2dCQUNQLFVBQVUsRUFBRSxJQUFJLENBQUMsV0FBVztnQkFDNUIsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVO2dCQUNyQixPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVE7YUFDdkI7U0FDRixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBakJELDRDQWlCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IFRhc2tDb25maWd1cmF0aW9uLCBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvciB9IGZyb20gJy4uLy4uL3NyYyc7XG5pbXBvcnQgeyBSdW5TY2hlbWF0aWNOYW1lLCBSdW5TY2hlbWF0aWNUYXNrT3B0aW9ucyB9IGZyb20gJy4vb3B0aW9ucyc7XG5cblxuZXhwb3J0IGNsYXNzIFJ1blNjaGVtYXRpY1Rhc2sgaW1wbGVtZW50cyBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvcjxSdW5TY2hlbWF0aWNUYXNrT3B0aW9ucz4ge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcm90ZWN0ZWQgX2NvbGxlY3Rpb246IHN0cmluZyxcbiAgICBwcm90ZWN0ZWQgX3NjaGVtYXRpYzogc3RyaW5nLFxuICAgIHByb3RlY3RlZCBfb3B0aW9uczogb2JqZWN0LFxuICApIHt9XG5cbiAgdG9Db25maWd1cmF0aW9uKCk6IFRhc2tDb25maWd1cmF0aW9uPFJ1blNjaGVtYXRpY1Rhc2tPcHRpb25zPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IFJ1blNjaGVtYXRpY05hbWUsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIGNvbGxlY3Rpb246IHRoaXMuX2NvbGxlY3Rpb24sXG4gICAgICAgIG5hbWU6IHRoaXMuX3NjaGVtYXRpYyxcbiAgICAgICAgb3B0aW9uczogdGhpcy5fb3B0aW9ucyxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxufVxuIl19