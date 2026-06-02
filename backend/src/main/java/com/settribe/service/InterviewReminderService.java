package com.settribe.service;

import com.settribe.entity.Interview;
import com.settribe.entity.Notification;
import com.settribe.repository.InterviewRepository;
import com.settribe.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.time.temporal.ChronoUnit;

@Service
public class InterviewReminderService {

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // Run every minute
    @Scheduled(cron = "0 * * * * *")
    public void sendInterviewReminders() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        String dateString = today.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        
        // Fetch all interviews for today that are scheduled
        List<Interview> todaysInterviews = interviewRepository.findAll().stream()
                .filter(i -> dateString.equals(i.getDate()) && "scheduled".equals(i.getStatus()))
                .toList();

        for (Interview interview : todaysInterviews) {
            try {
                LocalTime interviewTime = LocalTime.parse(interview.getTime());
                long minutesUntil = ChronoUnit.MINUTES.between(now, interviewTime);

                if (minutesUntil == 30 || minutesUntil == 10 || minutesUntil == 5) {
                    sendNotificationToInterviewer(interview, minutesUntil);
                }
            } catch (Exception e) {
                // Ignore parsing errors for individual interviews
                e.printStackTrace();
            }
        }
    }

    private void sendNotificationToInterviewer(Interview interview, long minutesUntil) {
        if (interview.getInterviewerId() == null || interview.getInterviewerId().isEmpty()) {
            return;
        }

        Notification notification = new Notification();
        notification.setId(UUID.randomUUID().toString());
        notification.setUserId(interview.getInterviewerId());
        notification.setType("interview_reminder");
        notification.setTitle("Upcoming Interview in " + minutesUntil + " mins");
        notification.setMessage("Your interview with " + interview.getCandidateName() + " for " + interview.getPosition() + " starts in " + minutesUntil + " minutes.");
        notification.setIsRead(false);
        notification.setCreatedAt(java.time.Instant.now().toString());
        notification.setRelatedId(interview.getId());
        notification.setRelatedType("interview");

        notificationRepository.save(notification);
    }
}
