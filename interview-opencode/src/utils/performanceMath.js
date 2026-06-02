/**
 * performanceMath.js
 * Algorithms to calculate performance metrics based on user data.
 */

// Calculates average turnaround time for completed tasks vs estimated time
export function calculateTaskEfficiency(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  
  const completedTasks = tasks.filter(t => t.status === 'done');
  if (completedTasks.length === 0) return 0;

  let totalEfficiency = 0;
  
  completedTasks.forEach(task => {
    // Mock efficiency: assume an average of 90% if no historical dates are fully present
    // In a real app, you would calculate: (Actual Hours / Estimated Hours)
    const mockEfficiency = 85 + Math.random() * 15; // 85-100%
    totalEfficiency += mockEfficiency;
  });

  return Math.round(totalEfficiency / completedTasks.length);
}

// Calculates percentage of tasks rejected or requiring revisions
export function calculateQualityRate(tasks) {
  if (!tasks || tasks.length === 0) return 100; // Perfect quality if no tasks
  
  // Mock rework rate: assume 5-15% of tasks need rework
  // Real app: count tasks that went from 'review' back to 'in-progress'
  const mockReworkRate = 5 + Math.random() * 10;
  
  return Math.round(100 - mockReworkRate);
}

// Calculates OKR completion percentage
export function calculateGoalCompletion(okrs) {
  if (!okrs || okrs.length === 0) return 0;
  
  let totalProgress = 0;
  okrs.forEach(okr => {
    totalProgress += okr.progress;
  });
  
  return Math.round(totalProgress / okrs.length);
}

// Aggregates 360-degree feedback
export function calculateFeedbackScore(feedback) {
  if (!feedback || feedback.length === 0) return 0;
  
  let totalScore = 0;
  feedback.forEach(f => {
    totalScore += f.score; // Assume score out of 100
  });
  
  return Math.round(totalScore / feedback.length);
}

/**
 * Calculates the Composite Performance Score
 * Weights:
 * - Task Efficiency: 30%
 * - Quality/Rework: 25%
 * - Goal Completion (OKRs): 30%
 * - Peer/Manager Feedback: 15%
 */
export function calculateCompositeScore(tasks, okrs, feedback) {
  const efficiency = calculateTaskEfficiency(tasks);
  const quality = calculateQualityRate(tasks);
  const goals = calculateGoalCompletion(okrs);
  const feedb = calculateFeedbackScore(feedback);
  
  const composite = (efficiency * 0.30) + (quality * 0.25) + (goals * 0.30) + (feedb * 0.15);
  
  return Math.round(composite);
}

// Generates a mock trend compared to previous 30/90 days
export function getPerformanceTrend(currentScore) {
  // Randomly generate a previous score to show trend
  const mockPreviousScore = currentScore + (Math.random() * 10 - 5); // +/- 5 points
  const difference = currentScore - mockPreviousScore;
  
  return {
    isImproving: difference >= 0,
    difference: Math.abs(Math.round(difference)),
    previousScore: Math.round(mockPreviousScore)
  };
}
