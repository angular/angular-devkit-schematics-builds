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
const rxjs_1 = require("rxjs");
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
        let taskPackageManagerProfile = packageManagerProfile;
        let taskPackageManagerName = packageManagerName;
        if (factoryOptions.allowPackageManagerOverride && options.packageManager) {
            taskPackageManagerProfile = packageManagers[options.packageManager];
            if (!taskPackageManagerProfile) {
                throw new UnknownPackageManagerException(options.packageManager);
            }
            taskPackageManagerName = options.packageManager;
        }
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
        if (options.quiet && taskPackageManagerProfile.quietArgument) {
            args.push(taskPackageManagerProfile.quietArgument);
        }
        return new rxjs_1.Observable(obs => {
            child_process_1.spawn(taskPackageManagerName, args, spawnOptions)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdGFza3Mvbm9kZS1wYWNrYWdlL2V4ZWN1dG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQXFEO0FBQ3JELGlEQUFvRDtBQUNwRCw2QkFBNkI7QUFDN0IsK0JBQWtDO0FBUWxDLE1BQU0sZUFBZSxHQUE4QztJQUNqRSxLQUFLLEVBQUU7UUFDTCxhQUFhLEVBQUUsU0FBUztLQUN6QjtJQUNELE1BQU0sRUFBRSxFQUFHO0lBQ1gsTUFBTSxFQUFFO1FBQ04sYUFBYSxFQUFFLFVBQVU7S0FDMUI7Q0FDRixDQUFDO0FBRUYsb0NBQTRDLFNBQVEsb0JBQWE7SUFDL0QsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyw0QkFBNEIsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUM5QyxDQUFDO0NBQ0Y7QUFKRCx3RUFJQztBQUVELG1CQUNFLGlCQUFnRCxFQUFFO0lBRWxELE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxDQUFDLGNBQWMsSUFBSSxLQUFLLENBQUM7SUFDbEUsTUFBTSxxQkFBcUIsR0FBRyxlQUFlLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNsRSxFQUFFLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztRQUMzQixNQUFNLElBQUksOEJBQThCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRUQsTUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDLGFBQWEsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFcEUsTUFBTSxDQUFDLENBQUMsT0FBK0IsRUFBRSxFQUFFO1FBQ3pDLElBQUkseUJBQXlCLEdBQUcscUJBQXFCLENBQUM7UUFDdEQsSUFBSSxzQkFBc0IsR0FBRyxrQkFBa0IsQ0FBQztRQUNoRCxFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsMkJBQTJCLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDekUseUJBQXlCLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNwRSxFQUFFLENBQUMsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztnQkFDL0IsTUFBTSxJQUFJLDhCQUE4QixDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNuRSxDQUFDO1lBQ0Qsc0JBQXNCLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQztRQUNsRCxDQUFDO1FBRUQsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUNwQyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ25DLE1BQU0sWUFBWSxHQUFpQjtZQUNqQyxLQUFLLEVBQUcsQ0FBRSxPQUFPLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxXQUFXLENBQUU7WUFDcEQsS0FBSyxFQUFFLElBQUk7WUFDWCxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLGdCQUFnQixJQUFJLEVBQUUsQ0FBQztTQUM5RCxDQUFDO1FBQ0YsTUFBTSxJQUFJLEdBQUcsQ0FBRSxPQUFPLENBQUMsT0FBTyxDQUFFLENBQUM7UUFFakMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUkseUJBQXlCLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUM3RCxJQUFJLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxpQkFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzFCLHFCQUFLLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQztpQkFDOUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFO2dCQUM1QixFQUFFLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDZixHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1gsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNqQixDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNOLE1BQU0sT0FBTyxHQUFHLG9DQUFvQyxDQUFDO29CQUNyRCxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUwsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQXJERCw0QkFxREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgU3Bhd25PcHRpb25zLCBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IFRhc2tFeGVjdXRvciB9IGZyb20gJy4uLy4uL3NyYyc7XG5pbXBvcnQgeyBOb2RlUGFja2FnZVRhc2tGYWN0b3J5T3B0aW9ucywgTm9kZVBhY2thZ2VUYXNrT3B0aW9ucyB9IGZyb20gJy4vb3B0aW9ucyc7XG5cbnR5cGUgUGFja2FnZU1hbmFnZXJQcm9maWxlID0ge1xuICBxdWlldEFyZ3VtZW50Pzogc3RyaW5nO1xufTtcblxuY29uc3QgcGFja2FnZU1hbmFnZXJzOiB7IFtuYW1lOiBzdHJpbmddOiBQYWNrYWdlTWFuYWdlclByb2ZpbGUgfSA9IHtcbiAgJ25wbSc6IHtcbiAgICBxdWlldEFyZ3VtZW50OiAnLS1xdWlldCcsXG4gIH0sXG4gICdjbnBtJzogeyB9LFxuICAneWFybic6IHtcbiAgICBxdWlldEFyZ3VtZW50OiAnLS1zaWxlbnQnLFxuICB9LFxufTtcblxuZXhwb3J0IGNsYXNzIFVua25vd25QYWNrYWdlTWFuYWdlckV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgVW5rbm93biBwYWNrYWdlIG1hbmFnZXIgXCIke25hbWV9XCIuYCk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oXG4gIGZhY3RvcnlPcHRpb25zOiBOb2RlUGFja2FnZVRhc2tGYWN0b3J5T3B0aW9ucyA9IHt9LFxuKTogVGFza0V4ZWN1dG9yPE5vZGVQYWNrYWdlVGFza09wdGlvbnM+IHtcbiAgY29uc3QgcGFja2FnZU1hbmFnZXJOYW1lID0gZmFjdG9yeU9wdGlvbnMucGFja2FnZU1hbmFnZXIgfHwgJ25wbSc7XG4gIGNvbnN0IHBhY2thZ2VNYW5hZ2VyUHJvZmlsZSA9IHBhY2thZ2VNYW5hZ2Vyc1twYWNrYWdlTWFuYWdlck5hbWVdO1xuICBpZiAoIXBhY2thZ2VNYW5hZ2VyUHJvZmlsZSkge1xuICAgIHRocm93IG5ldyBVbmtub3duUGFja2FnZU1hbmFnZXJFeGNlcHRpb24ocGFja2FnZU1hbmFnZXJOYW1lKTtcbiAgfVxuXG4gIGNvbnN0IHJvb3REaXJlY3RvcnkgPSBmYWN0b3J5T3B0aW9ucy5yb290RGlyZWN0b3J5IHx8IHByb2Nlc3MuY3dkKCk7XG5cbiAgcmV0dXJuIChvcHRpb25zOiBOb2RlUGFja2FnZVRhc2tPcHRpb25zKSA9PiB7XG4gICAgbGV0IHRhc2tQYWNrYWdlTWFuYWdlclByb2ZpbGUgPSBwYWNrYWdlTWFuYWdlclByb2ZpbGU7XG4gICAgbGV0IHRhc2tQYWNrYWdlTWFuYWdlck5hbWUgPSBwYWNrYWdlTWFuYWdlck5hbWU7XG4gICAgaWYgKGZhY3RvcnlPcHRpb25zLmFsbG93UGFja2FnZU1hbmFnZXJPdmVycmlkZSAmJiBvcHRpb25zLnBhY2thZ2VNYW5hZ2VyKSB7XG4gICAgICB0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlID0gcGFja2FnZU1hbmFnZXJzW29wdGlvbnMucGFja2FnZU1hbmFnZXJdO1xuICAgICAgaWYgKCF0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlKSB7XG4gICAgICAgIHRocm93IG5ldyBVbmtub3duUGFja2FnZU1hbmFnZXJFeGNlcHRpb24ob3B0aW9ucy5wYWNrYWdlTWFuYWdlcik7XG4gICAgICB9XG4gICAgICB0YXNrUGFja2FnZU1hbmFnZXJOYW1lID0gb3B0aW9ucy5wYWNrYWdlTWFuYWdlcjtcbiAgICB9XG5cbiAgICBjb25zdCBvdXRwdXRTdHJlYW0gPSBwcm9jZXNzLnN0ZG91dDtcbiAgICBjb25zdCBlcnJvclN0cmVhbSA9IHByb2Nlc3Muc3RkZXJyO1xuICAgIGNvbnN0IHNwYXduT3B0aW9uczogU3Bhd25PcHRpb25zID0ge1xuICAgICAgc3RkaW86ICBbIHByb2Nlc3Muc3RkaW4sIG91dHB1dFN0cmVhbSwgZXJyb3JTdHJlYW0gXSxcbiAgICAgIHNoZWxsOiB0cnVlLFxuICAgICAgY3dkOiBwYXRoLmpvaW4ocm9vdERpcmVjdG9yeSwgb3B0aW9ucy53b3JraW5nRGlyZWN0b3J5IHx8ICcnKSxcbiAgICB9O1xuICAgIGNvbnN0IGFyZ3MgPSBbIG9wdGlvbnMuY29tbWFuZCBdO1xuXG4gICAgaWYgKG9wdGlvbnMucGFja2FnZU5hbWUpIHtcbiAgICAgIGFyZ3MucHVzaChvcHRpb25zLnBhY2thZ2VOYW1lKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5xdWlldCAmJiB0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlLnF1aWV0QXJndW1lbnQpIHtcbiAgICAgIGFyZ3MucHVzaCh0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlLnF1aWV0QXJndW1lbnQpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZShvYnMgPT4ge1xuICAgICAgc3Bhd24odGFza1BhY2thZ2VNYW5hZ2VyTmFtZSwgYXJncywgc3Bhd25PcHRpb25zKVxuICAgICAgICAub24oJ2Nsb3NlJywgKGNvZGU6IG51bWJlcikgPT4ge1xuICAgICAgICAgIGlmIChjb2RlID09PSAwKSB7XG4gICAgICAgICAgICBvYnMubmV4dCgpO1xuICAgICAgICAgICAgb2JzLmNvbXBsZXRlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSAnUGFja2FnZSBpbnN0YWxsIGZhaWxlZCwgc2VlIGFib3ZlLic7XG4gICAgICAgICAgICBvYnMuZXJyb3IobmV3IEVycm9yKG1lc3NhZ2UpKTtcbiAgICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICB9O1xufVxuIl19