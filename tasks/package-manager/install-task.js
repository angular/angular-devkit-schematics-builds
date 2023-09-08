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
    quiet = true;
    hideOutput = true;
    allowScripts = false;
    workingDirectory;
    packageManager;
    packageName;
    constructor(options) {
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
            if (options.allowScripts !== undefined) {
                this.allowScripts = options.allowScripts;
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
                allowScripts: this.allowScripts,
            },
        };
    }
}
exports.NodePackageInstallTask = NodePackageInstallTask;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbC10YXNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90YXNrcy9wYWNrYWdlLW1hbmFnZXIvaW5zdGFsbC10YXNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUdILHVDQUFvRTtBQVdwRSxNQUFhLHNCQUFzQjtJQUNqQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ2IsVUFBVSxHQUFHLElBQUksQ0FBQztJQUNsQixZQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLGdCQUFnQixDQUFVO0lBQzFCLGNBQWMsQ0FBVTtJQUN4QixXQUFXLENBQVU7SUFJckIsWUFBWSxPQUFnRDtRQUMxRCxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUMvQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsT0FBTyxDQUFDO1NBQ2pDO2FBQU0sSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUU7WUFDdEMsSUFBSSxPQUFPLENBQUMsS0FBSyxJQUFJLFNBQVMsRUFBRTtnQkFDOUIsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO2FBQzVCO1lBQ0QsSUFBSSxPQUFPLENBQUMsVUFBVSxJQUFJLFNBQVMsRUFBRTtnQkFDbkMsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO2FBQ3RDO1lBQ0QsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLElBQUksU0FBUyxFQUFFO2dCQUN6QyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDO2FBQ2xEO1lBQ0QsSUFBSSxPQUFPLENBQUMsY0FBYyxJQUFJLFNBQVMsRUFBRTtnQkFDdkMsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDO2FBQzlDO1lBQ0QsSUFBSSxPQUFPLENBQUMsV0FBVyxJQUFJLFNBQVMsRUFBRTtnQkFDcEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDO2FBQ3hDO1lBQ0QsSUFBSSxPQUFPLENBQUMsWUFBWSxLQUFLLFNBQVMsRUFBRTtnQkFDdEMsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDO2FBQzFDO1NBQ0Y7SUFDSCxDQUFDO0lBRUQsZUFBZTtRQUNiLE9BQU87WUFDTCxJQUFJLEVBQUUseUJBQWU7WUFDckIsT0FBTyxFQUFFO2dCQUNQLE9BQU8sRUFBRSxTQUFTO2dCQUNsQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2pCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtnQkFDM0IsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtnQkFDdkMsY0FBYyxFQUFFLElBQUksQ0FBQyxjQUFjO2dCQUNuQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7Z0JBQzdCLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTthQUNoQztTQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFqREQsd0RBaURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IFRhc2tDb25maWd1cmF0aW9uLCBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvciB9IGZyb20gJy4uLy4uL3NyYyc7XG5pbXBvcnQgeyBOb2RlUGFja2FnZU5hbWUsIE5vZGVQYWNrYWdlVGFza09wdGlvbnMgfSBmcm9tICcuL29wdGlvbnMnO1xuXG5pbnRlcmZhY2UgTm9kZVBhY2thZ2VJbnN0YWxsVGFza09wdGlvbnMge1xuICBwYWNrYWdlTWFuYWdlcj86IHN0cmluZztcbiAgcGFja2FnZU5hbWU/OiBzdHJpbmc7XG4gIHdvcmtpbmdEaXJlY3Rvcnk/OiBzdHJpbmc7XG4gIHF1aWV0PzogYm9vbGVhbjtcbiAgaGlkZU91dHB1dD86IGJvb2xlYW47XG4gIGFsbG93U2NyaXB0cz86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlUGFja2FnZUluc3RhbGxUYXNrIGltcGxlbWVudHMgVGFza0NvbmZpZ3VyYXRpb25HZW5lcmF0b3I8Tm9kZVBhY2thZ2VUYXNrT3B0aW9ucz4ge1xuICBxdWlldCA9IHRydWU7XG4gIGhpZGVPdXRwdXQgPSB0cnVlO1xuICBhbGxvd1NjcmlwdHMgPSBmYWxzZTtcbiAgd29ya2luZ0RpcmVjdG9yeT86IHN0cmluZztcbiAgcGFja2FnZU1hbmFnZXI/OiBzdHJpbmc7XG4gIHBhY2thZ2VOYW1lPzogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHdvcmtpbmdEaXJlY3Rvcnk/OiBzdHJpbmcpO1xuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBOb2RlUGFja2FnZUluc3RhbGxUYXNrT3B0aW9ucyk7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBzdHJpbmcgfCBOb2RlUGFja2FnZUluc3RhbGxUYXNrT3B0aW9ucykge1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMud29ya2luZ0RpcmVjdG9yeSA9IG9wdGlvbnM7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGlmIChvcHRpb25zLnF1aWV0ICE9IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLnF1aWV0ID0gb3B0aW9ucy5xdWlldDtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLmhpZGVPdXRwdXQgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuaGlkZU91dHB1dCA9IG9wdGlvbnMuaGlkZU91dHB1dDtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLndvcmtpbmdEaXJlY3RvcnkgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMud29ya2luZ0RpcmVjdG9yeSA9IG9wdGlvbnMud29ya2luZ0RpcmVjdG9yeTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLnBhY2thZ2VNYW5hZ2VyICE9IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLnBhY2thZ2VNYW5hZ2VyID0gb3B0aW9ucy5wYWNrYWdlTWFuYWdlcjtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLnBhY2thZ2VOYW1lICE9IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLnBhY2thZ2VOYW1lID0gb3B0aW9ucy5wYWNrYWdlTmFtZTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLmFsbG93U2NyaXB0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuYWxsb3dTY3JpcHRzID0gb3B0aW9ucy5hbGxvd1NjcmlwdHM7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdG9Db25maWd1cmF0aW9uKCk6IFRhc2tDb25maWd1cmF0aW9uPE5vZGVQYWNrYWdlVGFza09wdGlvbnM+IHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogTm9kZVBhY2thZ2VOYW1lLFxuICAgICAgb3B0aW9uczoge1xuICAgICAgICBjb21tYW5kOiAnaW5zdGFsbCcsXG4gICAgICAgIHF1aWV0OiB0aGlzLnF1aWV0LFxuICAgICAgICBoaWRlT3V0cHV0OiB0aGlzLmhpZGVPdXRwdXQsXG4gICAgICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHRoaXMud29ya2luZ0RpcmVjdG9yeSxcbiAgICAgICAgcGFja2FnZU1hbmFnZXI6IHRoaXMucGFja2FnZU1hbmFnZXIsXG4gICAgICAgIHBhY2thZ2VOYW1lOiB0aGlzLnBhY2thZ2VOYW1lLFxuICAgICAgICBhbGxvd1NjcmlwdHM6IHRoaXMuYWxsb3dTY3JpcHRzLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG59XG4iXX0=