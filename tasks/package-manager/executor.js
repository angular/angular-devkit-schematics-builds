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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL3BhY2thZ2UtbWFuYWdlci9leGVjdXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsK0NBQXFEO0FBQ3JELGlEQUFvRDtBQUNwRCw4Q0FBc0I7QUFDdEIsMkNBQTZCO0FBQzdCLCtCQUFrQztBQUNsQyxtQ0FBd0U7QUFXeEUsTUFBTSxlQUFlLEdBQThDO0lBQ2pFLEtBQUssRUFBRTtRQUNMLGFBQWEsRUFBRSxTQUFTO1FBQ3hCLFFBQVEsRUFBRTtZQUNSLFVBQVUsRUFBRSxTQUFTO1lBQ3JCLGNBQWMsRUFBRSxTQUFTO1NBQzFCO0tBQ0Y7SUFDRCxNQUFNLEVBQUU7UUFDTixRQUFRLEVBQUU7WUFDUixVQUFVLEVBQUUsU0FBUztZQUNyQixjQUFjLEVBQUUsU0FBUztTQUMxQjtLQUNGO0lBQ0QsTUFBTSxFQUFFO1FBQ04sYUFBYSxFQUFFLFVBQVU7UUFDekIsUUFBUSxFQUFFO1lBQ1IsY0FBYyxFQUFFLEtBQUs7U0FDdEI7S0FDRjtJQUNELE1BQU0sRUFBRTtRQUNOLGFBQWEsRUFBRSxVQUFVO1FBQ3pCLFFBQVEsRUFBRTtZQUNSLFVBQVUsRUFBRSxTQUFTO1lBQ3JCLGNBQWMsRUFBRSxTQUFTO1NBQzFCO0tBQ0Y7Q0FDRixDQUFDO0FBRUYsTUFBYSw4QkFBK0IsU0FBUSxvQkFBYTtJQUMvRCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLDRCQUE0QixJQUFJLElBQUksQ0FBQyxDQUFDO0lBQzlDLENBQUM7Q0FDRjtBQUpELHdFQUlDO0FBRUQsbUJBQ0UsaUJBQWdELEVBQUU7SUFFbEQsTUFBTSxrQkFBa0IsR0FBRyxjQUFjLENBQUMsY0FBYyxJQUFJLEtBQUssQ0FBQztJQUNsRSxNQUFN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TExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgU3Bhd25PcHRpb25zLCBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IG9yYSBmcm9tICdvcmEnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IFRhc2tFeGVjdXRvciwgVW5zdWNjZXNzZnVsV29ya2Zsb3dFeGVjdXRpb24gfSBmcm9tICcuLi8uLi9zcmMnO1xuaW1wb3J0IHsgTm9kZVBhY2thZ2VUYXNrRmFjdG9yeU9wdGlvbnMsIE5vZGVQYWNrYWdlVGFza09wdGlvbnMgfSBmcm9tICcuL29wdGlvbnMnO1xuXG5pbnRlcmZhY2UgUGFja2FnZU1hbmFnZXJQcm9maWxlIHtcbiAgcXVpZXRBcmd1bWVudD86IHN0cmluZztcbiAgY29tbWFuZHM6IHtcbiAgICBpbnN0YWxsQWxsPzogc3RyaW5nO1xuICAgIGluc3RhbGxQYWNrYWdlOiBzdHJpbmc7XG4gIH07XG59XG5cbmNvbnN0IHBhY2thZ2VNYW5hZ2VyczogeyBbbmFtZTogc3RyaW5nXTogUGFja2FnZU1hbmFnZXJQcm9maWxlIH0gPSB7XG4gICducG0nOiB7XG4gICAgcXVpZXRBcmd1bWVudDogJy0tcXVpZXQnLFxuICAgIGNvbW1hbmRzOiB7XG4gICAgICBpbnN0YWxsQWxsOiAnaW5zdGFsbCcsXG4gICAgICBpbnN0YWxsUGFja2FnZTogJ2luc3RhbGwnLFxuICAgIH0sXG4gIH0sXG4gICdjbnBtJzoge1xuICAgIGNvbW1hbmRzOiB7XG4gICAgICBpbnN0YWxsQWxsOiAnaW5zdGFsbCcsXG4gICAgICBpbnN0YWxsUGFja2FnZTogJ2luc3RhbGwnLFxuICAgIH0sXG4gIH0sXG4gICd5YXJuJzoge1xuICAgIHF1aWV0QXJndW1lbnQ6ICctLXNpbGVudCcsXG4gICAgY29tbWFuZHM6IHtcbiAgICAgIGluc3RhbGxQYWNrYWdlOiAnYWRkJyxcbiAgICB9LFxuICB9LFxuICAncG5wbSc6IHtcbiAgICBxdWlldEFyZ3VtZW50OiAnLS1zaWxlbnQnLFxuICAgIGNvbW1hbmRzOiB7XG4gICAgICBpbnN0YWxsQWxsOiAnaW5zdGFsbCcsXG4gICAgICBpbnN0YWxsUGFja2FnZTogJ2luc3RhbGwnLFxuICAgIH0sXG4gIH0sXG59O1xuXG5leHBvcnQgY2xhc3MgVW5rbm93blBhY2thZ2VNYW5hZ2VyRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBVbmtub3duIHBhY2thZ2UgbWFuYWdlciBcIiR7bmFtZX1cIi5gKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoXG4gIGZhY3RvcnlPcHRpb25zOiBOb2RlUGFja2FnZVRhc2tGYWN0b3J5T3B0aW9ucyA9IHt9LFxuKTogVGFza0V4ZWN1dG9yPE5vZGVQYWNrYWdlVGFza09wdGlvbnM+IHtcbiAgY29uc3QgcGFja2FnZU1hbmFnZXJOYW1lID0gZmFjdG9yeU9wdGlvbnMucGFja2FnZU1hbmFnZXIgfHwgJ25wbSc7XG4gIGNvbnN0IHBhY2thZ2VNYW5hZ2VyUHJvZmlsZSA9IHBhY2thZ2VNYW5hZ2Vyc1twYWNrYWdlTWFuYWdlck5hbWVdO1xuICBpZiAoIXBhY2thZ2VNYW5hZ2VyUHJvZmlsZSkge1xuICAgIHRocm93IG5ldyBVbmtub3duUGFja2FnZU1hbmFnZXJFeGNlcHRpb24ocGFja2FnZU1hbmFnZXJOYW1lKTtcbiAgfVxuXG4gIGNvbnN0IHJvb3REaXJlY3RvcnkgPSBmYWN0b3J5T3B0aW9ucy5yb290RGlyZWN0b3J5IHx8IHByb2Nlc3MuY3dkKCk7XG5cbiAgcmV0dXJuIChvcHRpb25zOiBOb2RlUGFja2FnZVRhc2tPcHRpb25zID0geyBjb21tYW5kOiAnaW5zdGFsbCcgfSkgPT4ge1xuICAgIGxldCB0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlID0gcGFja2FnZU1hbmFnZXJQcm9maWxlO1xuICAgIGxldCB0YXNrUGFja2FnZU1hbmFnZXJOYW1lID0gcGFja2FnZU1hbmFnZXJOYW1lO1xuICAgIGlmIChmYWN0b3J5T3B0aW9ucy5hbGxvd1BhY2thZ2VNYW5hZ2VyT3ZlcnJpZGUgJiYgb3B0aW9ucy5wYWNrYWdlTWFuYWdlcikge1xuICAgICAgdGFza1BhY2thZ2VNYW5hZ2VyUHJvZmlsZSA9IHBhY2thZ2VNYW5hZ2Vyc1tvcHRpb25zLnBhY2thZ2VNYW5hZ2VyXTtcbiAgICAgIGlmICghdGFza1BhY2thZ2VNYW5hZ2VyUHJvZmlsZSkge1xuICAgICAgICB0aHJvdyBuZXcgVW5rbm93blBhY2thZ2VNYW5hZ2VyRXhjZXB0aW9uKG9wdGlvbnMucGFja2FnZU1hbmFnZXIpO1xuICAgICAgfVxuICAgICAgdGFza1BhY2thZ2VNYW5hZ2VyTmFtZSA9IG9wdGlvbnMucGFja2FnZU1hbmFnZXI7XG4gICAgfVxuXG4gICAgY29uc3QgYnVmZmVyZWRPdXRwdXQ6IHsgc3RyZWFtOiBOb2RlSlMuV3JpdGVTdHJlYW07IGRhdGE6IEJ1ZmZlciB9W10gPSBbXTtcbiAgICBjb25zdCBzcGF3bk9wdGlvbnM6IFNwYXduT3B0aW9ucyA9IHtcbiAgICAgIHN0ZGlvOiBvcHRpb25zLmhpZGVPdXRwdXQgPyAncGlwZScgOiAnaW5oZXJpdCcsXG4gICAgICBzaGVsbDogdHJ1ZSxcbiAgICAgIGN3ZDogcGF0aC5qb2luKHJvb3REaXJlY3RvcnksIG9wdGlvbnMud29ya2luZ0RpcmVjdG9yeSB8fCAnJyksXG4gICAgfTtcbiAgICBjb25zdCBhcmdzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKG9wdGlvbnMucGFja2FnZU5hbWUpIHtcbiAgICAgIGlmIChvcHRpb25zLmNvbW1hbmQgPT09ICdpbnN0YWxsJykge1xuICAgICAgICBhcmdzLnB1c2godGFza1BhY2thZ2VNYW5hZ2VyUHJvZmlsZS5jb21tYW5kcy5pbnN0YWxsUGFja2FnZSk7XG4gICAgICB9XG4gICAgICBhcmdzLnB1c2gob3B0aW9ucy5wYWNrYWdlTmFtZSk7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLmNvbW1hbmQgPT09ICdpbnN0YWxsJyAmJiB0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlLmNvbW1hbmRzLmluc3RhbGxBbGwpIHtcbiAgICAgIGFyZ3MucHVzaCh0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlLmNvbW1hbmRzLmluc3RhbGxBbGwpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnF1aWV0ICYmIHRhc2tQYWNrYWdlTWFuYWdlclByb2ZpbGUucXVpZXRBcmd1bWVudCkge1xuICAgICAgYXJncy5wdXNoKHRhc2tQYWNrYWdlTWFuYWdlclByb2ZpbGUucXVpZXRBcmd1bWVudCk7XG4gICAgfVxuXG4gICAgaWYgKGZhY3RvcnlPcHRpb25zLnJlZ2lzdHJ5KSB7XG4gICAgICBhcmdzLnB1c2goYC0tcmVnaXN0cnk9XCIke2ZhY3RvcnlPcHRpb25zLnJlZ2lzdHJ5fVwiYCk7XG4gICAgfVxuXG4gICAgaWYgKGZhY3RvcnlPcHRpb25zLmZvcmNlKSB7XG4gICAgICBhcmdzLnB1c2goJy0tZm9yY2UnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGUoKG9icykgPT4ge1xuICAgICAgY29uc3Qgc3Bpbm5lciA9IG9yYSh7XG4gICAgICAgIHRleHQ6IGBJbnN0YWxsaW5nIHBhY2thZ2VzICgke3Rhc2tQYWNrYWdlTWFuYWdlck5hbWV9KS4uLmAsXG4gICAgICAgIC8vIFdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9zaW5kcmVzb3JodXMvb3JhL2lzc3Vlcy8xMzYuXG4gICAgICAgIGRpc2NhcmRTdGRpbjogcHJvY2Vzcy5wbGF0Zm9ybSAhPSAnd2luMzInLFxuICAgICAgfSkuc3RhcnQoKTtcbiAgICAgIGNvbnN0IGNoaWxkUHJvY2VzcyA9IHNwYXduKHRhc2tQYWNrYWdlTWFuYWdlck5hbWUsIGFyZ3MsIHNwYXduT3B0aW9ucykub24oXG4gICAgICAgICdjbG9zZScsXG4gICAgICAgIChjb2RlOiBudW1iZXIpID0+IHtcbiAgICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xuICAgICAgICAgICAgc3Bpbm5lci5zdWNjZWVkKCdQYWNrYWdlcyBpbnN0YWxsZWQgc3VjY2Vzc2Z1bGx5LicpO1xuICAgICAgICAgICAgc3Bpbm5lci5zdG9wKCk7XG4gICAgICAgICAgICBvYnMubmV4dCgpO1xuICAgICAgICAgICAgb2JzLmNvbXBsZXRlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmhpZGVPdXRwdXQpIHtcbiAgICAgICAgICAgICAgYnVmZmVyZWRPdXRwdXQuZm9yRWFjaCgoeyBzdHJlYW0sIGRhdGEgfSkgPT4gc3RyZWFtLndyaXRlKGRhdGEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNwaW5uZXIuZmFpbCgnUGFja2FnZSBpbnN0YWxsIGZhaWxlZCwgc2VlIGFib3ZlLicpO1xuICAgICAgICAgICAgb2JzLmVycm9yKG5ldyBVbnN1Y2Nlc3NmdWxXb3JrZmxvd0V4ZWN1dGlvbigpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgICAgaWYgKG9wdGlvbnMuaGlkZU91dHB1dCkge1xuICAgICAgICBjaGlsZFByb2Nlc3Muc3Rkb3V0Py5vbignZGF0YScsIChkYXRhOiBCdWZmZXIpID0+XG4gICAgICAgICAgYnVmZmVyZWRPdXRwdXQucHVzaCh7IHN0cmVhbTogcHJvY2Vzcy5zdGRvdXQsIGRhdGE6IGRhdGEgfSksXG4gICAgICAgICk7XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRlcnI/Lm9uKCdkYXRhJywgKGRhdGE6IEJ1ZmZlcikgPT5cbiAgICAgICAgICBidWZmZXJlZE91dHB1dC5wdXNoKHsgc3RyZWFtOiBwcm9jZXNzLnN0ZGVyciwgZGF0YTogZGF0YSB9KSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn1cbiJdfQ==