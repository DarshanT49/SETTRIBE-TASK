package com.settribe;

import com.settribe.entity.*;
import com.settribe.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired private UserRepository userRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private MilestoneRepository milestoneRepository;
    @Autowired private SprintRepository sprintRepository;
    @Autowired private TaskRepository taskRepository;
    @Autowired private MeetingRepository meetingRepository;
    @Autowired private InterviewRepository interviewRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            String now = Instant.now().toString();
            String lastMonth = Instant.now().minus(30, ChronoUnit.DAYS).toString();
            String yesterday = Instant.now().minus(1, ChronoUnit.DAYS).toString();
            String twoDaysAgo = Instant.now().minus(2, ChronoUnit.DAYS).toString();
            String tomorrow = Instant.now().plus(1, ChronoUnit.DAYS).toString();
            String nextWeek = Instant.now().plus(7, ChronoUnit.DAYS).toString();
            String nextMonth = Instant.now().plus(30, ChronoUnit.DAYS).toString();

            // Seed Users
            userRepository.save(new User("user-admin-001", "Alex Thompson", "EMP001", "admin@settribe.com", "9876543210", "Management", "admin", true, true, null, now, lastMonth, null, "Admin@1234"));
            userRepository.save(new User("user-hr-001", "Priya Sharma", "EMP002", "hr@settribe.com", "9876543211", "HR", "hr", true, true, "user-admin-001", lastMonth, lastMonth, null, "Hr@12345"));
            userRepository.save(new User("user-manager-001", "Rajesh Kumar", "EMP003", "manager@settribe.com", "9876543212", "Engineering", "manager", true, true, "user-admin-001", lastMonth, lastMonth, null, "Manager@123"));
            userRepository.save(new User("user-employee-001", "Ananya Patel", "EMP004", "employee@settribe.com", "9876543213", "Engineering", "employee", true, true, "user-admin-001", lastMonth, lastMonth, null, "Employee@123"));
            userRepository.save(new User("user-intern-001", "Ravi Verma", "EMP005", "intern@settribe.com", "9876543214", "Engineering", "intern", true, true, "user-admin-001", lastMonth, lastMonth, null, "Intern@1234"));
            userRepository.save(new User("user-panel-001", "Deepika Singh", "EMP006", "panel@settribe.com", "9876543215", "Engineering", "panel", true, true, "user-admin-001", lastMonth, lastMonth, null, "Panel@1234"));

            // Seed Projects
            Project proj1 = new Project("proj-001", "E-Commerce Platform Redesign",
                "Complete redesign and rebuild of the existing e-commerce platform.", "TechMart Inc.",
                "Web", "high", "active", "user-employee-001", "user-manager-001",
                lastMonth, nextMonth, nextMonth, "https://github.com/settribe/ecommerce", 45, lastMonth);
            proj1.setTeamIds("[\"user-employee-001\",\"user-intern-001\",\"user-manager-001\"]");
            projectRepository.save(proj1);

            Project proj2 = new Project("proj-002", "HR Analytics Dashboard",
                "Internal analytics dashboard for HR.", "Internal",
                "Internal", "medium", "completed", "user-manager-001", "user-manager-001",
                Instant.now().minus(60, ChronoUnit.DAYS).toString(), yesterday, yesterday, "", 100,
                Instant.now().minus(60, ChronoUnit.DAYS).toString());
            proj2.setTeamIds("[\"user-manager-001\",\"user-employee-001\"]");
            projectRepository.save(proj2);

            // Seed Milestones
            milestoneRepository.save(new Milestone("ms-001", "proj-001", "UI/UX Design & Prototyping",
                "Complete Figma designs and prototypes.", yesterday, twoDaysAgo, "completed",
                true, 0, "", null, null, 100, 1));
            milestoneRepository.save(new Milestone("ms-002", "proj-001", "Frontend Development",
                "Implement all UI components.", nextWeek, null, "active",
                true, 0, "", null, null, 60, 2));
            milestoneRepository.save(new Milestone("ms-003", "proj-001", "Backend API Development",
                "Build REST APIs.", Instant.now().plus(21, ChronoUnit.DAYS).toString(), null, "upcoming",
                false, 0, "", null, null, 0, 3));
            milestoneRepository.save(new Milestone("ms-004", "proj-001", "QA Testing & Deployment",
                "End-to-end testing and deployment.", Instant.now().plus(28, ChronoUnit.DAYS).toString(), null, "upcoming",
                false, 0, "", null, null, 0, 4));

            // Seed Sprints
            sprintRepository.save(new com.settribe.entity.Sprint("sprint-001", "proj-001", "Sprint 1", "Setup & Design", lastMonth, yesterday, "completed"));
            sprintRepository.save(new com.settribe.entity.Sprint("sprint-002", "proj-001", "Sprint 2", "Core Components", now, nextWeek, "active"));

            // Seed Tasks
            Task task1 = new Task("task-001", "proj-001", "ms-002", "sprint-002",
                "Implement product listing page with filters",
                "Create a responsive product listing page with search, category filter.", "high",
                "user-manager-001", "user-manager-001", "in_progress", now,
                Instant.now().plus(5, ChronoUnit.DAYS).toString(), "", null, false, now);
            task1.setAssigneeIds("[\"user-employee-001\"]");
            taskRepository.save(task1);

            Task task2 = new Task("task-002", "proj-001", "ms-002", "sprint-002",
                "Shopping cart with localStorage persistence",
                "Implement full cart functionality.", "high",
                "user-manager-001", "user-manager-001", "todo", tomorrow,
                Instant.now().plus(7, ChronoUnit.DAYS).toString(), "", null, false, now);
            task2.setAssigneeIds("[\"user-employee-001\",\"user-intern-001\"]");
            taskRepository.save(task2);

            Task task3 = new Task("task-003", "proj-001", "ms-002", "sprint-002",
                "User authentication UI",
                "Design and implement all auth pages.", "critical",
                "user-employee-001", "user-employee-001", "in_review", twoDaysAgo, tomorrow,
                "", null, false, twoDaysAgo);
            task3.setAssigneeIds("[\"user-intern-001\"]");
            taskRepository.save(task3);

            Task task4 = new Task("task-004", "proj-001", "ms-002", "sprint-002",
                "Setup Tailwind design system",
                "Create base design tokens and reusable components.", "medium",
                "user-manager-001", "user-manager-001", "done", lastMonth, yesterday,
                "", null, false, lastMonth);
            task4.setAssigneeIds("[\"user-employee-001\"]");
            taskRepository.save(task4);

            Task task5 = new Task("task-005", "proj-002", null, null,
                "Build employee performance dashboard",
                "HR analytics charts.", "medium",
                "user-manager-001", "user-manager-001", "done",
                Instant.now().minus(50, ChronoUnit.DAYS).toString(), yesterday,
                "", null, false, Instant.now().minus(50, ChronoUnit.DAYS).toString());
            task5.setAssigneeIds("[\"user-employee-001\"]");
            taskRepository.save(task5);

            // Seed Meetings
            String todayDateStr = Instant.now().toString().substring(0, 10);
            String tomorrowDateStr = Instant.now().plus(1, ChronoUnit.DAYS).toString().substring(0, 10);

            Meeting m1 = new Meeting("meeting-001", "Daily Standup — E-Commerce Team",
                "Daily sync to discuss progress and blockers.", todayDateStr, "11:00", "30",
                "user-manager-001", "standup", "internal", "", "proj-001", "upcoming", true, yesterday);
            m1.setParticipantIds("[\"user-manager-001\",\"user-employee-001\",\"user-intern-001\"]");
            meetingRepository.save(m1);

            Meeting m2 = new Meeting("meeting-002", "Project Kickoff — E-Commerce Redesign",
                "Review project scope, timeline, and responsibilities.", tomorrowDateStr, "15:00", "60",
                "user-manager-001", "project", "internal", "", "proj-001", "upcoming", false, yesterday);
            m2.setParticipantIds("[\"user-admin-001\",\"user-manager-001\",\"user-employee-001\",\"user-intern-001\"]");
            meetingRepository.save(m2);

            // Seed Interviews
            interviewRepository.save(new Interview("interview-001", "Karan Mehta", "9988776655",
                "karan.mehta@email.com", "Rajesh Kumar", "Senior Frontend Developer", "technical",
                tomorrowDateStr.substring(0, 10), "10:00", "",
                "user-panel-001", "scheduled", "token-interview-001", "Candidate has 4 years of React experience.",
                "Karan_Mehta_Resume.pdf", "waiting", now));

            System.out.println("✅ Data Seeding Completed!");
        }
    }
}
