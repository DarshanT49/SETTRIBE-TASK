const http = require('http');

http.get('http://localhost:8080/api/meetings', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const meetings = JSON.parse(data);
      console.log("Total meetings:", meetings.length);
      if (meetings.length > 0) {
        console.log("First meeting structure:", Object.keys(meetings[0]));
        console.log("Participant IDs:", meetings[0].participantIds);
      }
    } catch (e) {
      console.log("Error parsing response", e.message);
    }
  });
}).on('error', err => console.log("Error:", err.message));
