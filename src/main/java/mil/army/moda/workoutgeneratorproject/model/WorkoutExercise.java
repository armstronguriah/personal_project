package mil.army.moda.workoutgeneratorproject.model;

public record WorkoutExercise(
        Long exerciseId,
        String exerciseName,
        int sets,
        int reps,
        Double targetRpe
) {
    // Preserve existing four-argument constructor calls
    public WorkoutExercise(
            Long exerciseId,
            String exerciseName,
            int sets,
            int reps
    ) {
        this(exerciseId, exerciseName, sets, reps, null);
    }
}