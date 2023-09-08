"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LazyFileEntry = exports.SimpleFileEntry = void 0;
class SimpleFileEntry {
    _path;
    _content;
    constructor(_path, _content) {
        this._path = _path;
        this._content = _content;
    }
    get path() {
        return this._path;
    }
    get content() {
        return this._content;
    }
}
exports.SimpleFileEntry = SimpleFileEntry;
class LazyFileEntry {
    _path;
    _load;
    _content = null;
    constructor(_path, _load) {
        this._path = _path;
        this._load = _load;
    }
    get path() {
        return this._path;
    }
    get content() {
        return this._content || (this._content = this._load(this._path));
    }
}
exports.LazyFileEntry = LazyFileEntry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy90cmVlL2VudHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUtILE1BQWEsZUFBZTtJQUNOO0lBQXFCO0lBQXpDLFlBQW9CLEtBQVcsRUFBVSxRQUFnQjtRQUFyQyxVQUFLLEdBQUwsS0FBSyxDQUFNO1FBQVUsYUFBUSxHQUFSLFFBQVEsQ0FBUTtJQUFHLENBQUM7SUFFN0QsSUFBSSxJQUFJO1FBQ04sT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7SUFDRCxJQUFJLE9BQU87UUFDVCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDdkIsQ0FBQztDQUNGO0FBVEQsMENBU0M7QUFFRCxNQUFhLGFBQWE7SUFHSjtJQUFxQjtJQUZqQyxRQUFRLEdBQWtCLElBQUksQ0FBQztJQUV2QyxZQUFvQixLQUFXLEVBQVUsS0FBOEI7UUFBbkQsVUFBSyxHQUFMLEtBQUssQ0FBTTtRQUFVLFVBQUssR0FBTCxLQUFLLENBQXlCO0lBQUcsQ0FBQztJQUUzRSxJQUFJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUNELElBQUksT0FBTztRQUNULE9BQU8sSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNuRSxDQUFDO0NBQ0Y7QUFYRCxzQ0FXQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBQYXRoIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgRmlsZUVudHJ5IH0gZnJvbSAnLi9pbnRlcmZhY2UnO1xuXG5leHBvcnQgY2xhc3MgU2ltcGxlRmlsZUVudHJ5IGltcGxlbWVudHMgRmlsZUVudHJ5IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfcGF0aDogUGF0aCwgcHJpdmF0ZSBfY29udGVudDogQnVmZmVyKSB7fVxuXG4gIGdldCBwYXRoKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXRoO1xuICB9XG4gIGdldCBjb250ZW50KCkge1xuICAgIHJldHVybiB0aGlzLl9jb250ZW50O1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMYXp5RmlsZUVudHJ5IGltcGxlbWVudHMgRmlsZUVudHJ5IHtcbiAgcHJpdmF0ZSBfY29udGVudDogQnVmZmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfcGF0aDogUGF0aCwgcHJpdmF0ZSBfbG9hZDogKHBhdGg/OiBQYXRoKSA9PiBCdWZmZXIpIHt9XG5cbiAgZ2V0IHBhdGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhdGg7XG4gIH1cbiAgZ2V0IGNvbnRlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRlbnQgfHwgKHRoaXMuX2NvbnRlbnQgPSB0aGlzLl9sb2FkKHRoaXMuX3BhdGgpKTtcbiAgfVxufVxuIl19