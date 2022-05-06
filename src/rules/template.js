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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy9ydWxlcy90ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBMEY7QUFDMUYsK0JBQW1DO0FBR25DLGlDQUFvRTtBQUNwRSxxQ0FBa0M7QUFFckIsUUFBQSxvQkFBb0IsR0FBRyxhQUFhLENBQUM7QUFFbEQsTUFBYSwyQkFBNEIsU0FBUSxvQkFBYTtJQUM1RCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLFdBQVcsSUFBSSxtQkFBbUIsQ0FBQyxDQUFDO0lBQzVDLENBQUM7Q0FDRjtBQUpELGtFQUlDO0FBRUQsTUFBYSxvQkFBcUIsU0FBUSxvQkFBYTtJQUNyRCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLFNBQVMsSUFBSSxtQkFBbUIsQ0FBQyxDQUFDO0lBQzFDLENBQUM7Q0FDRjtBQUpELG9EQUlDO0FBRUQsTUFBYSxvQkFBcUIsU0FBUSxvQkFBYTtJQUNyRCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLFNBQVMsSUFBSSxlQUFlLENBQUMsQ0FBQztJQUN0QyxDQUFDO0NBQ0Y7QUFKRCxvREFJQztBQWtCRCxNQUFNLE9BQU8sR0FBRyxJQUFJLGtCQUFXLENBQUMsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFFMUQsU0FBZ0Isb0JBQW9CLENBQUksT0FBVTtJQUNoRCxPQUFPLENBQUMsS0FBZ0IsRUFBRSxFQUFFO1FBQzFCLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRWhDLElBQUk7WUFDRixNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRS9DLE9BQU87Z0JBQ0wsSUFBSTtnQkFDSixP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QUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLDRCQUFvQixDQUFDLEVBQzVDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDRCQUFvQixFQUFFLEVBQUUsQ0FBQyxDQUNqRCxDQUFDO0FBQ0osQ0FBQztBQUxELGtEQUtDO0FBRUQsU0FBZ0IsUUFBUSxDQUFtQixPQUFVO0lBQ25ELE9BQU8sSUFBQSxZQUFLLEVBQUM7UUFDWCxlQUFlLENBQUMsT0FBTyxDQUFDO1FBQ3hCLHVGQUF1RjtRQUN2RixpRkFBaUY7UUFDakYsbUZBQW1GO1FBQ25GLFlBQVksQ0FBQyxPQUFpQyxDQUFDO0tBQ2hELENBQUMsQ0FBQztBQUNMLENBQUM7QUFSRCw0QkFRQztBQUVELFNBQWdCLGNBQWMsQ0FBbUIsT0FBVTtJQUN6RCxPQUFPLElBQUEsY0FBTyxFQUNaLElBQUEsV0FBSSxFQUNGLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUNwQyxJQUFBLDJCQUFvQixFQUFDO1FBQ25CLG9CQUFvQixDQUFDLE9BQU8sQ0FBQztRQUM3QixpQ0FBaUM7UUFDakMsaUJBQWlCLENBQUMsT0FBaUMsQ0FBQztRQUNwRCxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ1IsT0FBTztnQkFDTCxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87Z0JBQ3RCLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyw0QkFBb0IsRUFBRSxFQUFFLENBQUM7YUFDdEMsQ0FBQztRQUNqQixDQUFDO0tBQ0YsQ0FBQyxDQUNILENBQ0YsQ0FBQztBQUNKLENBQUM7QUFqQkQsd0NBaUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24sIG5vcm1hbGl6ZSwgdGVtcGxhdGUgYXMgdGVtcGxhdGVJbXBsIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgVGV4dERlY29kZXIgfSBmcm9tICd1dGlsJztcbmltcG9ydCB7IEZpbGVPcGVyYXRvciwgUnVsZSB9IGZyb20gJy4uL2VuZ2luZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgRmlsZUVudHJ5IH0gZnJvbSAnLi4vdHJlZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgY2hhaW4sIGNvbXBvc2VGaWxlT3BlcmF0b3JzLCBmb3JFYWNoLCB3aGVuIH0gZnJvbSAnLi9iYXNlJztcbmltcG9ydCB7IHJlbmFtZSB9IGZyb20gJy4vcmVuYW1lJztcblxuZXhwb3J0IGNvbnN0IFRFTVBMQVRFX0ZJTEVOQU1FX1JFID0gL1xcLnRlbXBsYXRlJC87XG5cbmV4cG9ydCBjbGFzcyBPcHRpb25Jc05vdERlZmluZWRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYE9wdGlvbiBcIiR7bmFtZX1cIiBpcyBub3QgZGVmaW5lZC5gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVW5rbm93blBpcGVFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFBpcGUgXCIke25hbWV9XCIgaXMgbm90IGRlZmluZWQuYCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEludmFsaWRQaXBlRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBQaXBlIFwiJHtuYW1lfVwiIGlzIGludmFsaWQuYCk7XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgUGF0aFRlbXBsYXRlVmFsdWUgPSBib29sZWFuIHwgc3RyaW5nIHwgbnVtYmVyIHwgdW5kZWZpbmVkO1xuZXhwb3J0IHR5cGUgUGF0aFRlbXBsYXRlUGlwZUZ1bmN0aW9uID0gKHg6IHN0cmluZykgPT4gUGF0aFRlbXBsYXRlVmFsdWU7XG5leHBvcnQgdHlwZSBQYXRoVGVtcGxhdGVEYXRhID0ge1xuICBba2V5OiBzdHJpbmddOiBQYXRoVGVtcGxhdGVWYWx1ZSB8IFBhdGhUZW1wbGF0ZURhdGEgfCBQYXRoVGVtcGxhdGVQaXBlRnVuY3Rpb247XG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIFBhdGhUZW1wbGF0ZU9wdGlvbnMge1xuICAvLyBJbnRlcnBvbGF0aW9uIHN0YXJ0IGFuZCBlbmQgc3RyaW5ncy5cbiAgaW50ZXJwb2xhdGlvblN0YXJ0OiBzdHJpbmc7XG4gIC8vIEludGVycG9sYXRpb24gc3RhcnQgYW5kIGVuZCBzdHJpbmdzLlxuICBpbnRlcnBvbGF0aW9uRW5kOiBzdHJpbmc7XG5cbiAgLy8gU2VwYXJhdG9yIGZvciBwaXBlcy4gRG8gbm90IHNwZWNpZnkgdG8gcmVtb3ZlIHBpcGUgc3VwcG9ydC5cbiAgcGlwZVNlcGFyYXRvcj86IHN0cmluZztcbn1cblxuY29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigndXRmLTgnLCB7IGZhdGFsOiB0cnVlIH0pO1xuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlDb250ZW50VGVtcGxhdGU8VD4ob3B0aW9uczogVCk6IEZpbGVPcGVyYXRvciB7XG4gIHJldHVybiAoZW50cnk6IEZpbGVFbnRyeSkgPT4ge1xuICAgIGNvbnN0IHsgcGF0aCwgY29udGVudCB9ID0gZW50cnk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgZGVjb2RlZENvbnRlbnQgPSBkZWNvZGVyLmRlY29kZShjb250ZW50KTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGF0aCxcbiAgICAgICAgY29udGVudDogQnVmZmVyLmZyb20odGVtcGxhdGVJbXBsKGRlY29kZWRDb250ZW50LCB7fSkob3B0aW9ucykpLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZS5jb2RlID09PSAnRVJSX0VOQ09ESU5HX0lOVkFMSURfRU5DT0RFRF9EQVRBJykge1xuICAgICAgICByZXR1cm4gZW50cnk7XG4gICAgICB9XG5cbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29udGVudFRlbXBsYXRlPFQ+KG9wdGlvbnM6IFQpOiBSdWxlIHtcbiAgcmV0dXJuIGZvckVhY2goYXBwbHlDb250ZW50VGVtcGxhdGUob3B0aW9ucykpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlQYXRoVGVtcGxhdGU8VCBleHRlbmRzIFBhdGhUZW1wbGF0ZURhdGE+KFxuICBkYXRhOiBULFxuICBvcHRpb25zOiBQYXRoVGVtcGxhdGVPcHRpb25zID0ge1xuICAgIGludGVycG9sYXRpb25TdGFydDogJ19fJyxcbiAgICBpbnRlcnBvbGF0aW9uRW5kOiAnX18nLFxuICAgIHBpcGVTZXBhcmF0b3I6ICdAJyxcbiAgfSxcbik6IEZpbGVPcGVyYXRvciB7XG4gIGNvbnN0IGlzID0gb3B0aW9ucy5pbnRlcnBvbGF0aW9uU3RhcnQ7XG4gIGNvbnN0IGllID0gb3B0aW9ucy5pbnRlcnBvbGF0aW9uRW5kO1xuICBjb25zdCBpc0wgPSBpcy5sZW5ndGg7XG4gIGNvbnN0IGllTCA9IGllLmxlbmd0aDtcblxuICByZXR1cm4gKGVudHJ5OiBGaWxlRW50cnkpID0+IHtcbiAgICBsZXQgcGF0aCA9IGVudHJ5LnBhdGggYXMgc3RyaW5nO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBlbnRyeS5jb250ZW50O1xuICAgIGNvbnN0IG9yaWdpbmFsID0gcGF0aDtcblxuICAgIGxldCBzdGFydCA9IHBhdGguaW5kZXhPZihpcyk7XG4gICAgLy8gKyAxIHRvIGhhdmUgYXQgbGVhc3QgYSBsZW5ndGggMSBuYW1lLiBgX19fX2AgaXMgbm90IHZhbGlkLlxuICAgIGxldCBlbmQgPSBwYXRoLmluZGV4T2YoaWUsIHN0YXJ0ICsgaXNMICsgMSk7XG5cbiAgICB3aGlsZSAoc3RhcnQgIT0gLTEgJiYgZW5kICE9IC0xKSB7XG4gICAgICBjb25zdCBtYXRjaCA9IHBhdGguc3Vic3RyaW5nKHN0YXJ0ICsgaXNMLCBlbmQpO1xuICAgICAgbGV0IHJlcGxhY2VtZW50ID0gZGF0YVttYXRjaF07XG5cbiAgICAgIGlmICghb3B0aW9ucy5waXBlU2VwYXJhdG9yKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVwbGFjZW1lbnQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHJlcGxhY2VtZW50ID0gcmVwbGFjZW1lbnQuY2FsbChkYXRhLCBvcmlnaW5hbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVwbGFjZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRocm93IG5ldyBPcHRpb25Jc05vdERlZmluZWRFeGNlcHRpb24obWF0Y2gpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBbbmFtZSwgLi4ucGlwZXNdID0gbWF0Y2guc3BsaXQob3B0aW9ucy5waXBlU2VwYXJhdG9yKTtcbiAgICAgICAgcmVwbGFjZW1lbnQgPSBkYXRhW25hbWVdO1xuXG4gICAgICAgIGlmICh0eXBlb2YgcmVwbGFjZW1lbnQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHJlcGxhY2VtZW50ID0gcmVwbGFjZW1lbnQuY2FsbChkYXRhLCBvcmlnaW5hbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVwbGFjZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRocm93IG5ldyBPcHRpb25Jc05vdERlZmluZWRFeGNlcHRpb24obmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXBsYWNlbWVudCA9IHBpcGVzLnJlZHVjZSgoYWNjOiBzdHJpbmcsIHBpcGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgIGlmICghcGlwZSkge1xuICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCEocGlwZSBpbiBkYXRhKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFVua25vd25QaXBlRXhjZXB0aW9uKHBpcGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHlwZW9mIGRhdGFbcGlwZV0gIT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRQaXBlRXhjZXB0aW9uKHBpcGUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIENvZXJjZSB0byBzdHJpbmcuXG4gICAgICAgICAgcmV0dXJuICcnICsgKGRhdGFbcGlwZV0gYXMgUGF0aFRlbXBsYXRlUGlwZUZ1bmN0aW9uKShhY2MpO1xuICAgICAgICB9LCAnJyArIHJlcGxhY2VtZW50KTtcbiAgICAgIH1cblxuICAgICAgcGF0aCA9IHBhdGguc3Vic3RyaW5nKDAsIHN0YXJ0KSArIHJlcGxhY2VtZW50ICsgcGF0aC5zdWJzdHJpbmcoZW5kICsgaWVMKTtcblxuICAgICAgc3RhcnQgPSBwYXRoLmluZGV4T2Yob3B0aW9ucy5pbnRlcnBvbGF0aW9uU3RhcnQpO1xuICAgICAgLy8gU2VlIGFib3ZlLlxuICAgICAgZW5kID0gcGF0aC5pbmRleE9mKG9wdGlvbnMuaW50ZXJwb2xhdGlvbkVuZCwgc3RhcnQgKyBpc0wgKyAxKTtcbiAgICB9XG5cbiAgICByZXR1cm4geyBwYXRoOiBub3JtYWxpemUocGF0aCksIGNvbnRlbnQgfTtcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhdGhUZW1wbGF0ZTxUIGV4dGVuZHMgUGF0aFRlbXBsYXRlRGF0YT4ob3B0aW9uczogVCk6IFJ1bGUge1xuICByZXR1cm4gZm9yRWFjaChhcHBseVBhdGhUZW1wbGF0ZShvcHRpb25zKSk7XG59XG5cbi8qKlxuICogUmVtb3ZlIGV2ZXJ5IGAudGVtcGxhdGVgIHN1ZmZpeCBmcm9tIGZpbGUgbmFtZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5hbWVUZW1wbGF0ZUZpbGVzKCk6IFJ1bGUge1xuICByZXR1cm4gcmVuYW1lKFxuICAgIChwYXRoKSA9PiAhIXBhdGgubWF0Y2goVEVNUExBVEVfRklMRU5BTUVfUkUpLFxuICAgIChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoVEVNUExBVEVfRklMRU5BTUVfUkUsICcnKSxcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRlbXBsYXRlPFQgZXh0ZW5kcyBvYmplY3Q+KG9wdGlvbnM6IFQpOiBSdWxlIHtcbiAgcmV0dXJuIGNoYWluKFtcbiAgICBjb250ZW50VGVtcGxhdGUob3B0aW9ucyksXG4gICAgLy8gRm9yY2UgY2FzdCB0byBQYXRoVGVtcGxhdGVEYXRhLiBXZSBuZWVkIHRoZSB0eXBlIGZvciB0aGUgYWN0dWFsIHBhdGhUZW1wbGF0ZSgpIGNhbGwsXG4gICAgLy8gYnV0IGluIHRoaXMgY2FzZSB3ZSBjYW5ub3QgZG8gYW55dGhpbmcgYXMgY29udGVudFRlbXBsYXRlIGFyZSBtb3JlIHBlcm1pc3NpdmUuXG4gICAgLy8gU2luY2UgdmFsdWVzIGFyZSBjb2VyY2VkIHRvIHN0cmluZ3MgaW4gUGF0aFRlbXBsYXRlcyBpdCB3aWxsIGJlIGZpbmUgaW4gdGhlIGVuZC5cbiAgICBwYXRoVGVtcGxhdGUob3B0aW9ucyBhcyB7fSBhcyBQYXRoVGVtcGxhdGVEYXRhKSxcbiAgXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVRlbXBsYXRlczxUIGV4dGVuZHMgb2JqZWN0PihvcHRpb25zOiBUKTogUnVsZSB7XG4gIHJldHVybiBmb3JFYWNoKFxuICAgIHdoZW4oXG4gICAgICAocGF0aCkgPT4gcGF0aC5lbmRzV2l0aCgnLnRlbXBsYXRlJyksXG4gICAgICBjb21wb3NlRmlsZU9wZXJhdG9ycyhbXG4gICAgICAgIGFwcGx5Q29udGVudFRlbXBsYXRlKG9wdGlvbnMpLFxuICAgICAgICAvLyBTZWUgYWJvdmUgZm9yIHRoaXMgd2VpcmQgY2FzdC5cbiAgICAgICAgYXBwbHlQYXRoVGVtcGxhdGUob3B0aW9ucyBhcyB7fSBhcyBQYXRoVGVtcGxhdGVEYXRhKSxcbiAgICAgICAgKGVudHJ5KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbnRlbnQ6IGVudHJ5LmNvbnRlbnQsXG4gICAgICAgICAgICBwYXRoOiBlbnRyeS5wYXRoLnJlcGxhY2UoVEVNUExBVEVfRklMRU5BTUVfUkUsICcnKSxcbiAgICAgICAgICB9IGFzIEZpbGVFbnRyeTtcbiAgICAgICAgfSxcbiAgICAgIF0pLFxuICAgICksXG4gICk7XG59XG4iXX0=