package mil.army.moda.workoutgeneratorproject.model;

import java.util.List;

public record WorkoutDay(
        int sessionNumber,
        WorkoutType workoutType,
        List<WorkoutExercise> exercises
) {
    public WorkoutDay {
        exercises = List.copyOf(exercises);
    }

    public WorkoutDay(int sessionNumber, WorkoutType workoutType) {
        this(sessionNumber, workoutType, List.of());
    }
}
