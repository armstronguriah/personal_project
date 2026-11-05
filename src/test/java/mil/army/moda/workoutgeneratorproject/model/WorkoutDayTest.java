
package mil.army.moda.workoutgeneratorproject.model;

import org.junit.jupiter.api.Test;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class WorkoutDayTest {

    @Test
    void workoutDay_containsPrescribedExercises() {
        // Arrange
        WorkoutExercise bench = new WorkoutExercise(
                1L, "Bench Press", 4, 6
        );

        WorkoutExercise row = new WorkoutExercise(
                2L, "Barbell Row", 3, 8
        );

        // Act
        WorkoutDay workout = new WorkoutDay(
                1,
                WorkoutType.UPPER_BODY,
                List.of(bench, row)
        );

        // Assert
        assertEquals(1, workout.sessionNumber());
        assertEquals(WorkoutType.UPPER_BODY, workout.workoutType());
        assertEquals(List.of(bench, row), workout.exercises());
    }
}
