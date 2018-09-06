"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const linked_list_1 = require("./linked-list");
class IndexOutOfBoundException extends core_1.BaseException {
    constructor(index, min, max = Infinity) {
        super(`Index ${index} outside of range [${min}, ${max}].`);
    }
}
exports.IndexOutOfBoundException = IndexOutOfBoundException;
class ContentCannotBeRemovedException extends core_1.BaseException {
    constructor() {
        super(`User tried to remove content that was marked essential.`);
    }
}
exports.ContentCannotBeRemovedException = ContentCannotBeRemovedException;
/**
 * A Chunk description, including left/right content that has been inserted.
 * If _left/_right is null, this means that content was deleted. If the _content is null,
 * it means the content itself was deleted.
 *
 * @see UpdateBuffer
 */
class Chunk {
    constructor(start, end, originalContent) {
        this.start = start;
        this.end = end;
        this.originalContent = originalContent;
        this._left = Buffer.alloc(0);
        this._right = Buffer.alloc(0);
        this._assertLeft = false;
        this._assertRight = false;
        this.next = null;
        this._content = originalContent.slice(start, end);
    }
    get length() {
        return (this._left ? this._left.length : 0)
            + (this._content ? this._content.length : 0)
            + (this._right ? this._right.length : 0);
    }
    toString(encoding = 'utf-8') {
        return (this._left ? this._left.toString(encoding) : '')
            + (this._content ? this._content.toString(encoding) : '')
            + (this._right ? this._right.toString(encoding) : '');
    }
    slice(start) {
        if (start < this.start || start > this.end) {
            throw new IndexOutOfBoundException(start, this.start, this.end);
        }
        // Update _content to the new indices.
        const newChunk = new Chunk(start, this.end, this.originalContent);
        // If this chunk has _content, reslice the original _content. We move the _right so we are not
        // losing any data here. If this chunk has been deleted, the next chunk should also be deleted.
        if (this._content) {
            this._content = this.originalContent.slice(this.start, start);
        }
        else {
            newChunk._content = this._content;
            if (this._right === null) {
                newChunk._left = null;
            }
        }
        this.end = start;
        // Move _right to the new chunk.
        newChunk._right = this._right;
        this._right = this._right && Buffer.alloc(0);
        // Update essentials.
        if (this._assertRight) {
            newChunk._assertRight = true;
            this._assertRight = false;
        }
        // Update the linked list.
        newChunk.next = this.next;
        this.next = newChunk;
        return newChunk;
    }
    append(buffer, essential) {
        if (!this._right) {
            if (essential) {
                throw new ContentCannotBeRemovedException();
            }
            return;
        }
        const outro = this._right;
        this._right = Buffer.alloc(outro.length + buffer.length);
        outro.copy(this._right, 0);
        buffer.copy(this._right, outro.length);
        if (essential) {
            this._assertRight = true;
        }
    }
    prepend(buffer, essential) {
        if (!this._left) {
            if (essential) {
                throw new ContentCannotBeRemovedException();
            }
            return;
        }
        const intro = this._left;
        this._left = Buffer.alloc(intro.length + buffer.length);
        intro.copy(this._left, 0);
        buffer.copy(this._left, intro.length);
        if (essential) {
            this._assertLeft = true;
        }
    }
    assert(left, _content, right) {
        if (left) {
            if (this._assertLeft) {
                throw new ContentCannotBeRemovedException();
            }
        }
        if (right) {
            if (this._assertRight) {
                throw new ContentCannotBeRemovedException();
            }
        }
    }
    remove(left, content, right) {
        if (left) {
            if (this._assertLeft) {
                throw new ContentCannotBeRemovedException();
            }
            this._left = null;
        }
        if (content) {
            this._content = null;
        }
        if (right) {
            if (this._assertRight) {
                throw new ContentCannotBeRemovedException();
            }
            this._right = null;
        }
    }
    copy(target, start) {
        if (this._left) {
            this._left.copy(target, start);
            start += this._left.length;
        }
        if (this._content) {
            this._content.copy(target, start);
            start += this._content.length;
        }
        if (this._right) {
            this._right.copy(target, start);
            start += this._right.length;
        }
        return start;
    }
}
exports.Chunk = Chunk;
/**
 * An utility class that allows buffers to be inserted to the _right or _left, or deleted, while
 * keeping indices to the original buffer.
 *
 * The constructor takes an original buffer, and keeps it into a linked list of chunks, smaller
 * buffers that keep track of _content inserted to the _right or _left of it.
 *
 * Since the Node Buffer structure is non-destructive when slicing, we try to use slicing to create
 * new chunks, and always keep chunks pointing to the original content.
 */
