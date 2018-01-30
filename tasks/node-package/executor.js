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
const child_process_1 = require("child_process");
const path = require("path");
const Observable_1 = require("rxjs/Observable");
const packageManagers = {
    'npm': {
        quietArgument: '--quiet',
    },
    'cnpm': {},
    'yarn': {
        quietArgument: '--silent',
    },
};
class UnknownPackageManagerException extends core_1.BaseException {
    constructor(name) {
        super(`Unknown package manager "${name}".`);
    }
}
exports.UnknownPackageManagerException = UnknownPackageManagerException;
function default_1(factoryOptions = {}) {
    const packageManagerName = factoryOptions.packageManager || 'npm';
    const packageManagerProfile = packageManagers[packageManagerName];
    if (!packageManagerProfile) {
        throw new UnknownPackageManagerException(packageManagerName);
    }
    const rootDirectory = factoryOptions.rootDirectory || process.cwd();
    return (options) => {
        const outputStream = process.stdout;
        const errorStream = process.stderr;
        const spawnOptions = {
            stdio: [process.stdin, outputStream, errorStream],
            shell: true,
            cwd: path.join(rootDirectory, options.workingDirectory || ''),
        };
        const args = [options.command];
        if (options.packageName) {
            args.push(options.packageName);
        }
        if (options.quiet && packageManagerProfile.quietArgument) {
            args.push(packageManagerProfile.quietArgument);
        }
        return new Observable_1.Observable(obs => {
            child_process_1.spawn(packageManagerName, args, spawnOptions)
                .on('close', (code) => {
                if (code === 0) {
                    obs.next();
                    obs.complete();
                }
                else {
                    const message = 'Package install failed, see above.';
                    obs.error(new Error(message));
                }
            });
        });
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdGFza3Mvbm9kZS1wYWNrYWdlL2V4ZWN1dG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQXFEO0FBRXJELGlEQUFvRDtBQUNwRCw2QkFBNkI7QUFDN0IsZ0RBQTZDO0FBTzdDLE1BQU0sZUFBZSxHQUE4QztJQUNqRSxLQUFLLEVBQUU7UUFDTCxhQUFhLEVBQUUsU0FBUztLQUN6QjtJQUNELE1BQU0sRUFBRSxFQUFHO0lBQ1gsTUFBTSxFQUFFO1FBQ04sYUFBYSxFQUFFLFVBQVU7S0FDMUI7Q0FDRixDQUFDO0FBRUYsb0NBQTRDLFNBQVEsb0JBQWE7SUFDL0QsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyw0QkFBNEIsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUM5QyxDQUFDO0NBQ0Y7QUFKRCx3RUFJQztBQUVELG1CQUNFLGlCQUFnRCxFQUFFO0lBRWxELE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxDQUFDLGNBQWMsSUFBSSxLQUFLLENBQUM7SUFDbEUsTUFBTSxxQkFBcUIsR0FBRyxlQUFlLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNsRSxFQUFFLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztRQUMzQixNQUFNLElBQUksOEJBQThCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRUQsTUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDLGFBQWEsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFcEUsTUFBTSxDQUFDLENBQUMsT0FBK0IsRUFBRSxFQUFFO1FBQ3pDLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDcEMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUNuQyxNQUFNLFlBQVksR0FBaUI7WUFDakMsS0FBSyxFQUFHLENBQUUsT0FBTyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsV0FBVyxDQUFFO1lBQ3BELEtBQUssRUFBRSxJQUFJO1lBQ1gsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFLENBQUM7U0FDOUQsQ0FBQztRQUNGLE1BQU0sSUFBSSxHQUFHLENBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBRSxDQUFDO1FBRWpDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDekQsSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksdUJBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMxQixxQkFBSyxDQUFDLGtCQUFrQixFQUFFLElBQUksRUFBRSxZQUFZLENBQUM7aUJBQzFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFZLEVBQUUsRUFBRTtnQkFDNUIsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2YsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNYLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDakIsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDTixNQUFNLE9BQU8sR0FBRyxvQ0FBb0MsQ0FBQztvQkFDckQsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQztBQUNKLENBQUM7QUEzQ0QsNEJBMkNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IFRhc2tFeGVjdXRvciB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IFNwYXduT3B0aW9ucywgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcy9PYnNlcnZhYmxlJztcbmltcG9ydCB7IE5vZGVQYWNrYWdlVGFza0ZhY3RvcnlPcHRpb25zLCBOb2RlUGFja2FnZVRhc2tPcHRpb25zIH0gZnJvbSAnLi9vcHRpb25zJztcblxudHlwZSBQYWNrYWdlTWFuYWdlclByb2ZpbGUgPSB7XG4gIHF1aWV0QXJndW1lbnQ/OiBzdHJpbmc7XG59O1xuXG5jb25zdCBwYWNrYWdlTWFuYWdlcnM6IHsgW25hbWU6IHN0cmluZ106IFBhY2thZ2VNYW5hZ2VyUHJvZmlsZSB9ID0ge1xuICAnbnBtJzoge1xuICAgIHF1aWV0QXJndW1lbnQ6ICctLXF1aWV0JyxcbiAgfSxcbiAgJ2NucG0nOiB7IH0sXG4gICd5YXJuJzoge1xuICAgIHF1aWV0QXJndW1lbnQ6ICctLXNpbGVudCcsXG4gIH0sXG59O1xuXG5leHBvcnQgY2xhc3MgVW5rbm93blBhY2thZ2VNYW5hZ2VyRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBVbmtub3duIHBhY2thZ2UgbWFuYWdlciBcIiR7bmFtZX1cIi5gKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihcbiAgZmFjdG9yeU9wdGlvbnM6IE5vZGVQYWNrYWdlVGFza0ZhY3RvcnlPcHRpb25zID0ge30sXG4pOiBUYXNrRXhlY3V0b3I8Tm9kZVBhY2thZ2VUYXNrT3B0aW9ucz4ge1xuICBjb25zdCBwYWNrYWdlTWFuYWdlck5hbWUgPSBmYWN0b3J5T3B0aW9ucy5wYWNrYWdlTWFuYWdlciB8fCAnbnBtJztcbiAgY29uc3QgcGFja2FnZU1hbmFnZXJQcm9maWxlID0gcGFja2FnZU1hbmFnZXJzW3BhY2thZ2VNYW5hZ2VyTmFtZV07XG4gIGlmICghcGFja2FnZU1hbmFnZXJQcm9maWxlKSB7XG4gICAgdGhyb3cgbmV3IFVua25vd25QYWNrYWdlTWFuYWdlckV4Y2VwdGlvbihwYWNrYWdlTWFuYWdlck5hbWUpO1xuICB9XG5cbiAgY29uc3Qgcm9vdERpcmVjdG9yeSA9IGZhY3RvcnlPcHRpb25zLnJvb3REaXJlY3RvcnkgfHwgcHJvY2Vzcy5jd2QoKTtcblxuICByZXR1cm4gKG9wdGlvbnM6IE5vZGVQYWNrYWdlVGFza09wdGlvbnMpID0+IHtcbiAgICBjb25zdCBvdXRwdXRTdHJlYW0gPSBwcm9jZXNzLnN0ZG91dDtcbiAgICBjb25zdCBlcnJvclN0cmVhbSA9IHByb2Nlc3Muc3RkZXJyO1xuICAgIGNvbnN0IHNwYXduT3B0aW9uczogU3Bhd25PcHRpb25zID0ge1xuICAgICAgc3RkaW86ICBbIHByb2Nlc3Muc3RkaW4sIG91dHB1dFN0cmVhbSwgZXJyb3JTdHJlYW0gXSxcbiAgICAgIHNoZWxsOiB0cnVlLFxuICAgICAgY3dkOiBwYXRoLmpvaW4ocm9vdERpcmVjdG9yeSwgb3B0aW9ucy53b3JraW5nRGlyZWN0b3J5IHx8ICcnKSxcbiAgICB9O1xuICAgIGNvbnN0IGFyZ3MgPSBbIG9wdGlvbnMuY29tbWFuZCBdO1xuXG4gICAgaWYgKG9wdGlvbnMucGFja2FnZU5hbWUpIHtcbiAgICAgIGFyZ3MucHVzaChvcHRpb25zLnBhY2thZ2VOYW1lKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5xdWlldCAmJiBwYWNrYWdlTWFuYWdlclByb2ZpbGUucXVpZXRBcmd1bWVudCkge1xuICAgICAgYXJncy5wdXNoKHBhY2thZ2VNYW5hZ2VyUHJvZmlsZS5xdWlldEFyZ3VtZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGUob2JzID0+IHtcbiAgICAgIHNwYXduKHBhY2thZ2VNYW5hZ2VyTmFtZSwgYXJncywgc3Bhd25PcHRpb25zKVxuICAgICAgICAub24oJ2Nsb3NlJywgKGNvZGU6IG51bWJlcikgPT4ge1xuICAgICAgICAgIGlmIChjb2RlID09PSAwKSB7XG4gICAgICAgICAgICBvYnMubmV4dCgpO1xuICAgICAgICAgICAgb2JzLmNvbXBsZXRlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSAnUGFja2FnZSBpbnN0YWxsIGZhaWxlZCwgc2VlIGFib3ZlLic7XG4gICAgICAgICAgICBvYnMuZXJyb3IobmV3IEVycm9yKG1lc3NhZ2UpKTtcbiAgICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICB9O1xufVxuIl19