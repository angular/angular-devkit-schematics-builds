"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const exception_1 = require("../exception/exception");
const update_buffer_1 = require("../utility/update-buffer");
class UpdateRecorderBase {
    constructor(entry) {
        this._original = Buffer.from(entry.content);
        this._content = new update_buffer_1.UpdateBuffer(entry.content);
        this._path = entry.path;
    }
    static createFromFileEntry(entry) {
        const c0 = entry.content.byteLength > 0 && entry.content.readUInt8(0);
        const c1 = entry.content.byteLength > 1 && entry.content.readUInt8(1);
        const c2 = entry.content.byteLength > 2 && entry.content.readUInt8(2);
        // Check if we're BOM.
        if (c0 == 0xEF && c1 == 0xBB && c2 == 0xBF) {
            return new UpdateRecorderBom(entry);
        }
        else if (c0 === 0xFF && c1 == 0xFE) {
            return new UpdateRecorderBom(entry, 2);
        }
        else if (c0 === 0xFE && c1 == 0xFF) {
            return new UpdateRecorderBom(entry, 2);
        }
        return new UpdateRecorderBase(entry);
    }
    get path() { return this._path; }
    // These just record changes.
    insertLeft(index, content) {
        this._content.insertLeft(index, typeof content == 'string' ? Buffer.from(content) : content);
        return this;
    }
    insertRight(index, content) {
        this._content.insertRight(index, typeof content == 'string' ? Buffer.from(content) : content);
        return this;
    }
    remove(index, length) {
        this._content.remove(index, length);
        return this;
    }
    apply(content) {
        if (!content.equals(this._content.original)) {
            throw new exception_1.ContentHasMutatedException(this.path);
        }
        return this._content.generate();
    }
}
exports.UpdateRecorderBase = UpdateRecorderBase;
class UpdateRecorderBom extends UpdateRecorderBase {
    constructor(entry, _delta = 3) {
        super(entry);
        this._delta = _delta;
    }
    insertLeft(index, content) {
        return super.insertLeft(index + this._delta, content);
    }
    insertRight(index, content) {
        return super.insertRight(index + this._delta, content);
    }
    remove(index, length) {
        return super.remove(index + this._delta, length);
    }
}
exports.UpdateRecorderBom = UpdateRecorderBom;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3JkZXIuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3RyZWUvcmVjb3JkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCxzREFBb0U7QUFDcEUsNERBQXdEO0FBSXhELE1BQWEsa0JBQWtCO0lBSzdCLFlBQVksS0FBZ0I7UUFDMUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksNEJBQVksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0lBQzFCLENBQUM7SUFFRCxNQUFNLENBQUMsbUJBQW1CLENBQUMsS0FBZ0I7UUFDekMsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFdEUsc0JBQXNCO1FBQ3RCLElBQUksRUFBRSxJQUFJLElBQUksSUFBSSxFQUFFLElBQUksSUFBSSxJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUU7WUFDMUMsT0FBTyxJQUFJLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3JDO2FBQU0sSUFBSSxFQUFFLEtBQUssSUFBSSxJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUU7WUFDcEMsT0FBTyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztTQUN4QzthQUFNLElBQUksRUFBRSxLQUFLLElBQUksSUFBSSxFQUFFLElBQUksSUFBSSxFQUFFO1lBQ3BDLE9BQU8sSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDeEM7UUFFRCxPQUFPLElBQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELElBQUksSUFBSSxLQUFLLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFFakMsNkJBQTZCO0lBQzdCLFVBQVUsQ0FBQyxLQUFhLEVBQUUsT0FBd0I7UUFDaEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE9BQU8sT0FBTyxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFN0YsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsV0FBVyxDQUFDLEtBQWEsRUFBRSxPQUF3QjtRQUNqRCxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxPQUFPLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUU5RixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxNQUFNLENBQUMsS0FBYSxFQUFFLE1BQWM7UUFDbEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRXBDLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFlO1FBQ25CLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDM0MsTUFBTSxJQUFJLHNDQUEwQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNqRDtRQUVELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNsQyxDQUFDO0NBQ0Y7QUF4REQsZ0RBd0RDO0FBR0QsTUFBYSxpQkFBa0IsU0FBUSxrQkFBa0I7SUFDdkQsWUFBWSxLQUFnQixFQUFVLFNBQVMsQ0FBQztRQUM5QyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFEdUIsV0FBTSxHQUFOLE1BQU0sQ0FBSTtJQUVoRCxDQUFDO0lBRUQsVUFBVSxDQUFDLEtBQWEsRUFBRSxPQUF3QjtRQUNoRCxPQUFPLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVELFdBQVcsQ0FBQyxLQUFhLEVBQUUsT0FBd0I7UUFDakQsT0FBTyxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxNQUFNLENBQUMsS0FBYSxFQUFFLE1BQWM7UUFDbEMsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ25ELENBQUM7Q0FDRjtBQWhCRCw4Q0FnQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBDb250ZW50SGFzTXV0YXRlZEV4Y2VwdGlvbiB9IGZyb20gJy4uL2V4Y2VwdGlvbi9leGNlcHRpb24nO1xuaW1wb3J0IHsgVXBkYXRlQnVmZmVyIH0gZnJvbSAnLi4vdXRpbGl0eS91cGRhdGUtYnVmZmVyJztcbmltcG9ydCB7IEZpbGVFbnRyeSwgVXBkYXRlUmVjb3JkZXIgfSBmcm9tICcuL2ludGVyZmFjZSc7XG5cblxuZXhwb3J0IGNsYXNzIFVwZGF0ZVJlY29yZGVyQmFzZSBpbXBsZW1lbnRzIFVwZGF0ZVJlY29yZGVyIHtcbiAgcHJvdGVjdGVkIF9wYXRoOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBfb3JpZ2luYWw6IEJ1ZmZlcjtcbiAgcHJvdGVjdGVkIF9jb250ZW50OiBVcGRhdGVCdWZmZXI7XG5cbiAgY29uc3RydWN0b3IoZW50cnk6IEZpbGVFbnRyeSkge1xuICAgIHRoaXMuX29yaWdpbmFsID0gQnVmZmVyLmZyb20oZW50cnkuY29udGVudCk7XG4gICAgdGhpcy5fY29udGVudCA9IG5ldyBVcGRhdGVCdWZmZXIoZW50cnkuY29udGVudCk7XG4gICAgdGhpcy5fcGF0aCA9IGVudHJ5LnBhdGg7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlRnJvbUZpbGVFbnRyeShlbnRyeTogRmlsZUVudHJ5KTogVXBkYXRlUmVjb3JkZXJCYXNlIHtcbiAgICBjb25zdCBjMCA9IGVudHJ5LmNvbnRlbnQuYnl0ZUxlbmd0aCA+IDAgJiYgZW50cnkuY29udGVudC5yZWFkVUludDgoMCk7XG4gICAgY29uc3QgYzEgPSBlbnRyeS5jb250ZW50LmJ5dGVMZW5ndGggPiAxICYmIGVudHJ5LmNvbnRlbnQucmVhZFVJbnQ4KDEpO1xuICAgIGNvbnN0IGMyID0gZW50cnkuY29udGVudC5ieXRlTGVuZ3RoID4gMiAmJiBlbnRyeS5jb250ZW50LnJlYWRVSW50OCgyKTtcblxuICAgIC8vIENoZWNrIGlmIHdlJ3JlIEJPTS5cbiAgICBpZiAoYzAgPT0gMHhFRiAmJiBjMSA9PSAweEJCICYmIGMyID09IDB4QkYpIHtcbiAgICAgIHJldHVybiBuZXcgVXBkYXRlUmVjb3JkZXJCb20oZW50cnkpO1xuICAgIH0gZWxzZSBpZiAoYzAgPT09IDB4RkYgJiYgYzEgPT0gMHhGRSkge1xuICAgICAgcmV0dXJuIG5ldyBVcGRhdGVSZWNvcmRlckJvbShlbnRyeSwgMik7XG4gICAgfSBlbHNlIGlmIChjMCA9PT0gMHhGRSAmJiBjMSA9PSAweEZGKSB7XG4gICAgICByZXR1cm4gbmV3IFVwZGF0ZVJlY29yZGVyQm9tKGVudHJ5LCAyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFVwZGF0ZVJlY29yZGVyQmFzZShlbnRyeSk7XG4gIH1cblxuICBnZXQgcGF0aCgpIHsgcmV0dXJuIHRoaXMuX3BhdGg7IH1cblxuICAvLyBUaGVzZSBqdXN0IHJlY29yZCBjaGFuZ2VzLlxuICBpbnNlcnRMZWZ0KGluZGV4OiBudW1iZXIsIGNvbnRlbnQ6IEJ1ZmZlciB8IHN0cmluZyk6IFVwZGF0ZVJlY29yZGVyIHtcbiAgICB0aGlzLl9jb250ZW50Lmluc2VydExlZnQoaW5kZXgsIHR5cGVvZiBjb250ZW50ID09ICdzdHJpbmcnID8gQnVmZmVyLmZyb20oY29udGVudCkgOiBjb250ZW50KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgaW5zZXJ0UmlnaHQoaW5kZXg6IG51bWJlciwgY29udGVudDogQnVmZmVyIHwgc3RyaW5nKTogVXBkYXRlUmVjb3JkZXIge1xuICAgIHRoaXMuX2NvbnRlbnQuaW5zZXJ0UmlnaHQoaW5kZXgsIHR5cGVvZiBjb250ZW50ID09ICdzdHJpbmcnID8gQnVmZmVyLmZyb20oY29udGVudCkgOiBjb250ZW50KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVtb3ZlKGluZGV4OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKTogVXBkYXRlUmVjb3JkZXIge1xuICAgIHRoaXMuX2NvbnRlbnQucmVtb3ZlKGluZGV4LCBsZW5ndGgpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBhcHBseShjb250ZW50OiBCdWZmZXIpOiBCdWZmZXIge1xuICAgIGlmICghY29udGVudC5lcXVhbHModGhpcy5fY29udGVudC5vcmlnaW5hbCkpIHtcbiAgICAgIHRocm93IG5ldyBDb250ZW50SGFzTXV0YXRlZEV4Y2VwdGlvbih0aGlzLnBhdGgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9jb250ZW50LmdlbmVyYXRlKCk7XG4gIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgVXBkYXRlUmVjb3JkZXJCb20gZXh0ZW5kcyBVcGRhdGVSZWNvcmRlckJhc2Uge1xuICBjb25zdHJ1Y3RvcihlbnRyeTogRmlsZUVudHJ5LCBwcml2YXRlIF9kZWx0YSA9IDMpIHtcbiAgICBzdXBlcihlbnRyeSk7XG4gIH1cblxuICBpbnNlcnRMZWZ0KGluZGV4OiBudW1iZXIsIGNvbnRlbnQ6IEJ1ZmZlciB8IHN0cmluZykge1xuICAgIHJldHVybiBzdXBlci5pbnNlcnRMZWZ0KGluZGV4ICsgdGhpcy5fZGVsdGEsIGNvbnRlbnQpO1xuICB9XG5cbiAgaW5zZXJ0UmlnaHQoaW5kZXg6IG51bWJlciwgY29udGVudDogQnVmZmVyIHwgc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN1cGVyLmluc2VydFJpZ2h0KGluZGV4ICsgdGhpcy5fZGVsdGEsIGNvbnRlbnQpO1xuICB9XG5cbiAgcmVtb3ZlKGluZGV4OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHN1cGVyLnJlbW92ZShpbmRleCArIHRoaXMuX2RlbHRhLCBsZW5ndGgpO1xuICB9XG59XG4iXX0=