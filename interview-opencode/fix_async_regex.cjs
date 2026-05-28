const fs = require('fs');

const files = [
    'src/components/kanban/KanbanBoard.jsx',
    'src/contexts/NotificationContext.jsx',
    'src/contexts/ThemeContext.jsx',
    'src/pages/Dashboard.jsx',
    'src/pages/EmployeeProfile.jsx',
    'src/pages/Employees.jsx',
    'src/pages/InterviewDetail.jsx',
    'src/pages/MeetingDetail.jsx',
    'src/pages/MeetingRoom.jsx',
    'src/pages/NewInterview.jsx',
    'src/pages/NewMeeting.jsx',
    'src/pages/NewProject.jsx',
    'src/pages/PendingApprovals.jsx',
    'src/pages/ProjectDetail.jsx',
    'src/pages/SelfTasks.jsx',
    'src/services/auth.js',
    'src/services/notifications.js'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Pattern 1: const myFunc = (args) => {
    content = content.replace(/(const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*\{/g, (match, keyword, name, args, offset, str) => {
        // find block
        let blockStart = offset + match.length;
        let open = 1, i = blockStart;
        while(open > 0 && i < str.length) {
            if (str[i] === '{') open++;
            if (str[i] === '}') open--;
            i++;
        }
        let block = str.substring(blockStart, i);
        if (block.includes('await asyncGet') || block.includes('await asyncSet') || block.includes('await asyncUpdate') || block.includes('await asyncDelete')) {
            changed = true;
            return `${keyword} ${name} = async (${args}) => {`;
        }
        return match;
    });

    // Pattern 2: function myFunc(args) {
    content = content.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*\{/g, (match, name, args, offset, str) => {
        let blockStart = offset + match.length;
        let open = 1, i = blockStart;
        while(open > 0 && i < str.length) {
            if (str[i] === '{') open++;
            if (str[i] === '}') open--;
            i++;
        }
        let block = str.substring(blockStart, i);
        if (block.includes('await asyncGet') || block.includes('await asyncSet') || block.includes('await asyncUpdate') || block.includes('await asyncDelete')) {
            changed = true;
            // check if already async
            if (str.substring(Math.max(0, offset - 6), offset).includes('async')) {
                return match;
            }
            return `async function ${name}(${args}) {`;
        }
        return match;
    });

    // Pattern 3: (args) => { (Inline callbacks)
    content = content.replace(/(?<!async\s+)(?<!function\s+)\(([^)]*)\)\s*=>\s*\{/g, (match, args, offset, str) => {
        let blockStart = offset + match.length;
        let open = 1, i = blockStart;
        while(open > 0 && i < str.length) {
            if (str[i] === '{') open++;
            if (str[i] === '}') open--;
            i++;
        }
        let block = str.substring(blockStart, i);
        if (block.includes('await asyncGet') || block.includes('await asyncSet') || block.includes('await asyncUpdate') || block.includes('await asyncDelete')) {
            // Check if there's an assignment or it's just a callback
            changed = true;
            return `async (${args}) => {`;
        }
        return match;
    });

    if (changed) {
        fs.writeFileSync(file, content);
        console.log("Fixed", file);
    }
});
