
package mil.army.moda.workoutgeneratorproject.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class WorkoutExerciseTest {

    @Test
    void workoutExercise_storesExercisePrescription() {
        // Arrange & Act
        WorkoutExercise exercise = new WorkoutExercise(
                1L,
                "Bench Press",
                4,
                6
        );

        // Assert
        assertEquals(1L, exercise.exerciseId());
        assertEquals("Bench Press", exercise.exerciseName());
        assertEquals(4, exercise.sets());
        assertEquals(6, exercise.reps());
    }
}
