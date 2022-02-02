"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
function default_1(factoryOptions = {}) {
    const rootDirectory = factoryOptions.rootDirectory || process.cwd();
    return async (options = {}, context) => {
        const authorName = options.authorName;
        const authorEmail = options.authorEmail;
        const execute = (args, ignoreErrorStream) => {
            const outputStream = 'ignore';
            const errorStream = ignoreErrorStream ? 'ignore' : process.stderr;
            const spawnOptions = {
                stdio: [process.stdin, outputStream, errorStream],
                shell: true,
                cwd: path.join(rootDirectory, options.workingDirectory || ''),
                env: {
                    ...process.env,
                    ...(authorName ? { GIT_AUTHOR_NAME: authorName, GIT_COMMITTER_NAME: authorName } : {}),
                    ...(authorEmail
                        ? { GIT_AUTHOR_EMAIL: authorEmail, GIT_COMMITTER_EMAIL: authorEmail }
                        : {}),
                },
            };
            return new Promise((resolve, reject) => {
                (0, child_process_1.spawn)('git', args, spawnOptions).on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    }
                    else {
                        reject(code);
                    }
                });
            });
        };
        const hasCommand = await execute(['--version']).then(() => true, () => false);
        if (!hasCommand) {
            return;
        }
        const insideRepo = await execute(['rev-parse', '--is-inside-work-tree'], true).then(() => true, () => false);
        if (insideRepo) {
            context.logger.info(core_1.tags.oneLine `
        Directory is already under version control.
        Skipping initialization of git.
      `);
            return;
        }
        // if git is not found or an error was thrown during the `git`
        // init process just swallow any errors here
        // NOTE: This will be removed once task error handling is implemented
        try {
            await execute(['init']);
            await execute(['add', '.']);
            if (options.commit) {
                const message = options.message || 'initial commit';
                await execute(['commit', `-m "${message}"`]);
            }
            context.logger.info('Successfully initialized git.');
        }
        catch (_a) { }
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL3JlcG8taW5pdC9leGVjdXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwrQ0FBNEM7QUFDNUMsaURBQW9EO0FBQ3BELDJDQUE2QjtBQU83QixtQkFDRSxpQkFBMEQsRUFBRTtJQUU1RCxNQUFNLGFBQWEsR0FBRyxjQUFjLENBQUMsYUFBYSxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUVwRSxPQUFPLEtBQUssRUFBRSxVQUE0QyxFQUFFLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1FBQ3pGLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFDdEMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQztRQUV4QyxNQUFNLE9BQU8sR0FBRyxDQUFDLElBQWMsRUFBRSxpQkFBMkIsRUFBRSxFQUFFO1lBQzlELE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQztZQUM5QixNQUFNLFdBQVcsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQ2xFLE1BQU0sWUFBWSxHQUFpQjtnQkFDakMsS0FBSyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsV0FBVyxDQUFDO2dCQUNqRCxLQUFLLEVBQUUsSUFBSTtnQkFDWCxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLGdCQUFnQixJQUFJLEVBQUUsQ0FBQztnQkFDN0QsR0FBRyxFQUFFO29CQUNILEdBQUcsT0FBTyxDQUFDLEdBQUc7b0JBQ2QsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3RGLEdBQUcsQ0FBQyxXQUFXO3dCQUNiLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUU7d0JBQ3JFLENBQUMsQ0FBQyxFQUFFLENBQUM7aUJBQ1I7YUFDRixDQUFDO1lBRUYsT0FBTyxJQUFJLE9BQU8sQ0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDM0MsSUFBQSxxQkFBSyxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFO29CQUM1RCxJQUFJLElBQUksS0FBSyxDQUFDLEVBQUU7d0JBQ2QsT0FBTyxFQUFFLENBQUM7cUJBQ1g7eUJBQU07d0JBQ0wsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO3FCQUNkO2dCQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUM7UUFFRixNQUFNLFVBQVUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUNsRCxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQ1YsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUNaLENBQUM7UUFDRixJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ2YsT0FBTztTQUNSO1FBRUQsTUFBTSxVQUFVLEdBQUcsTUFBTSxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsdUJBQXVCLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQ2pGLEdBQUcsRUFBRSxDQUFDLElBQUksRUFDVixHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQ1osQ0FBQztRQUNGLElBQUksVUFBVSxFQUFFO1lBQ2QsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBSSxDQUFDLE9BQU8sQ0FBQTs7O09BRy9CLENBQUMsQ0FBQztZQUVILE9BQU87U0FDUjtRQUVELDhEQUE4RDtRQUM5RCw0Q0FBNEM7UUFDNUMscUVBQXFFO1FBQ3JFLElBQUk7WUFDRixNQUFNLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDeEIsTUFBTSxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUU1QixJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUU7Z0JBQ2xCLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLElBQUksZ0JBQWdCLENBQUM7Z0JBRXBELE1BQU0sT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLE9BQU8sT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQzlDO1lBRUQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsK0JBQStCLENBQUMsQ0FBQztTQUN0RDtRQUFDLFdBQU0sR0FBRTtJQUNaLENBQUMsQ0FBQztBQUNKLENBQUM7QUF6RUQsNEJBeUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IHRhZ3MgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBTcGF3bk9wdGlvbnMsIHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgU2NoZW1hdGljQ29udGV4dCwgVGFza0V4ZWN1dG9yIH0gZnJvbSAnLi4vLi4vc3JjJztcbmltcG9ydCB7XG4gIFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2tGYWN0b3J5T3B0aW9ucyxcbiAgUmVwb3NpdG9yeUluaXRpYWxpemVyVGFza09wdGlvbnMsXG59IGZyb20gJy4vb3B0aW9ucyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChcbiAgZmFjdG9yeU9wdGlvbnM6IFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2tGYWN0b3J5T3B0aW9ucyA9IHt9LFxuKTogVGFza0V4ZWN1dG9yPFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2tPcHRpb25zPiB7XG4gIGNvbnN0IHJvb3REaXJlY3RvcnkgPSBmYWN0b3J5T3B0aW9ucy5yb290RGlyZWN0b3J5IHx8IHByb2Nlc3MuY3dkKCk7XG5cbiAgcmV0dXJuIGFzeW5jIChvcHRpb25zOiBSZXBvc2l0b3J5SW5pdGlhbGl6ZXJUYXNrT3B0aW9ucyA9IHt9LCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3QgYXV0aG9yTmFtZSA9IG9wdGlvbnMuYXV0aG9yTmFtZTtcbiAgICBjb25zdCBhdXRob3JFbWFpbCA9IG9wdGlvbnMuYXV0aG9yRW1haWw7XG5cbiAgICBjb25zdCBleGVjdXRlID0gKGFyZ3M6IHN0cmluZ1tdLCBpZ25vcmVFcnJvclN0cmVhbT86IGJvb2xlYW4pID0+IHtcbiAgICAgIGNvbnN0IG91dHB1dFN0cmVhbSA9ICdpZ25vcmUnO1xuICAgICAgY29uc3QgZXJyb3JTdHJlYW0gPSBpZ25vcmVFcnJvclN0cmVhbSA/ICdpZ25vcmUnIDogcHJvY2Vzcy5zdGRlcnI7XG4gICAgICBjb25zdCBzcGF3bk9wdGlvbnM6IFNwYXduT3B0aW9ucyA9IHtcbiAgICAgICAgc3RkaW86IFtwcm9jZXNzLnN0ZGluLCBvdXRwdXRTdHJlYW0sIGVycm9yU3RyZWFtXSxcbiAgICAgICAgc2hlbGw6IHRydWUsXG4gICAgICAgIGN3ZDogcGF0aC5qb2luKHJvb3REaXJlY3RvcnksIG9wdGlvbnMud29ya2luZ0RpcmVjdG9yeSB8fCAnJyksXG4gICAgICAgIGVudjoge1xuICAgICAgICAgIC4uLnByb2Nlc3MuZW52LFxuICAgICAgICAgIC4uLihhdXRob3JOYW1lID8geyBHSVRfQVVUSE9SX05BTUU6IGF1dGhvck5hbWUsIEdJVF9DT01NSVRURVJfTkFNRTogYXV0aG9yTmFtZSB9IDoge30pLFxuICAgICAgICAgIC4uLihhdXRob3JFbWFpbFxuICAgICAgICAgICAgPyB7IEdJVF9BVVRIT1JfRU1BSUw6IGF1dGhvckVtYWlsLCBHSVRfQ09NTUlUVEVSX0VNQUlMOiBhdXRob3JFbWFpbCB9XG4gICAgICAgICAgICA6IHt9KSxcbiAgICAgICAgfSxcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHNwYXduKCdnaXQnLCBhcmdzLCBzcGF3bk9wdGlvbnMpLm9uKCdjbG9zZScsIChjb2RlOiBudW1iZXIpID0+IHtcbiAgICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWplY3QoY29kZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb25zdCBoYXNDb21tYW5kID0gYXdhaXQgZXhlY3V0ZShbJy0tdmVyc2lvbiddKS50aGVuKFxuICAgICAgKCkgPT4gdHJ1ZSxcbiAgICAgICgpID0+IGZhbHNlLFxuICAgICk7XG4gICAgaWYgKCFoYXNDb21tYW5kKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaW5zaWRlUmVwbyA9IGF3YWl0IGV4ZWN1dGUoWydyZXYtcGFyc2UnLCAnLS1pcy1pbnNpZGUtd29yay10cmVlJ10sIHRydWUpLnRoZW4oXG4gICAgICAoKSA9PiB0cnVlLFxuICAgICAgKCkgPT4gZmFsc2UsXG4gICAgKTtcbiAgICBpZiAoaW5zaWRlUmVwbykge1xuICAgICAgY29udGV4dC5sb2dnZXIuaW5mbyh0YWdzLm9uZUxpbmVgXG4gICAgICAgIERpcmVjdG9yeSBpcyBhbHJlYWR5IHVuZGVyIHZlcnNpb24gY29udHJvbC5cbiAgICAgICAgU2tpcHBpbmcgaW5pdGlhbGl6YXRpb24gb2YgZ2l0LlxuICAgICAgYCk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBpZiBnaXQgaXMgbm90IGZvdW5kIG9yIGFuIGVycm9yIHdhcyB0aHJvd24gZHVyaW5nIHRoZSBgZ2l0YFxuICAgIC8vIGluaXQgcHJvY2VzcyBqdXN0IHN3YWxsb3cgYW55IGVycm9ycyBoZXJlXG4gICAgLy8gTk9URTogVGhpcyB3aWxsIGJlIHJlbW92ZWQgb25jZSB0YXNrIGVycm9yIGhhbmRsaW5nIGlzIGltcGxlbWVudGVkXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGV4ZWN1dGUoWydpbml0J10pO1xuICAgICAgYXdhaXQgZXhlY3V0ZShbJ2FkZCcsICcuJ10pO1xuXG4gICAgICBpZiAob3B0aW9ucy5jb21taXQpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZSB8fCAnaW5pdGlhbCBjb21taXQnO1xuXG4gICAgICAgIGF3YWl0IGV4ZWN1dGUoWydjb21taXQnLCBgLW0gXCIke21lc3NhZ2V9XCJgXSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnRleHQubG9nZ2VyLmluZm8oJ1N1Y2Nlc3NmdWxseSBpbml0aWFsaXplZCBnaXQuJyk7XG4gICAgfSBjYXRjaCB7fVxuICB9O1xufVxuIl19