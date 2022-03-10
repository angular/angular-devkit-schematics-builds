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
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownPackageManagerException = void 0;
const core_1 = require("@angular-devkit/core");
const child_process_1 = require("child_process");
const ora_1 = __importDefault(require("ora"));
const path = __importStar(require("path"));
const rxjs_1 = require("rxjs");
const src_1 = require("../../src");
const packageManagers = {
    'npm': {
        quietArgument: '--quiet',
        commands: {
            installAll: 'install',
            installPackage: 'install',
        },
    },
    'cnpm': {
        commands: {
            installAll: 'install',
            installPackage: 'install',
        },
    },
    'yarn': {
        quietArgument: '--silent',
        commands: {
            installPackage: 'add',
        },
    },
    'pnpm': {
        quietArgument: '--silent',
        commands: {
            installAll: 'install',
            installPackage: 'install',
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
    return (options = { command: 'install' }) => {
        let taskPackageManagerProfile = packageManagerProfile;
        let taskPackageManagerName = packageManagerName;
        if (factoryOptions.allowPackageManagerOverride && options.packageManager) {
            taskPackageManagerProfile = packageManagers[options.packageManager];
            if (!taskPackageManagerProfile) {
                throw new UnknownPackageManagerException(options.packageManager);
            }
            taskPackageManagerName = options.packageManager;
        }
        const bufferedOutput = [];
        const spawnOptions = {
            stdio: options.hideOutput ? 'pipe' : 'inherit',
            shell: true,
            cwd: path.join(rootDirectory, options.workingDirectory || ''),
        };
        const args = [];
        if (options.packageName) {
            if (options.command === 'install') {
                args.push(taskPackageManagerProfile.commands.installPackage);
            }
            args.push(options.packageName);
        }
        else if (options.command === 'install' && taskPackageManagerProfile.commands.installAll) {
            args.push(taskPackageManagerProfile.commands.installAll);
        }
        if (options.quiet && taskPackageManagerProfile.quietArgument) {
            args.push(taskPackageManagerProfile.quietArgument);
        }
        if (factoryOptions.registry) {
            args.push(`--registry="${factoryOptions.registry}"`);
        }
        if (factoryOptions.force) {
            args.push('--force');
        }
        return new rxjs_1.Observable((obs) => {
            var _a, _b;
            const spinner = (0, ora_1.default)({
                text: `Installing packages (${taskPackageManagerName})...`,
                // Workaround for https://github.com/sindresorhus/ora/issues/136.
                discardStdin: process.platform != 'win32',
            }).start();
            const childProcess = (0, child_process_1.spawn)(taskPackageManagerName, args, spawnOptions).on('close', (code) => {
                if (code === 0) {
                    spinner.succeed('Packages installed successfully.');
                    spinner.stop();
                    obs.next();
                    obs.complete();
                }
                else {
                    if (options.hideOutput) {
                        bufferedOutput.forEach(({ stream, data }) => stream.write(data));
                    }
                    spinner.fail('Package install failed, see above.');
                    obs.error(new src_1.UnsuccessfulWorkflowExecution());
                }
            });
            if (options.hideOutput) {
                (_a = childProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => bufferedOutput.push({ stream: process.stdout, data: data }));
                (_b = childProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (data) => bufferedOutput.push({ stream: process.stderr, data: data }));
            }
        });
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL3BhY2thZ2UtbWFuYWdlci9leGVjdXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILCtDQUFxRDtBQUNyRCxpREFBb0Q7QUFDcEQsOENBQXNCO0FBQ3RCLDJDQUE2QjtBQUM3QiwrQkFBa0M7QUFDbEMsbUNBQXdFO0FBV3hFLE1BQU0sZUFBZSxHQUE4QztJQUNqRSxLQUFLLEVBQUU7UUFDTCxhQUFhLEVBQUUsU0FBUztRQUN4QixRQUFRLEVBQUU7WUFDUixVQUFVLEVBQUUsU0FBUztZQUNyQixjQUFjLEVBQUUsU0FBUztTQUMxQjtLQUNGO0lBQ0QsTUFBTSxFQUFFO1FBQ04sUUFBUSxFQUFFO1lBQ1IsVUFBVSxFQUFFLFNBQVM7WUFDckIsY0FBYyxFQUFFLFNBQVM7U0FDMUI7S0FDRjtJQUNELE1BQU0sRUFBRTtRQUNOLGFBQWEsRUFBRSxVQUFVO1FBQ3pCLFFBQVEsRUFBRTtZQUNSLGNBQWMsRUFBRSxLQUFLO1NBQ3RCO0tBQ0Y7SUFDRCxNQUFNLEVBQUU7UUFDTixhQUFhLEVBQUUsVUFBVTtRQUN6QixRQUFRLEVBQUU7WUFDUixVQUFVLEVBQUUsU0FBUztZQUNyQixjQUFjLEVBQUUsU0FBUztTQUMxQjtLQUNGO0NBQ0YsQ0FBQztBQUVGLE1BQWEsOEJBQStCLFNBQVEsb0JBQWE7SUFDL0QsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyw0QkFBNEIsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUM5QyxDQUFDO0NBQ0Y7QUFKRCx3RUFJQztBQUVELG1CQUNFLGlCQUFnRCxFQUFFO0lBRWxELE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxDQUFDLGNBQWMsSUFBSSxLQUFLLENBQUM7SUFDbEUs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Z2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IFNwYXduT3B0aW9ucywgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBvcmEgZnJvbSAnb3JhJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBUYXNrRXhlY3V0b3IsIFVuc3VjY2Vzc2Z1bFdvcmtmbG93RXhlY3V0aW9uIH0gZnJvbSAnLi4vLi4vc3JjJztcbmltcG9ydCB7IE5vZGVQYWNrYWdlVGFza0ZhY3RvcnlPcHRpb25zLCBOb2RlUGFja2FnZVRhc2tPcHRpb25zIH0gZnJvbSAnLi9vcHRpb25zJztcblxuaW50ZXJmYWNlIFBhY2thZ2VNYW5hZ2VyUHJvZmlsZSB7XG4gIHF1aWV0QXJndW1lbnQ/OiBzdHJpbmc7XG4gIGNvbW1hbmRzOiB7XG4gICAgaW5zdGFsbEFsbD86IHN0cmluZztcbiAgICBpbnN0YWxsUGFja2FnZTogc3RyaW5nO1xuICB9O1xufVxuXG5jb25zdCBwYWNrYWdlTWFuYWdlcnM6IHsgW25hbWU6IHN0cmluZ106IFBhY2thZ2VNYW5hZ2VyUHJvZmlsZSB9ID0ge1xuICAnbnBtJzoge1xuICAgIHF1aWV0QXJndW1lbnQ6ICctLXF1aWV0JyxcbiAgICBjb21tYW5kczoge1xuICAgICAgaW5zdGFsbEFsbDogJ2luc3RhbGwnLFxuICAgICAgaW5zdGFsbFBhY2thZ2U6ICdpbnN0YWxsJyxcbiAgICB9LFxuICB9LFxuICAnY25wbSc6IHtcbiAgICBjb21tYW5kczoge1xuICAgICAgaW5zdGFsbEFsbDogJ2luc3RhbGwnLFxuICAgICAgaW5zdGFsbFBhY2thZ2U6ICdpbnN0YWxsJyxcbiAgICB9LFxuICB9LFxuICAneWFybic6IHtcbiAgICBxdWlldEFyZ3VtZW50OiAnLS1zaWxlbnQnLFxuICAgIGNvbW1hbmRzOiB7XG4gICAgICBpbnN0YWxsUGFja2FnZTogJ2FkZCcsXG4gICAgfSxcbiAgfSxcbiAgJ3BucG0nOiB7XG4gICAgcXVpZXRBcmd1bWVudDogJy0tc2lsZW50JyxcbiAgICBjb21tYW5kczoge1xuICAgICAgaW5zdGFsbEFsbDogJ2luc3RhbGwnLFxuICAgICAgaW5zdGFsbFBhY2thZ2U6ICdpbnN0YWxsJyxcbiAgICB9LFxuICB9LFxufTtcblxuZXhwb3J0IGNsYXNzIFVua25vd25QYWNrYWdlTWFuYWdlckV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgVW5rbm93biBwYWNrYWdlIG1hbmFnZXIgXCIke25hbWV9XCIuYCk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKFxuICBmYWN0b3J5T3B0aW9uczogTm9kZVBhY2thZ2VUYXNrRmFjdG9yeU9wdGlvbnMgPSB7fSxcbik6IFRhc2tFeGVjdXRvcjxOb2RlUGFja2FnZVRhc2tPcHRpb25zPiB7XG4gIGNvbnN0IHBhY2thZ2VNYW5hZ2VyTmFtZSA9IGZhY3RvcnlPcHRpb25zLnBhY2thZ2VNYW5hZ2VyIHx8ICducG0nO1xuICBjb25zdCBwYWNrYWdlTWFuYWdlclByb2ZpbGUgPSBwYWNrYWdlTWFuYWdlcnNbcGFja2FnZU1hbmFnZXJOYW1lXTtcbiAgaWYgKCFwYWNrYWdlTWFuYWdlclByb2ZpbGUpIHtcbiAgICB0aHJvdyBuZXcgVW5rbm93blBhY2thZ2VNYW5hZ2VyRXhjZXB0aW9uKHBhY2thZ2VNYW5hZ2VyTmFtZSk7XG4gIH1cblxuICBjb25zdCByb290RGlyZWN0b3J5ID0gZmFjdG9yeU9wdGlvbnMucm9vdERpcmVjdG9yeSB8fCBwcm9jZXNzLmN3ZCgpO1xuXG4gIHJldHVybiAob3B0aW9uczogTm9kZVBhY2thZ2VUYXNrT3B0aW9ucyA9IHsgY29tbWFuZDogJ2luc3RhbGwnIH0pID0+IHtcbiAgICBsZXQgdGFza1BhY2thZ2VNYW5hZ2VyUHJvZmlsZSA9IHBhY2thZ2VNYW5hZ2VyUHJvZmlsZTtcbiAgICBsZXQgdGFza1BhY2thZ2VNYW5hZ2VyTmFtZSA9IHBhY2thZ2VNYW5hZ2VyTmFtZTtcbiAgICBpZiAoZmFjdG9yeU9wdGlvbnMuYWxsb3dQYWNrYWdlTWFuYWdlck92ZXJyaWRlICYmIG9wdGlvbnMucGFja2FnZU1hbmFnZXIpIHtcbiAgICAgIHRhc2tQYWNrYWdlTWFuYWdlclByb2ZpbGUgPSBwYWNrYWdlTWFuYWdlcnNbb3B0aW9ucy5wYWNrYWdlTWFuYWdlcl07XG4gICAgICBpZiAoIXRhc2tQYWNrYWdlTWFuYWdlclByb2ZpbGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IFVua25vd25QYWNrYWdlTWFuYWdlckV4Y2VwdGlvbihvcHRpb25zLnBhY2thZ2VNYW5hZ2VyKTtcbiAgICAgIH1cbiAgICAgIHRhc2tQYWNrYWdlTWFuYWdlck5hbWUgPSBvcHRpb25zLnBhY2thZ2VNYW5hZ2VyO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1ZmZlcmVkT3V0cHV0OiB7IHN0cmVhbTogTm9kZUpTLldyaXRlU3RyZWFtOyBkYXRhOiBCdWZmZXIgfVtdID0gW107XG4gICAgY29uc3Qgc3Bhd25PcHRpb25zOiBTcGF3bk9wdGlvbnMgPSB7XG4gICAgICBzdGRpbzogb3B0aW9ucy5oaWRlT3V0cHV0ID8gJ3BpcGUnIDogJ2luaGVyaXQnLFxuICAgICAgc2hlbGw6IHRydWUsXG4gICAgICBjd2Q6IHBhdGguam9pbihyb290RGlyZWN0b3J5LCBvcHRpb25zLndvcmtpbmdEaXJlY3RvcnkgfHwgJycpLFxuICAgIH07XG4gICAgY29uc3QgYXJnczogc3RyaW5nW10gPSBbXTtcblxuICAgIGlmIChvcHRpb25zLnBhY2thZ2VOYW1lKSB7XG4gICAgICBpZiAob3B0aW9ucy5jb21tYW5kID09PSAnaW5zdGFsbCcpIHtcbiAgICAgICAgYXJncy5wdXNoKHRhc2tQYWNrYWdlTWFuYWdlclByb2ZpbGUuY29tbWFuZHMuaW5zdGFsbFBhY2thZ2UpO1xuICAgICAgfVxuICAgICAgYXJncy5wdXNoKG9wdGlvbnMucGFja2FnZU5hbWUpO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5jb21tYW5kID09PSAnaW5zdGFsbCcgJiYgdGFza1BhY2thZ2VNYW5hZ2VyUHJvZmlsZS5jb21tYW5kcy5pbnN0YWxsQWxsKSB7XG4gICAgICBhcmdzLnB1c2godGFza1BhY2thZ2VNYW5hZ2VyUHJvZmlsZS5jb21tYW5kcy5pbnN0YWxsQWxsKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5xdWlldCAmJiB0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlLnF1aWV0QXJndW1lbnQpIHtcbiAgICAgIGFyZ3MucHVzaCh0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlLnF1aWV0QXJndW1lbnQpO1xuICAgIH1cblxuICAgIGlmIChmYWN0b3J5T3B0aW9ucy5yZWdpc3RyeSkge1xuICAgICAgYXJncy5wdXNoKGAtLXJlZ2lzdHJ5PVwiJHtmYWN0b3J5T3B0aW9ucy5yZWdpc3RyeX1cImApO1xuICAgIH1cblxuICAgIGlmIChmYWN0b3J5T3B0aW9ucy5mb3JjZSkge1xuICAgICAgYXJncy5wdXNoKCctLWZvcmNlJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlKChvYnMpID0+IHtcbiAgICAgIGNvbnN0IHNwaW5uZXIgPSBvcmEoe1xuICAgICAgICB0ZXh0OiBgSW5zdGFsbGluZyBwYWNrYWdlcyAoJHt0YXNrUGFja2FnZU1hbmFnZXJOYW1lfSkuLi5gLFxuICAgICAgICAvLyBXb3JrYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vc2luZHJlc29yaHVzL29yYS9pc3N1ZXMvMTM2LlxuICAgICAgICBkaXNjYXJkU3RkaW46IHByb2Nlc3MucGxhdGZvcm0gIT0gJ3dpbjMyJyxcbiAgICAgIH0pLnN0YXJ0KCk7XG4gICAgICBjb25zdCBjaGlsZFByb2Nlc3MgPSBzcGF3bih0YXNrUGFja2FnZU1hbmFnZXJOYW1lLCBhcmdzLCBzcGF3bk9wdGlvbnMpLm9uKFxuICAgICAgICAnY2xvc2UnLFxuICAgICAgICAoY29kZTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgaWYgKGNvZGUgPT09IDApIHtcbiAgICAgICAgICAgIHNwaW5uZXIuc3VjY2VlZCgnUGFja2FnZXMgaW5zdGFsbGVkIHN1Y2Nlc3NmdWxseS4nKTtcbiAgICAgICAgICAgIHNwaW5uZXIuc3RvcCgpO1xuICAgICAgICAgICAgb2JzLm5leHQoKTtcbiAgICAgICAgICAgIG9icy5jb21wbGV0ZSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5oaWRlT3V0cHV0KSB7XG4gICAgICAgICAgICAgIGJ1ZmZlcmVkT3V0cHV0LmZvckVhY2goKHsgc3RyZWFtLCBkYXRhIH0pID0+IHN0cmVhbS53cml0ZShkYXRhKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzcGlubmVyLmZhaWwoJ1BhY2thZ2UgaW5zdGFsbCBmYWlsZWQsIHNlZSBhYm92ZS4nKTtcbiAgICAgICAgICAgIG9icy5lcnJvcihuZXcgVW5zdWNjZXNzZnVsV29ya2Zsb3dFeGVjdXRpb24oKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgKTtcbiAgICAgIGlmIChvcHRpb25zLmhpZGVPdXRwdXQpIHtcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZG91dD8ub24oJ2RhdGEnLCAoZGF0YTogQnVmZmVyKSA9PlxuICAgICAgICAgIGJ1ZmZlcmVkT3V0cHV0LnB1c2goeyBzdHJlYW06IHByb2Nlc3Muc3Rkb3V0LCBkYXRhOiBkYXRhIH0pLFxuICAgICAgICApO1xuICAgICAgICBjaGlsZFByb2Nlc3Muc3RkZXJyPy5vbignZGF0YScsIChkYXRhOiBCdWZmZXIpID0+XG4gICAgICAgICAgYnVmZmVyZWRPdXRwdXQucHVzaCh7IHN0cmVhbTogcHJvY2Vzcy5zdGRlcnIsIGRhdGE6IGRhdGEgfSksXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59XG4iXX0=