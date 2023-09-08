"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportStringRef = void 0;
const path_1 = require("path");
class ExportStringRef {
    _ref;
    _module;
    _path;
    constructor(ref, parentPath = process.cwd(), inner = true) {
        const [path, name] = ref.split('#', 2);
        this._module = path[0] == '.' ? (0, path_1.resolve)(parentPath, path) : path;
        this._module = require.resolve(this._module);
        this._path = (0, path_1.dirname)(this._module);
        if (inner) {
            this._ref = require(this._module)[name || 'default'];
        }
        else {
            this._ref = require(this._module);
        }
    }
    get ref() {
        return this._ref;
    }
    get module() {
        return this._module;
    }
    get path() {
        return this._path;
    }
}
exports.ExportStringRef = ExportStringRef;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvZXhwb3J0LXJlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQkFBd0M7QUFFeEMsTUFBYSxlQUFlO0lBQ2xCLElBQUksQ0FBSztJQUNULE9BQU8sQ0FBUztJQUNoQixLQUFLLENBQVM7SUFFdEIsWUFBWSxHQUFXLEVBQUUsYUFBcUIsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssR0FBRyxJQUFJO1FBQ3ZFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQU8sRUFBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNqRSxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBQSxjQUFPLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRW5DLElBQUksS0FBSyxFQUFFO1lBQ1QsSUFBSSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsQ0FBQztTQUN0RDthQUFNO1lBQ0wsSUFBSSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ25DO0lBQ0gsQ0FBQztJQUVELElBQUksR0FBRztRQUNMLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztJQUNuQixDQUFDO0lBQ0QsSUFBSSxNQUFNO1FBQ1IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7SUFDRCxJQUFJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztDQUNGO0FBM0JELDBDQTJCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBkaXJuYW1lLCByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBjbGFzcyBFeHBvcnRTdHJpbmdSZWY8VD4ge1xuICBwcml2YXRlIF9yZWY/OiBUO1xuICBwcml2YXRlIF9tb2R1bGU6IHN0cmluZztcbiAgcHJpdmF0ZSBfcGF0aDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHJlZjogc3RyaW5nLCBwYXJlbnRQYXRoOiBzdHJpbmcgPSBwcm9jZXNzLmN3ZCgpLCBpbm5lciA9IHRydWUpIHtcbiAgICBjb25zdCBbcGF0aCwgbmFtZV0gPSByZWYuc3BsaXQoJyMnLCAyKTtcbiAgICB0aGlzLl9tb2R1bGUgPSBwYXRoWzBdID09ICcuJyA/IHJlc29sdmUocGFyZW50UGF0aCwgcGF0aCkgOiBwYXRoO1xuICAgIHRoaXMuX21vZHVsZSA9IHJlcXVpcmUucmVzb2x2ZSh0aGlzLl9tb2R1bGUpO1xuICAgIHRoaXMuX3BhdGggPSBkaXJuYW1lKHRoaXMuX21vZHVsZSk7XG5cbiAgICBpZiAoaW5uZXIpIHtcbiAgICAgIHRoaXMuX3JlZiA9IHJlcXVpcmUodGhpcy5fbW9kdWxlKVtuYW1lIHx8ICdkZWZhdWx0J107XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3JlZiA9IHJlcXVpcmUodGhpcy5fbW9kdWxlKTtcbiAgICB9XG4gIH1cblxuICBnZXQgcmVmKCkge1xuICAgIHJldHVybiB0aGlzLl9yZWY7XG4gIH1cbiAgZ2V0IG1vZHVsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fbW9kdWxlO1xuICB9XG4gIGdldCBwYXRoKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXRoO1xuICB9XG59XG4iXX0=