class UpdateBuffer {
    constructor(_originalContent) {
        this._originalContent = _originalContent;
        this._linkedList = new linked_list_1.LinkedList(new Chunk(0, _originalContent.length, _originalContent));
    }
    _assertIndex(index) {
        if (index < 0 || index > this._originalContent.length) {
            throw new IndexOutOfBoundException(index, 0, this._originalContent.length);
        }
    }
    _slice(start) {
        this._assertIndex(start);
        // Find the chunk by going through the list.
        const h = this._linkedList.find(chunk => start <= chunk.end);
        if (!h) {
            throw Error('Chunk cannot be found.');
        }
        if (start == h.end && h.next !== null) {
            return [h, h.next];
        }
        return [h, h.slice(start)];
    }
    get length() {
        return this._linkedList.reduce((acc, chunk) => acc + chunk.length, 0);
    }
    get original() {
        return this._originalContent;
    }
    toString(encoding = 'utf-8') {
        return this._linkedList.reduce((acc, chunk) => acc + chunk.toString(encoding), '');
    }
    generate() {
        const result = Buffer.allocUnsafe(this.length);
        let i = 0;
        this._linkedList.forEach(chunk => {
            chunk.copy(result, i);
            i += chunk.length;
        });
        return result;
    }
    insertLeft(index, content, assert = false) {
        this._slice(index)[0].append(content, assert);
    }
    insertRight(index, content, assert = false) {
        this._slice(index)[1].prepend(content, assert);
    }
    remove(index, length) {
        const end = index + length;
        const first = this._slice(index)[1];
        const last = this._slice(end)[1];
        let curr;
        for (curr = first; curr && curr !== last; curr = curr.next) {
            curr.assert(curr !== first, curr !== last, curr === first);
        }
        for (curr = first; curr && curr !== last; curr = curr.next) {
            curr.remove(curr !== first, curr !== last, curr === first);
        }
        if (curr) {
            curr.remove(true, false, false);
        }
    }
}
exports.UpdateBuffer = UpdateBuffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLWJ1ZmZlci5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvdXRpbGl0eS91cGRhdGUtYnVmZmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQXFEO0FBQ3JELCtDQUEyQztBQUczQyxNQUFhLHdCQUF5QixTQUFRLG9CQUFhO0lBQ3pELFlBQVksS0FBYSxFQUFFLEdBQVcsRUFBRSxHQUFHLEdBQUcsUUFBUTtRQUNwRCxLQUFLLENBQUMsU0FBUyxLQUFLLHNCQUFzQixHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM3RCxDQUFDO0NBQ0Y7QUFKRCw0REFJQztBQUNELE1BQWEsK0JBQWdDLFNBQVEsb0JBQWE7SUFDaEU7UUFDRSxLQUFLLENBQUMseURBQXlELENBQUMsQ0FBQztJQUNuRSxDQUFDO0NBQ0Y7QUFKRCwwRUFJQztBQUdEOzs7Ozs7R0FNRztBQUNILE1BQWEsS0FBSztJQVVoQixZQUFtQixLQUFhLEVBQVMsR0FBVyxFQUFTLGVBQXVCO1FBQWpFLFVBQUssR0FBTCxLQUFLLENBQVE7UUFBUyxRQUFHLEdBQUgsR0FBRyxDQUFRO1FBQVMsb0JBQWUsR0FBZixlQUFlLENBQVE7UUFSNUUsVUFBSyxHQUFrQixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLFdBQU0sR0FBa0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV4QyxnQkFBVyxHQUFHLEtBQUssQ0FBQztRQUNwQixpQkFBWSxHQUFHLEtBQUssQ0FBQztRQUU3QixTQUFJLEdBQWlCLElBQUksQ0FBQztRQUd4QixJQUFJLENBQUMsUUFBUSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRCxJQUFJLE1BQU07UUFDUixPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztjQUNwQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Y0FDMUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUNELFFBQVEsQ0FBQyxRQUFRLEdBQUcsT0FBTztRQUN6QixPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztjQUNqRCxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Y0FDdkQsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVELEtBQUssQ0FBQyxLQUFhO1FBQ2pCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDMUMsTUFBTSxJQUFJLHdCQUF3QixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNqRTtRQUVELHNDQUFzQztRQUN0QyxNQUFNLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFFbEUsOEZBQThGO1FBQzlGLCtGQUErRjtRQUMvRixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDakIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQy9EO2FBQU07WUFDTCxRQUFRLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDbEMsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksRUFBRTtnQkFDeEIsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7YUFDdkI7U0FDRjtRQUNELElBQUksQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDO1FBRWpCLGdDQUFnQztRQUNoQyxRQUFRLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDOUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFN0MscUJBQXFCO1FBQ3JCLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtZQUNyQixRQUFRLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztZQUM3QixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztTQUMzQjtRQUVELDBCQUEwQjtRQUMxQixRQUFRLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDMUIsSUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUM7UUFFckIsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUFjLEVBQUUsU0FBa0I7UUFDdkMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDaEIsSUFBSSxTQUFTLEVBQUU7Z0JBQ2IsTUFBTSxJQUFJLCtCQUErQixFQUFFLENBQUM7YUFDN0M7WUFFRCxPQUFPO1NBQ1I7UUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6RCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUV2QyxJQUFJLFNBQVMsRUFBRTtZQUNiLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1NBQzFCO0lBQ0gsQ0FBQztJQUNELE9BQU8sQ0FBQyxNQUFjLEVBQUUsU0FBa0I7UUFDeEMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDZixJQUFJLFNBQVMsRUFBRTtnQkFDYixNQUFNLElBQUksK0JBQStCLEVBQUUsQ0FBQzthQUM3QztZQUVELE9BQU87U0FDUjtRQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDekIsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hELEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXRDLElBQUksU0FBUyxFQUFFO1lBQ2IsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7U0FDekI7SUFDSCxDQUFDO0lBRUQsTUFBTSxDQUFDLElBQWEsRUFBRSxRQUFpQixFQUFFLEtBQWM7UUFDckQsSUFBSSxJQUFJLEVBQUU7WUFDUixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ3BCLE1BQU0sSUFBSSwrQkFBK0IsRUFBRSxDQUFDO2FBQzdDO1NBQ0Y7UUFDRCxJQUFJLEtBQUssRUFBRTtZQUNULElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtnQkFDckIsTUFBTSxJQUFJLCtCQUErQixFQUFFLENBQUM7YUFDN0M7U0FDRjtJQUNILENBQUM7SUFFRCxNQUFNLENBQUMsSUFBYSxFQUFFLE9BQWdCLEVBQUUsS0FBYztRQUNwRCxJQUFJLElBQUksRUFBRTtZQUNSLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDcEIsTUFBTSxJQUFJLCtCQUErQixFQUFFLENBQUM7YUFDN0M7WUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztTQUNuQjtRQUNELElBQUksT0FBTyxFQUFFO1lBQ1gsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7U0FDdEI7UUFDRCxJQUFJLEtBQUssRUFBRTtZQUNULElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtnQkFDckIsTUFBTSxJQUFJLCtCQUErQixFQUFFLENBQUM7YUFDN0M7WUFDRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztTQUNwQjtJQUNILENBQUM7SUFFRCxJQUFJLENBQUMsTUFBYyxFQUFFLEtBQWE7UUFDaEMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ2QsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9CLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztTQUM1QjtRQUNELElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNqQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEMsS0FBSyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1NBQy9CO1FBQ0QsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hDLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztTQUM3QjtRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztDQUNGO0FBbEpELHNCQWtKQztBQUdEOzs7Ozs7Ozs7R0FTRztBQUNILE1BQWEsWUFBWTtJQUd2QixZQUFzQixnQkFBd0I7UUFBeEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFRO1FBQzVDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSx3QkFBVSxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO0lBQzdGLENBQUM7SUFFUyxZQUFZLENBQUMsS0FBYTtRQUNsQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUU7WUFDckQsTUFBTSxJQUFJLHdCQUF3QixDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzVFO0lBQ0gsQ0FBQztJQUVTLE1BQU0sQ0FBQyxLQUFhO1FBQzVCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFekIsNENBQTRDO1FBQzVDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3RCxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ04sTUFBTSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztTQUN2QztRQUVELElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7WUFDckMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDcEI7UUFFRCxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRUQsSUFBSSxNQUFNO1FBQ1IsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3hFLENBQUM7SUFDRCxJQUFJLFFBQVE7UUFDVixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztJQUMvQixDQUFDO0lBRUQsUUFBUSxDQUFDLFFBQVEsR0FBRyxPQUFPO1FBQ3pCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNyRixDQUFDO0lBQ0QsUUFBUTtRQUNOLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNWLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQy9CLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVELFVBQVUsQ0FBQyxLQUFhLEVBQUUsT0FBZSxFQUFFLE1BQU0sR0FBRyxLQUFLO1FBQ3ZELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBQ0QsV0FBVyxDQUFDLEtBQWEsRUFBRSxPQUFlLEVBQUUsTUFBTSxHQUFHLEtBQUs7UUFDeEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRCxNQUFNLENBQUMsS0FBYSxFQUFFLE1BQWM7UUFDbEMsTUFBTSxHQUFHLEdBQUcsS0FBSyxHQUFHLE1BQU0sQ0FBQztRQUUzQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFakMsSUFBSSxJQUFrQixDQUFDO1FBQ3ZCLEtBQUssSUFBSSxHQUFHLEtBQUssRUFBRSxJQUFJLElBQUksSUFBSSxLQUFLLElBQUksRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRTtZQUMxRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxLQUFLLEVBQUUsSUFBSSxLQUFLLElBQUksRUFBRSxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUM7U0FDNUQ7UUFDRCxLQUFLLElBQUksR0FBRyxLQUFLLEVBQUUsSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLEVBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDMUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssS0FBSyxFQUFFLElBQUksS0FBSyxJQUFJLEVBQUUsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDO1NBQzVEO1FBRUQsSUFBSSxJQUFJLEVBQUU7WUFDUixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDakM7SUFDSCxDQUFDO0NBQ0Y7QUEzRUQsb0NBMkVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IExpbmtlZExpc3QgfSBmcm9tICcuL2xpbmtlZC1saXN0JztcblxuXG5leHBvcnQgY2xhc3MgSW5kZXhPdXRPZkJvdW5kRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKGluZGV4OiBudW1iZXIsIG1pbjogbnVtYmVyLCBtYXggPSBJbmZpbml0eSkge1xuICAgIHN1cGVyKGBJbmRleCAke2luZGV4fSBvdXRzaWRlIG9mIHJhbmdlIFske21pbn0sICR7bWF4fV0uYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBDb250ZW50Q2Fubm90QmVSZW1vdmVkRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKGBVc2VyIHRyaWVkIHRvIHJlbW92ZSBjb250ZW50IHRoYXQgd2FzIG1hcmtlZCBlc3NlbnRpYWwuYCk7XG4gIH1cbn1cblxuXG4vKipcbiAqIEEgQ2h1bmsgZGVzY3JpcHRpb24sIGluY2x1ZGluZyBsZWZ0L3JpZ2h0IGNvbnRlbnQgdGhhdCBoYXMgYmVlbiBpbnNlcnRlZC5cbiAqIElmIF9sZWZ0L19yaWdodCBpcyBudWxsLCB0aGlzIG1lYW5zIHRoYXQgY29udGVudCB3YXMgZGVsZXRlZC4gSWYgdGhlIF9jb250ZW50IGlzIG51bGwsXG4gKiBpdCBtZWFucyB0aGUgY29udGVudCBpdHNlbGYgd2FzIGRlbGV0ZWQuXG4gKlxuICogQHNlZSBVcGRhdGVCdWZmZXJcbiAqL1xuZXhwb3J0IGNsYXNzIENodW5rIHtcbiAgcHJpdmF0ZSBfY29udGVudDogQnVmZmVyIHwgbnVsbDtcbiAgcHJpdmF0ZSBfbGVmdDogQnVmZmVyIHwgbnVsbCA9IEJ1ZmZlci5hbGxvYygwKTtcbiAgcHJpdmF0ZSBfcmlnaHQ6IEJ1ZmZlciB8IG51bGwgPSBCdWZmZXIuYWxsb2MoMCk7XG5cbiAgcHJpdmF0ZSBfYXNzZXJ0TGVmdCA9IGZhbHNlO1xuICBwcml2YXRlIF9hc3NlcnRSaWdodCA9IGZhbHNlO1xuXG4gIG5leHQ6IENodW5rIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHN0YXJ0OiBudW1iZXIsIHB1YmxpYyBlbmQ6IG51bWJlciwgcHVibGljIG9yaWdpbmFsQ29udGVudDogQnVmZmVyKSB7XG4gICAgdGhpcy5fY29udGVudCA9IG9yaWdpbmFsQ29udGVudC5zbGljZShzdGFydCwgZW5kKTtcbiAgfVxuXG4gIGdldCBsZW5ndGgoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9sZWZ0ID8gdGhpcy5fbGVmdC5sZW5ndGggOiAwKVxuICAgICAgICAgKyAodGhpcy5fY29udGVudCA/IHRoaXMuX2NvbnRlbnQubGVuZ3RoIDogMClcbiAgICAgICAgICsgKHRoaXMuX3JpZ2h0ID8gdGhpcy5fcmlnaHQubGVuZ3RoIDogMCk7XG4gIH1cbiAgdG9TdHJpbmcoZW5jb2RpbmcgPSAndXRmLTgnKSB7XG4gICAgcmV0dXJuICh0aGlzLl9sZWZ0ID8gdGhpcy5fbGVmdC50b1N0cmluZyhlbmNvZGluZykgOiAnJylcbiAgICAgICAgICsgKHRoaXMuX2NvbnRlbnQgPyB0aGlzLl9jb250ZW50LnRvU3RyaW5nKGVuY29kaW5nKSA6ICcnKVxuICAgICAgICAgKyAodGhpcy5fcmlnaHQgPyB0aGlzLl9yaWdodC50b1N0cmluZyhlbmNvZGluZykgOiAnJyk7XG4gIH1cblxuICBzbGljZShzdGFydDogbnVtYmVyKSB7XG4gICAgaWYgKHN0YXJ0IDwgdGhpcy5zdGFydCB8fCBzdGFydCA+IHRoaXMuZW5kKSB7XG4gICAgICB0aHJvdyBuZXcgSW5kZXhPdXRPZkJvdW5kRXhjZXB0aW9uKHN0YXJ0LCB0aGlzLnN0YXJ0LCB0aGlzLmVuZCk7XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIF9jb250ZW50IHRvIHRoZSBuZXcgaW5kaWNlcy5cbiAgICBjb25zdCBuZXdDaHVuayA9IG5ldyBDaHVuayhzdGFydCwgdGhpcy5lbmQsIHRoaXMub3JpZ2luYWxDb250ZW50KTtcblxuICAgIC8vIElmIHRoaXMgY2h1bmsgaGFzIF9jb250ZW50LCByZXNsaWNlIHRoZSBvcmlnaW5hbCBfY29udGVudC4gV2UgbW92ZSB0aGUgX3JpZ2h0IHNvIHdlIGFyZSBub3RcbiAgICAvLyBsb3NpbmcgYW55IGRhdGEgaGVyZS4gSWYgdGhpcyBjaHVuayBoYXMgYmVlbiBkZWxldGVkLCB0aGUgbmV4dCBjaHVuayBzaG91bGQgYWxzbyBiZSBkZWxldGVkLlxuICAgIGlmICh0aGlzLl9jb250ZW50KSB7XG4gICAgICB0aGlzLl9jb250ZW50ID0gdGhpcy5vcmlnaW5hbENvbnRlbnQuc2xpY2UodGhpcy5zdGFydCwgc3RhcnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdDaHVuay5fY29udGVudCA9IHRoaXMuX2NvbnRlbnQ7XG4gICAgICBpZiAodGhpcy5fcmlnaHQgPT09IG51bGwpIHtcbiAgICAgICAgbmV3Q2h1bmsuX2xlZnQgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmVuZCA9IHN0YXJ0O1xuXG4gICAgLy8gTW92ZSBfcmlnaHQgdG8gdGhlIG5ldyBjaHVuay5cbiAgICBuZXdDaHVuay5fcmlnaHQgPSB0aGlzLl9yaWdodDtcbiAgICB0aGlzLl9yaWdodCA9IHRoaXMuX3JpZ2h0ICYmIEJ1ZmZlci5hbGxvYygwKTtcblxuICAgIC8vIFVwZGF0ZSBlc3NlbnRpYWxzLlxuICAgIGlmICh0aGlzLl9hc3NlcnRSaWdodCkge1xuICAgICAgbmV3Q2h1bmsuX2Fzc2VydFJpZ2h0ID0gdHJ1ZTtcbiAgICAgIHRoaXMuX2Fzc2VydFJpZ2h0ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHRoZSBsaW5rZWQgbGlzdC5cbiAgICBuZXdDaHVuay5uZXh0ID0gdGhpcy5uZXh0O1xuICAgIHRoaXMubmV4dCA9IG5ld0NodW5rO1xuXG4gICAgcmV0dXJuIG5ld0NodW5rO1xuICB9XG5cbiAgYXBwZW5kKGJ1ZmZlcjogQnVmZmVyLCBlc3NlbnRpYWw6IGJvb2xlYW4pIHtcbiAgICBpZiAoIXRoaXMuX3JpZ2h0KSB7XG4gICAgICBpZiAoZXNzZW50aWFsKSB7XG4gICAgICAgIHRocm93IG5ldyBDb250ZW50Q2Fubm90QmVSZW1vdmVkRXhjZXB0aW9uKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBvdXRybyA9IHRoaXMuX3JpZ2h0O1xuICAgIHRoaXMuX3JpZ2h0ID0gQnVmZmVyLmFsbG9jKG91dHJvLmxlbmd0aCArIGJ1ZmZlci5sZW5ndGgpO1xuICAgIG91dHJvLmNvcHkodGhpcy5fcmlnaHQsIDApO1xuICAgIGJ1ZmZlci5jb3B5KHRoaXMuX3JpZ2h0LCBvdXRyby5sZW5ndGgpO1xuXG4gICAgaWYgKGVzc2VudGlhbCkge1xuICAgICAgdGhpcy5fYXNzZXJ0UmlnaHQgPSB0cnVlO1xuICAgIH1cbiAgfVxuICBwcmVwZW5kKGJ1ZmZlcjogQnVmZmVyLCBlc3NlbnRpYWw6IGJvb2xlYW4pIHtcbiAgICBpZiAoIXRoaXMuX2xlZnQpIHtcbiAgICAgIGlmIChlc3NlbnRpYWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IENvbnRlbnRDYW5ub3RCZVJlbW92ZWRFeGNlcHRpb24oKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGludHJvID0gdGhpcy5fbGVmdDtcbiAgICB0aGlzLl9sZWZ0ID0gQnVmZmVyLmFsbG9jKGludHJvLmxlbmd0aCArIGJ1ZmZlci5sZW5ndGgpO1xuICAgIGludHJvLmNvcHkodGhpcy5fbGVmdCwgMCk7XG4gICAgYnVmZmVyLmNvcHkodGhpcy5fbGVmdCwgaW50cm8ubGVuZ3RoKTtcblxuICAgIGlmIChlc3NlbnRpYWwpIHtcbiAgICAgIHRoaXMuX2Fzc2VydExlZnQgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGFzc2VydChsZWZ0OiBib29sZWFuLCBfY29udGVudDogYm9vbGVhbiwgcmlnaHQ6IGJvb2xlYW4pIHtcbiAgICBpZiAobGVmdCkge1xuICAgICAgaWYgKHRoaXMuX2Fzc2VydExlZnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IENvbnRlbnRDYW5ub3RCZVJlbW92ZWRFeGNlcHRpb24oKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJpZ2h0KSB7XG4gICAgICBpZiAodGhpcy5fYXNzZXJ0UmlnaHQpIHtcbiAgICAgICAgdGhyb3cgbmV3IENvbnRlbnRDYW5ub3RCZVJlbW92ZWRFeGNlcHRpb24oKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZW1vdmUobGVmdDogYm9vbGVhbiwgY29udGVudDogYm9vbGVhbiwgcmlnaHQ6IGJvb2xlYW4pIHtcbiAgICBpZiAobGVmdCkge1xuICAgICAgaWYgKHRoaXMuX2Fzc2VydExlZnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IENvbnRlbnRDYW5ub3RCZVJlbW92ZWRFeGNlcHRpb24oKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2xlZnQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAoY29udGVudCkge1xuICAgICAgdGhpcy5fY29udGVudCA9IG51bGw7XG4gICAgfVxuICAgIGlmIChyaWdodCkge1xuICAgICAgaWYgKHRoaXMuX2Fzc2VydFJpZ2h0KSB7XG4gICAgICAgIHRocm93IG5ldyBDb250ZW50Q2Fubm90QmVSZW1vdmVkRXhjZXB0aW9uKCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9yaWdodCA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgY29weSh0YXJnZXQ6IEJ1ZmZlciwgc3RhcnQ6IG51bWJlcikge1xuICAgIGlmICh0aGlzLl9sZWZ0KSB7XG4gICAgICB0aGlzLl9sZWZ0LmNvcHkodGFyZ2V0LCBzdGFydCk7XG4gICAgICBzdGFydCArPSB0aGlzLl9sZWZ0Lmxlbmd0aDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2NvbnRlbnQpIHtcbiAgICAgIHRoaXMuX2NvbnRlbnQuY29weSh0YXJnZXQsIHN0YXJ0KTtcbiAgICAgIHN0YXJ0ICs9IHRoaXMuX2NvbnRlbnQubGVuZ3RoO1xuICAgIH1cbiAgICBpZiAodGhpcy5fcmlnaHQpIHtcbiAgICAgIHRoaXMuX3JpZ2h0LmNvcHkodGFyZ2V0LCBzdGFydCk7XG4gICAgICBzdGFydCArPSB0aGlzLl9yaWdodC5sZW5ndGg7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0YXJ0O1xuICB9XG59XG5cblxuLyoqXG4gKiBBbiB1dGlsaXR5IGNsYXNzIHRoYXQgYWxsb3dzIGJ1ZmZlcnMgdG8gYmUgaW5zZXJ0ZWQgdG8gdGhlIF9yaWdodCBvciBfbGVmdCwgb3IgZGVsZXRlZCwgd2hpbGVcbiAqIGtlZXBpbmcgaW5kaWNlcyB0byB0aGUgb3JpZ2luYWwgYnVmZmVyLlxuICpcbiAqIFRoZSBjb25zdHJ1Y3RvciB0YWtlcyBhbiBvcmlnaW5hbCBidWZmZXIsIGFuZCBrZWVwcyBpdCBpbnRvIGEgbGlua2VkIGxpc3Qgb2YgY2h1bmtzLCBzbWFsbGVyXG4gKiBidWZmZXJzIHRoYXQga2VlcCB0cmFjayBvZiBfY29udGVudCBpbnNlcnRlZCB0byB0aGUgX3JpZ2h0IG9yIF9sZWZ0IG9mIGl0LlxuICpcbiAqIFNpbmNlIHRoZSBOb2RlIEJ1ZmZlciBzdHJ1Y3R1cmUgaXMgbm9uLWRlc3RydWN0aXZlIHdoZW4gc2xpY2luZywgd2UgdHJ5IHRvIHVzZSBzbGljaW5nIHRvIGNyZWF0ZVxuICogbmV3IGNodW5rcywgYW5kIGFsd2F5cyBrZWVwIGNodW5rcyBwb2ludGluZyB0byB0aGUgb3JpZ2luYWwgY29udGVudC5cbiAqL1xuZXhwb3J0IGNsYXNzIFVwZGF0ZUJ1ZmZlciB7XG4gIHByb3RlY3RlZCBfbGlua2VkTGlzdDogTGlua2VkTGlzdDxDaHVuaz47XG5cbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIF9vcmlnaW5hbENvbnRlbnQ6IEJ1ZmZlcikge1xuICAgIHRoaXMuX2xpbmtlZExpc3QgPSBuZXcgTGlua2VkTGlzdChuZXcgQ2h1bmsoMCwgX29yaWdpbmFsQ29udGVudC5sZW5ndGgsIF9vcmlnaW5hbENvbnRlbnQpKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfYXNzZXJ0SW5kZXgoaW5kZXg6IG51bWJlcikge1xuICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPiB0aGlzLl9vcmlnaW5hbENvbnRlbnQubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgSW5kZXhPdXRPZkJvdW5kRXhjZXB0aW9uKGluZGV4LCAwLCB0aGlzLl9vcmlnaW5hbENvbnRlbnQubGVuZ3RoKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgX3NsaWNlKHN0YXJ0OiBudW1iZXIpOiBbQ2h1bmssIENodW5rXSB7XG4gICAgdGhpcy5fYXNzZXJ0SW5kZXgoc3RhcnQpO1xuXG4gICAgLy8gRmluZCB0aGUgY2h1bmsgYnkgZ29pbmcgdGhyb3VnaCB0aGUgbGlzdC5cbiAgICBjb25zdCBoID0gdGhpcy5fbGlua2VkTGlzdC5maW5kKGNodW5rID0+IHN0YXJ0IDw9IGNodW5rLmVuZCk7XG4gICAgaWYgKCFoKSB7XG4gICAgICB0aHJvdyBFcnJvcignQ2h1bmsgY2Fubm90IGJlIGZvdW5kLicpO1xuICAgIH1cblxuICAgIGlmIChzdGFydCA9PSBoLmVuZCAmJiBoLm5leHQgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBbaCwgaC5uZXh0XTtcbiAgICB9XG5cbiAgICByZXR1cm4gW2gsIGguc2xpY2Uoc3RhcnQpXTtcbiAgfVxuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fbGlua2VkTGlzdC5yZWR1Y2UoKGFjYywgY2h1bmspID0+IGFjYyArIGNodW5rLmxlbmd0aCwgMCk7XG4gIH1cbiAgZ2V0IG9yaWdpbmFsKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMuX29yaWdpbmFsQ29udGVudDtcbiAgfVxuXG4gIHRvU3RyaW5nKGVuY29kaW5nID0gJ3V0Zi04Jyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX2xpbmtlZExpc3QucmVkdWNlKChhY2MsIGNodW5rKSA9PiBhY2MgKyBjaHVuay50b1N0cmluZyhlbmNvZGluZyksICcnKTtcbiAgfVxuICBnZW5lcmF0ZSgpOiBCdWZmZXIge1xuICAgIGNvbnN0IHJlc3VsdCA9IEJ1ZmZlci5hbGxvY1Vuc2FmZSh0aGlzLmxlbmd0aCk7XG4gICAgbGV0IGkgPSAwO1xuICAgIHRoaXMuX2xpbmtlZExpc3QuZm9yRWFjaChjaHVuayA9PiB7XG4gICAgICBjaHVuay5jb3B5KHJlc3VsdCwgaSk7XG4gICAgICBpICs9IGNodW5rLmxlbmd0aDtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBpbnNlcnRMZWZ0KGluZGV4OiBudW1iZXIsIGNvbnRlbnQ6IEJ1ZmZlciwgYXNzZXJ0ID0gZmFsc2UpIHtcbiAgICB0aGlzLl9zbGljZShpbmRleClbMF0uYXBwZW5kKGNvbnRlbnQsIGFzc2VydCk7XG4gIH1cbiAgaW5zZXJ0UmlnaHQoaW5kZXg6IG51bWJlciwgY29udGVudDogQnVmZmVyLCBhc3NlcnQgPSBmYWxzZSkge1xuICAgIHRoaXMuX3NsaWNlKGluZGV4KVsxXS5wcmVwZW5kKGNvbnRlbnQsIGFzc2VydCk7XG4gIH1cblxuICByZW1vdmUoaW5kZXg6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpIHtcbiAgICBjb25zdCBlbmQgPSBpbmRleCArIGxlbmd0aDtcblxuICAgIGNvbnN0IGZpcnN0ID0gdGhpcy5fc2xpY2UoaW5kZXgpWzFdO1xuICAgIGNvbnN0IGxhc3QgPSB0aGlzLl9zbGljZShlbmQpWzFdO1xuXG4gICAgbGV0IGN1cnI6IENodW5rIHwgbnVsbDtcbiAgICBmb3IgKGN1cnIgPSBmaXJzdDsgY3VyciAmJiBjdXJyICE9PSBsYXN0OyBjdXJyID0gY3Vyci5uZXh0KSB7XG4gICAgICBjdXJyLmFzc2VydChjdXJyICE9PSBmaXJzdCwgY3VyciAhPT0gbGFzdCwgY3VyciA9PT0gZmlyc3QpO1xuICAgIH1cbiAgICBmb3IgKGN1cnIgPSBmaXJzdDsgY3VyciAmJiBjdXJyICE9PSBsYXN0OyBjdXJyID0gY3Vyci5uZXh0KSB7XG4gICAgICBjdXJyLnJlbW92ZShjdXJyICE9PSBmaXJzdCwgY3VyciAhPT0gbGFzdCwgY3VyciA9PT0gZmlyc3QpO1xuICAgIH1cblxuICAgIGlmIChjdXJyKSB7XG4gICAgICBjdXJyLnJlbW92ZSh0cnVlLCBmYWxzZSwgZmFsc2UpO1xuICAgIH1cbiAgfVxufVxuIl19