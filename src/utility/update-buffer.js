"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBuffer = exports.UpdateBufferBase = exports.IndexOutOfBoundException = void 0;
const core_1 = require("@angular-devkit/core");
const magic_string_1 = __importDefault(require("magic-string"));
class IndexOutOfBoundException extends core_1.BaseException {
    constructor(index, min, max = Infinity) {
        super(`Index ${index} outside of range [${min}, ${max}].`);
    }
}
exports.IndexOutOfBoundException = IndexOutOfBoundException;
/**
 * Base class for an update buffer implementation that allows buffers to be inserted to the _right
 * or _left, or deleted, while keeping indices to the original buffer.
 */
class UpdateBufferBase {
    constructor(_originalContent) {
        this._originalContent = _originalContent;
    }
    /**
     * Creates an UpdateBufferBase instance.
     *
     * @param originalContent The original content of the update buffer instance.
     * @returns An UpdateBufferBase instance.
     */
    static create(originalContent) {
        return new UpdateBuffer(originalContent);
    }
}
exports.UpdateBufferBase = UpdateBufferBase;
/**
 * An utility class that allows buffers to be inserted to the _right or _left, or deleted, while
 * keeping indices to the original buffer.
 */
class UpdateBuffer extends UpdateBufferBase {
    constructor() {
        super(...arguments);
        this._mutatableContent = new magic_string_1.default(this._originalContent.toString());
    }
    _assertIndex(index) {
        if (index < 0 || index > this._originalContent.length) {
            throw new IndexOutOfBoundException(index, 0, this._originalContent.length);
        }
    }
    get length() {
        return this._mutatableContent.length();
    }
    get original() {
        return this._originalContent;
    }
    toString() {
        return this._mutatableContent.toString();
    }
    generate() {
        return Buffer.from(this.toString());
    }
    insertLeft(index, content) {
        this._assertIndex(index);
        this._mutatableContent.appendLeft(index, content.toString());
    }
    insertRight(index, content) {
        this._assertIndex(index);
        this._mutatableContent.appendRight(index, content.toString());
    }
    remove(index, length) {
        this._assertIndex(index);
        this._mutatableContent.remove(index, index + length);
    }
}
exports.UpdateBuffer = UpdateBuffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLWJ1ZmZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3V0aWxpdHkvdXBkYXRlLWJ1ZmZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFFSCwrQ0FBcUQ7QUFDckQsZ0VBQXVDO0FBRXZDLE1BQWEsd0JBQXlCLFNBQVEsb0JBQWE7SUFDekQsWUFBWSxLQUFhLEVBQUUsR0FBVyxFQUFFLEdBQUcsR0FBRyxRQUFRO1FBQ3BELEtBQUssQ0FBQyxTQUFTLEtBQUssc0JBQXNCLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQzdELENBQUM7Q0FDRjtBQUpELDREQUlDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBc0IsZ0JBQWdCO0lBQ3BDLFlBQXNCLGdCQUF3QjtRQUF4QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVE7SUFBRyxDQUFDO0lBU2xEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQyxlQUF1QjtRQUNuQyxPQUFPLElBQUksWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQzNDLENBQUM7Q0FDRjtBQW5CRCw0Q0FtQkM7QUFFRDs7O0dBR0c7QUFDSCxNQUFhLFlBQWEsU0FBUSxnQkFBZ0I7SUFBbEQ7O1FBQ1ksc0JBQWlCLEdBQWdCLElBQUksc0JBQVcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQXFDL0YsQ0FBQztJQW5DVyxZQUFZLENBQUMsS0FBYTtRQUNsQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUU7WUFDckQsTUFBTSxJQUFJLHdCQUF3QixDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzVFO0lBQ0gsQ0FBQztJQUVELElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3pDLENBQUM7SUFDRCxJQUFJLFFBQVE7UUFDVixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztJQUMvQixDQUFDO0lBRUQsUUFBUTtRQUNOLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzNDLENBQUM7SUFFRCxRQUFRO1FBQ04sT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRCxVQUFVLENBQUMsS0FBYSxFQUFFLE9BQWU7UUFDdkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRUQsV0FBVyxDQUFDLEtBQWEsRUFBRSxPQUFlO1FBQ3hDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVELE1BQU0sQ0FBQyxLQUFhLEVBQUUsTUFBYztRQUNsQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQztJQUN2RCxDQUFDO0NBQ0Y7QUF0Q0Qsb0NBc0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24gfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgTWFnaWNTdHJpbmcgZnJvbSAnbWFnaWMtc3RyaW5nJztcblxuZXhwb3J0IGNsYXNzIEluZGV4T3V0T2ZCb3VuZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihpbmRleDogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4ID0gSW5maW5pdHkpIHtcbiAgICBzdXBlcihgSW5kZXggJHtpbmRleH0gb3V0c2lkZSBvZiByYW5nZSBbJHttaW59LCAke21heH1dLmApO1xuICB9XG59XG5cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgYW4gdXBkYXRlIGJ1ZmZlciBpbXBsZW1lbnRhdGlvbiB0aGF0IGFsbG93cyBidWZmZXJzIHRvIGJlIGluc2VydGVkIHRvIHRoZSBfcmlnaHRcbiAqIG9yIF9sZWZ0LCBvciBkZWxldGVkLCB3aGlsZSBrZWVwaW5nIGluZGljZXMgdG8gdGhlIG9yaWdpbmFsIGJ1ZmZlci5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFVwZGF0ZUJ1ZmZlckJhc2Uge1xuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgX29yaWdpbmFsQ29udGVudDogQnVmZmVyKSB7fVxuICBhYnN0cmFjdCBnZXQgbGVuZ3RoKCk6IG51bWJlcjtcbiAgYWJzdHJhY3QgZ2V0IG9yaWdpbmFsKCk6IEJ1ZmZlcjtcbiAgYWJzdHJhY3QgdG9TdHJpbmcoZW5jb2Rpbmc/OiBzdHJpbmcpOiBzdHJpbmc7XG4gIGFic3RyYWN0IGdlbmVyYXRlKCk6IEJ1ZmZlcjtcbiAgYWJzdHJhY3QgaW5zZXJ0TGVmdChpbmRleDogbnVtYmVyLCBjb250ZW50OiBCdWZmZXIsIGFzc2VydD86IGJvb2xlYW4pOiB2b2lkO1xuICBhYnN0cmFjdCBpbnNlcnRSaWdodChpbmRleDogbnVtYmVyLCBjb250ZW50OiBCdWZmZXIsIGFzc2VydD86IGJvb2xlYW4pOiB2b2lkO1xuICBhYnN0cmFjdCByZW1vdmUoaW5kZXg6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIFVwZGF0ZUJ1ZmZlckJhc2UgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBvcmlnaW5hbENvbnRlbnQgVGhlIG9yaWdpbmFsIGNvbnRlbnQgb2YgdGhlIHVwZGF0ZSBidWZmZXIgaW5zdGFuY2UuXG4gICAqIEByZXR1cm5zIEFuIFVwZGF0ZUJ1ZmZlckJhc2UgaW5zdGFuY2UuXG4gICAqL1xuICBzdGF0aWMgY3JlYXRlKG9yaWdpbmFsQ29udGVudDogQnVmZmVyKTogVXBkYXRlQnVmZmVyQmFzZSB7XG4gICAgcmV0dXJuIG5ldyBVcGRhdGVCdWZmZXIob3JpZ2luYWxDb250ZW50KTtcbiAgfVxufVxuXG4vKipcbiAqIEFuIHV0aWxpdHkgY2xhc3MgdGhhdCBhbGxvd3MgYnVmZmVycyB0byBiZSBpbnNlcnRlZCB0byB0aGUgX3JpZ2h0IG9yIF9sZWZ0LCBvciBkZWxldGVkLCB3aGlsZVxuICoga2VlcGluZyBpbmRpY2VzIHRvIHRoZSBvcmlnaW5hbCBidWZmZXIuXG4gKi9cbmV4cG9ydCBjbGFzcyBVcGRhdGVCdWZmZXIgZXh0ZW5kcyBVcGRhdGVCdWZmZXJCYXNlIHtcbiAgcHJvdGVjdGVkIF9tdXRhdGFibGVDb250ZW50OiBNYWdpY1N0cmluZyA9IG5ldyBNYWdpY1N0cmluZyh0aGlzLl9vcmlnaW5hbENvbnRlbnQudG9TdHJpbmcoKSk7XG5cbiAgcHJvdGVjdGVkIF9hc3NlcnRJbmRleChpbmRleDogbnVtYmVyKSB7XG4gICAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+IHRoaXMuX29yaWdpbmFsQ29udGVudC5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBJbmRleE91dE9mQm91bmRFeGNlcHRpb24oaW5kZXgsIDAsIHRoaXMuX29yaWdpbmFsQ29udGVudC5sZW5ndGgpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fbXV0YXRhYmxlQ29udGVudC5sZW5ndGgoKTtcbiAgfVxuICBnZXQgb3JpZ2luYWwoKTogQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy5fb3JpZ2luYWxDb250ZW50O1xuICB9XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fbXV0YXRhYmxlQ29udGVudC50b1N0cmluZygpO1xuICB9XG5cbiAgZ2VuZXJhdGUoKTogQnVmZmVyIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20odGhpcy50b1N0cmluZygpKTtcbiAgfVxuXG4gIGluc2VydExlZnQoaW5kZXg6IG51bWJlciwgY29udGVudDogQnVmZmVyKTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0SW5kZXgoaW5kZXgpO1xuICAgIHRoaXMuX211dGF0YWJsZUNvbnRlbnQuYXBwZW5kTGVmdChpbmRleCwgY29udGVudC50b1N0cmluZygpKTtcbiAgfVxuXG4gIGluc2VydFJpZ2h0KGluZGV4OiBudW1iZXIsIGNvbnRlbnQ6IEJ1ZmZlcik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydEluZGV4KGluZGV4KTtcbiAgICB0aGlzLl9tdXRhdGFibGVDb250ZW50LmFwcGVuZFJpZ2h0KGluZGV4LCBjb250ZW50LnRvU3RyaW5nKCkpO1xuICB9XG5cbiAgcmVtb3ZlKGluZGV4OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKSB7XG4gICAgdGhpcy5fYXNzZXJ0SW5kZXgoaW5kZXgpO1xuICAgIHRoaXMuX211dGF0YWJsZUNvbnRlbnQucmVtb3ZlKGluZGV4LCBpbmRleCArIGxlbmd0aCk7XG4gIH1cbn1cbiJdfQ==