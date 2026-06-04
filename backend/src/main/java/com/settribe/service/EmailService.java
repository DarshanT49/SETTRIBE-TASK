package com.settribe.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import com.settribe.dto.InterviewDTO;
import com.settribe.entity.EmailTemplate;

import java.util.Map;

import jakarta.mail.internet.MimeMessage;
import org.springframework.scheduling.annotation.Async;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;
    
    @Autowired
    private EmailTemplateService emailTemplateService;

    @Value("${frontend.urls:https://settribe-task-1.onrender.com}")
    private String[] frontendUrls;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public String compileTemplate(String htmlBody, Map<String, String> variables) {
        String compiled = htmlBody;
        if (compiled == null) return "";
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            compiled = compiled.replace("{{" + entry.getKey() + "}}", entry.getValue() != null ? entry.getValue() : "");
        }
        return compiled;
    }

    @Async
    public void sendInterviewInvitation(InterviewDTO interview) {
        if (interview.getEmail() == null || interview.getEmail().isEmpty()) {
            return; // No email provided
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(senderEmail, "SetTribe HR Team");
            helper.setTo(interview.getEmail());
            String baseUrl = frontendUrls != null && frontendUrls.length > 0 ? frontendUrls[0] : "https://settribe-task-1.onrender.com";
            String interviewLink = baseUrl + "/join-interview/" + interview.getToken();
            
            EmailTemplate template = emailTemplateService.getActiveTemplateByCategory("Interview Invitation");
            String htmlTemplate;
            String subject;

            if (template != null) {
                subject = compileTemplate(template.getSubject(), Map.of("JobRole", interview.getPosition()));
                htmlTemplate = compileTemplate(template.getHtmlBody(), Map.ofEntries(
                        Map.entry("CandidateName", interview.getCandidateName()),
                        Map.entry("CandidateEmail", interview.getEmail()),
                        Map.entry("InterviewerName", "SetTribe Interviewer"),
                        Map.entry("InterviewDate", interview.getDate()),
                        Map.entry("InterviewTime", interview.getTime()),
                        Map.entry("InterviewType", interview.getRound() != null ? interview.getRound() : "Screening"),
                        Map.entry("MeetingLink", interviewLink),
                        Map.entry("CompanyName", "SetTribe"),
                        Map.entry("CompanyLogo", "https://settribe.com/logo.png"),
                        Map.entry("HRName", "SetTribe HR Team"),
                        Map.entry("JobRole", interview.getPosition()),
                        Map.entry("Department", "Engineering")
                ));
            } else {
                subject = "Interview Invitation: " + interview.getPosition() + " at SetTribe";
                htmlTemplate = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;\">" +
                        "<div style=\"text-align: center; margin-bottom: 30px;\">" +
                        "  <h1 style=\"color: #4f46e5; margin: 0;\">SetTribe</h1>" +
                        "  <p style=\"color: #64748b; margin-top: 5px; font-size: 14px;\">Interview Invitation</p>" +
                        "</div>" +
                        "<p style=\"color: #334155; font-size: 16px;\">Dear <strong>" + interview.getCandidateName() + "</strong>,</p>" +
                        "<p style=\"color: #334155; font-size: 16px; line-height: 1.5;\">" +
                        "Congratulations! You have been selected for an interview for the position of <strong>" + interview.getPosition() + "</strong>." +
                        "</p>" +
                        "<div style=\"background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 25px 0;\">" +
                        "  <h3 style=\"margin-top: 0; color: #0f172a;\">Interview Details:</h3>" +
                        "  <ul style=\"color: #334155; line-height: 1.6; list-style: none; padding-left: 0;\">" +
                        "    <li>📅 <strong>Date:</strong> " + interview.getDate() + "</li>" +
                        "    <li>⏰ <strong>Time:</strong> " + interview.getTime() + "</li>" +
                        "    <li>💼 <strong>Round:</strong> " + (interview.getRound() != null ? interview.getRound().substring(0, 1).toUpperCase() + interview.getRound().substring(1) : "Screening") + "</li>" +
                        "  </ul>" +
                        "</div>" +
                        "<div style=\"text-align: center; margin: 35px 0;\">" +
                        "  <a href=\"" + interviewLink + "\" style=\"background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;\">Join Video Interview</a>" +
                        "</div>" +
                        "<p style=\"color: #334155; font-size: 14px; line-height: 1.5;\">" +
                        "<strong>Important:</strong> Please ensure you join at least 5 minutes early to test your camera and microphone. Our platform conducts the video call directly in your browser without requiring external software downloads." +
                        "</p>" +
                        "<hr style=\"border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;\" />" +
                        "<p style=\"color: #64748b; font-size: 13px; text-align: center;\">" +
                        "If you need to reschedule or have any questions, please reply directly to this email.<br><br>Best regards,<br><strong>SetTribe HR Team</strong>" +
                        "</p>" +
                        "</div>";
            }
            
            helper.setSubject(subject);
            helper.setText(htmlTemplate, true);
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Failed to send HTML email to " + interview.getEmail());
        }
    }
}
