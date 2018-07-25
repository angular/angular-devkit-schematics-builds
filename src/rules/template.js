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
const base_1 = require("./base");
const is_binary_1 = require("./utils/is-binary");
class OptionIsNotDefinedException extends core_1.BaseException {
    constructor(name) { super(`Option "${name}" is not defined.`); }
}
exports.OptionIsNotDefinedException = OptionIsNotDefinedException;
class UnknownPipeException extends core_1.BaseException {
    constructor(name) { super(`Pipe "${name}" is not defined.`); }
}
exports.UnknownPipeException = UnknownPipeException;
class InvalidPipeException extends core_1.BaseException {
    constructor(name) { super(`Pipe "${name}" is invalid.`); }
}
exports.InvalidPipeException = InvalidPipeException;
function applyContentTemplate(options) {
    return (entry) => {
        const { path, content } = entry;
        if (is_binary_1.isBinary(content)) {
            return entry;
        }
        return {
            path: path,
            content: Buffer.from(core_1.template(content.toString('utf-8'), {})(options)),
        };
    };
}
exports.applyContentTemplate = applyContentTemplate;
function contentTemplate(options) {
    return base_1.forEach(applyContentTemplate(options));
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
        return { path: core_1.normalize(path), content };
    };
}
exports.applyPathTemplate = applyPathTemplate;
function pathTemplate(options) {
    return base_1.forEach(applyPathTemplate(options));
}
exports.pathTemplate = pathTemplate;
function template(options) {
    return base_1.chain([
        contentTemplate(options),
        // Force cast to PathTemplateData. We need the type for the actual pathTemplate() call,
        // but in this case we cannot do anything as contentTemplate are more permissive.
        // Since values are coerced to strings in PathTemplates it will be fine in the end.
        pathTemplate(options),
    ]);
}
exports.template = template;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3J1bGVzL3RlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQTBGO0FBRzFGLGlDQUF3QztBQUN4QyxpREFBNkM7QUFHN0MsaUNBQXlDLFNBQVEsb0JBQWE7SUFDNUQsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLFdBQVcsSUFBSSxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN6RTtBQUZELGtFQUVDO0FBR0QsMEJBQWtDLFNBQVEsb0JBQWE7SUFDckQsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLFNBQVMsSUFBSSxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2RTtBQUZELG9EQUVDO0FBR0QsMEJBQWtDLFNBQVEsb0JBQWE7SUFDckQsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLFNBQVMsSUFBSSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDbkU7QUFGRCxvREFFQztBQXFCRCw4QkFBd0MsT0FBVTtJQUNoRCxNQUFNLENBQUMsQ0FBQyxLQUFnQixFQUFFLEVBQUU7UUFDMUIsTUFBTSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUMsR0FBRyxLQUFLLENBQUM7UUFDOUIsRUFBRSxDQUFDLENBQUMsb0JBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUNmLENBQUM7UUFFRCxNQUFNLENBQUM7WUFDTCxJQUFJLEVBQUUsSUFBSTtZQUNWLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQVksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzNFLENBQUM7SUFDSixDQUFDLENBQUM7QUFDSixD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RkFBbUY7UUFDbkYsWUFBWSxDQUFDLE9BQWlDLENBQUM7S0FDaEQsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVJELDRCQVFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiwgbm9ybWFsaXplLCB0ZW1wbGF0ZSBhcyB0ZW1wbGF0ZUltcGwgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBGaWxlT3BlcmF0b3IsIFJ1bGUgfSBmcm9tICcuLi9lbmdpbmUvaW50ZXJmYWNlJztcbmltcG9ydCB7IEZpbGVFbnRyeSB9IGZyb20gJy4uL3RyZWUvaW50ZXJmYWNlJztcbmltcG9ydCB7IGNoYWluLCBmb3JFYWNoIH0gZnJvbSAnLi9iYXNlJztcbmltcG9ydCB7IGlzQmluYXJ5IH0gZnJvbSAnLi91dGlscy9pcy1iaW5hcnknO1xuXG5cbmV4cG9ydCBjbGFzcyBPcHRpb25Jc05vdERlZmluZWRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBPcHRpb24gXCIke25hbWV9XCIgaXMgbm90IGRlZmluZWQuYCk7IH1cbn1cblxuXG5leHBvcnQgY2xhc3MgVW5rbm93blBpcGVFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBQaXBlIFwiJHtuYW1lfVwiIGlzIG5vdCBkZWZpbmVkLmApOyB9XG59XG5cblxuZXhwb3J0IGNsYXNzIEludmFsaWRQaXBlRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykgeyBzdXBlcihgUGlwZSBcIiR7bmFtZX1cIiBpcyBpbnZhbGlkLmApOyB9XG59XG5cblxuZXhwb3J0IHR5cGUgUGF0aFRlbXBsYXRlVmFsdWUgPSBib29sZWFuIHwgc3RyaW5nIHwgbnVtYmVyIHwgdW5kZWZpbmVkO1xuZXhwb3J0IHR5cGUgUGF0aFRlbXBsYXRlUGlwZUZ1bmN0aW9uID0gKHg6IHN0cmluZykgPT4gUGF0aFRlbXBsYXRlVmFsdWU7XG5leHBvcnQgdHlwZSBQYXRoVGVtcGxhdGVEYXRhID0ge1xuICBba2V5OiBzdHJpbmddOiBQYXRoVGVtcGxhdGVWYWx1ZSB8IFBhdGhUZW1wbGF0ZURhdGEgfCBQYXRoVGVtcGxhdGVQaXBlRnVuY3Rpb24sXG59O1xuXG5cbmV4cG9ydCBpbnRlcmZhY2UgUGF0aFRlbXBsYXRlT3B0aW9ucyB7XG4gIC8vIEludGVycG9sYXRpb24gc3RhcnQgYW5kIGVuZCBzdHJpbmdzLlxuICBpbnRlcnBvbGF0aW9uU3RhcnQ6IHN0cmluZztcbiAgLy8gSW50ZXJwb2xhdGlvbiBzdGFydCBhbmQgZW5kIHN0cmluZ3MuXG4gIGludGVycG9sYXRpb25FbmQ6IHN0cmluZztcblxuICAvLyBTZXBhcmF0b3IgZm9yIHBpcGVzLiBEbyBub3Qgc3BlY2lmeSB0byByZW1vdmUgcGlwZSBzdXBwb3J0LlxuICBwaXBlU2VwYXJhdG9yPzogc3RyaW5nO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseUNvbnRlbnRUZW1wbGF0ZTxUPihvcHRpb25zOiBUKTogRmlsZU9wZXJhdG9yIHtcbiAgcmV0dXJuIChlbnRyeTogRmlsZUVudHJ5KSA9PiB7XG4gICAgY29uc3Qge3BhdGgsIGNvbnRlbnR9ID0gZW50cnk7XG4gICAgaWYgKGlzQmluYXJ5KGNvbnRlbnQpKSB7XG4gICAgICByZXR1cm4gZW50cnk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHBhdGg6IHBhdGgsXG4gICAgICBjb250ZW50OiBCdWZmZXIuZnJvbSh0ZW1wbGF0ZUltcGwoY29udGVudC50b1N0cmluZygndXRmLTgnKSwge30pKG9wdGlvbnMpKSxcbiAgICB9O1xuICB9O1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjb250ZW50VGVtcGxhdGU8VD4ob3B0aW9uczogVCk6IFJ1bGUge1xuICByZXR1cm4gZm9yRWFjaChhcHBseUNvbnRlbnRUZW1wbGF0ZShvcHRpb25zKSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UGF0aFRlbXBsYXRlPFQgZXh0ZW5kcyBQYXRoVGVtcGxhdGVEYXRhPihcbiAgZGF0YTogVCxcbiAgb3B0aW9uczogUGF0aFRlbXBsYXRlT3B0aW9ucyA9IHtcbiAgICBpbnRlcnBvbGF0aW9uU3RhcnQ6ICdfXycsXG4gICAgaW50ZXJwb2xhdGlvbkVuZDogJ19fJyxcbiAgICBwaXBlU2VwYXJhdG9yOiAnQCcsXG4gIH0sXG4pOiBGaWxlT3BlcmF0b3Ige1xuICBjb25zdCBpcyA9IG9wdGlvbnMuaW50ZXJwb2xhdGlvblN0YXJ0O1xuICBjb25zdCBpZSA9IG9wdGlvbnMuaW50ZXJwb2xhdGlvbkVuZDtcbiAgY29uc3QgaXNMID0gaXMubGVuZ3RoO1xuICBjb25zdCBpZUwgPSBpZS5sZW5ndGg7XG5cbiAgcmV0dXJuIChlbnRyeTogRmlsZUVudHJ5KSA9PiB7XG4gICAgbGV0IHBhdGggPSBlbnRyeS5wYXRoIGFzIHN0cmluZztcbiAgICBjb25zdCBjb250ZW50ID0gZW50cnkuY29udGVudDtcbiAgICBjb25zdCBvcmlnaW5hbCA9IHBhdGg7XG5cbiAgICBsZXQgc3RhcnQgPSBwYXRoLmluZGV4T2YoaXMpO1xuICAgIC8vICsgMSB0byBoYXZlIGF0IGxlYXN0IGEgbGVuZ3RoIDEgbmFtZS4gYF9fX19gIGlzIG5vdCB2YWxpZC5cbiAgICBsZXQgZW5kID0gcGF0aC5pbmRleE9mKGllLCBzdGFydCArIGlzTCArIDEpO1xuXG4gICAgd2hpbGUgKHN0YXJ0ICE9IC0xICYmIGVuZCAhPSAtMSkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBwYXRoLnN1YnN0cmluZyhzdGFydCArIGlzTCwgZW5kKTtcbiAgICAgIGxldCByZXBsYWNlbWVudCA9IGRhdGFbbWF0Y2hdO1xuXG4gICAgICBpZiAoIW9wdGlvbnMucGlwZVNlcGFyYXRvcikge1xuICAgICAgICBpZiAodHlwZW9mIHJlcGxhY2VtZW50ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICByZXBsYWNlbWVudCA9IHJlcGxhY2VtZW50LmNhbGwoZGF0YSwgb3JpZ2luYWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlcGxhY2VtZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgT3B0aW9uSXNOb3REZWZpbmVkRXhjZXB0aW9uKG1hdGNoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgW25hbWUsIC4uLnBpcGVzXSA9IG1hdGNoLnNwbGl0KG9wdGlvbnMucGlwZVNlcGFyYXRvcik7XG4gICAgICAgIHJlcGxhY2VtZW50ID0gZGF0YVtuYW1lXTtcblxuICAgICAgICBpZiAodHlwZW9mIHJlcGxhY2VtZW50ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICByZXBsYWNlbWVudCA9IHJlcGxhY2VtZW50LmNhbGwoZGF0YSwgb3JpZ2luYWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlcGxhY2VtZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgT3B0aW9uSXNOb3REZWZpbmVkRXhjZXB0aW9uKG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVwbGFjZW1lbnQgPSBwaXBlcy5yZWR1Y2UoKGFjYzogc3RyaW5nLCBwaXBlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICBpZiAoIXBpcGUpIHtcbiAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghKHBpcGUgaW4gZGF0YSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBVbmtub3duUGlwZUV4Y2VwdGlvbihwaXBlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiBkYXRhW3BpcGVdICE9ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBJbnZhbGlkUGlwZUV4Y2VwdGlvbihwaXBlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBDb2VyY2UgdG8gc3RyaW5nLlxuICAgICAgICAgIHJldHVybiAnJyArIChkYXRhW3BpcGVdIGFzIFBhdGhUZW1wbGF0ZVBpcGVGdW5jdGlvbikoYWNjKTtcbiAgICAgICAgfSwgJycgKyByZXBsYWNlbWVudCk7XG4gICAgICB9XG5cbiAgICAgIHBhdGggPSBwYXRoLnN1YnN0cmluZygwLCBzdGFydCkgKyByZXBsYWNlbWVudCArIHBhdGguc3Vic3RyaW5nKGVuZCArIGllTCk7XG5cbiAgICAgIHN0YXJ0ID0gcGF0aC5pbmRleE9mKG9wdGlvbnMuaW50ZXJwb2xhdGlvblN0YXJ0KTtcbiAgICAgIC8vIFNlZSBhYm92ZS5cbiAgICAgIGVuZCA9IHBhdGguaW5kZXhPZihvcHRpb25zLmludGVycG9sYXRpb25FbmQsIHN0YXJ0ICsgaXNMICsgMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcGF0aDogbm9ybWFsaXplKHBhdGgpLCBjb250ZW50IH07XG4gIH07XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHBhdGhUZW1wbGF0ZTxUIGV4dGVuZHMgUGF0aFRlbXBsYXRlRGF0YT4ob3B0aW9uczogVCk6IFJ1bGUge1xuICByZXR1cm4gZm9yRWFjaChhcHBseVBhdGhUZW1wbGF0ZShvcHRpb25zKSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHRlbXBsYXRlPFQ+KG9wdGlvbnM6IFQpOiBSdWxlIHtcbiAgcmV0dXJuIGNoYWluKFtcbiAgICBjb250ZW50VGVtcGxhdGUob3B0aW9ucyksXG4gICAgLy8gRm9yY2UgY2FzdCB0byBQYXRoVGVtcGxhdGVEYXRhLiBXZSBuZWVkIHRoZSB0eXBlIGZvciB0aGUgYWN0dWFsIHBhdGhUZW1wbGF0ZSgpIGNhbGwsXG4gICAgLy8gYnV0IGluIHRoaXMgY2FzZSB3ZSBjYW5ub3QgZG8gYW55dGhpbmcgYXMgY29udGVudFRlbXBsYXRlIGFyZSBtb3JlIHBlcm1pc3NpdmUuXG4gICAgLy8gU2luY2UgdmFsdWVzIGFyZSBjb2VyY2VkIHRvIHN0cmluZ3MgaW4gUGF0aFRlbXBsYXRlcyBpdCB3aWxsIGJlIGZpbmUgaW4gdGhlIGVuZC5cbiAgICBwYXRoVGVtcGxhdGUob3B0aW9ucyBhcyB7fSBhcyBQYXRoVGVtcGxhdGVEYXRhKSxcbiAgXSk7XG59XG4iXX0=