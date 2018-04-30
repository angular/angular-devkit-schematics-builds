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
        commands: {},
    },
    'cnpm': {
        commands: {},
    },
    'yarn': {
        quietArgument: '--silent',
        commands: {
            'install': 'add',
        },
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
        const args = [
            taskPackageManagerProfile.commands[options.command] || options.command,
        ];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdGFza3Mvbm9kZS1wYWNrYWdlL2V4ZWN1dG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQXFEO0FBQ3JELGlEQUFvRDtBQUNwRCw2QkFBNkI7QUFDN0IsK0JBQWtDO0FBU2xDLE1BQU0sZUFBZSxHQUE4QztJQUNqRSxLQUFLLEVBQUU7UUFDTCxhQUFhLEVBQUUsU0FBUztRQUN4QixRQUFRLEVBQUUsRUFBRztLQUNkO0lBQ0QsTUFBTSxFQUFFO1FBQ04sUUFBUSxFQUFFLEVBQUc7S0FDYjtJQUNGLE1BQU0sRUFBRTtRQUNOLGFBQWEsRUFBRSxVQUFVO1FBQ3pCLFFBQVEsRUFBRTtZQUNSLFNBQVMsRUFBRSxLQUFLO1NBQ2pCO0tBQ0Y7Q0FDRixDQUFDO0FBRUYsb0NBQTRDLFNBQVEsb0JBQWE7SUFDL0QsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyw0QkFBNEIsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUM5QyxDQUFDO0NBQ0Y7QUFKRCx3RUFJQztBQUVELG1CQUNFLGlCQUFnRCxFQUFFO0lBRWxELE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxDQUFDLGNBQWMsSUFBSSxLQUFLLENBQUM7SUFDbEUsTUFBTSxxQkFBcUIsR0FBRyxlQUFlLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNsRSxFQUFFLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztRQUMzQixNQUFNLElBQUksOEJBQThCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRUQsTUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDLGFBQWEsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFcEUsTUFBTSxDQUFDLENBQUMsT0FBK0IsRUFBRSxFQUFFO1FBQ3pDLElBQUkseUJBQXlCLEdBQUcscUJBQXFCLENBQUM7UUFDdEQsSUFBSSxzQkFBc0IsR0FBRyxrQkFBa0IsQ0FBQztRQUNoRCxFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsMkJBQTJCLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDekUseUJBQXlCLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNwRSxFQUFFLENBQUMsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztnQkFDL0IsTUFBTSxJQUFJLDhCQUE4QixDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNuRSxDQUFDO1lBQ0Qsc0JBQXNCLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQztRQUNsRCxDQUFDO1FBRUQsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUNwQyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ25DLE1BQU0sWUFBWSxHQUFpQjtZQUNqQyxLQUFLLEVBQUcsQ0FBRSxPQUFPLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxXQUFXLENBQUU7WUFDcEQsS0FBSyxFQUFFLElBQUk7WUFDWCxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLGdCQUFnQixJQUFJLEVBQUUsQ0FBQztTQUM5RCxDQUFDO1FBQ0YsTUFBTSxJQUFJLEdBQUc7WUFDWCx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPO1NBQ3ZFLENBQUM7UUFFRixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSx5QkFBeUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLGlCQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDMUIscUJBQUssQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDO2lCQUM5QyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUU7Z0JBQzVCLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNmLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDWCxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2pCLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ04sTUFBTSxPQUFPLEdBQUcsb0NBQW9DLENBQUM7b0JBQ3JELEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDaEMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFTCxDQUFDLENBQUM7QUFDSixDQUFDO0FBdkRELDRCQXVEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24gfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBTcGF3bk9wdGlvbnMsIHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgVGFza0V4ZWN1dG9yIH0gZnJvbSAnLi4vLi4vc3JjJztcbmltcG9ydCB7IE5vZGVQYWNrYWdlVGFza0ZhY3RvcnlPcHRpb25zLCBOb2RlUGFja2FnZVRhc2tPcHRpb25zIH0gZnJvbSAnLi9vcHRpb25zJztcblxudHlwZSBQYWNrYWdlTWFuYWdlclByb2ZpbGUgPSB7XG4gIHF1aWV0QXJndW1lbnQ/OiBzdHJpbmc7XG4gIGNvbW1hbmRzOiB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfSxcbn07XG5cbmNvbnN0IHBhY2thZ2VNYW5hZ2VyczogeyBbbmFtZTogc3RyaW5nXTogUGFja2FnZU1hbmFnZXJQcm9maWxlIH0gPSB7XG4gICducG0nOiB7XG4gICAgcXVpZXRBcmd1bWVudDogJy0tcXVpZXQnLFxuICAgIGNvbW1hbmRzOiB7IH0sXG4gIH0sXG4gICdjbnBtJzoge1xuICAgIGNvbW1hbmRzOiB7IH0sXG4gICB9LFxuICAneWFybic6IHtcbiAgICBxdWlldEFyZ3VtZW50OiAnLS1zaWxlbnQnLFxuICAgIGNvbW1hbmRzOiB7XG4gICAgICAnaW5zdGFsbCc6ICdhZGQnLFxuICAgIH0sXG4gIH0sXG59O1xuXG5leHBvcnQgY2xhc3MgVW5rbm93blBhY2thZ2VNYW5hZ2VyRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBVbmtub3duIHBhY2thZ2UgbWFuYWdlciBcIiR7bmFtZX1cIi5gKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihcbiAgZmFjdG9yeU9wdGlvbnM6IE5vZGVQYWNrYWdlVGFza0ZhY3RvcnlPcHRpb25zID0ge30sXG4pOiBUYXNrRXhlY3V0b3I8Tm9kZVBhY2thZ2VUYXNrT3B0aW9ucz4ge1xuICBjb25zdCBwYWNrYWdlTWFuYWdlck5hbWUgPSBmYWN0b3J5T3B0aW9ucy5wYWNrYWdlTWFuYWdlciB8fCAnbnBtJztcbiAgY29uc3QgcGFja2FnZU1hbmFnZXJQcm9maWxlID0gcGFja2FnZU1hbmFnZXJzW3BhY2thZ2VNYW5hZ2VyTmFtZV07XG4gIGlmICghcGFja2FnZU1hbmFnZXJQcm9maWxlKSB7XG4gICAgdGhyb3cgbmV3IFVua25vd25QYWNrYWdlTWFuYWdlckV4Y2VwdGlvbihwYWNrYWdlTWFuYWdlck5hbWUpO1xuICB9XG5cbiAgY29uc3Qgcm9vdERpcmVjdG9yeSA9IGZhY3RvcnlPcHRpb25zLnJvb3REaXJlY3RvcnkgfHwgcHJvY2Vzcy5jd2QoKTtcblxuICByZXR1cm4gKG9wdGlvbnM6IE5vZGVQYWNrYWdlVGFza09wdGlvbnMpID0+IHtcbiAgICBsZXQgdGFza1BhY2thZ2VNYW5hZ2VyUHJvZmlsZSA9IHBhY2thZ2VNYW5hZ2VyUHJvZmlsZTtcbiAgICBsZXQgdGFza1BhY2thZ2VNYW5hZ2VyTmFtZSA9IHBhY2thZ2VNYW5hZ2VyTmFtZTtcbiAgICBpZiAoZmFjdG9yeU9wdGlvbnMuYWxsb3dQYWNrYWdlTWFuYWdlck92ZXJyaWRlICYmIG9wdGlvbnMucGFja2FnZU1hbmFnZXIpIHtcbiAgICAgIHRhc2tQYWNrYWdlTWFuYWdlclByb2ZpbGUgPSBwYWNrYWdlTWFuYWdlcnNbb3B0aW9ucy5wYWNrYWdlTWFuYWdlcl07XG4gICAgICBpZiAoIXRhc2tQYWNrYWdlTWFuYWdlclByb2ZpbGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IFVua25vd25QYWNrYWdlTWFuYWdlckV4Y2VwdGlvbihvcHRpb25zLnBhY2thZ2VNYW5hZ2VyKTtcbiAgICAgIH1cbiAgICAgIHRhc2tQYWNrYWdlTWFuYWdlck5hbWUgPSBvcHRpb25zLnBhY2thZ2VNYW5hZ2VyO1xuICAgIH1cblxuICAgIGNvbnN0IG91dHB1dFN0cmVhbSA9IHByb2Nlc3Muc3Rkb3V0O1xuICAgIGNvbnN0IGVycm9yU3RyZWFtID0gcHJvY2Vzcy5zdGRlcnI7XG4gICAgY29uc3Qgc3Bhd25PcHRpb25zOiBTcGF3bk9wdGlvbnMgPSB7XG4gICAgICBzdGRpbzogIFsgcHJvY2Vzcy5zdGRpbiwgb3V0cHV0U3RyZWFtLCBlcnJvclN0cmVhbSBdLFxuICAgICAgc2hlbGw6IHRydWUsXG4gICAgICBjd2Q6IHBhdGguam9pbihyb290RGlyZWN0b3J5LCBvcHRpb25zLndvcmtpbmdEaXJlY3RvcnkgfHwgJycpLFxuICAgIH07XG4gICAgY29uc3QgYXJncyA9IFtcbiAgICAgIHRhc2tQYWNrYWdlTWFuYWdlclByb2ZpbGUuY29tbWFuZHNbb3B0aW9ucy5jb21tYW5kXSB8fCBvcHRpb25zLmNvbW1hbmQsXG4gICAgXTtcblxuICAgIGlmIChvcHRpb25zLnBhY2thZ2VOYW1lKSB7XG4gICAgICBhcmdzLnB1c2gob3B0aW9ucy5wYWNrYWdlTmFtZSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMucXVpZXQgJiYgdGFza1BhY2thZ2VNYW5hZ2VyUHJvZmlsZS5xdWlldEFyZ3VtZW50KSB7XG4gICAgICBhcmdzLnB1c2godGFza1BhY2thZ2VNYW5hZ2VyUHJvZmlsZS5xdWlldEFyZ3VtZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGUob2JzID0+IHtcbiAgICAgIHNwYXduKHRhc2tQYWNrYWdlTWFuYWdlck5hbWUsIGFyZ3MsIHNwYXduT3B0aW9ucylcbiAgICAgICAgLm9uKCdjbG9zZScsIChjb2RlOiBudW1iZXIpID0+IHtcbiAgICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xuICAgICAgICAgICAgb2JzLm5leHQoKTtcbiAgICAgICAgICAgIG9icy5jb21wbGV0ZSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gJ1BhY2thZ2UgaW5zdGFsbCBmYWlsZWQsIHNlZSBhYm92ZS4nO1xuICAgICAgICAgICAgb2JzLmVycm9yKG5ldyBFcnJvcihtZXNzYWdlKSk7XG4gICAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgfTtcbn1cbiJdfQ==