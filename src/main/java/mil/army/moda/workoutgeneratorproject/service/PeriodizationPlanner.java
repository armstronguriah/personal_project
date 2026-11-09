
package mil.army.moda.workoutgeneratorproject.service;

import mil.army.moda.workoutgeneratorproject.model.TrainingGoal;
import mil.army.moda.workoutgeneratorproject.model.WorkoutExercise;

public final class PeriodizationPlanner {

    private PeriodizationPlanner() {
        // Utility class
    }

    private record WeekPlan(
            int setsChange,
            int repsChange,
            double targetRpe,
            boolean deload
    ) {}

    public static WorkoutExercise apply(
            WorkoutExercise exercise,
            TrainingGoal goal,
            int week,
            String experience,
            boolean primaryExercise
    ) {
        if (week < 1 || week > 8) {
            throw new IllegalArgumentException(
                    "Week must be between 1 and 8"
            );
        }

        // Do not treat minutes/intervals as resistance sets and repetitions.
        if (exercise.isCardio()) {
            return applyCardio(exercise, week, experience);
        }

        WeekPlan plan = getWeekPlan(goal, week);

        int sets;

        if (plan.deload()) {
            // Reduce working sets by approximately 50%
            sets = Math.max(
                    1,
                    (int) Math.ceil(exercise.sets() / 2.0)
            );
        } else {
            // Only add extra sets to the first two exercises
            // to limit increases in workout duration.
            int setsChange = primaryExercise
                    ? plan.setsChange()
                    : Math.min(0, plan.setsChange());

            sets = Math.clamp(exercise.sets() + setsChange,
                    1, 5);
        }

        int reps = Math.max(
                1,
                exercise.reps() + plan.repsChange()
        );

        double rpe = plan.targetRpe();

        // Keep beginner and intermediate targets manageable.
        if ("BEGINNER".equalsIgnoreCase(experience)) {
            rpe = Math.min(rpe, 7.5);
        } else if ("INTERMEDIATE".equalsIgnoreCase(experience)) {
            rpe = Math.min(rpe, 8.0);
        }

        return new WorkoutExercise(
                exercise.exerciseId(),
                exercise.exerciseName(),
                sets,
                reps,
                rpe
        );
    }
    private static WorkoutExercise applyCardio(WorkoutExercise exercise, int week, String experience) {
        boolean deload = week == 4 || week == 8;
        boolean beginner = "BEGINNER".equalsIgnoreCase(experience);
        boolean intervals = "INTERVALS".equals(
                exercise.prescriptionType()
        );

        int progressionWeek = (week - 1) % 4;

        double rpe;

        if (deload) {
            rpe = 5.0;
        } else if (intervals) {
            // Higher effort for sprint and interval training
            rpe = 7.5 + progressionWeek * 0.5;
        } else {
            // Moderate effort for steady-state cardio
            rpe = 5.5 + progressionWeek * 0.5;
        }

// Limit intensity for beginners
        if (beginner) {
            rpe = Math.min(rpe, 7.5);
        }

        if ("DURATION".equals(exercise.prescriptionType())) {
            int base = exercise.durationMinutes();
            int minutes = deload ? Math.max(10, (int) Math.round(base * 0.7))
                    : base + (beginner ? 2 : 3) * ((week - 1) % 4);
            return WorkoutExercise.steadyCardio(
                    exercise.exerciseId(), exercise.exerciseName(), minutes, rpe);
        }

        int baseRounds = exercise.rounds();
        int rounds = deload ? Math.max(3, baseRounds - 2)
                : baseRounds + Math.min(2, (week - 1) % 4);
        // Easy warmup and cooldown are accounted for in the approximate total.
        int totalMinutes = 10 + (int) Math.ceil(
                rounds * (exercise.workSeconds() + exercise.restSeconds()) / 60.0);
        return WorkoutExercise.intervalCardio(
                exercise.exerciseId(), exercise.exerciseName(), rounds,
                exercise.workSeconds(), exercise.restSeconds(), totalMinutes, rpe);
    }

    private static WeekPlan getWeekPlan(
            TrainingGoal goal,
            int week
    ) {
        return switch (goal) {

            case STRENGTH -> switch (week) {
                case 1 -> new WeekPlan(0, 1, 7.0, false);
                case 2 -> new WeekPlan(1, 0, 7.5, false);
                case 3 -> new WeekPlan(0, -1, 8.0, false);
                case 4 -> new WeekPlan(0, 0, 6.0, true);
                case 5 -> new WeekPlan(0, 0, 7.5, false);
                case 6 -> new WeekPlan(1, -1, 8.0, false);
                case 7 -> new WeekPlan(0, -2, 8.5, false);
                default -> new WeekPlan(0, 0, 6.0, true);
            };

            case HYPERTROPHY -> switch (week) {
                case 1 -> new WeekPlan(0, 2, 7.0, false);
                case 2 -> new WeekPlan(1, 1, 7.5, false);
                case 3 -> new WeekPlan(1, 0, 8.0, false);
                case 4 -> new WeekPlan(0, 0, 6.0, true);
                case 5 -> new WeekPlan(0, 1, 7.5, false);
                case 6 -> new WeekPlan(1, 0, 8.0, false);
                case 7 -> new WeekPlan(1, -1, 8.5, false);
                default -> new WeekPlan(0, 0, 6.0, true);
            };

            case ENDURANCE -> switch (week) {
                case 1 -> new WeekPlan(0, 0, 7.0, false);
                case 2 -> new WeekPlan(0, 2, 7.5, false);
                case 3 -> new WeekPlan(1, 2, 8.0, false);
                case 4 -> new WeekPlan(0, 0, 6.0, true);
                case 5 -> new WeekPlan(0, 1, 7.5, false);
                case 6 -> new WeekPlan(0, 2, 8.0, false);
                case 7 -> new WeekPlan(1, 3, 8.5, false);
                default -> new WeekPlan(0, 0, 6.0, true);
            };

            case HYBRID -> switch (week) {
                case 1 -> new WeekPlan(0, 1, 7.0, false);
                case 2 -> new WeekPlan(1, 0, 7.5, false);
                case 3 -> new WeekPlan(0, -1, 8.0, false);
                case 4 -> new WeekPlan(0, 0, 6.0, true);
                case 5 -> new WeekPlan(0, 0, 7.5, false);
                case 6 -> new WeekPlan(1, -1, 8.0, false);
                case 7 -> new WeekPlan(0, -2, 8.5, false);
                default -> new WeekPlan(0, 0, 6.0, true);
            };
        };
    }
}
