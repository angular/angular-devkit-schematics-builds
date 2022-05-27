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
        commands: {
            installPackage: 'add',
        },
    },
    'pnpm': {
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
            shell: true,
            cwd: path.join(rootDirectory, options.workingDirectory || ''),
        };
        if (options.hideOutput) {
            spawnOptions.stdio = options.quiet ? ['ignore', 'ignore', 'pipe'] : 'pipe';
        }
        else {
            spawnOptions.stdio = options.quiet ? ['ignore', 'ignore', 'inherit'] : 'inherit';
        }
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
        if (!options.allowScripts) {
            args.push('--ignore-scripts');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL3BhY2thZ2UtbWFuYWdlci9leGVjdXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILCtDQUFxRDtBQUNyRCxpREFBb0Q7QUFDcEQsOENBQXNCO0FBQ3RCLDJDQUE2QjtBQUM3QiwrQkFBa0M7QUFDbEMsbUNBQXdFO0FBVXhFLE1BQU0sZUFBZSxHQUE4QztJQUNqRSxLQUFLLEVBQUU7UUFDTCxRQUFRLEVBQUU7WUFDUixVQUFVLEVBQUUsU0FBUztZQUNyQixjQUFjLEVBQUUsU0FBUztTQUMxQjtLQUNGO0lBQ0QsTUFBTSxFQUFFO1FBQ04sUUFBUSxFQUFFO1lBQ1IsVUFBVSxFQUFFLFNBQVM7WUFDckIsY0FBYyxFQUFFLFNBQVM7U0FDMUI7S0FDRjtJQUNELE1BQU0sRUFBRTtRQUNOLFFBQVEsRUFBRTtZQUNSLGNBQWMsRUFBRSxLQUFLO1NBQ3RCO0tBQ0Y7SUFDRCxNQUFNLEVBQUU7UUFDTixRQUFRLEVBQUU7WUFDUixVQUFVLEVBQUUsU0FBUztZQUNyQixjQUFjLEVBQUUsU0FBUztTQUMxQjtLQUNGO0NBQ0YsQ0FBQztBQUVGLE1BQWEsOEJBQStCLFNBQVEsb0JBQWE7SUFDL0QsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyw0QkFBNEIsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUM5QyxDQUFDO0NBQ0Y7QUFKRCx3RUFJQztBQUVELG1CQUNFLGlCQUFnRCxFQUFFO0lBRWxELE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxDQUFDLGNBQWMsSUFBSSxLQUFLLENBQUM7SUFDbEUsTUFBTSxxQkFBcUIsR0FBRyxlQUFlLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNsRSxJQUFJLENBQUMscUJB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YUFDSDtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQXpGRCw0QkF5RkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IFNwYXduT3B0aW9ucywgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBvcmEgZnJvbSAnb3JhJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBUYXNrRXhlY3V0b3IsIFVuc3VjY2Vzc2Z1bFdvcmtmbG93RXhlY3V0aW9uIH0gZnJvbSAnLi4vLi4vc3JjJztcbmltcG9ydCB7IE5vZGVQYWNrYWdlVGFza0ZhY3RvcnlPcHRpb25zLCBOb2RlUGFja2FnZVRhc2tPcHRpb25zIH0gZnJvbSAnLi9vcHRpb25zJztcblxuaW50ZXJmYWNlIFBhY2thZ2VNYW5hZ2VyUHJvZmlsZSB7XG4gIGNvbW1hbmRzOiB7XG4gICAgaW5zdGFsbEFsbD86IHN0cmluZztcbiAgICBpbnN0YWxsUGFja2FnZTogc3RyaW5nO1xuICB9O1xufVxuXG5jb25zdCBwYWNrYWdlTWFuYWdlcnM6IHsgW25hbWU6IHN0cmluZ106IFBhY2thZ2VNYW5hZ2VyUHJvZmlsZSB9ID0ge1xuICAnbnBtJzoge1xuICAgIGNvbW1hbmRzOiB7XG4gICAgICBpbnN0YWxsQWxsOiAnaW5zdGFsbCcsXG4gICAgICBpbnN0YWxsUGFja2FnZTogJ2luc3RhbGwnLFxuICAgIH0sXG4gIH0sXG4gICdjbnBtJzoge1xuICAgIGNvbW1hbmRzOiB7XG4gICAgICBpbnN0YWxsQWxsOiAnaW5zdGFsbCcsXG4gICAgICBpbnN0YWxsUGFja2FnZTogJ2luc3RhbGwnLFxuICAgIH0sXG4gIH0sXG4gICd5YXJuJzoge1xuICAgIGNvbW1hbmRzOiB7XG4gICAgICBpbnN0YWxsUGFja2FnZTogJ2FkZCcsXG4gICAgfSxcbiAgfSxcbiAgJ3BucG0nOiB7XG4gICAgY29tbWFuZHM6IHtcbiAgICAgIGluc3RhbGxBbGw6ICdpbnN0YWxsJyxcbiAgICAgIGluc3RhbGxQYWNrYWdlOiAnaW5zdGFsbCcsXG4gICAgfSxcbiAgfSxcbn07XG5cbmV4cG9ydCBjbGFzcyBVbmtub3duUGFja2FnZU1hbmFnZXJFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFVua25vd24gcGFja2FnZSBtYW5hZ2VyIFwiJHtuYW1lfVwiLmApO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChcbiAgZmFjdG9yeU9wdGlvbnM6IE5vZGVQYWNrYWdlVGFza0ZhY3RvcnlPcHRpb25zID0ge30sXG4pOiBUYXNrRXhlY3V0b3I8Tm9kZVBhY2thZ2VUYXNrT3B0aW9ucz4ge1xuICBjb25zdCBwYWNrYWdlTWFuYWdlck5hbWUgPSBmYWN0b3J5T3B0aW9ucy5wYWNrYWdlTWFuYWdlciB8fCAnbnBtJztcbiAgY29uc3QgcGFja2FnZU1hbmFnZXJQcm9maWxlID0gcGFja2FnZU1hbmFnZXJzW3BhY2thZ2VNYW5hZ2VyTmFtZV07XG4gIGlmICghcGFja2FnZU1hbmFnZXJQcm9maWxlKSB7XG4gICAgdGhyb3cgbmV3IFVua25vd25QYWNrYWdlTWFuYWdlckV4Y2VwdGlvbihwYWNrYWdlTWFuYWdlck5hbWUpO1xuICB9XG5cbiAgY29uc3Qgcm9vdERpcmVjdG9yeSA9IGZhY3RvcnlPcHRpb25zLnJvb3REaXJlY3RvcnkgfHwgcHJvY2Vzcy5jd2QoKTtcblxuICByZXR1cm4gKG9wdGlvbnM6IE5vZGVQYWNrYWdlVGFza09wdGlvbnMgPSB7IGNvbW1hbmQ6ICdpbnN0YWxsJyB9KSA9PiB7XG4gICAgbGV0IHRhc2tQYWNrYWdlTWFuYWdlclByb2ZpbGUgPSBwYWNrYWdlTWFuYWdlclByb2ZpbGU7XG4gICAgbGV0IHRhc2tQYWNrYWdlTWFuYWdlck5hbWUgPSBwYWNrYWdlTWFuYWdlck5hbWU7XG4gICAgaWYgKGZhY3RvcnlPcHRpb25zLmFsbG93UGFja2FnZU1hbmFnZXJPdmVycmlkZSAmJiBvcHRpb25zLnBhY2thZ2VNYW5hZ2VyKSB7XG4gICAgICB0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlID0gcGFja2FnZU1hbmFnZXJzW29wdGlvbnMucGFja2FnZU1hbmFnZXJdO1xuICAgICAgaWYgKCF0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlKSB7XG4gICAgICAgIHRocm93IG5ldyBVbmtub3duUGFja2FnZU1hbmFnZXJFeGNlcHRpb24ob3B0aW9ucy5wYWNrYWdlTWFuYWdlcik7XG4gICAgICB9XG4gICAgICB0YXNrUGFja2FnZU1hbmFnZXJOYW1lID0gb3B0aW9ucy5wYWNrYWdlTWFuYWdlcjtcbiAgICB9XG5cbiAgICBjb25zdCBidWZmZXJlZE91dHB1dDogeyBzdHJlYW06IE5vZGVKUy5Xcml0ZVN0cmVhbTsgZGF0YTogQnVmZmVyIH1bXSA9IFtdO1xuICAgIGNvbnN0IHNwYXduT3B0aW9uczogU3Bhd25PcHRpb25zID0ge1xuICAgICAgc2hlbGw6IHRydWUsXG4gICAgICBjd2Q6IHBhdGguam9pbihyb290RGlyZWN0b3J5LCBvcHRpb25zLndvcmtpbmdEaXJlY3RvcnkgfHwgJycpLFxuICAgIH07XG4gICAgaWYgKG9wdGlvbnMuaGlkZU91dHB1dCkge1xuICAgICAgc3Bhd25PcHRpb25zLnN0ZGlvID0gb3B0aW9ucy5xdWlldCA/IFsnaWdub3JlJywgJ2lnbm9yZScsICdwaXBlJ10gOiAncGlwZSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNwYXduT3B0aW9ucy5zdGRpbyA9IG9wdGlvbnMucXVpZXQgPyBbJ2lnbm9yZScsICdpZ25vcmUnLCAnaW5oZXJpdCddIDogJ2luaGVyaXQnO1xuICAgIH1cblxuICAgIGNvbnN0IGFyZ3M6IHN0cmluZ1tdID0gW107XG5cbiAgICBpZiAob3B0aW9ucy5wYWNrYWdlTmFtZSkge1xuICAgICAgaWYgKG9wdGlvbnMuY29tbWFuZCA9PT0gJ2luc3RhbGwnKSB7XG4gICAgICAgIGFyZ3MucHVzaCh0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlLmNvbW1hbmRzLmluc3RhbGxQYWNrYWdlKTtcbiAgICAgIH1cbiAgICAgIGFyZ3MucHVzaChvcHRpb25zLnBhY2thZ2VOYW1lKTtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMuY29tbWFuZCA9PT0gJ2luc3RhbGwnICYmIHRhc2tQYWNrYWdlTWFuYWdlclByb2ZpbGUuY29tbWFuZHMuaW5zdGFsbEFsbCkge1xuICAgICAgYXJncy5wdXNoKHRhc2tQYWNrYWdlTWFuYWdlclByb2ZpbGUuY29tbWFuZHMuaW5zdGFsbEFsbCk7XG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zLmFsbG93U2NyaXB0cykge1xuICAgICAgYXJncy5wdXNoKCctLWlnbm9yZS1zY3JpcHRzJyk7XG4gICAgfVxuXG4gICAgaWYgKGZhY3RvcnlPcHRpb25zLnJlZ2lzdHJ5KSB7XG4gICAgICBhcmdzLnB1c2goYC0tcmVnaXN0cnk9XCIke2ZhY3RvcnlPcHRpb25zLnJlZ2lzdHJ5fVwiYCk7XG4gICAgfVxuXG4gICAgaWYgKGZhY3RvcnlPcHRpb25zLmZvcmNlKSB7XG4gICAgICBhcmdzLnB1c2goJy0tZm9yY2UnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGUoKG9icykgPT4ge1xuICAgICAgY29uc3Qgc3Bpbm5lciA9IG9yYSh7XG4gICAgICAgIHRleHQ6IGBJbnN0YWxsaW5nIHBhY2thZ2VzICgke3Rhc2tQYWNrYWdlTWFuYWdlck5hbWV9KS4uLmAsXG4gICAgICAgIC8vIFdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9zaW5kcmVzb3JodXMvb3JhL2lzc3Vlcy8xMzYuXG4gICAgICAgIGRpc2NhcmRTdGRpbjogcHJvY2Vzcy5wbGF0Zm9ybSAhPSAnd2luMzInLFxuICAgICAgfSkuc3RhcnQoKTtcbiAgICAgIGNvbnN0IGNoaWxkUHJvY2VzcyA9IHNwYXduKHRhc2tQYWNrYWdlTWFuYWdlck5hbWUsIGFyZ3MsIHNwYXduT3B0aW9ucykub24oXG4gICAgICAgICdjbG9zZScsXG4gICAgICAgIChjb2RlOiBudW1iZXIpID0+IHtcbiAgICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xuICAgICAgICAgICAgc3Bpbm5lci5zdWNjZWVkKCdQYWNrYWdlcyBpbnN0YWxsZWQgc3VjY2Vzc2Z1bGx5LicpO1xuICAgICAgICAgICAgc3Bpbm5lci5zdG9wKCk7XG4gICAgICAgICAgICBvYnMubmV4dCgpO1xuICAgICAgICAgICAgb2JzLmNvbXBsZXRlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmhpZGVPdXRwdXQpIHtcbiAgICAgICAgICAgICAgYnVmZmVyZWRPdXRwdXQuZm9yRWFjaCgoeyBzdHJlYW0sIGRhdGEgfSkgPT4gc3RyZWFtLndyaXRlKGRhdGEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNwaW5uZXIuZmFpbCgnUGFja2FnZSBpbnN0YWxsIGZhaWxlZCwgc2VlIGFib3ZlLicpO1xuICAgICAgICAgICAgb2JzLmVycm9yKG5ldyBVbnN1Y2Nlc3NmdWxXb3JrZmxvd0V4ZWN1dGlvbigpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgICAgaWYgKG9wdGlvbnMuaGlkZU91dHB1dCkge1xuICAgICAgICBjaGlsZFByb2Nlc3Muc3Rkb3V0Py5vbignZGF0YScsIChkYXRhOiBCdWZmZXIpID0+XG4gICAgICAgICAgYnVmZmVyZWRPdXRwdXQucHVzaCh7IHN0cmVhbTogcHJvY2Vzcy5zdGRvdXQsIGRhdGE6IGRhdGEgfSksXG4gICAgICAgICk7XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRlcnI/Lm9uKCdkYXRhJywgKGRhdGE6IEJ1ZmZlcikgPT5cbiAgICAgICAgICBidWZmZXJlZE91dHB1dC5wdXNoKHsgc3RyZWFtOiBwcm9jZXNzLnN0ZGVyciwgZGF0YTogZGF0YSB9KSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn1cbiJdfQ==