"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyTemplates = exports.template = exports.renameTemplateFiles = exports.pathTemplate = exports.applyPathTemplate = exports.contentTemplate = exports.applyContentTemplate = exports.InvalidPipeException = exports.UnknownPipeException = exports.OptionIsNotDefinedException = exports.TEMPLATE_FILENAME_RE = void 0;
const core_1 = require("@angular-devkit/core");
const util_1 = require("util");
const base_1 = require("./base");
const rename_1 = require("./rename");
exports.TEMPLATE_FILENAME_RE = /\.template$/;
class OptionIsNotDefinedException extends core_1.BaseException {
    constructor(name) {
        super(`Option "${name}" is not defined.`);
    }
}
exports.OptionIsNotDefinedException = OptionIsNotDefinedException;
class UnknownPipeException extends core_1.BaseException {
    constructor(name) {
        super(`Pipe "${name}" is not defined.`);
    }
}
exports.UnknownPipeException = UnknownPipeException;
class InvalidPipeException extends core_1.BaseException {
    constructor(name) {
        super(`Pipe "${name}" is invalid.`);
    }
}
exports.InvalidPipeException = InvalidPipeException;
const decoder = new util_1.TextDecoder('utf-8', { fatal: true });
function applyContentTemplate(options) {
    return (entry) => {
        const { path, content } = entry;
        try {
            const decodedContent = decoder.decode(content);
            return {
                path,
                content: Buffer.from((0, core_1.template)(decodedContent, {})(options)),
            };
        }
        catch (e) {
            if (e.code === 'ERR_ENCODING_INVALID_ENCODED_DATA') {
                return entry;
            }
            throw e;
        }
    };
}
exports.applyContentTemplate = applyContentTemplate;
function contentTemplate(options) {
    return (0, base_1.forEach)(applyContentTemplate(options));
}
exports.contentTemplate = contentTemplate;
function applyPathTemplate(data, options = {
    interpolationStart: '__',
    interpolationEnd: '__',
    pipeSeparator: '@',
}) {
    const is = options.interpolationStart;
    const ie = options.interpolationEnd;
    const isL = is.length;
    const ieL = ie.length;
    return (entry) => {
        let path = entry.path;
        const content = entry.content;
        const original = path;
        let start = path.indexOf(is);
        // + 1 to have at least a length 1 name. `____` is not valid.
        let end = path.indexOf(ie, start + isL + 1);
        while (start != -1 && end != -1) {
            const match = path.substring(start + isL, end);
            let replacement = data[match];
            if (!options.pipeSeparator) {
                if (typeof replacement == 'function') {
                    replacement = replacement.call(data, original);
                }
                if (replacement === undefined) {
                    throw new OptionIsNotDefinedException(match);
                }
            }
            else {
                const [name, ...pipes] = match.split(options.pipeSeparator);
                replacement = data[name];
                if (typeof replacement == 'function') {
                    replacement = replacement.call(data, original);
                }
                if (replacement === undefined) {
                    throw new OptionIsNotDefinedException(name);
                }
                replacement = pipes.reduce((acc, pipe) => {
                    if (!pipe) {
                        return acc;
                    }
                    if (!(pipe in data)) {
                        throw new UnknownPipeException(pipe);
                    }
                    if (typeof data[pipe] != 'function') {
                        throw new InvalidPipeException(pipe);
                    }
                    // Coerce to string.
                    return '' + data[pipe](acc);
                }, '' + replacement);
            }
            path = path.substring(0, start) + replacement + path.substring(end + ieL);
            start = path.indexOf(options.interpolationStart);
            // See above.
            end = path.indexOf(options.interpolationEnd, start + isL + 1);
        }
        return { path: (0, core_1.normalize)(path), content };
    };
}
exports.applyPathTemplate = applyPathTemplate;
function pathTemplate(options) {
    return (0, base_1.forEach)(applyPathTemplate(options));
}
exports.pathTemplate = pathTemplate;
/**
 * Remove every `.template` suffix from file names.
 */
