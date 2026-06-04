function getMeetingDateTime(meeting) {
  return new Date(`${meeting.date}T${meeting.time}:00+05:30`);
}

const meeting = {
  date: '2026-06-04',
  time: '16:20'
};

const meetingTime = getMeetingDateTime(meeting).getTime();
const now = Date.now();
const timeUntilMeeting = meetingTime - now;

console.log("Meeting Time:", new Date(meetingTime).toISOString());
console.log("Now:", new Date(now).toISOString());
console.log("Time Until Meeting (ms):", timeUntilMeeting);
console.log("Time Until Meeting (min):", timeUntilMeeting / 60000);
console.log("Will trigger alert?", timeUntilMeeting > 0 && timeUntilMeeting <= 5 * 60 * 1000);
