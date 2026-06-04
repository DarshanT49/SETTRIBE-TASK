package com.settribe;

import com.settribe.entity.*;
import com.settribe.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired private UserRepository userRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private MilestoneRepository milestoneRepository;
    @Autowired private SprintRepository sprintRepository;
    @Autowired private TaskRepository taskRepository;
    @Autowired private MeetingRepository meetingRepository;
    @Autowired private InterviewRepository interviewRepository;
    @Autowired private EmailTemplateRepository emailTemplateRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private ProjectMemberRepository projectMemberRepository;
    @Autowired private TaskAssigneeRepository taskAssigneeRepository;

    // Known plaintext passwords from old seeding — migrate these to BCrypt if found
    private static final java.util.Map<String, String> KNOWN_PLAINTEXT = java.util.Map.of(
        "Admin@1234", "Admin@1234",
        "Hr@12345", "Hr@12345",
        "Manager@123", "Manager@123",
        "Employee@123", "Employee@123",
        "Intern@1234", "Intern@1234",
        "Panel@1234", "Panel@1234"
    );

    @Override
    public void run(String... args) throws Exception {
        // Migrate any existing plaintext passwords to BCrypt
        migratePlaintextPasswords();

        if (userRepository.count() == 0) {
            String now = Instant.now().toString();
            String lastMonth = Instant.now().minus(30, ChronoUnit.DAYS).toString();
            String yesterday = Instant.now().minus(1, ChronoUnit.DAYS).toString();
            String twoDaysAgo = Instant.now().minus(2, ChronoUnit.DAYS).toString();
            String tomorrow = Instant.now().plus(1, ChronoUnit.DAYS).toString();
            String nextWeek = Instant.now().plus(7, ChronoUnit.DAYS).toString();
            String nextMonth = Instant.now().plus(30, ChronoUnit.DAYS).toString();

            // Seed Users — passwords are BCrypt-hashed
            User admin = userRepository.save(new User(null, "Alex Thompson", "EMP001", "admin@settribe.com", "9876543210", "Management", "admin", true, true, null, now, lastMonth, null, passwordEncoder.encode("Admin@1234")));
            User hr = userRepository.save(new User(null, "Priya Sharma", "EMP002", "hr@settribe.com", "9876543211", "HR", "hr", true, true, String.valueOf(admin.getId()), lastMonth, lastMonth, null, passwordEncoder.encode("Hr@12345")));
            User manager = userRepository.save(new User(null, "Rajesh Kumar", "EMP003", "manager@settribe.com", "9876543212", "Engineering", "manager", true, true, String.valueOf(admin.getId()), lastMonth, lastMonth, null, passwordEncoder.encode("Manager@123")));
            User employee = userRepository.save(new User(null, "Ananya Patel", "EMP004", "employee@settribe.com", "9876543213", "Engineering", "employee", true, true, String.valueOf(admin.getId()), lastMonth, lastMonth, null, passwordEncoder.encode("Employee@123")));
            User intern = userRepository.save(new User(null, "Ravi Verma", "EMP005", "intern@settribe.com", "9876543214", "Engineering", "intern", true, true, String.valueOf(admin.getId()), lastMonth, lastMonth, null, passwordEncoder.encode("Intern@1234")));
            User panel = userRepository.save(new User(null, "Deepika Singh", "EMP006", "panel@settribe.com", "9876543215", "Engineering", "panel", true, true, String.valueOf(admin.getId()), lastMonth, lastMonth, null, passwordEncoder.encode("Panel@1234")));

            // Seed Projects
            Project proj1 = projectRepository.save(new Project(null, "E-Commerce Platform Redesign",
                "Complete redesign and rebuild of the existing e-commerce platform.", "TechMart Inc.",
                "Web", "high", "active", employee.getId(), manager.getId(),
                lastMonth, nextMonth, nextMonth, "https://github.com/settribe/ecommerce", 45, lastMonth));
            projectMemberRepository.save(new ProjectMember(proj1.getId(), employee.getId(), false, "ACTIVE", now, null));
            projectMemberRepository.save(new ProjectMember(proj1.getId(), intern.getId(), false, "ACTIVE", now, null));
            projectMemberRepository.save(new ProjectMember(proj1.getId(), manager.getId(), true, "ACTIVE", now, null));

            Project proj2 = projectRepository.save(new Project(null, "HR Analytics Dashboard",
                "Internal analytics dashboard for HR.", "Internal",
                "Internal", "medium", "completed", manager.getId(), manager.getId(),
                Instant.now().minus(60, ChronoUnit.DAYS).toString(), yesterday, yesterday, "", 100,
                Instant.now().minus(60, ChronoUnit.DAYS).toString()));
            projectMemberRepository.save(new ProjectMember(proj2.getId(), manager.getId(), true, "ACTIVE", now, null));
            projectMemberRepository.save(new ProjectMember(proj2.getId(), employee.getId(), false, "ACTIVE", now, null));

            // Seed Tasks
            Task task1 = taskRepository.save(new Task(null, proj1.getId(), "ms-002", "sprint-002",
                "Implement product listing page with filters",
                "Create a responsive product listing page with search, category filter.", "high",
                manager.getId(), manager.getId(), "in_progress", now,
                Instant.now().plus(5, ChronoUnit.DAYS).toString(), "", null, false, now, 5.0));
            taskAssigneeRepository.save(new TaskAssignee(task1.getId(), employee.getId(), "ACTIVE", now, null));

            Task task2 = taskRepository.save(new Task(null, proj1.getId(), "ms-002", "sprint-002",
                "Shopping cart with localStorage persistence",
                "Implement full cart functionality.", "high",
                manager.getId(), manager.getId(), "todo", tomorrow,
                Instant.now().plus(7, ChronoUnit.DAYS).toString(), "", null, false, now, 8.0));
            taskAssigneeRepository.save(new TaskAssignee(task2.getId(), employee.getId(), "ACTIVE", now, null));
            taskAssigneeRepository.save(new TaskAssignee(task2.getId(), intern.getId(), "ACTIVE", now, null));

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

            // Seed Email Templates
            if (emailTemplateRepository.count() == 0) {
                EmailTemplate template = new EmailTemplate();
                template.setId("tmpl-interview-invite");
                template.setName("Standard Interview Invitation");
                template.setCategory("Interview Invitation");
                template.setSubject("Interview Invitation - {{JobRole}}");
                template.setHtmlBody("<p>Dear {{CandidateName}},</p><p>Thank you for applying for the position of {{JobRole}}.</p><p>We are pleased to invite you for an interview.</p><p><strong>Interview Details:</strong></p><ul><li>Date: {{InterviewDate}}</li><li>Time: {{InterviewTime}}</li><li>Interviewer: {{InterviewerName}}</li></ul><p>Please join using the following link:</p><p><a href=\"{{MeetingLink}}\">Join Interview</a></p><p>We look forward to speaking with you.</p><p>Regards,</p><p>{{HRName}}</p><p>{{CompanyName}}</p>");
                template.setIsDefault(true);
                template.setIsActive(true);
                template.setVersion(1);
                template.setCreatedBy("user-admin-001");
                template.setUpdatedBy("user-admin-001");
                template.setCreatedAt(now);
                template.setUpdatedAt(now);
                emailTemplateRepository.save(template);
            }

            System.out.println("✅ Data Seeding Completed!");
        }
    }

    /**
     * Migrates any users whose password is still stored as plaintext
     * (from the old json-server era) to a proper BCrypt hash.
     * Safe to run on every startup — already-hashed passwords start with "$2a$"
     * and will be left untouched.
     */
    private void migratePlaintextPasswords() {
        List<User> users = userRepository.findAll();
        boolean anyMigrated = false;
        for (User user : users) {
            String pwd = user.getPassword();
            if (pwd != null && !pwd.startsWith("$2a$") && KNOWN_PLAINTEXT.containsKey(pwd)) {
                user.setPassword(passwordEncoder.encode(pwd));
                userRepository.save(user);
                anyMigrated = true;
                System.out.println("🔐 Migrated password for user: " + user.getEmail());
            }
        }
        if (anyMigrated) {
            System.out.println("✅ Password migration completed.");
        }
    }
}
