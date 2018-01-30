"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("./options");
class NodePackageLinkTask {
    constructor(packageName, workingDirectory) {
        this.packageName = packageName;
        this.workingDirectory = workingDirectory;
        this.quiet = true;
    }
    toConfiguration() {
        return {
            name: options_1.NodePackageName,
            options: {
                command: 'link',
                quiet: this.quiet,
                workingDirectory: this.workingDirectory,
                packageName: this.packageName,
            },
        };
    }
}
exports.NodePackageLinkTask = NodePackageLinkTask;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluay10YXNrLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL25vZGUtcGFja2FnZS9saW5rLXRhc2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSx1Q0FBb0U7QUFFcEU7SUFHRSxZQUFtQixXQUFvQixFQUFTLGdCQUF5QjtRQUF0RCxnQkFBVyxHQUFYLFdBQVcsQ0FBUztRQUFTLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBUztRQUZ6RSxVQUFLLEdBQUcsSUFBSSxDQUFDO0lBRStELENBQUM7SUFFN0UsZUFBZTtRQUNiLE1BQU0sQ0FBQztZQUNMLElBQUksRUFBRSx5QkFBZTtZQUNyQixPQUFPLEVBQUU7Z0JBQ1AsT0FBTyxFQUFFLE1BQU07Z0JBQ2YsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO2dCQUNqQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO2dCQUN2QyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7YUFDOUI7U0FDRixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBaEJELGtEQWdCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IFRhc2tDb25maWd1cmF0aW9uLCBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvciB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IE5vZGVQYWNrYWdlTmFtZSwgTm9kZVBhY2thZ2VUYXNrT3B0aW9ucyB9IGZyb20gJy4vb3B0aW9ucyc7XG5cbmV4cG9ydCBjbGFzcyBOb2RlUGFja2FnZUxpbmtUYXNrIGltcGxlbWVudHMgVGFza0NvbmZpZ3VyYXRpb25HZW5lcmF0b3I8Tm9kZVBhY2thZ2VUYXNrT3B0aW9ucz4ge1xuICBxdWlldCA9IHRydWU7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHBhY2thZ2VOYW1lPzogc3RyaW5nLCBwdWJsaWMgd29ya2luZ0RpcmVjdG9yeT86IHN0cmluZykge31cblxuICB0b0NvbmZpZ3VyYXRpb24oKTogVGFza0NvbmZpZ3VyYXRpb248Tm9kZVBhY2thZ2VUYXNrT3B0aW9ucz4ge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBOb2RlUGFja2FnZU5hbWUsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIGNvbW1hbmQ6ICdsaW5rJyxcbiAgICAgICAgcXVpZXQ6IHRoaXMucXVpZXQsXG4gICAgICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHRoaXMud29ya2luZ0RpcmVjdG9yeSxcbiAgICAgICAgcGFja2FnZU5hbWU6IHRoaXMucGFja2FnZU5hbWUsXG4gICAgICB9LFxuICAgIH07XG4gIH1cbn1cbiJdfQ==