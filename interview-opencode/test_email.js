const data = {
  service_id: 'service_goc9w1j',
  template_id: 'template_drkqxne',
  user_id: 'V07dNeUiCodm5y05d',
  template_params: {
    candidate_name: 'Test Candidate',
    candidate_email: 'loharshubham96@gmail.com',
    interview_date: '2026-05-28 at 10:00',
    role: 'Software Engineer',
    join_link: 'http://localhost:5173/join-interview/test',
    title: 'Interview Invitation - Software Engineer',
    name: 'SetTribe HR Team',
    email: 'hr@settribe.com'
  }
};

fetch('https://api.emailjs.com/api/v1.0/email/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
.then(res => res.text())
.then(text => console.log('Response:', text))
.catch(err => console.error('Error:', err));
