
package mil.army.moda.workoutgeneratorproject.service;

import mil.army.moda.workoutgeneratorproject.model.TrainingGoal;
import mil.army.moda.workoutgeneratorproject.model.WorkoutExercise;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PeriodizationPlannerTest {

    private final WorkoutExercise squat =
            new WorkoutExercise(
                    1L,
                    "Barbell Back Squat",
                    4,
                    5
            );

    @Test
    void strengthProgramVariesSetsRepsAndRpe() {
        WorkoutExercise week1 = PeriodizationPlanner.apply(
                squat, TrainingGoal.STRENGTH, 1,
                "ADVANCED", true
        );

        WorkoutExercise week2 = PeriodizationPlanner.apply(
                squat, TrainingGoal.STRENGTH, 2,
                "ADVANCED", true
        );

        WorkoutExercise week3 = PeriodizationPlanner.apply(
                squat, TrainingGoal.STRENGTH, 3,
                "ADVANCED", true
        );

        assertEquals(4, week1.sets());
        assertEquals(6, week1.reps());
        assertEquals(7.0, week1.targetRpe());

        assertEquals(5, week2.sets());
        assertEquals(5, week2.reps());
        assertEquals(7.5, week2.targetRpe());

        assertEquals(4, week3.sets());
        assertEquals(4, week3.reps());
        assertEquals(8.0, week3.targetRpe());
    }

    @Test
    void deloadWeekReducesVolumeAndEffort() {
        WorkoutExercise week4 = PeriodizationPlanner.apply(
                squat, TrainingGoal.STRENGTH, 4,
                "ADVANCED", true
        );

        assertEquals(2, week4.sets());
        assertEquals(5, week4.reps());
        assertEquals(6.0, week4.targetRpe());
    }

    @Test
    void beginnerRpeIsCapped() {
        WorkoutExercise week7 = PeriodizationPlanner.apply(
                squat, TrainingGoal.STRENGTH, 7,
                "BEGINNER", true
        );

        assertEquals(7.5, week7.targetRpe());
    }

    @Test
    void periodizationPreservesExerciseIdentity() {
        WorkoutExercise adjusted = PeriodizationPlanner.apply(
                squat, TrainingGoal.HYPERTROPHY, 2,
                "INTERMEDIATE", true
        );

        assertEquals(squat.exerciseId(), adjusted.exerciseId());
        assertEquals(squat.exerciseName(), adjusted.exerciseName());
    }
}
