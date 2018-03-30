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
        return new rxjs_1.Observable(obs => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdGFza3Mvbm9kZS1wYWNrYWdlL2V4ZWN1dG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQXFEO0FBQ3JELGlEQUFvRDtBQUNwRCw2QkFBNkI7QUFDN0IsK0JBQWtDO0FBUWxDLE1BQU0sZUFBZSxHQUE4QztJQUNqRSxLQUFLLEVBQUU7UUFDTCxhQUFhLEVBQUUsU0FBUztLQUN6QjtJQUNELE1BQU0sRUFBRSxFQUFHO0lBQ1gsTUFBTSxFQUFFO1FBQ04sYUFBYSxFQUFFLFVBQVU7S0FDMUI7Q0FDRixDQUFDO0FBRUYsb0NBQTRDLFNBQVEsb0JBQWE7SUFDL0QsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyw0QkFBNEIsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUM5QyxDQUFDO0NBQ0Y7QUFKRCx3RUFJQztBQUVELG1CQUNFLGlCQUFnRCxFQUFFO0lBRWxELE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxDQUFDLGNBQWMsSUFBSSxLQUFLLENBQUM7SUFDbEUsTUFBTSxxQkFBcUIsR0FBRyxlQUFlLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNsRSxFQUFFLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztRQUMzQixNQUFNLElBQUksOEJBQThCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRUQsTUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDLGFBQWEsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFcEUsTUFBTSxDQUFDLENBQUMsT0FBK0IsRUFBRSxFQUFFO1FBQ3pDLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDcEMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUNuQyxNQUFNLFlBQVksR0FBaUI7WUFDakMsS0FBSyxFQUFHLENBQUUsT0FBTyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsV0FBVyxDQUFFO1lBQ3BELEtBQUssRUFBRSxJQUFJO1lBQ1gsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFLENBQUM7U0FDOUQsQ0FBQztRQUNGLE1BQU0sSUFBSSxHQUFHLENBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBRSxDQUFDO1FBRWpDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDekQsSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksaUJBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMxQixxQkFBSyxDQUFDLGtCQUFrQixFQUFFLElBQUksRUFBRSxZQUFZLENBQUM7aUJBQzFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFZLEVBQUUsRUFBRTtnQkFDNUIsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2YsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNYLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDakIsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDTixNQUFNLE9BQU8sR0FBRyxvQ0FBb0MsQ0FBQztvQkFDckQsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUVMLENBQUMsQ0FBQztBQUNKLENBQUM7QUEzQ0QsNEJBMkNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IFNwYXduT3B0aW9ucywgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBUYXNrRXhlY3V0b3IgfSBmcm9tICcuLi8uLi9zcmMnO1xuaW1wb3J0IHsgTm9kZVBhY2thZ2VUYXNrRmFjdG9yeU9wdGlvbnMsIE5vZGVQYWNrYWdlVGFza09wdGlvbnMgfSBmcm9tICcuL29wdGlvbnMnO1xuXG50eXBlIFBhY2thZ2VNYW5hZ2VyUHJvZmlsZSA9IHtcbiAgcXVpZXRBcmd1bWVudD86IHN0cmluZztcbn07XG5cbmNvbnN0IHBhY2thZ2VNYW5hZ2VyczogeyBbbmFtZTogc3RyaW5nXTogUGFja2FnZU1hbmFnZXJQcm9maWxlIH0gPSB7XG4gICducG0nOiB7XG4gICAgcXVpZXRBcmd1bWVudDogJy0tcXVpZXQnLFxuICB9LFxuICAnY25wbSc6IHsgfSxcbiAgJ3lhcm4nOiB7XG4gICAgcXVpZXRBcmd1bWVudDogJy0tc2lsZW50JyxcbiAgfSxcbn07XG5cbmV4cG9ydCBjbGFzcyBVbmtub3duUGFja2FnZU1hbmFnZXJFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFVua25vd24gcGFja2FnZSBtYW5hZ2VyIFwiJHtuYW1lfVwiLmApO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKFxuICBmYWN0b3J5T3B0aW9uczogTm9kZVBhY2thZ2VUYXNrRmFjdG9yeU9wdGlvbnMgPSB7fSxcbik6IFRhc2tFeGVjdXRvcjxOb2RlUGFja2FnZVRhc2tPcHRpb25zPiB7XG4gIGNvbnN0IHBhY2thZ2VNYW5hZ2VyTmFtZSA9IGZhY3RvcnlPcHRpb25zLnBhY2thZ2VNYW5hZ2VyIHx8ICducG0nO1xuICBjb25zdCBwYWNrYWdlTWFuYWdlclByb2ZpbGUgPSBwYWNrYWdlTWFuYWdlcnNbcGFja2FnZU1hbmFnZXJOYW1lXTtcbiAgaWYgKCFwYWNrYWdlTWFuYWdlclByb2ZpbGUpIHtcbiAgICB0aHJvdyBuZXcgVW5rbm93blBhY2thZ2VNYW5hZ2VyRXhjZXB0aW9uKHBhY2thZ2VNYW5hZ2VyTmFtZSk7XG4gIH1cblxuICBjb25zdCByb290RGlyZWN0b3J5ID0gZmFjdG9yeU9wdGlvbnMucm9vdERpcmVjdG9yeSB8fCBwcm9jZXNzLmN3ZCgpO1xuXG4gIHJldHVybiAob3B0aW9uczogTm9kZVBhY2thZ2VUYXNrT3B0aW9ucykgPT4ge1xuICAgIGNvbnN0IG91dHB1dFN0cmVhbSA9IHByb2Nlc3Muc3Rkb3V0O1xuICAgIGNvbnN0IGVycm9yU3RyZWFtID0gcHJvY2Vzcy5zdGRlcnI7XG4gICAgY29uc3Qgc3Bhd25PcHRpb25zOiBTcGF3bk9wdGlvbnMgPSB7XG4gICAgICBzdGRpbzogIFsgcHJvY2Vzcy5zdGRpbiwgb3V0cHV0U3RyZWFtLCBlcnJvclN0cmVhbSBdLFxuICAgICAgc2hlbGw6IHRydWUsXG4gICAgICBjd2Q6IHBhdGguam9pbihyb290RGlyZWN0b3J5LCBvcHRpb25zLndvcmtpbmdEaXJlY3RvcnkgfHwgJycpLFxuICAgIH07XG4gICAgY29uc3QgYXJncyA9IFsgb3B0aW9ucy5jb21tYW5kIF07XG5cbiAgICBpZiAob3B0aW9ucy5wYWNrYWdlTmFtZSkge1xuICAgICAgYXJncy5wdXNoKG9wdGlvbnMucGFja2FnZU5hbWUpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnF1aWV0ICYmIHBhY2thZ2VNYW5hZ2VyUHJvZmlsZS5xdWlldEFyZ3VtZW50KSB7XG4gICAgICBhcmdzLnB1c2gocGFja2FnZU1hbmFnZXJQcm9maWxlLnF1aWV0QXJndW1lbnQpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZShvYnMgPT4ge1xuICAgICAgc3Bhd24ocGFja2FnZU1hbmFnZXJOYW1lLCBhcmdzLCBzcGF3bk9wdGlvbnMpXG4gICAgICAgIC5vbignY2xvc2UnLCAoY29kZTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgaWYgKGNvZGUgPT09IDApIHtcbiAgICAgICAgICAgIG9icy5uZXh0KCk7XG4gICAgICAgICAgICBvYnMuY29tcGxldGUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9ICdQYWNrYWdlIGluc3RhbGwgZmFpbGVkLCBzZWUgYWJvdmUuJztcbiAgICAgICAgICAgIG9icy5lcnJvcihuZXcgRXJyb3IobWVzc2FnZSkpO1xuICAgICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gIH07XG59XG4iXX0=