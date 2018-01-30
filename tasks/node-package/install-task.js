"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("./options");
class NodePackageInstallTask {
    constructor(workingDirectory) {
        this.workingDirectory = workingDirectory;
        this.quiet = true;
    }
    toConfiguration() {
        return {
            name: options_1.NodePackageName,
            options: {
                command: 'install',
                quiet: this.quiet,
                workingDirectory: this.workingDirectory,
            },
        };
    }
}
exports.NodePackageInstallTask = NodePackageInstallTask;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbC10YXNrLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL25vZGUtcGFja2FnZS9pbnN0YWxsLXRhc2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSx1Q0FBb0U7QUFFcEU7SUFHRSxZQUFtQixnQkFBeUI7UUFBekIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFTO1FBRjVDLFVBQUssR0FBRyxJQUFJLENBQUM7SUFFa0MsQ0FBQztJQUVoRCxlQUFlO1FBQ2IsTUFBTSxDQUFDO1lBQ0wsSUFBSSxFQUFFLHlCQUFlO1lBQ3JCLE9BQU8sRUFBRTtnQkFDUCxPQUFPLEVBQUUsU0FBUztnQkFDbEIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO2dCQUNqQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO2FBQ3hDO1NBQ0YsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQWZELHdEQWVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgVGFza0NvbmZpZ3VyYXRpb24sIFRhc2tDb25maWd1cmF0aW9uR2VuZXJhdG9yIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgTm9kZVBhY2thZ2VOYW1lLCBOb2RlUGFja2FnZVRhc2tPcHRpb25zIH0gZnJvbSAnLi9vcHRpb25zJztcblxuZXhwb3J0IGNsYXNzIE5vZGVQYWNrYWdlSW5zdGFsbFRhc2sgaW1wbGVtZW50cyBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvcjxOb2RlUGFja2FnZVRhc2tPcHRpb25zPiB7XG4gIHF1aWV0ID0gdHJ1ZTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgd29ya2luZ0RpcmVjdG9yeT86IHN0cmluZykge31cblxuICB0b0NvbmZpZ3VyYXRpb24oKTogVGFza0NvbmZpZ3VyYXRpb248Tm9kZVBhY2thZ2VUYXNrT3B0aW9ucz4ge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBOb2RlUGFja2FnZU5hbWUsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIGNvbW1hbmQ6ICdpbnN0YWxsJyxcbiAgICAgICAgcXVpZXQ6IHRoaXMucXVpZXQsXG4gICAgICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHRoaXMud29ya2luZ0RpcmVjdG9yeSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxufVxuIl19