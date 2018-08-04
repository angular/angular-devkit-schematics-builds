"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const host_tree_1 = require("../tree/host-tree");
function generateStringOfLength(l) {
    return new Array(l).fill(0).map(_x => {
        return 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    }).join('');
}
function random(from, to) {
    return Math.floor(Math.random() * (to - from)) + from;
}
function default_1(options) {
    return () => {
        const root = ('root' in options) ? options.root : '/';
        const map = new host_tree_1.HostTree();
        const nbFiles = ('multiFiles' in options)
            ? (typeof options.multiFiles == 'number' ? options.multiFiles : random(2, 12))
            : 1;
        for (let i = 0; i < nbFiles; i++) {
            const path = 'a/b/c/d/e/f'.slice(Math.random() * 10);
            const fileName = generateStringOfLength(20);
            const content = generateStringOfLength(100);
            map.create(root + '/' + path + '/' + fileName, content);
        }
        return map;
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZG9tLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy9ydWxlcy9yYW5kb20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSxpREFBNkM7QUFHN0MsZ0NBQWdDLENBQVM7SUFDdkMsT0FBTyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFO1FBQ25DLE9BQU8sNEJBQTRCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN0RSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDZCxDQUFDO0FBR0QsZ0JBQWdCLElBQVksRUFBRSxFQUFVO0lBQ3RDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDeEQsQ0FBQztBQVVELG1CQUF3QixPQUFzQjtJQUM1QyxPQUFPLEdBQUcsRUFBRTtRQUNWLE1BQU0sSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7UUFFdEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxvQkFBUSxFQUFFLENBQUM7UUFDM0IsTUFBTSxPQUFPLEdBQUcsQ0FBQyxZQUFZLElBQUksT0FBTyxDQUFDO1lBQzNCLENBQUMsQ0FBQyxDQUFDLE9BQU8sT0FBTyxDQUFDLFVBQVUsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDOUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVsQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2hDLE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sUUFBUSxHQUFHLHNCQUFzQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sT0FBTyxHQUFHLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRTVDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUN6RDtRQUVELE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQW5CRCw0QkFtQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBTb3VyY2UgfSBmcm9tICcuLi9lbmdpbmUvaW50ZXJmYWNlJztcbmltcG9ydCB7IEhvc3RUcmVlIH0gZnJvbSAnLi4vdHJlZS9ob3N0LXRyZWUnO1xuXG5cbmZ1bmN0aW9uIGdlbmVyYXRlU3RyaW5nT2ZMZW5ndGgobDogbnVtYmVyKSB7XG4gIHJldHVybiBuZXcgQXJyYXkobCkuZmlsbCgwKS5tYXAoX3ggPT4ge1xuICAgIHJldHVybiAnYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXonW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDI2KV07XG4gIH0pLmpvaW4oJycpO1xufVxuXG5cbmZ1bmN0aW9uIHJhbmRvbShmcm9tOiBudW1iZXIsIHRvOiBudW1iZXIpIHtcbiAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqICh0byAtIGZyb20pKSArIGZyb207XG59XG5cblxuZXhwb3J0IGludGVyZmFjZSBSYW5kb21PcHRpb25zIHtcbiAgcm9vdD86IHN0cmluZztcbiAgbXVsdGk/OiBib29sZWFuIHwgbnVtYmVyO1xuICBtdWx0aUZpbGVzPzogYm9vbGVhbiB8IG51bWJlcjtcbn1cblxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihvcHRpb25zOiBSYW5kb21PcHRpb25zKTogU291cmNlIHtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBjb25zdCByb290ID0gKCdyb290JyBpbiBvcHRpb25zKSA/IG9wdGlvbnMucm9vdCA6ICcvJztcblxuICAgIGNvbnN0IG1hcCA9IG5ldyBIb3N0VHJlZSgpO1xuICAgIGNvbnN0IG5iRmlsZXMgPSAoJ211bHRpRmlsZXMnIGluIG9wdGlvbnMpXG4gICAgICAgICAgICAgICAgICA/ICh0eXBlb2Ygb3B0aW9ucy5tdWx0aUZpbGVzID09ICdudW1iZXInID8gb3B0aW9ucy5tdWx0aUZpbGVzIDogcmFuZG9tKDIsIDEyKSlcbiAgICAgICAgICAgICAgICAgIDogMTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmJGaWxlczsgaSsrKSB7XG4gICAgICBjb25zdCBwYXRoID0gJ2EvYi9jL2QvZS9mJy5zbGljZShNYXRoLnJhbmRvbSgpICogMTApO1xuICAgICAgY29uc3QgZmlsZU5hbWUgPSBnZW5lcmF0ZVN0cmluZ09mTGVuZ3RoKDIwKTtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBnZW5lcmF0ZVN0cmluZ09mTGVuZ3RoKDEwMCk7XG5cbiAgICAgIG1hcC5jcmVhdGUocm9vdCArICcvJyArIHBhdGggKyAnLycgKyBmaWxlTmFtZSwgY29udGVudCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hcDtcbiAgfTtcbn1cbiJdfQ==