function renameTemplateFiles() {
    return (0, rename_1.rename)((path) => !!path.match(exports.TEMPLATE_FILENAME_RE), (path) => path.replace(exports.TEMPLATE_FILENAME_RE, ''));
}
exports.renameTemplateFiles = renameTemplateFiles;
function template(options) {
    return (0, base_1.chain)([
        contentTemplate(options),
        // Force cast to PathTemplateData. We need the type for the actual pathTemplate() call,
        // but in this case we cannot do anything as contentTemplate are more permissive.
        // Since values are coerced to strings in PathTemplates it will be fine in the end.
        pathTemplate(options),
    ]);
}
exports.template = template;
function applyTemplates(options) {
    return (0, base_1.forEach)((0, base_1.when)((path) => path.endsWith('.template'), (0, base_1.composeFileOperators)([
        applyContentTemplate(options),
        // See above for this weird cast.
        applyPathTemplate(options),
        (entry) => {
            return {
                content: entry.content,
                path: entry.path.replace(exports.TEMPLATE_FILENAME_RE, ''),
            };
        },
    ])));
}
exports.applyTemplates = applyTemplates;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy9ydWxlcy90ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBMEY7QUFDMUYsK0JBQW1DO0FBR25DLGlDQUFvRTtBQUNwRSxxQ0FBa0M7QUFFckIsUUFBQSxvQkFBb0IsR0FBRyxhQUFhLENBQUM7QUFFbEQsTUFBYSwyQkFBNEIsU0FBUSxvQkFBYTtJQUM1RCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLFdBQVcsSUFBSSxtQkFBbUIsQ0FBQyxDQUFDO0lBQzVDLENBQUM7Q0FDRjtBQUpELGtFQUlDO0FBRUQsTUFBYSxvQkFBcUIsU0FBUSxvQkFBYTtJQUNyRCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLFNBQVMsSUFBSSxtQkFBbUIsQ0FBQyxDQUFDO0lBQzFDLENBQUM7Q0FDRjtBQUpELG9EQUlDO0FBRUQsTUFBYSxvQkFBcUIsU0FBUSxvQkFBYTtJQUNyRCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLFNBQVMsSUFBSSxlQUFlLENBQUMsQ0FBQztJQUN0QyxDQUFDO0NBQ0Y7QUFKRCxvREFJQztBQWtCRCxNQUFNLE9BQU8sR0FBRyxJQUFJLGtCQUFXLENBQUMsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFFMUQsU0FBZ0Isb0JBQW9CLENBQUksT0FBVTtJQUNoRCxPQUFPLENBQUMsS0FBZ0IsRUFBRSxFQUFFO1FBQzFCLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRWhDLElBQUk7WUFDRixNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRS9DLE9BQU87Z0JBQ0wsSUFBSTtnQkFDSixP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QUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLDRCQUFvQixDQUFDLEVBQzVDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDRCQUFvQixFQUFFLEVBQUUsQ0FBQyxDQUNqRCxDQUFDO0FBQ0osQ0FBQztBQUxELGtEQUtDO0FBRUQsU0FBZ0IsUUFBUSxDQUFJLE9BQVU7SUFDcEMsT0FBTyxJQUFBLFlBQUssRUFBQztRQUNYLGVBQWUsQ0FBQyxPQUFPLENBQUM7UUFDeEIsdUZBQXVGO1FBQ3ZGLGlGQUFpRjtRQUNqRixtRkFBbUY7UUFDbkYsWUFBWSxDQUFFLE9BQWtDLENBQUM7S0FDbEQsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVJELDRCQVFDO0FBRUQsU0FBZ0IsY0FBYyxDQUFJLE9BQVU7SUFDMUMsT0FBTyxJQUFBLGNBQU8sRUFDWixJQUFBLFdBQUksRUFDRixDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFDcEMsSUFBQSwyQkFBb0IsRUFBQztRQUNuQixvQkFBb0IsQ0FBQyxPQUFPLENBQUM7UUFDN0IsaUNBQWlDO1FBQ2pDLGlCQUFpQixDQUFFLE9BQWtDLENBQUM7UUFDdEQsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUNSLE9BQU87Z0JBQ0wsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO2dCQUN0QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsNEJBQW9CLEVBQUUsRUFBRSxDQUFDO2FBQ3RDLENBQUM7UUFDakIsQ0FBQztLQUNGLENBQUMsQ0FDSCxDQUNGLENBQUM7QUFDSixDQUFDO0FBakJELHdDQWlCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uLCBub3JtYWxpemUsIHRlbXBsYXRlIGFzIHRlbXBsYXRlSW1wbCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IFRleHREZWNvZGVyIH0gZnJvbSAndXRpbCc7XG5pbXBvcnQgeyBGaWxlT3BlcmF0b3IsIFJ1bGUgfSBmcm9tICcuLi9lbmdpbmUvaW50ZXJmYWNlJztcbmltcG9ydCB7IEZpbGVFbnRyeSB9IGZyb20gJy4uL3RyZWUvaW50ZXJmYWNlJztcbmltcG9ydCB7IGNoYWluLCBjb21wb3NlRmlsZU9wZXJhdG9ycywgZm9yRWFjaCwgd2hlbiB9IGZyb20gJy4vYmFzZSc7XG5pbXBvcnQgeyByZW5hbWUgfSBmcm9tICcuL3JlbmFtZSc7XG5cbmV4cG9ydCBjb25zdCBURU1QTEFURV9GSUxFTkFNRV9SRSA9IC9cXC50ZW1wbGF0ZSQvO1xuXG5leHBvcnQgY2xhc3MgT3B0aW9uSXNOb3REZWZpbmVkRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBPcHRpb24gXCIke25hbWV9XCIgaXMgbm90IGRlZmluZWQuYCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFVua25vd25QaXBlRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBQaXBlIFwiJHtuYW1lfVwiIGlzIG5vdCBkZWZpbmVkLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnZhbGlkUGlwZUV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgUGlwZSBcIiR7bmFtZX1cIiBpcyBpbnZhbGlkLmApO1xuICB9XG59XG5cbmV4cG9ydCB0eXBlIFBhdGhUZW1wbGF0ZVZhbHVlID0gYm9vbGVhbiB8IHN0cmluZyB8IG51bWJlciB8IHVuZGVmaW5lZDtcbmV4cG9ydCB0eXBlIFBhdGhUZW1wbGF0ZVBpcGVGdW5jdGlvbiA9ICh4OiBzdHJpbmcpID0+IFBhdGhUZW1wbGF0ZVZhbHVlO1xuZXhwb3J0IHR5cGUgUGF0aFRlbXBsYXRlRGF0YSA9IHtcbiAgW2tleTogc3RyaW5nXTogUGF0aFRlbXBsYXRlVmFsdWUgfCBQYXRoVGVtcGxhdGVEYXRhIHwgUGF0aFRlbXBsYXRlUGlwZUZ1bmN0aW9uO1xufTtcblxuZXhwb3J0IGludGVyZmFjZSBQYXRoVGVtcGxhdGVPcHRpb25zIHtcbiAgLy8gSW50ZXJwb2xhdGlvbiBzdGFydCBhbmQgZW5kIHN0cmluZ3MuXG4gIGludGVycG9sYXRpb25TdGFydDogc3RyaW5nO1xuICAvLyBJbnRlcnBvbGF0aW9uIHN0YXJ0IGFuZCBlbmQgc3RyaW5ncy5cbiAgaW50ZXJwb2xhdGlvbkVuZDogc3RyaW5nO1xuXG4gIC8vIFNlcGFyYXRvciBmb3IgcGlwZXMuIERvIG5vdCBzcGVjaWZ5IHRvIHJlbW92ZSBwaXBlIHN1cHBvcnQuXG4gIHBpcGVTZXBhcmF0b3I/OiBzdHJpbmc7XG59XG5cbmNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoJ3V0Zi04JywgeyBmYXRhbDogdHJ1ZSB9KTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5Q29udGVudFRlbXBsYXRlPFQ+KG9wdGlvbnM6IFQpOiBGaWxlT3BlcmF0b3Ige1xuICByZXR1cm4gKGVudHJ5OiBGaWxlRW50cnkpID0+IHtcbiAgICBjb25zdCB7IHBhdGgsIGNvbnRlbnQgfSA9IGVudHJ5O1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRlY29kZWRDb250ZW50ID0gZGVjb2Rlci5kZWNvZGUoY29udGVudCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBhdGgsXG4gICAgICAgIGNvbnRlbnQ6IEJ1ZmZlci5mcm9tKHRlbXBsYXRlSW1wbChkZWNvZGVkQ29udGVudCwge30pKG9wdGlvbnMpKSxcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUuY29kZSA9PT0gJ0VSUl9FTkNPRElOR19JTlZBTElEX0VOQ09ERURfREFUQScpIHtcbiAgICAgICAgcmV0dXJuIGVudHJ5O1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnRlbnRUZW1wbGF0ZTxUPihvcHRpb25zOiBUKTogUnVsZSB7XG4gIHJldHVybiBmb3JFYWNoKGFwcGx5Q29udGVudFRlbXBsYXRlKG9wdGlvbnMpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UGF0aFRlbXBsYXRlPFQgZXh0ZW5kcyBQYXRoVGVtcGxhdGVEYXRhPihcbiAgZGF0YTogVCxcbiAgb3B0aW9uczogUGF0aFRlbXBsYXRlT3B0aW9ucyA9IHtcbiAgICBpbnRlcnBvbGF0aW9uU3RhcnQ6ICdfXycsXG4gICAgaW50ZXJwb2xhdGlvbkVuZDogJ19fJyxcbiAgICBwaXBlU2VwYXJhdG9yOiAnQCcsXG4gIH0sXG4pOiBGaWxlT3BlcmF0b3Ige1xuICBjb25zdCBpcyA9IG9wdGlvbnMuaW50ZXJwb2xhdGlvblN0YXJ0O1xuICBjb25zdCBpZSA9IG9wdGlvbnMuaW50ZXJwb2xhdGlvbkVuZDtcbiAgY29uc3QgaXNMID0gaXMubGVuZ3RoO1xuICBjb25zdCBpZUwgPSBpZS5sZW5ndGg7XG5cbiAgcmV0dXJuIChlbnRyeTogRmlsZUVudHJ5KSA9PiB7XG4gICAgbGV0IHBhdGggPSBlbnRyeS5wYXRoIGFzIHN0cmluZztcbiAgICBjb25zdCBjb250ZW50ID0gZW50cnkuY29udGVudDtcbiAgICBjb25zdCBvcmlnaW5hbCA9IHBhdGg7XG5cbiAgICBsZXQgc3RhcnQgPSBwYXRoLmluZGV4T2YoaXMpO1xuICAgIC8vICsgMSB0byBoYXZlIGF0IGxlYXN0IGEgbGVuZ3RoIDEgbmFtZS4gYF9fX19gIGlzIG5vdCB2YWxpZC5cbiAgICBsZXQgZW5kID0gcGF0aC5pbmRleE9mKGllLCBzdGFydCArIGlzTCArIDEpO1xuXG4gICAgd2hpbGUgKHN0YXJ0ICE9IC0xICYmIGVuZCAhPSAtMSkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBwYXRoLnN1YnN0cmluZyhzdGFydCArIGlzTCwgZW5kKTtcbiAgICAgIGxldCByZXBsYWNlbWVudCA9IGRhdGFbbWF0Y2hdO1xuXG4gICAgICBpZiAoIW9wdGlvbnMucGlwZVNlcGFyYXRvcikge1xuICAgICAgICBpZiAodHlwZW9mIHJlcGxhY2VtZW50ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICByZXBsYWNlbWVudCA9IHJlcGxhY2VtZW50LmNhbGwoZGF0YSwgb3JpZ2luYWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlcGxhY2VtZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgT3B0aW9uSXNOb3REZWZpbmVkRXhjZXB0aW9uKG1hdGNoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgW25hbWUsIC4uLnBpcGVzXSA9IG1hdGNoLnNwbGl0KG9wdGlvbnMucGlwZVNlcGFyYXRvcik7XG4gICAgICAgIHJlcGxhY2VtZW50ID0gZGF0YVtuYW1lXTtcblxuICAgICAgICBpZiAodHlwZW9mIHJlcGxhY2VtZW50ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICByZXBsYWNlbWVudCA9IHJlcGxhY2VtZW50LmNhbGwoZGF0YSwgb3JpZ2luYWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlcGxhY2VtZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgT3B0aW9uSXNOb3REZWZpbmVkRXhjZXB0aW9uKG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVwbGFjZW1lbnQgPSBwaXBlcy5yZWR1Y2UoKGFjYzogc3RyaW5nLCBwaXBlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICBpZiAoIXBpcGUpIHtcbiAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghKHBpcGUgaW4gZGF0YSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBVbmtub3duUGlwZUV4Y2VwdGlvbihwaXBlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiBkYXRhW3BpcGVdICE9ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBJbnZhbGlkUGlwZUV4Y2VwdGlvbihwaXBlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBDb2VyY2UgdG8gc3RyaW5nLlxuICAgICAgICAgIHJldHVybiAnJyArIChkYXRhW3BpcGVdIGFzIFBhdGhUZW1wbGF0ZVBpcGVGdW5jdGlvbikoYWNjKTtcbiAgICAgICAgfSwgJycgKyByZXBsYWNlbWVudCk7XG4gICAgICB9XG5cbiAgICAgIHBhdGggPSBwYXRoLnN1YnN0cmluZygwLCBzdGFydCkgKyByZXBsYWNlbWVudCArIHBhdGguc3Vic3RyaW5nKGVuZCArIGllTCk7XG5cbiAgICAgIHN0YXJ0ID0gcGF0aC5pbmRleE9mKG9wdGlvbnMuaW50ZXJwb2xhdGlvblN0YXJ0KTtcbiAgICAgIC8vIFNlZSBhYm92ZS5cbiAgICAgIGVuZCA9IHBhdGguaW5kZXhPZihvcHRpb25zLmludGVycG9sYXRpb25FbmQsIHN0YXJ0ICsgaXNMICsgMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcGF0aDogbm9ybWFsaXplKHBhdGgpLCBjb250ZW50IH07XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXRoVGVtcGxhdGU8VCBleHRlbmRzIFBhdGhUZW1wbGF0ZURhdGE+KG9wdGlvbnM6IFQpOiBSdWxlIHtcbiAgcmV0dXJuIGZvckVhY2goYXBwbHlQYXRoVGVtcGxhdGUob3B0aW9ucykpO1xufVxuXG4vKipcbiAqIFJlbW92ZSBldmVyeSBgLnRlbXBsYXRlYCBzdWZmaXggZnJvbSBmaWxlIG5hbWVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuYW1lVGVtcGxhdGVGaWxlcygpOiBSdWxlIHtcbiAgcmV0dXJuIHJlbmFtZShcbiAgICAocGF0aCkgPT4gISFwYXRoLm1hdGNoKFRFTVBMQVRFX0ZJTEVOQU1FX1JFKSxcbiAgICAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKFRFTVBMQVRFX0ZJTEVOQU1FX1JFLCAnJyksXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZTxUPihvcHRpb25zOiBUKTogUnVsZSB7XG4gIHJldHVybiBjaGFpbihbXG4gICAgY29udGVudFRlbXBsYXRlKG9wdGlvbnMpLFxuICAgIC8vIEZvcmNlIGNhc3QgdG8gUGF0aFRlbXBsYXRlRGF0YS4gV2UgbmVlZCB0aGUgdHlwZSBmb3IgdGhlIGFjdHVhbCBwYXRoVGVtcGxhdGUoKSBjYWxsLFxuICAgIC8vIGJ1dCBpbiB0aGlzIGNhc2Ugd2UgY2Fubm90IGRvIGFueXRoaW5nIGFzIGNvbnRlbnRUZW1wbGF0ZSBhcmUgbW9yZSBwZXJtaXNzaXZlLlxuICAgIC8vIFNpbmNlIHZhbHVlcyBhcmUgY29lcmNlZCB0byBzdHJpbmdzIGluIFBhdGhUZW1wbGF0ZXMgaXQgd2lsbCBiZSBmaW5lIGluIHRoZSBlbmQuXG4gICAgcGF0aFRlbXBsYXRlKChvcHRpb25zIGFzIHt9KSBhcyBQYXRoVGVtcGxhdGVEYXRhKSxcbiAgXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVRlbXBsYXRlczxUPihvcHRpb25zOiBUKTogUnVsZSB7XG4gIHJldHVybiBmb3JFYWNoKFxuICAgIHdoZW4oXG4gICAgICAocGF0aCkgPT4gcGF0aC5lbmRzV2l0aCgnLnRlbXBsYXRlJyksXG4gICAgICBjb21wb3NlRmlsZU9wZXJhdG9ycyhbXG4gICAgICAgIGFwcGx5Q29udGVudFRlbXBsYXRlKG9wdGlvbnMpLFxuICAgICAgICAvLyBTZWUgYWJvdmUgZm9yIHRoaXMgd2VpcmQgY2FzdC5cbiAgICAgICAgYXBwbHlQYXRoVGVtcGxhdGUoKG9wdGlvbnMgYXMge30pIGFzIFBhdGhUZW1wbGF0ZURhdGEpLFxuICAgICAgICAoZW50cnkpID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29udGVudDogZW50cnkuY29udGVudCxcbiAgICAgICAgICAgIHBhdGg6IGVudHJ5LnBhdGgucmVwbGFjZShURU1QTEFURV9GSUxFTkFNRV9SRSwgJycpLFxuICAgICAgICAgIH0gYXMgRmlsZUVudHJ5O1xuICAgICAgICB9LFxuICAgICAgXSksXG4gICAgKSxcbiAgKTtcbn1cbiJdfQ==