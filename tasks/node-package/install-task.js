"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("./options");
class NodePackageInstallTaskOptions {
}
exports.NodePackageInstallTaskOptions = NodePackageInstallTaskOptions;
class NodePackageInstallTask {
    constructor(options) {
        this.quiet = true;
        if (typeof options === 'string') {
            this.workingDirectory = options;
        }
        else if (typeof options === 'object') {
            if (options.quiet != undefined) {
                this.quiet = options.quiet;
            }
            if (options.workingDirectory != undefined) {
                this.workingDirectory = options.workingDirectory;
            }
            if (options.packageManager != undefined) {
                this.packageManager = options.packageManager;
            }
        }
    }
    toConfiguration() {
        return {
            name: options_1.NodePackageName,
            options: {
                command: 'install',
                quiet: this.quiet,
                workingDirectory: this.workingDirectory,
                packageManager: this.packageManager,
            },
        };
    }
}
exports.NodePackageInstallTask = NodePackageInstallTask;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbC10YXNrLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL25vZGUtcGFja2FnZS9pbnN0YWxsLXRhc2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSx1Q0FBb0U7QUFFcEU7Q0FJQztBQUpELHNFQUlDO0FBRUQ7SUFPRSxZQUFZLE9BQXlEO1FBTnJFLFVBQUssR0FBRyxJQUFJLENBQUM7UUFPWCxFQUFFLENBQUMsQ0FBQyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxPQUFPLENBQUM7UUFDbEMsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQzdCLENBQUM7WUFDRCxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztZQUNuRCxDQUFDO1lBQ0QsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUN4QyxJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7WUFDL0MsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsZUFBZTtRQUNiLE1BQU0sQ0FBQztZQUNMLElBQUksRUFBRSx5QkFBZTtZQUNyQixPQUFPLEVBQUU7Z0JBQ1AsT0FBTyxFQUFFLFNBQVM7Z0JBQ2xCLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtnQkFDdkMsY0FBYyxFQUFFLElBQUksQ0FBQyxjQUFjO2FBQ3BDO1NBQ0YsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQWxDRCx3REFrQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBUYXNrQ29uZmlndXJhdGlvbiwgVGFza0NvbmZpZ3VyYXRpb25HZW5lcmF0b3IgfSBmcm9tICcuLi8uLi9zcmMnO1xuaW1wb3J0IHsgTm9kZVBhY2thZ2VOYW1lLCBOb2RlUGFja2FnZVRhc2tPcHRpb25zIH0gZnJvbSAnLi9vcHRpb25zJztcblxuZXhwb3J0IGNsYXNzIE5vZGVQYWNrYWdlSW5zdGFsbFRhc2tPcHRpb25zIHtcbiAgcGFja2FnZU1hbmFnZXI6IHN0cmluZztcbiAgd29ya2luZ0RpcmVjdG9yeTogc3RyaW5nO1xuICBxdWlldDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVQYWNrYWdlSW5zdGFsbFRhc2sgaW1wbGVtZW50cyBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvcjxOb2RlUGFja2FnZVRhc2tPcHRpb25zPiB7XG4gIHF1aWV0ID0gdHJ1ZTtcbiAgd29ya2luZ0RpcmVjdG9yeT86IHN0cmluZztcbiAgcGFja2FnZU1hbmFnZXI/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Iod29ya2luZ0RpcmVjdG9yeT86IHN0cmluZyk7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFBhcnRpYWw8Tm9kZVBhY2thZ2VJbnN0YWxsVGFza09wdGlvbnM+KTtcbiAgY29uc3RydWN0b3Iob3B0aW9ucz86IHN0cmluZyB8IFBhcnRpYWw8Tm9kZVBhY2thZ2VJbnN0YWxsVGFza09wdGlvbnM+KSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy53b3JraW5nRGlyZWN0b3J5ID0gb3B0aW9ucztcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0Jykge1xuICAgICAgaWYgKG9wdGlvbnMucXVpZXQgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMucXVpZXQgPSBvcHRpb25zLnF1aWV0O1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMud29ya2luZ0RpcmVjdG9yeSAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy53b3JraW5nRGlyZWN0b3J5ID0gb3B0aW9ucy53b3JraW5nRGlyZWN0b3J5O1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMucGFja2FnZU1hbmFnZXIgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMucGFja2FnZU1hbmFnZXIgPSBvcHRpb25zLnBhY2thZ2VNYW5hZ2VyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHRvQ29uZmlndXJhdGlvbigpOiBUYXNrQ29uZmlndXJhdGlvbjxOb2RlUGFja2FnZVRhc2tPcHRpb25zPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IE5vZGVQYWNrYWdlTmFtZSxcbiAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgY29tbWFuZDogJ2luc3RhbGwnLFxuICAgICAgICBxdWlldDogdGhpcy5xdWlldCxcbiAgICAgICAgd29ya2luZ0RpcmVjdG9yeTogdGhpcy53b3JraW5nRGlyZWN0b3J5LFxuICAgICAgICBwYWNrYWdlTWFuYWdlcjogdGhpcy5wYWNrYWdlTWFuYWdlcixcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxufVxuIl19