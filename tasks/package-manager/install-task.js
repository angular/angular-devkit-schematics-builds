"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodePackageInstallTask = void 0;
const options_1 = require("./options");
class NodePackageInstallTask {
    constructor(options) {
        this.quiet = true;
        this.hideOutput = true;
        if (typeof options === 'string') {
            this.workingDirectory = options;
        }
        else if (typeof options === 'object') {
            if (options.quiet != undefined) {
                this.quiet = options.quiet;
            }
            if (options.hideOutput != undefined) {
                this.hideOutput = options.hideOutput;
            }
            if (options.workingDirectory != undefined) {
                this.workingDirectory = options.workingDirectory;
            }
            if (options.packageManager != undefined) {
                this.packageManager = options.packageManager;
            }
            if (options.packageName != undefined) {
                this.packageName = options.packageName;
            }
        }
    }
    toConfiguration() {
        return {
            name: options_1.NodePackageName,
            options: {
                command: 'install',
                quiet: this.quiet,
                hideOutput: this.hideOutput,
                workingDirectory: this.workingDirectory,
                packageManager: this.packageManager,
                packageName: this.packageName,
            },
        };
    }
}
exports.NodePackageInstallTask = NodePackageInstallTask;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbC10YXNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90YXNrcy9wYWNrYWdlLW1hbmFnZXIvaW5zdGFsbC10YXNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUdILHVDQUFvRTtBQVVwRSxNQUFhLHNCQUFzQjtJQVNqQyxZQUFZLE9BQWdEO1FBUjVELFVBQUssR0FBRyxJQUFJLENBQUM7UUFDYixlQUFVLEdBQUcsSUFBSSxDQUFDO1FBUWhCLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFO1lBQy9CLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxPQUFPLENBQUM7U0FDakM7YUFBTSxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUN0QyxJQUFJLE9BQU8sQ0FBQyxLQUFLLElBQUksU0FBUyxFQUFFO2dCQUM5QixJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7YUFDNUI7WUFDRCxJQUFJLE9BQU8sQ0FBQyxVQUFVLElBQUksU0FBUyxFQUFFO2dCQUNuQyxJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7YUFDdEM7WUFDRCxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxTQUFTLEVBQUU7Z0JBQ3pDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7YUFDbEQ7WUFDRCxJQUFJLE9BQU8sQ0FBQyxjQUFjLElBQUksU0FBUyxFQUFFO2dCQUN2QyxJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7YUFDOUM7WUFDRCxJQUFJLE9BQU8sQ0FBQyxXQUFXLElBQUksU0FBUyxFQUFFO2dCQUNwQyxJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUM7YUFDeEM7U0FDRjtJQUNILENBQUM7SUFFRCxlQUFlO1FBQ2IsT0FBTztZQUNMLElBQUksRUFBRSx5QkFBZTtZQUNyQixPQUFPLEVBQUU7Z0JBQ1AsT0FBTyxFQUFFLFNBQVM7Z0JBQ2xCLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO2dCQUMzQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO2dCQUN2QyxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWM7Z0JBQ25DLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVzthQUM5QjtTQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUE1Q0Qsd0RBNENDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IFRhc2tDb25maWd1cmF0aW9uLCBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvciB9IGZyb20gJy4uLy4uL3NyYyc7XG5pbXBvcnQgeyBOb2RlUGFja2FnZU5hbWUsIE5vZGVQYWNrYWdlVGFza09wdGlvbnMgfSBmcm9tICcuL29wdGlvbnMnO1xuXG5pbnRlcmZhY2UgTm9kZVBhY2thZ2VJbnN0YWxsVGFza09wdGlvbnMge1xuICBwYWNrYWdlTWFuYWdlcj86IHN0cmluZztcbiAgcGFja2FnZU5hbWU/OiBzdHJpbmc7XG4gIHdvcmtpbmdEaXJlY3Rvcnk/OiBzdHJpbmc7XG4gIHF1aWV0PzogYm9vbGVhbjtcbiAgaGlkZU91dHB1dD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlUGFja2FnZUluc3RhbGxUYXNrIGltcGxlbWVudHMgVGFza0NvbmZpZ3VyYXRpb25HZW5lcmF0b3I8Tm9kZVBhY2thZ2VUYXNrT3B0aW9ucz4ge1xuICBxdWlldCA9IHRydWU7XG4gIGhpZGVPdXRwdXQgPSB0cnVlO1xuICB3b3JraW5nRGlyZWN0b3J5Pzogc3RyaW5nO1xuICBwYWNrYWdlTWFuYWdlcj86IHN0cmluZztcbiAgcGFja2FnZU5hbWU/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Iod29ya2luZ0RpcmVjdG9yeT86IHN0cmluZyk7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2tPcHRpb25zKTtcbiAgY29uc3RydWN0b3Iob3B0aW9ucz86IHN0cmluZyB8IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2tPcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy53b3JraW5nRGlyZWN0b3J5ID0gb3B0aW9ucztcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0Jykge1xuICAgICAgaWYgKG9wdGlvbnMucXVpZXQgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMucXVpZXQgPSBvcHRpb25zLnF1aWV0O1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMuaGlkZU91dHB1dCAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5oaWRlT3V0cHV0ID0gb3B0aW9ucy5oaWRlT3V0cHV0O1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMud29ya2luZ0RpcmVjdG9yeSAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy53b3JraW5nRGlyZWN0b3J5ID0gb3B0aW9ucy53b3JraW5nRGlyZWN0b3J5O1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMucGFja2FnZU1hbmFnZXIgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMucGFja2FnZU1hbmFnZXIgPSBvcHRpb25zLnBhY2thZ2VNYW5hZ2VyO1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMucGFja2FnZU5hbWUgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMucGFja2FnZU5hbWUgPSBvcHRpb25zLnBhY2thZ2VOYW1lO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHRvQ29uZmlndXJhdGlvbigpOiBUYXNrQ29uZmlndXJhdGlvbjxOb2RlUGFja2FnZVRhc2tPcHRpb25zPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IE5vZGVQYWNrYWdlTmFtZSxcbiAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgY29tbWFuZDogJ2luc3RhbGwnLFxuICAgICAgICBxdWlldDogdGhpcy5xdWlldCxcbiAgICAgICAgaGlkZU91dHB1dDogdGhpcy5oaWRlT3V0cHV0LFxuICAgICAgICB3b3JraW5nRGlyZWN0b3J5OiB0aGlzLndvcmtpbmdEaXJlY3RvcnksXG4gICAgICAgIHBhY2thZ2VNYW5hZ2VyOiB0aGlzLnBhY2thZ2VNYW5hZ2VyLFxuICAgICAgICBwYWNrYWdlTmFtZTogdGhpcy5wYWNrYWdlTmFtZSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxufVxuIl19