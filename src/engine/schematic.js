"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchematicImpl = exports.InvalidSchematicsNameException = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const call_1 = require("../rules/call");
const scoped_1 = require("../tree/scoped");
class InvalidSchematicsNameException extends core_1.BaseException {
    constructor(name) {
        super(`Schematics has invalid name: "${name}".`);
    }
}
exports.InvalidSchematicsNameException = InvalidSchematicsNameException;
class SchematicImpl {
    _description;
    _factory;
    _collection;
    _engine;
    constructor(_description, _factory, _collection, _engine) {
        this._description = _description;
        this._factory = _factory;
        this._collection = _collection;
        this._engine = _engine;
        if (!_description.name.match(/^[-@/_.a-zA-Z0-9]+$/)) {
            throw new InvalidSchematicsNameException(_description.name);
        }
    }
    get description() {
        return this._description;
    }
    get collection() {
        return this._collection;
    }
    call(options, host, parentContext, executionOptions) {
        const context = this._engine.createContext(this, parentContext, executionOptions);
        return host.pipe((0, rxjs_1.first)(), (0, rxjs_1.concatMap)((tree) => this._engine
            .transformOptions(this, options, context)
            .pipe((0, rxjs_1.map)((o) => [tree, o]))), (0, rxjs_1.concatMap)(([tree, transformedOptions]) => {
            let input;
            let scoped = false;
            if (executionOptions && executionOptions.scope) {
                scoped = true;
                input = new scoped_1.ScopedTree(tree, executionOptions.scope);
            }
            else {
                input = tree;
            }
            return (0, call_1.callRule)(this._factory(transformedOptions), input, context).pipe((0, rxjs_1.map)((output) => {
                if (output === input) {
                    return tree;
                }
                else if (scoped) {
                    tree.merge(output);
                    return tree;
                }
                else {
                    return output;
                }
            }));
        }));
    }
}
exports.SchematicImpl = SchematicImpl;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hdGljLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvZW5naW5lL3NjaGVtYXRpYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBcUQ7QUFDckQsK0JBQXlEO0FBQ3pELHdDQUF5QztBQUV6QywyQ0FBNEM7QUFXNUMsTUFBYSw4QkFBK0IsU0FBUSxvQkFBYTtJQUMvRCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGlDQUFpQyxJQUFJLElBQUksQ0FBQyxDQUFDO0lBQ25ELENBQUM7Q0FDRjtBQUpELHdFQUlDO0FBRUQsTUFBYSxhQUFhO0lBSWQ7SUFDQTtJQUNBO0lBQ0E7SUFKVixZQUNVLFlBQTJELEVBQzNELFFBQXlCLEVBQ3pCLFdBQWdELEVBQ2hELE9BQXdDO1FBSHhDLGlCQUFZLEdBQVosWUFBWSxDQUErQztRQUMzRCxhQUFRLEdBQVIsUUFBUSxDQUFpQjtRQUN6QixnQkFBVyxHQUFYLFdBQVcsQ0FBcUM7UUFDaEQsWUFBTyxHQUFQLE9BQU8sQ0FBaUM7UUFFaEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEVBQUU7WUFDbkQsTUFBTSxJQUFJLDhCQUE4QixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM3RDtJQUNILENBQUM7SUFFRCxJQUFJLFdBQVc7UUFDYixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDM0IsQ0FBQztJQUNELElBQUksVUFBVTtRQUNaLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUMxQixDQUFDO0lBRUQsSUFBSSxDQUNGLE9BQWdCLEVBQ2hCLElBQXNCLEVBQ3RCLGFBQXVFLEVBQ3ZFLGdCQUE0QztRQUU1QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFFbEYsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUNkLElBQUEsWUFBSyxHQUFFLEVBQ1AsSUFBQSxnQkFBUyxFQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FDakIsSUFBSSxDQUFDLE9BQU87YUFDVCxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQzthQUN4QyxJQUFJLENBQUMsSUFBQSxVQUFHLEVBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBb0IsQ0FBQyxDQUFDLENBQ2xELEVBQ0QsSUFBQSxnQkFBUyxFQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxFQUFFO1lBQ3ZDLElBQUksS0FBVyxDQUFDO1lBQ2hCLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLEtBQUssRUFBRTtnQkFDOUMsTUFBTSxHQUFHLElBQUksQ0FBQztnQkFDZCxLQUFLLEdBQUcsSUFBSSxtQkFBVSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN0RDtpQkFBTTtnQkFDTCxLQUFLLEdBQUcsSUFBSSxDQUFDO2FBQ2Q7WUFFRCxPQUFPLElBQUEsZUFBUSxFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUNyRSxJQUFBLFVBQUcsRUFBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNiLElBQUksTUFBTSxLQUFLLEtBQUssRUFBRTtvQkFDcEIsT0FBTyxJQUFJLENBQUM7aUJBQ2I7cUJBQU0sSUFBSSxNQUFNLEVBQUU7b0JBQ2pCLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBRW5CLE9BQU8sSUFBSSxDQUFDO2lCQUNiO3FCQUFNO29CQUNMLE9BQU8sTUFBTSxDQUFDO2lCQUNmO1lBQ0gsQ0FBQyxDQUFDLENBQ0gsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDO0NBQ0Y7QUE5REQsc0NBOERDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24gfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBjb25jYXRNYXAsIGZpcnN0LCBtYXAgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGNhbGxSdWxlIH0gZnJvbSAnLi4vcnVsZXMvY2FsbCc7XG5pbXBvcnQgeyBUcmVlIH0gZnJvbSAnLi4vdHJlZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgU2NvcGVkVHJlZSB9IGZyb20gJy4uL3RyZWUvc2NvcGVkJztcbmltcG9ydCB7XG4gIENvbGxlY3Rpb24sXG4gIEVuZ2luZSxcbiAgRXhlY3V0aW9uT3B0aW9ucyxcbiAgUnVsZUZhY3RvcnksXG4gIFNjaGVtYXRpYyxcbiAgU2NoZW1hdGljRGVzY3JpcHRpb24sXG4gIFR5cGVkU2NoZW1hdGljQ29udGV4dCxcbn0gZnJvbSAnLi9pbnRlcmZhY2UnO1xuXG5leHBvcnQgY2xhc3MgSW52YWxpZFNjaGVtYXRpY3NOYW1lRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBTY2hlbWF0aWNzIGhhcyBpbnZhbGlkIG5hbWU6IFwiJHtuYW1lfVwiLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNJbXBsPENvbGxlY3Rpb25UIGV4dGVuZHMgb2JqZWN0LCBTY2hlbWF0aWNUIGV4dGVuZHMgb2JqZWN0PlxuICBpbXBsZW1lbnRzIFNjaGVtYXRpYzxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD5cbntcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfZGVzY3JpcHRpb246IFNjaGVtYXRpY0Rlc2NyaXB0aW9uPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPixcbiAgICBwcml2YXRlIF9mYWN0b3J5OiBSdWxlRmFjdG9yeTx7fT4sXG4gICAgcHJpdmF0ZSBfY29sbGVjdGlvbjogQ29sbGVjdGlvbjxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICAgcHJpdmF0ZSBfZW5naW5lOiBFbmdpbmU8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+LFxuICApIHtcbiAgICBpZiAoIV9kZXNjcmlwdGlvbi5uYW1lLm1hdGNoKC9eWy1AL18uYS16QS1aMC05XSskLykpIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkU2NoZW1hdGljc05hbWVFeGNlcHRpb24oX2Rlc2NyaXB0aW9uLm5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBkZXNjcmlwdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVzY3JpcHRpb247XG4gIH1cbiAgZ2V0IGNvbGxlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbGxlY3Rpb247XG4gIH1cblxuICBjYWxsPE9wdGlvblQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgIG9wdGlvbnM6IE9wdGlvblQsXG4gICAgaG9zdDogT2JzZXJ2YWJsZTxUcmVlPixcbiAgICBwYXJlbnRDb250ZXh0PzogUGFydGlhbDxUeXBlZFNjaGVtYXRpY0NvbnRleHQ8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+PixcbiAgICBleGVjdXRpb25PcHRpb25zPzogUGFydGlhbDxFeGVjdXRpb25PcHRpb25zPixcbiAgKTogT2JzZXJ2YWJsZTxUcmVlPiB7XG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuX2VuZ2luZS5jcmVhdGVDb250ZXh0KHRoaXMsIHBhcmVudENvbnRleHQsIGV4ZWN1dGlvbk9wdGlvbnMpO1xuXG4gICAgcmV0dXJuIGhvc3QucGlwZShcbiAgICAgIGZpcnN0KCksXG4gICAgICBjb25jYXRNYXAoKHRyZWUpID0+XG4gICAgICAgIHRoaXMuX2VuZ2luZVxuICAgICAgICAgIC50cmFuc2Zvcm1PcHRpb25zKHRoaXMsIG9wdGlvbnMsIGNvbnRleHQpXG4gICAgICAgICAgLnBpcGUobWFwKChvKSA9PiBbdHJlZSwgb10gYXMgW1RyZWUsIE9wdGlvblRdKSksXG4gICAgICApLFxuICAgICAgY29uY2F0TWFwKChbdHJlZSwgdHJhbnNmb3JtZWRPcHRpb25zXSkgPT4ge1xuICAgICAgICBsZXQgaW5wdXQ6IFRyZWU7XG4gICAgICAgIGxldCBzY29wZWQgPSBmYWxzZTtcbiAgICAgICAgaWYgKGV4ZWN1dGlvbk9wdGlvbnMgJiYgZXhlY3V0aW9uT3B0aW9ucy5zY29wZSkge1xuICAgICAgICAgIHNjb3BlZCA9IHRydWU7XG4gICAgICAgICAgaW5wdXQgPSBuZXcgU2NvcGVkVHJlZSh0cmVlLCBleGVjdXRpb25PcHRpb25zLnNjb3BlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbnB1dCA9IHRyZWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2FsbFJ1bGUodGhpcy5fZmFjdG9yeSh0cmFuc2Zvcm1lZE9wdGlvbnMpLCBpbnB1dCwgY29udGV4dCkucGlwZShcbiAgICAgICAgICBtYXAoKG91dHB1dCkgPT4ge1xuICAgICAgICAgICAgaWYgKG91dHB1dCA9PT0gaW5wdXQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRyZWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNjb3BlZCkge1xuICAgICAgICAgICAgICB0cmVlLm1lcmdlKG91dHB1dCk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHRyZWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxufVxuIl19