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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3J1bGVzL3RlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQTBGO0FBRzFGLGlDQUF3QztBQUN4QyxpREFBNkM7QUFHN0MsaUNBQXlDLFNBQVEsb0JBQWE7SUFDNUQsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLFdBQVcsSUFBSSxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN6RTtBQUZELGtFQUVDO0FBR0QsMEJBQWtDLFNBQVEsb0JBQWE7SUFDckQsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLFNBQVMsSUFBSSxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2RTtBQUZELG9EQUVDO0FBR0QsMEJBQWtDLFNBQVEsb0JBQWE7SUFDckQsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLFNBQVMsSUFBSSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDbkU7QUFGRCxvREFFQztBQXFCRCw4QkFBd0MsT0FBVTtJQUNoRCxPQUFPLENBQUMsS0FBZ0IsRUFBRSxFQUFFO1FBQzFCLE1BQU0sRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDLEdBQUcsS0FBSyxDQUFDO1FBQzlCLElBQUksb0JBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUNyQixPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsT0FBTztZQUNMLElBQUksRUFBRSxJQUFJO1lBQ1YsT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBWSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDM0UsQ0FBQztJQUNKLENBQUMsQ0FBQztBQUNKLENBQUM7QUFaRCxvREFZQztBQUdELHlCQUFtQyxPQUFVO0lBQzNDLE9B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Q0FBQyxDQUFDO2FBQ3RCO1lBRUQsSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUUxRSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUNqRCxhQUFhO1lBQ2IsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLEtBQUssR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDL0Q7UUFFRCxPQUFPLEVBQUUsSUFBSSxFQUFFLGdCQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUM7SUFDNUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQXZFRCw4Q0F1RUM7QUFHRCxzQkFBeUQsT0FBVTtJQUNqRSxPQUFPLGNBQU8sQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzdDLENBQUM7QUFGRCxvQ0FFQztBQUdELGtCQUE0QixPQUFVO0lBQ3BDLE9BQU8sWUFBSyxDQUFDO1FBQ1gsZUFBZSxDQUFDLE9BQU8sQ0FBQztRQUN4Qix1RkFBdUY7UUFDdkYsaUZBQWlGO1FBQ2pGLG1GQUFtRjtRQUNuRixZQUFZLENBQUMsT0FBaUMsQ0FBQztLQUNoRCxDQUFDLENBQUM7QUFDTCxDQUFDO0FBUkQsNEJBUUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uLCBub3JtYWxpemUsIHRlbXBsYXRlIGFzIHRlbXBsYXRlSW1wbCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IEZpbGVPcGVyYXRvciwgUnVsZSB9IGZyb20gJy4uL2VuZ2luZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgRmlsZUVudHJ5IH0gZnJvbSAnLi4vdHJlZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgY2hhaW4sIGZvckVhY2ggfSBmcm9tICcuL2Jhc2UnO1xuaW1wb3J0IHsgaXNCaW5hcnkgfSBmcm9tICcuL3V0aWxzL2lzLWJpbmFyeSc7XG5cblxuZXhwb3J0IGNsYXNzIE9wdGlvbklzTm90RGVmaW5lZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYE9wdGlvbiBcIiR7bmFtZX1cIiBpcyBub3QgZGVmaW5lZC5gKTsgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBVbmtub3duUGlwZUV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYFBpcGUgXCIke25hbWV9XCIgaXMgbm90IGRlZmluZWQuYCk7IH1cbn1cblxuXG5leHBvcnQgY2xhc3MgSW52YWxpZFBpcGVFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7IHN1cGVyKGBQaXBlIFwiJHtuYW1lfVwiIGlzIGludmFsaWQuYCk7IH1cbn1cblxuXG5leHBvcnQgdHlwZSBQYXRoVGVtcGxhdGVWYWx1ZSA9IGJvb2xlYW4gfCBzdHJpbmcgfCBudW1iZXIgfCB1bmRlZmluZWQ7XG5leHBvcnQgdHlwZSBQYXRoVGVtcGxhdGVQaXBlRnVuY3Rpb24gPSAoeDogc3RyaW5nKSA9PiBQYXRoVGVtcGxhdGVWYWx1ZTtcbmV4cG9ydCB0eXBlIFBhdGhUZW1wbGF0ZURhdGEgPSB7XG4gIFtrZXk6IHN0cmluZ106IFBhdGhUZW1wbGF0ZVZhbHVlIHwgUGF0aFRlbXBsYXRlRGF0YSB8IFBhdGhUZW1wbGF0ZVBpcGVGdW5jdGlvbixcbn07XG5cblxuZXhwb3J0IGludGVyZmFjZSBQYXRoVGVtcGxhdGVPcHRpb25zIHtcbiAgLy8gSW50ZXJwb2xhdGlvbiBzdGFydCBhbmQgZW5kIHN0cmluZ3MuXG4gIGludGVycG9sYXRpb25TdGFydDogc3RyaW5nO1xuICAvLyBJbnRlcnBvbGF0aW9uIHN0YXJ0IGFuZCBlbmQgc3RyaW5ncy5cbiAgaW50ZXJwb2xhdGlvbkVuZDogc3RyaW5nO1xuXG4gIC8vIFNlcGFyYXRvciBmb3IgcGlwZXMuIERvIG5vdCBzcGVjaWZ5IHRvIHJlbW92ZSBwaXBlIHN1cHBvcnQuXG4gIHBpcGVTZXBhcmF0b3I/OiBzdHJpbmc7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5Q29udGVudFRlbXBsYXRlPFQ+KG9wdGlvbnM6IFQpOiBGaWxlT3BlcmF0b3Ige1xuICByZXR1cm4gKGVudHJ5OiBGaWxlRW50cnkpID0+IHtcbiAgICBjb25zdCB7cGF0aCwgY29udGVudH0gPSBlbnRyeTtcbiAgICBpZiAoaXNCaW5hcnkoY29udGVudCkpIHtcbiAgICAgIHJldHVybiBlbnRyeTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgcGF0aDogcGF0aCxcbiAgICAgIGNvbnRlbnQ6IEJ1ZmZlci5mcm9tKHRlbXBsYXRlSW1wbChjb250ZW50LnRvU3RyaW5nKCd1dGYtOCcpLCB7fSkob3B0aW9ucykpLFxuICAgIH07XG4gIH07XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnRlbnRUZW1wbGF0ZTxUPihvcHRpb25zOiBUKTogUnVsZSB7XG4gIHJldHVybiBmb3JFYWNoKGFwcGx5Q29udGVudFRlbXBsYXRlKG9wdGlvbnMpKTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlQYXRoVGVtcGxhdGU8VCBleHRlbmRzIFBhdGhUZW1wbGF0ZURhdGE+KFxuICBkYXRhOiBULFxuICBvcHRpb25zOiBQYXRoVGVtcGxhdGVPcHRpb25zID0ge1xuICAgIGludGVycG9sYXRpb25TdGFydDogJ19fJyxcbiAgICBpbnRlcnBvbGF0aW9uRW5kOiAnX18nLFxuICAgIHBpcGVTZXBhcmF0b3I6ICdAJyxcbiAgfSxcbik6IEZpbGVPcGVyYXRvciB7XG4gIGNvbnN0IGlzID0gb3B0aW9ucy5pbnRlcnBvbGF0aW9uU3RhcnQ7XG4gIGNvbnN0IGllID0gb3B0aW9ucy5pbnRlcnBvbGF0aW9uRW5kO1xuICBjb25zdCBpc0wgPSBpcy5sZW5ndGg7XG4gIGNvbnN0IGllTCA9IGllLmxlbmd0aDtcblxuICByZXR1cm4gKGVudHJ5OiBGaWxlRW50cnkpID0+IHtcbiAgICBsZXQgcGF0aCA9IGVudHJ5LnBhdGggYXMgc3RyaW5nO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBlbnRyeS5jb250ZW50O1xuICAgIGNvbnN0IG9yaWdpbmFsID0gcGF0aDtcblxuICAgIGxldCBzdGFydCA9IHBhdGguaW5kZXhPZihpcyk7XG4gICAgLy8gKyAxIHRvIGhhdmUgYXQgbGVhc3QgYSBsZW5ndGggMSBuYW1lLiBgX19fX2AgaXMgbm90IHZhbGlkLlxuICAgIGxldCBlbmQgPSBwYXRoLmluZGV4T2YoaWUsIHN0YXJ0ICsgaXNMICsgMSk7XG5cbiAgICB3aGlsZSAoc3RhcnQgIT0gLTEgJiYgZW5kICE9IC0xKSB7XG4gICAgICBjb25zdCBtYXRjaCA9IHBhdGguc3Vic3RyaW5nKHN0YXJ0ICsgaXNMLCBlbmQpO1xuICAgICAgbGV0IHJlcGxhY2VtZW50ID0gZGF0YVttYXRjaF07XG5cbiAgICAgIGlmICghb3B0aW9ucy5waXBlU2VwYXJhdG9yKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVwbGFjZW1lbnQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHJlcGxhY2VtZW50ID0gcmVwbGFjZW1lbnQuY2FsbChkYXRhLCBvcmlnaW5hbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVwbGFjZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRocm93IG5ldyBPcHRpb25Jc05vdERlZmluZWRFeGNlcHRpb24obWF0Y2gpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBbbmFtZSwgLi4ucGlwZXNdID0gbWF0Y2guc3BsaXQob3B0aW9ucy5waXBlU2VwYXJhdG9yKTtcbiAgICAgICAgcmVwbGFjZW1lbnQgPSBkYXRhW25hbWVdO1xuXG4gICAgICAgIGlmICh0eXBlb2YgcmVwbGFjZW1lbnQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHJlcGxhY2VtZW50ID0gcmVwbGFjZW1lbnQuY2FsbChkYXRhLCBvcmlnaW5hbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVwbGFjZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRocm93IG5ldyBPcHRpb25Jc05vdERlZmluZWRFeGNlcHRpb24obmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXBsYWNlbWVudCA9IHBpcGVzLnJlZHVjZSgoYWNjOiBzdHJpbmcsIHBpcGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgIGlmICghcGlwZSkge1xuICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCEocGlwZSBpbiBkYXRhKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFVua25vd25QaXBlRXhjZXB0aW9uKHBpcGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHlwZW9mIGRhdGFbcGlwZV0gIT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRQaXBlRXhjZXB0aW9uKHBpcGUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIENvZXJjZSB0byBzdHJpbmcuXG4gICAgICAgICAgcmV0dXJuICcnICsgKGRhdGFbcGlwZV0gYXMgUGF0aFRlbXBsYXRlUGlwZUZ1bmN0aW9uKShhY2MpO1xuICAgICAgICB9LCAnJyArIHJlcGxhY2VtZW50KTtcbiAgICAgIH1cblxuICAgICAgcGF0aCA9IHBhdGguc3Vic3RyaW5nKDAsIHN0YXJ0KSArIHJlcGxhY2VtZW50ICsgcGF0aC5zdWJzdHJpbmcoZW5kICsgaWVMKTtcblxuICAgICAgc3RhcnQgPSBwYXRoLmluZGV4T2Yob3B0aW9ucy5pbnRlcnBvbGF0aW9uU3RhcnQpO1xuICAgICAgLy8gU2VlIGFib3ZlLlxuICAgICAgZW5kID0gcGF0aC5pbmRleE9mKG9wdGlvbnMuaW50ZXJwb2xhdGlvbkVuZCwgc3RhcnQgKyBpc0wgKyAxKTtcbiAgICB9XG5cbiAgICByZXR1cm4geyBwYXRoOiBub3JtYWxpemUocGF0aCksIGNvbnRlbnQgfTtcbiAgfTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gcGF0aFRlbXBsYXRlPFQgZXh0ZW5kcyBQYXRoVGVtcGxhdGVEYXRhPihvcHRpb25zOiBUKTogUnVsZSB7XG4gIHJldHVybiBmb3JFYWNoKGFwcGx5UGF0aFRlbXBsYXRlKG9wdGlvbnMpKTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gdGVtcGxhdGU8VD4ob3B0aW9uczogVCk6IFJ1bGUge1xuICByZXR1cm4gY2hhaW4oW1xuICAgIGNvbnRlbnRUZW1wbGF0ZShvcHRpb25zKSxcbiAgICAvLyBGb3JjZSBjYXN0IHRvIFBhdGhUZW1wbGF0ZURhdGEuIFdlIG5lZWQgdGhlIHR5cGUgZm9yIHRoZSBhY3R1YWwgcGF0aFRlbXBsYXRlKCkgY2FsbCxcbiAgICAvLyBidXQgaW4gdGhpcyBjYXNlIHdlIGNhbm5vdCBkbyBhbnl0aGluZyBhcyBjb250ZW50VGVtcGxhdGUgYXJlIG1vcmUgcGVybWlzc2l2ZS5cbiAgICAvLyBTaW5jZSB2YWx1ZXMgYXJlIGNvZXJjZWQgdG8gc3RyaW5ncyBpbiBQYXRoVGVtcGxhdGVzIGl0IHdpbGwgYmUgZmluZSBpbiB0aGUgZW5kLlxuICAgIHBhdGhUZW1wbGF0ZShvcHRpb25zIGFzIHt9IGFzIFBhdGhUZW1wbGF0ZURhdGEpLFxuICBdKTtcbn1cbiJdfQ==