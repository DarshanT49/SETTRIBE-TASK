import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatDate } from './dates';

export const exportMeetingReport = async (meeting, attendanceLogs, tasks, users) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'System';
  workbook.created = new Date();

  // Helper to apply neat styling to header rows
  const styleHeaderRow = (row) => {
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' } // Light gray background
      };
      cell.font = { bold: true, color: { argb: 'FF000000' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
  };

  // Helper to apply borders to all data rows
  const styleDataRows = (worksheet, startRow) => {
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= startRow) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        });
      }
    });
  };

  const getUser = (uid) => users.find(u => u.id === uid) || { name: 'Unknown User', role: 'unknown' };

  // 1. Attendance Logs Tab
  const attendanceSheet = workbook.addWorksheet('Attendance Logs');
  
  attendanceSheet.columns = [
    { header: 'Participant Name', key: 'name', width: 25 },
    { header: 'Role', key: 'role', width: 15 },
    { header: 'Join Time', key: 'joinTime', width: 22 },
    { header: 'Leave Time', key: 'leaveTime', width: 22 },
    { header: 'Duration (Mins)', key: 'duration', width: 18 },
    { header: 'Status', key: 'status', width: 15 },
  ];

  const headerRow1 = attendanceSheet.getRow(1);
  styleHeaderRow(headerRow1);

  // Build roster from participantIds and hostId
  const allInvited = Array.from(new Set([meeting.hostId, ...(meeting.participantIds || [])]));

  const formatTime = (isoString) => isoString ? new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

  allInvited.forEach(uid => {
    const user = getUser(uid);
    const log = attendanceLogs.find(l => l.userId === uid);
    
    let joinT = '-';
    let leaveT = '-';
    let dur = 0;
    let stat = 'Absent';

    if (log) {
      stat = log.status || 'Present';
      dur = log.durationMinutes || 0;
      if (log.joinTime) joinT = formatTime(log.joinTime);
      if (log.leaveTime) leaveT = formatTime(log.leaveTime);
    }

    attendanceSheet.addRow({
      name: user.name,
      role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
      joinTime: joinT,
      leaveTime: leaveT,
      duration: dur,
      status: stat.charAt(0).toUpperCase() + stat.slice(1)
    });
  });

  styleDataRows(attendanceSheet, 2);

  // 2. Assigned Tasks Tab (Only for Standups)
  if (meeting.type === 'standup') {
    const tasksSheet = workbook.addWorksheet('Assigned Tasks');

    tasksSheet.columns = [
      { header: 'Task Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Assignee', key: 'assignee', width: 25 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
    ];

    const headerRow2 = tasksSheet.getRow(1);
    styleHeaderRow(headerRow2);

    tasks.forEach(task => {
      const assigneeUser = getUser(task.assigneeId);
      tasksSheet.addRow({
        title: task.title || 'Untitled',
        description: task.description || '-',
        assignee: assigneeUser.name,
        priority: task.priority ? task.priority.toUpperCase() : 'NORMAL',
        status: task.status ? task.status.replace('_', ' ').toUpperCase() : 'PENDING',
        dueDate: task.dueDate ? formatDate(task.dueDate) : '-'
      });
    });

    styleDataRows(tasksSheet, 2);
  }

  // Generate and save Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const safeFilename = meeting.title ? meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'meeting_report';
  saveAs(blob, `${safeFilename}.xlsx`);
};
