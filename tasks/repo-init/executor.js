"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
function default_1(factoryOptions = {}) {
    const rootDirectory = factoryOptions.rootDirectory || process.cwd();
    return (options, context) => __awaiter(this, void 0, void 0, function* () {
        const authorName = options.authorName;
        const authorEmail = options.authorEmail;
        const execute = (args, ignoreErrorStream) => {
            const outputStream = 'ignore';
            const errorStream = ignoreErrorStream ? 'ignore' : process.stderr;
            const spawnOptions = {
                stdio: [process.stdin, outputStream, errorStream],
                shell: true,
                cwd: path.join(rootDirectory, options.workingDirectory || ''),
                env: Object.assign({}, (authorName
                    ? { GIT_AUTHOR_NAME: authorName, GIT_COMMITTER_NAME: authorName }
                    : {}), (authorEmail
                    ? { GIT_AUTHOR_EMAIL: authorEmail, GIT_COMMITTER_EMAIL: authorEmail }
                    : {})),
            };
            return new Promise((resolve, reject) => {
                child_process_1.spawn('git', args, spawnOptions)
                    .on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    }
                    else {
                        reject(code);
                    }
                });
            });
        };
        const hasCommand = yield execute(['--version'])
            .then(() => true, () => false);
        if (!hasCommand) {
            return;
        }
        const insideRepo = yield execute(['rev-parse', '--is-inside-work-tree'], true)
            .then(() => true, () => false);
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
            yield execute(['init']);
            yield execute(['add', '.']);
            if (options.commit) {
                const message = options.message || 'initial commit';
                yield execute(['commit', `-m "${message}"`]);
            }
            context.logger.info('Successfully initialized git.');
        }
        catch (_a) { }
    });
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MvcmVwby1pbml0L2V4ZWN1dG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FBNEM7QUFDNUMsaURBQW9EO0FBQ3BELDZCQUE2QjtBQVE3QixtQkFDRSxpQkFBMEQsRUFBRTtJQUU1RCxNQUFNLGFBQWEsR0FBRyxjQUFjLENBQUMsYUFBYSxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUVwRSxNQUFNLENBQUMsQ0FBTyxPQUF5QyxFQUFFLE9BQXlCLEVBQUUsRUFBRTtRQUNwRixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBQ3RDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUM7UUFFeEMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxJQUFjLEVBQUUsaUJBQTJCLEVBQUUsRUFBRTtZQUM5RCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUM7WUFDOUIsTUFBTSxXQUFXLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUNsRSxNQUFNLFlBQVksR0FBaUI7Z0JBQ2pDLEtBQUssRUFBRyxDQUFFLE9BQU8sQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLFdBQVcsQ0FBRTtnQkFDcEQsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFLENBQUM7Z0JBQzdELEdBQUcsb0JBQ0UsQ0FBQyxVQUFVO29CQUNaLENBQUMsQ0FBQyxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFFO29CQUNqRSxDQUFDLENBQUMsRUFBRSxDQUNMLEVBQ0UsQ0FBQyxXQUFXO29CQUNiLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUU7b0JBQ3JFLENBQUMsQ0FBQyxFQUFFLENBQ0wsQ0FDRjthQUNGLENBQUM7WUFFRixNQUFNLENBQUMsSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQzNDLHFCQUFLLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxZQUFZLENBQUM7cUJBQzdCLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFZLEVBQUUsRUFBRTtvQkFDNUIsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2YsT0FBTyxFQUFFLENBQUM7b0JBQ1osQ0FBQztvQkFBQyxJQUFJLENBQUMsQ0FBQzt3QkFDTixNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ2YsQ0FBQztnQkFDTCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBRUYsTUFBTSxVQUFVLEdBQUcsTUFBTSxPQUFPLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQzthQUM1QyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNoQixNQUFNLENBQUM7UUFDVCxDQUFDO1FBRUQsTUFBTSxVQUFVLEdBQUcsTUFBTSxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsdUJBQXVCLENBQUMsRUFBRSxJQUFJLENBQUM7YUFDM0UsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQyxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ2YsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBSSxDQUFDLE9BQU8sQ0FBQTs7O09BRy9CLENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQztRQUNULENBQUM7UUFFRCw4REFBOEQ7UUFDOUQsNENBQTRDO1FBQzVDLHFFQUFxRTtRQUNyRSxJQUFJLENBQUM7WUFDSCxNQUFNLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDeEIsTUFBTSxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUU1QixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDbkIsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQztnQkFFcEQsTUFBTSxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDL0MsQ0FBQztZQUVELE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLCtCQUErQixDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUFDLEtBQUssQ0FBQyxDQUFDLElBQUQsQ0FBQyxDQUFBLENBQUM7SUFDWixDQUFDLENBQUEsQ0FBQztBQUNKLENBQUM7QUF6RUQsNEJBeUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgdGFncyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IFNwYXduT3B0aW9ucywgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBTY2hlbWF0aWNDb250ZXh0LCBUYXNrRXhlY3V0b3IgfSBmcm9tICcuLi8uLi9zcmMnO1xuaW1wb3J0IHtcbiAgUmVwb3NpdG9yeUluaXRpYWxpemVyVGFza0ZhY3RvcnlPcHRpb25zLFxuICBSZXBvc2l0b3J5SW5pdGlhbGl6ZXJUYXNrT3B0aW9ucyxcbn0gZnJvbSAnLi9vcHRpb25zJztcblxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihcbiAgZmFjdG9yeU9wdGlvbnM6IFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2tGYWN0b3J5T3B0aW9ucyA9IHt9LFxuKTogVGFza0V4ZWN1dG9yPFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2tPcHRpb25zPiB7XG4gIGNvbnN0IHJvb3REaXJlY3RvcnkgPSBmYWN0b3J5T3B0aW9ucy5yb290RGlyZWN0b3J5IHx8IHByb2Nlc3MuY3dkKCk7XG5cbiAgcmV0dXJuIGFzeW5jIChvcHRpb25zOiBSZXBvc2l0b3J5SW5pdGlhbGl6ZXJUYXNrT3B0aW9ucywgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IGF1dGhvck5hbWUgPSBvcHRpb25zLmF1dGhvck5hbWU7XG4gICAgY29uc3QgYXV0aG9yRW1haWwgPSBvcHRpb25zLmF1dGhvckVtYWlsO1xuXG4gICAgY29uc3QgZXhlY3V0ZSA9IChhcmdzOiBzdHJpbmdbXSwgaWdub3JlRXJyb3JTdHJlYW0/OiBib29sZWFuKSA9PiB7XG4gICAgICBjb25zdCBvdXRwdXRTdHJlYW0gPSAnaWdub3JlJztcbiAgICAgIGNvbnN0IGVycm9yU3RyZWFtID0gaWdub3JlRXJyb3JTdHJlYW0gPyAnaWdub3JlJyA6IHByb2Nlc3Muc3RkZXJyO1xuICAgICAgY29uc3Qgc3Bhd25PcHRpb25zOiBTcGF3bk9wdGlvbnMgPSB7XG4gICAgICAgIHN0ZGlvOiAgWyBwcm9jZXNzLnN0ZGluLCBvdXRwdXRTdHJlYW0sIGVycm9yU3RyZWFtIF0sXG4gICAgICAgIHNoZWxsOiB0cnVlLFxuICAgICAgICBjd2Q6IHBhdGguam9pbihyb290RGlyZWN0b3J5LCBvcHRpb25zLndvcmtpbmdEaXJlY3RvcnkgfHwgJycpLFxuICAgICAgICBlbnY6IHtcbiAgICAgICAgICAuLi4oYXV0aG9yTmFtZVxuICAgICAgICAgICAgPyB7IEdJVF9BVVRIT1JfTkFNRTogYXV0aG9yTmFtZSwgR0lUX0NPTU1JVFRFUl9OQU1FOiBhdXRob3JOYW1lIH1cbiAgICAgICAgICAgIDoge31cbiAgICAgICAgICApLFxuICAgICAgICAgIC4uLihhdXRob3JFbWFpbFxuICAgICAgICAgICAgPyB7IEdJVF9BVVRIT1JfRU1BSUw6IGF1dGhvckVtYWlsLCBHSVRfQ09NTUlUVEVSX0VNQUlMOiBhdXRob3JFbWFpbCB9XG4gICAgICAgICAgICA6IHt9XG4gICAgICAgICAgKSxcbiAgICAgICAgfSxcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHNwYXduKCdnaXQnLCBhcmdzLCBzcGF3bk9wdGlvbnMpXG4gICAgICAgICAgLm9uKCdjbG9zZScsIChjb2RlOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGlmIChjb2RlID09PSAwKSB7XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlamVjdChjb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uc3QgaGFzQ29tbWFuZCA9IGF3YWl0IGV4ZWN1dGUoWyctLXZlcnNpb24nXSlcbiAgICAgIC50aGVuKCgpID0+IHRydWUsICgpID0+IGZhbHNlKTtcbiAgICBpZiAoIWhhc0NvbW1hbmQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpbnNpZGVSZXBvID0gYXdhaXQgZXhlY3V0ZShbJ3Jldi1wYXJzZScsICctLWlzLWluc2lkZS13b3JrLXRyZWUnXSwgdHJ1ZSlcbiAgICAgIC50aGVuKCgpID0+IHRydWUsICgpID0+IGZhbHNlKTtcbiAgICBpZiAoaW5zaWRlUmVwbykge1xuICAgICAgY29udGV4dC5sb2dnZXIuaW5mbyh0YWdzLm9uZUxpbmVgXG4gICAgICAgIERpcmVjdG9yeSBpcyBhbHJlYWR5IHVuZGVyIHZlcnNpb24gY29udHJvbC5cbiAgICAgICAgU2tpcHBpbmcgaW5pdGlhbGl6YXRpb24gb2YgZ2l0LlxuICAgICAgYCk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBpZiBnaXQgaXMgbm90IGZvdW5kIG9yIGFuIGVycm9yIHdhcyB0aHJvd24gZHVyaW5nIHRoZSBgZ2l0YFxuICAgIC8vIGluaXQgcHJvY2VzcyBqdXN0IHN3YWxsb3cgYW55IGVycm9ycyBoZXJlXG4gICAgLy8gTk9URTogVGhpcyB3aWxsIGJlIHJlbW92ZWQgb25jZSB0YXNrIGVycm9yIGhhbmRsaW5nIGlzIGltcGxlbWVudGVkXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGV4ZWN1dGUoWydpbml0J10pO1xuICAgICAgYXdhaXQgZXhlY3V0ZShbJ2FkZCcsICcuJ10pO1xuXG4gICAgICBpZiAob3B0aW9ucy5jb21taXQpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZSB8fCAnaW5pdGlhbCBjb21taXQnO1xuXG4gICAgICAgIGF3YWl0IGV4ZWN1dGUoWydjb21taXQnLCBgLW0gXCIke21lc3NhZ2V9XCJgXSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnRleHQubG9nZ2VyLmluZm8oJ1N1Y2Nlc3NmdWxseSBpbml0aWFsaXplZCBnaXQuJyk7XG4gICAgfSBjYXRjaCB7fVxuICB9O1xufVxuIl19