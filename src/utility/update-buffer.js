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
const node_util_1 = require("node:util");
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
    _originalContent;
    constructor(_originalContent) {
        this._originalContent = _originalContent;
    }
    /**
     * Creates an UpdateBufferBase instance.
     *
     * @param contentPath The path of the update buffer instance.
     * @param originalContent The original content of the update buffer instance.
     * @returns An UpdateBufferBase instance.
     */
    static create(contentPath, originalContent) {
        try {
            // We only support utf8 encoding.
            new node_util_1.TextDecoder('utf8', { fatal: true }).decode(originalContent);
            return new UpdateBuffer(originalContent);
        }
        catch (e) {
            if (e instanceof TypeError) {
                throw new Error(`Failed to decode "${contentPath}" as UTF-8 text.`);
            }
            throw e;
        }
    }
}
exports.UpdateBufferBase = UpdateBufferBase;
/**
 * An utility class that allows buffers to be inserted to the _right or _left, or deleted, while
 * keeping indices to the original buffer.
 */
class UpdateBuffer extends UpdateBufferBase {
    _mutatableContent = new magic_string_1.default(this._originalContent.toString());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLWJ1ZmZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3V0aWxpdHkvdXBkYXRlLWJ1ZmZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFFSCwrQ0FBcUQ7QUFDckQsZ0VBQXVDO0FBQ3ZDLHlDQUF3QztBQUV4QyxNQUFhLHdCQUF5QixTQUFRLG9CQUFhO0lBQ3pELFlBQVksS0FBYSxFQUFFLEdBQVcsRUFBRSxHQUFHLEdBQUcsUUFBUTtRQUNwRCxLQUFLLENBQUMsU0FBUyxLQUFLLHNCQUFzQixHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM3RCxDQUFDO0NBQ0Y7QUFKRCw0REFJQztBQUVEOzs7R0FHRztBQUNILE1BQXNCLGdCQUFnQjtJQUNkO0lBQXRCLFlBQXNCLGdCQUF3QjtRQUF4QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVE7SUFBRyxDQUFDO0lBU2xEOzs7Ozs7T0FNRztJQUNILE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBbUIsRUFBRSxlQUF1QjtRQUN4RCxJQUFJO1lBQ0YsaUNBQWlDO1lBQ2pDLElBQUksdUJBQVcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7WUFFakUsT0FBTyxJQUFJLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQztTQUMxQztRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsSUFBSSxDQUFDLFlBQVksU0FBUyxFQUFFO2dCQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixXQUFXLGtCQUFrQixDQUFDLENBQUM7YUFDckU7WUFFRCxNQUFNLENBQUMsQ0FBQztTQUNUO0lBQ0gsQ0FBQztDQUNGO0FBL0JELDRDQStCQztBQUVEOzs7R0FHRztBQUNILE1BQWEsWUFBYSxTQUFRLGdCQUFnQjtJQUN0QyxpQkFBaUIsR0FBZ0IsSUFBSSxzQkFBVyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBRW5GLFlBQVksQ0FBQyxLQUFhO1FBQ2xDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRTtZQUNyRCxNQUFNLElBQUksd0JBQXdCLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDNUU7SUFDSCxDQUFDO0lBRUQsSUFBSSxNQUFNO1FBQ1IsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDekMsQ0FBQztJQUNELElBQUksUUFBUTtRQUNWLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDO0lBQy9CLENBQUM7SUFFRCxRQUFRO1FBQ04sT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDM0MsQ0FBQztJQUVELFFBQVE7UUFDTixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVELFVBQVUsQ0FBQyxLQUFhLEVBQUUsT0FBZTtRQUN2QyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRCxXQUFXLENBQUMsS0FBYSxFQUFFLE9BQWU7UUFDeEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUNoRSxDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQWEsRUFBRSxNQUFjO1FBQ2xDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZELENBQUM7Q0FDRjtBQXRDRCxvQ0FzQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCBNYWdpY1N0cmluZyBmcm9tICdtYWdpYy1zdHJpbmcnO1xuaW1wb3J0IHsgVGV4dERlY29kZXIgfSBmcm9tICdub2RlOnV0aWwnO1xuXG5leHBvcnQgY2xhc3MgSW5kZXhPdXRPZkJvdW5kRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKGluZGV4OiBudW1iZXIsIG1pbjogbnVtYmVyLCBtYXggPSBJbmZpbml0eSkge1xuICAgIHN1cGVyKGBJbmRleCAke2luZGV4fSBvdXRzaWRlIG9mIHJhbmdlIFske21pbn0sICR7bWF4fV0uYCk7XG4gIH1cbn1cblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBhbiB1cGRhdGUgYnVmZmVyIGltcGxlbWVudGF0aW9uIHRoYXQgYWxsb3dzIGJ1ZmZlcnMgdG8gYmUgaW5zZXJ0ZWQgdG8gdGhlIF9yaWdodFxuICogb3IgX2xlZnQsIG9yIGRlbGV0ZWQsIHdoaWxlIGtlZXBpbmcgaW5kaWNlcyB0byB0aGUgb3JpZ2luYWwgYnVmZmVyLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVXBkYXRlQnVmZmVyQmFzZSB7XG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBfb3JpZ2luYWxDb250ZW50OiBCdWZmZXIpIHt9XG4gIGFic3RyYWN0IGdldCBsZW5ndGgoKTogbnVtYmVyO1xuICBhYnN0cmFjdCBnZXQgb3JpZ2luYWwoKTogQnVmZmVyO1xuICBhYnN0cmFjdCB0b1N0cmluZyhlbmNvZGluZz86IHN0cmluZyk6IHN0cmluZztcbiAgYWJzdHJhY3QgZ2VuZXJhdGUoKTogQnVmZmVyO1xuICBhYnN0cmFjdCBpbnNlcnRMZWZ0KGluZGV4OiBudW1iZXIsIGNvbnRlbnQ6IEJ1ZmZlciwgYXNzZXJ0PzogYm9vbGVhbik6IHZvaWQ7XG4gIGFic3RyYWN0IGluc2VydFJpZ2h0KGluZGV4OiBudW1iZXIsIGNvbnRlbnQ6IEJ1ZmZlciwgYXNzZXJ0PzogYm9vbGVhbik6IHZvaWQ7XG4gIGFic3RyYWN0IHJlbW92ZShpbmRleDogbnVtYmVyLCBsZW5ndGg6IG51bWJlcik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gVXBkYXRlQnVmZmVyQmFzZSBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIGNvbnRlbnRQYXRoIFRoZSBwYXRoIG9mIHRoZSB1cGRhdGUgYnVmZmVyIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gb3JpZ2luYWxDb250ZW50IFRoZSBvcmlnaW5hbCBjb250ZW50IG9mIHRoZSB1cGRhdGUgYnVmZmVyIGluc3RhbmNlLlxuICAgKiBAcmV0dXJucyBBbiBVcGRhdGVCdWZmZXJCYXNlIGluc3RhbmNlLlxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZShjb250ZW50UGF0aDogc3RyaW5nLCBvcmlnaW5hbENvbnRlbnQ6IEJ1ZmZlcik6IFVwZGF0ZUJ1ZmZlckJhc2Uge1xuICAgIHRyeSB7XG4gICAgICAvLyBXZSBvbmx5IHN1cHBvcnQgdXRmOCBlbmNvZGluZy5cbiAgICAgIG5ldyBUZXh0RGVjb2RlcigndXRmOCcsIHsgZmF0YWw6IHRydWUgfSkuZGVjb2RlKG9yaWdpbmFsQ29udGVudCk7XG5cbiAgICAgIHJldHVybiBuZXcgVXBkYXRlQnVmZmVyKG9yaWdpbmFsQ29udGVudCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBUeXBlRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZGVjb2RlIFwiJHtjb250ZW50UGF0aH1cIiBhcyBVVEYtOCB0ZXh0LmApO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFuIHV0aWxpdHkgY2xhc3MgdGhhdCBhbGxvd3MgYnVmZmVycyB0byBiZSBpbnNlcnRlZCB0byB0aGUgX3JpZ2h0IG9yIF9sZWZ0LCBvciBkZWxldGVkLCB3aGlsZVxuICoga2VlcGluZyBpbmRpY2VzIHRvIHRoZSBvcmlnaW5hbCBidWZmZXIuXG4gKi9cbmV4cG9ydCBjbGFzcyBVcGRhdGVCdWZmZXIgZXh0ZW5kcyBVcGRhdGVCdWZmZXJCYXNlIHtcbiAgcHJvdGVjdGVkIF9tdXRhdGFibGVDb250ZW50OiBNYWdpY1N0cmluZyA9IG5ldyBNYWdpY1N0cmluZyh0aGlzLl9vcmlnaW5hbENvbnRlbnQudG9TdHJpbmcoKSk7XG5cbiAgcHJvdGVjdGVkIF9hc3NlcnRJbmRleChpbmRleDogbnVtYmVyKSB7XG4gICAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+IHRoaXMuX29yaWdpbmFsQ29udGVudC5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBJbmRleE91dE9mQm91bmRFeGNlcHRpb24oaW5kZXgsIDAsIHRoaXMuX29yaWdpbmFsQ29udGVudC5sZW5ndGgpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fbXV0YXRhYmxlQ29udGVudC5sZW5ndGgoKTtcbiAgfVxuICBnZXQgb3JpZ2luYWwoKTogQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy5fb3JpZ2luYWxDb250ZW50O1xuICB9XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fbXV0YXRhYmxlQ29udGVudC50b1N0cmluZygpO1xuICB9XG5cbiAgZ2VuZXJhdGUoKTogQnVmZmVyIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20odGhpcy50b1N0cmluZygpKTtcbiAgfVxuXG4gIGluc2VydExlZnQoaW5kZXg6IG51bWJlciwgY29udGVudDogQnVmZmVyKTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0SW5kZXgoaW5kZXgpO1xuICAgIHRoaXMuX211dGF0YWJsZUNvbnRlbnQuYXBwZW5kTGVmdChpbmRleCwgY29udGVudC50b1N0cmluZygpKTtcbiAgfVxuXG4gIGluc2VydFJpZ2h0KGluZGV4OiBudW1iZXIsIGNvbnRlbnQ6IEJ1ZmZlcik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydEluZGV4KGluZGV4KTtcbiAgICB0aGlzLl9tdXRhdGFibGVDb250ZW50LmFwcGVuZFJpZ2h0KGluZGV4LCBjb250ZW50LnRvU3RyaW5nKCkpO1xuICB9XG5cbiAgcmVtb3ZlKGluZGV4OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKSB7XG4gICAgdGhpcy5fYXNzZXJ0SW5kZXgoaW5kZXgpO1xuICAgIHRoaXMuX211dGF0YWJsZUNvbnRlbnQucmVtb3ZlKGluZGV4LCBpbmRleCArIGxlbmd0aCk7XG4gIH1cbn1cbiJdfQ==