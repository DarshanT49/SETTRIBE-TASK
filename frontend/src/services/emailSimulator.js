export function generateInterviewEmail({ candidateName, position, interviewType, date, time, token }) {
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'https://settribe-task-1.onrender.com';
  const candidateLink = `${frontendUrl}/candidate/${token}`;
  const typeLabel = { technical: 'Technical', hr: 'HR Round', final: 'Final Round' }[interviewType] || interviewType;

  return {
    to: '',
    subject: `Interview Invitation — ${position} at SETTribe`,
    body: `Dear ${candidateName},

We are pleased to inform you that you have been scheduled for a ${typeLabel} interview for the position of ${position} at SetTribe.

📅 Date: ${new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
⏰ Time: ${time}

Please click the link below to access your interview portal:
${candidateLink}

Instructions:
• Please join 5 minutes early to test your camera and microphone
• Keep your resume and ID proof ready
• Ensure you have a stable internet connection
• Choose a quiet, well-lit environment

We look forward to speaking with you!

Best regards,
SETTribe HR Team
hr@settribe.com`,
    candidateLink,
  };
}
