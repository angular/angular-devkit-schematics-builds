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
const operators_1 = require("rxjs/operators");
const call_1 = require("../rules/call");
const scoped_1 = require("../tree/scoped");
class InvalidSchematicsNameException extends core_1.BaseException {
    constructor(name) {
        super(`Schematics has invalid name: "${name}".`);
    }
}
exports.InvalidSchematicsNameException = InvalidSchematicsNameException;
class SchematicImpl {
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
        return host.pipe((0, operators_1.first)(), (0, operators_1.concatMap)((tree) => this._engine
            .transformOptions(this, options, context)
            .pipe((0, operators_1.map)((o) => [tree, o]))), (0, operators_1.concatMap)(([tree, transformedOptions]) => {
            let input;
            let scoped = false;
            if (executionOptions && executionOptions.scope) {
                scoped = true;
                input = new scoped_1.ScopedTree(tree, executionOptions.scope);
            }
            else {
                input = tree;
            }
            return (0, call_1.callRule)(this._factory(transformedOptions), (0, rxjs_1.of)(input), context).pipe((0, operators_1.map)((output) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hdGljLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvZW5naW5lL3NjaGVtYXRpYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBcUQ7QUFDckQsK0JBQXNEO0FBQ3RELDhDQUF1RDtBQUN2RCx3Q0FBeUM7QUFFekMsMkNBQTRDO0FBVzVDLE1BQWEsOEJBQStCLFNBQVEsb0JBQWE7SUFDL0QsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyxpQ0FBaUMsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUNuRCxDQUFDO0NBQ0Y7QUFKRCx3RUFJQztBQUVELE1BQWEsYUFBYTtJQUV4QixZQUNVLFlBQTJELEVBQzNELFFBQXlCLEVBQ3pCLFdBQWdELEVBQ2hELE9BQXdDO1FBSHhDLGlCQUFZLEdBQVosWUFBWSxDQUErQztRQUMzRCxhQUFRLEdBQVIsUUFBUSxDQUFpQjtRQUN6QixnQkFBVyxHQUFYLFdBQVcsQ0FBcUM7UUFDaEQsWUFBTyxHQUFQLE9BQU8sQ0FBaUM7UUFFaEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEVBQUU7WUFDbkQsTUFBTSxJQUFJLDhCQUE4QixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM3RDtJQUNILENBQUM7SUFFRCxJQUFJLFdBQVc7UUFDYixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDM0IsQ0FBQztJQUNELElBQUksVUFBVTtRQUNaLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUMxQixDQUFDO0lBRUQsSUFBSSxDQUNGLE9BQWdCLEVBQ2hCLElBQXNCLEVBQ3RCLGFBQXVFLEVBQ3ZFLGdCQUE0QztRQUU1QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFFbEYsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUNkLElBQUEsaUJBQUssR0FBRSxFQUNQLElBQUEscUJBQVMsRUFBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQ2pCLElBQUksQ0FBQyxPQUFPO2FBQ1QsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUM7YUFDeEMsSUFBSSxDQUFDLElBQUEsZUFBRyxFQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQW9CLENBQUMsQ0FBQyxDQUNsRCxFQUNELElBQUEscUJBQVMsRUFBQyxDQUFDLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLEVBQUUsRUFBRTtZQUN2QyxJQUFJLEtBQVcsQ0FBQztZQUNoQixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDbkIsSUFBSSxnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUU7Z0JBQzlDLE1BQU0sR0FBRyxJQUFJLENBQUM7Z0JBQ2QsS0FBSyxHQUFHLElBQUksbUJBQVUsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDdEQ7aUJBQU07Z0JBQ0wsS0FBSyxHQUFHLElBQUksQ0FBQzthQUNkO1lBRUQsT0FBTyxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsSUFBQSxTQUFZLEVBQUMsS0FBSyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUNuRixJQUFBLGVBQUcsRUFBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNiLElBQUksTUFBTSxLQUFLLEtBQUssRUFBRTtvQkFDcEIsT0FBTyxJQUFJLENBQUM7aUJBQ2I7cUJBQU0sSUFBSSxNQUFNLEVBQUU7b0JBQ2pCLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBRW5CLE9BQU8sSUFBSSxDQUFDO2lCQUNiO3FCQUFNO29CQUNMLE9BQU8sTUFBTSxDQUFDO2lCQUNmO1lBQ0gsQ0FBQyxDQUFDLENBQ0gsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDO0NBQ0Y7QUE3REQsc0NBNkRDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24gfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBvZiBhcyBvYnNlcnZhYmxlT2YgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGNvbmNhdE1hcCwgZmlyc3QsIG1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IGNhbGxSdWxlIH0gZnJvbSAnLi4vcnVsZXMvY2FsbCc7XG5pbXBvcnQgeyBUcmVlIH0gZnJvbSAnLi4vdHJlZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgU2NvcGVkVHJlZSB9IGZyb20gJy4uL3RyZWUvc2NvcGVkJztcbmltcG9ydCB7XG4gIENvbGxlY3Rpb24sXG4gIEVuZ2luZSxcbiAgRXhlY3V0aW9uT3B0aW9ucyxcbiAgUnVsZUZhY3RvcnksXG4gIFNjaGVtYXRpYyxcbiAgU2NoZW1hdGljRGVzY3JpcHRpb24sXG4gIFR5cGVkU2NoZW1hdGljQ29udGV4dCxcbn0gZnJvbSAnLi9pbnRlcmZhY2UnO1xuXG5leHBvcnQgY2xhc3MgSW52YWxpZFNjaGVtYXRpY3NOYW1lRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBTY2hlbWF0aWNzIGhhcyBpbnZhbGlkIG5hbWU6IFwiJHtuYW1lfVwiLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTY2hlbWF0aWNJbXBsPENvbGxlY3Rpb25UIGV4dGVuZHMgb2JqZWN0LCBTY2hlbWF0aWNUIGV4dGVuZHMgb2JqZWN0PlxuICBpbXBsZW1lbnRzIFNjaGVtYXRpYzxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4ge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9kZXNjcmlwdGlvbjogU2NoZW1hdGljRGVzY3JpcHRpb248Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+LFxuICAgIHByaXZhdGUgX2ZhY3Rvcnk6IFJ1bGVGYWN0b3J5PHt9PixcbiAgICBwcml2YXRlIF9jb2xsZWN0aW9uOiBDb2xsZWN0aW9uPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPixcbiAgICBwcml2YXRlIF9lbmdpbmU6IEVuZ2luZTxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICkge1xuICAgIGlmICghX2Rlc2NyaXB0aW9uLm5hbWUubWF0Y2goL15bLUAvXy5hLXpBLVowLTldKyQvKSkge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRTY2hlbWF0aWNzTmFtZUV4Y2VwdGlvbihfZGVzY3JpcHRpb24ubmFtZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGRlc2NyaXB0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9kZXNjcmlwdGlvbjtcbiAgfVxuICBnZXQgY29sbGVjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fY29sbGVjdGlvbjtcbiAgfVxuXG4gIGNhbGw8T3B0aW9uVCBleHRlbmRzIG9iamVjdD4oXG4gICAgb3B0aW9uczogT3B0aW9uVCxcbiAgICBob3N0OiBPYnNlcnZhYmxlPFRyZWU+LFxuICAgIHBhcmVudENvbnRleHQ/OiBQYXJ0aWFsPFR5cGVkU2NoZW1hdGljQ29udGV4dDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4+LFxuICAgIGV4ZWN1dGlvbk9wdGlvbnM/OiBQYXJ0aWFsPEV4ZWN1dGlvbk9wdGlvbnM+LFxuICApOiBPYnNlcnZhYmxlPFRyZWU+IHtcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5fZW5naW5lLmNyZWF0ZUNvbnRleHQodGhpcywgcGFyZW50Q29udGV4dCwgZXhlY3V0aW9uT3B0aW9ucyk7XG5cbiAgICByZXR1cm4gaG9zdC5waXBlKFxuICAgICAgZmlyc3QoKSxcbiAgICAgIGNvbmNhdE1hcCgodHJlZSkgPT5cbiAgICAgICAgdGhpcy5fZW5naW5lXG4gICAgICAgICAgLnRyYW5zZm9ybU9wdGlvbnModGhpcywgb3B0aW9ucywgY29udGV4dClcbiAgICAgICAgICAucGlwZShtYXAoKG8pID0+IFt0cmVlLCBvXSBhcyBbVHJlZSwgT3B0aW9uVF0pKSxcbiAgICAgICksXG4gICAgICBjb25jYXRNYXAoKFt0cmVlLCB0cmFuc2Zvcm1lZE9wdGlvbnNdKSA9PiB7XG4gICAgICAgIGxldCBpbnB1dDogVHJlZTtcbiAgICAgICAgbGV0IHNjb3BlZCA9IGZhbHNlO1xuICAgICAgICBpZiAoZXhlY3V0aW9uT3B0aW9ucyAmJiBleGVjdXRpb25PcHRpb25zLnNjb3BlKSB7XG4gICAgICAgICAgc2NvcGVkID0gdHJ1ZTtcbiAgICAgICAgICBpbnB1dCA9IG5ldyBTY29wZWRUcmVlKHRyZWUsIGV4ZWN1dGlvbk9wdGlvbnMuc2NvcGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlucHV0ID0gdHJlZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjYWxsUnVsZSh0aGlzLl9mYWN0b3J5KHRyYW5zZm9ybWVkT3B0aW9ucyksIG9ic2VydmFibGVPZihpbnB1dCksIGNvbnRleHQpLnBpcGUoXG4gICAgICAgICAgbWFwKChvdXRwdXQpID0+IHtcbiAgICAgICAgICAgIGlmIChvdXRwdXQgPT09IGlucHV0KSB7XG4gICAgICAgICAgICAgIHJldHVybiB0cmVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzY29wZWQpIHtcbiAgICAgICAgICAgICAgdHJlZS5tZXJnZShvdXRwdXQpO1xuXG4gICAgICAgICAgICAgIHJldHVybiB0cmVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cbn1cbiJdfQ==