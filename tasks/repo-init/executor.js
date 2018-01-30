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
                env: {
                    GIT_AUTHOR_NAME: authorName,
                    GIT_COMMITTER_NAME: authorName,
                    GIT_AUTHOR_EMAIL: authorEmail,
                    GIT_COMMITTER_EMAIL: authorEmail,
                },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MvcmVwby1pbml0L2V4ZWN1dG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FBNEM7QUFFNUMsaURBQW9EO0FBQ3BELDZCQUE2QjtBQU83QixtQkFDRSxpQkFBMEQsRUFBRTtJQUU1RCxNQUFNLGFBQWEsR0FBRyxjQUFjLENBQUMsYUFBYSxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUVwRSxNQUFNLENBQUMsQ0FBTyxPQUF5QyxFQUFFLE9BQXlCLEVBQUUsRUFBRTtRQUNwRixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBQ3RDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUM7UUFFeEMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxJQUFjLEVBQUUsaUJBQTJCLEVBQUUsRUFBRTtZQUM5RCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUM7WUFDOUIsTUFBTSxXQUFXLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUNsRSxNQUFNLFlBQVksR0FBaUI7Z0JBQ2pDLEtBQUssRUFBRyxDQUFFLE9BQU8sQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLFdBQVcsQ0FBRTtnQkFDcEQsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFLENBQUM7Z0JBQzdELEdBQUcsRUFBRTtvQkFDSCxlQUFlLEVBQUUsVUFBVTtvQkFDM0Isa0JBQWtCLEVBQUUsVUFBVTtvQkFDOUIsZ0JBQWdCLEVBQUUsV0FBVztvQkFDN0IsbUJBQW1CLEVBQUUsV0FBVztpQkFDakM7YUFDRixDQUFDO1lBRUYsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUMzQyxxQkFBSyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDO3FCQUM3QixFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUU7b0JBQzVCLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNmLE9BQU8sRUFBRSxDQUFDO29CQUNaLENBQUM7b0JBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ04sTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNmLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQztRQUVGLE1BQU0sVUFBVSxHQUFHLE1BQU0sT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDNUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDaEIsTUFBTSxDQUFDO1FBQ1QsQ0FBQztRQUVELE1BQU0sVUFBVSxHQUFHLE1BQU0sT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLHVCQUF1QixDQUFDLEVBQUUsSUFBSSxDQUFDO2FBQzNFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNmLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQUksQ0FBQyxPQUFPLENBQUE7OztPQUcvQixDQUFDLENBQUM7WUFFSCxNQUFNLENBQUM7UUFDVCxDQUFDO1FBRUQsOERBQThEO1FBQzlELDRDQUE0QztRQUM1QyxxRUFBcUU7UUFDckUsSUFBSSxDQUFDO1lBQ0gsTUFBTSxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLE1BQU0sT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFNUIsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ25CLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLElBQUksZ0JBQWdCLENBQUM7Z0JBRXBELE1BQU0sT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLE9BQU8sT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQy9DLENBQUM7WUFFRCxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFBQyxLQUFLLENBQUMsQ0FBQyxJQUFELENBQUMsQ0FBQSxDQUFDO0lBQ1osQ0FBQyxDQUFBLENBQUM7QUFDSixDQUFDO0FBckVELDRCQXFFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IHRhZ3MgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBTY2hlbWF0aWNDb250ZXh0LCBUYXNrRXhlY3V0b3IgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyBTcGF3bk9wdGlvbnMsIHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtcbiAgUmVwb3NpdG9yeUluaXRpYWxpemVyVGFza0ZhY3RvcnlPcHRpb25zLFxuICBSZXBvc2l0b3J5SW5pdGlhbGl6ZXJUYXNrT3B0aW9ucyxcbn0gZnJvbSAnLi9vcHRpb25zJztcblxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihcbiAgZmFjdG9yeU9wdGlvbnM6IFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2tGYWN0b3J5T3B0aW9ucyA9IHt9LFxuKTogVGFza0V4ZWN1dG9yPFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2tPcHRpb25zPiB7XG4gIGNvbnN0IHJvb3REaXJlY3RvcnkgPSBmYWN0b3J5T3B0aW9ucy5yb290RGlyZWN0b3J5IHx8IHByb2Nlc3MuY3dkKCk7XG5cbiAgcmV0dXJuIGFzeW5jIChvcHRpb25zOiBSZXBvc2l0b3J5SW5pdGlhbGl6ZXJUYXNrT3B0aW9ucywgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IGF1dGhvck5hbWUgPSBvcHRpb25zLmF1dGhvck5hbWU7XG4gICAgY29uc3QgYXV0aG9yRW1haWwgPSBvcHRpb25zLmF1dGhvckVtYWlsO1xuXG4gICAgY29uc3QgZXhlY3V0ZSA9IChhcmdzOiBzdHJpbmdbXSwgaWdub3JlRXJyb3JTdHJlYW0/OiBib29sZWFuKSA9PiB7XG4gICAgICBjb25zdCBvdXRwdXRTdHJlYW0gPSAnaWdub3JlJztcbiAgICAgIGNvbnN0IGVycm9yU3RyZWFtID0gaWdub3JlRXJyb3JTdHJlYW0gPyAnaWdub3JlJyA6IHByb2Nlc3Muc3RkZXJyO1xuICAgICAgY29uc3Qgc3Bhd25PcHRpb25zOiBTcGF3bk9wdGlvbnMgPSB7XG4gICAgICAgIHN0ZGlvOiAgWyBwcm9jZXNzLnN0ZGluLCBvdXRwdXRTdHJlYW0sIGVycm9yU3RyZWFtIF0sXG4gICAgICAgIHNoZWxsOiB0cnVlLFxuICAgICAgICBjd2Q6IHBhdGguam9pbihyb290RGlyZWN0b3J5LCBvcHRpb25zLndvcmtpbmdEaXJlY3RvcnkgfHwgJycpLFxuICAgICAgICBlbnY6IHtcbiAgICAgICAgICBHSVRfQVVUSE9SX05BTUU6IGF1dGhvck5hbWUsXG4gICAgICAgICAgR0lUX0NPTU1JVFRFUl9OQU1FOiBhdXRob3JOYW1lLFxuICAgICAgICAgIEdJVF9BVVRIT1JfRU1BSUw6IGF1dGhvckVtYWlsLFxuICAgICAgICAgIEdJVF9DT01NSVRURVJfRU1BSUw6IGF1dGhvckVtYWlsLFxuICAgICAgICB9LFxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgc3Bhd24oJ2dpdCcsIGFyZ3MsIHNwYXduT3B0aW9ucylcbiAgICAgICAgICAub24oJ2Nsb3NlJywgKGNvZGU6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgaWYgKGNvZGUgPT09IDApIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVqZWN0KGNvZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb25zdCBoYXNDb21tYW5kID0gYXdhaXQgZXhlY3V0ZShbJy0tdmVyc2lvbiddKVxuICAgICAgLnRoZW4oKCkgPT4gdHJ1ZSwgKCkgPT4gZmFsc2UpO1xuICAgIGlmICghaGFzQ29tbWFuZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGluc2lkZVJlcG8gPSBhd2FpdCBleGVjdXRlKFsncmV2LXBhcnNlJywgJy0taXMtaW5zaWRlLXdvcmstdHJlZSddLCB0cnVlKVxuICAgICAgLnRoZW4oKCkgPT4gdHJ1ZSwgKCkgPT4gZmFsc2UpO1xuICAgIGlmIChpbnNpZGVSZXBvKSB7XG4gICAgICBjb250ZXh0LmxvZ2dlci5pbmZvKHRhZ3Mub25lTGluZWBcbiAgICAgICAgRGlyZWN0b3J5IGlzIGFscmVhZHkgdW5kZXIgdmVyc2lvbiBjb250cm9sLlxuICAgICAgICBTa2lwcGluZyBpbml0aWFsaXphdGlvbiBvZiBnaXQuXG4gICAgICBgKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGlmIGdpdCBpcyBub3QgZm91bmQgb3IgYW4gZXJyb3Igd2FzIHRocm93biBkdXJpbmcgdGhlIGBnaXRgXG4gICAgLy8gaW5pdCBwcm9jZXNzIGp1c3Qgc3dhbGxvdyBhbnkgZXJyb3JzIGhlcmVcbiAgICAvLyBOT1RFOiBUaGlzIHdpbGwgYmUgcmVtb3ZlZCBvbmNlIHRhc2sgZXJyb3IgaGFuZGxpbmcgaXMgaW1wbGVtZW50ZWRcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZXhlY3V0ZShbJ2luaXQnXSk7XG4gICAgICBhd2FpdCBleGVjdXRlKFsnYWRkJywgJy4nXSk7XG5cbiAgICAgIGlmIChvcHRpb25zLmNvbW1pdCkge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlIHx8ICdpbml0aWFsIGNvbW1pdCc7XG5cbiAgICAgICAgYXdhaXQgZXhlY3V0ZShbJ2NvbW1pdCcsIGAtbSBcIiR7bWVzc2FnZX1cImBdKTtcbiAgICAgIH1cblxuICAgICAgY29udGV4dC5sb2dnZXIuaW5mbygnU3VjY2Vzc2Z1bGx5IGluaXRpYWxpemVkIGdpdC4nKTtcbiAgICB9IGNhdGNoIHt9XG4gIH07XG59XG4iXX0=