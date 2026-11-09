package mil.army.moda.workoutgeneratorproject.model;

public record WorkoutExercise(
        Long exerciseId,
        String exerciseName,
        int sets,
        int reps,
        Double targetRpe,
        String prescriptionType,
        Integer durationMinutes,
        Integer rounds,
        Integer workSeconds,
        Integer restSeconds
) {
    // Preserve existing four-argument constructor calls
    public WorkoutExercise(Long exerciseId, String exerciseName, int sets, int reps) {
        this(exerciseId, exerciseName, sets, reps, null);
    }

    public WorkoutExercise(Long exerciseId, String exerciseName, int sets, int reps, Double targetRpe) {
        this(exerciseId, exerciseName, sets, reps, targetRpe,
                "REPETITIONS", null, null, null, null);
    }

    public static WorkoutExercise steadyCardio(Long id, String name, int minutes, double effort) {
        return new WorkoutExercise(id, name, 0, 0, effort,
                "DURATION", minutes, null, null, null);
    }

    public static WorkoutExercise intervalCardio(Long id, String name,
                                                 int rounds, int workSeconds,
                                                 int restSeconds, int durationMinutes,
                                                 double effort) {
        return new WorkoutExercise(id, name, 0, 0, effort,
                "INTERVALS", durationMinutes, rounds, workSeconds, restSeconds);
    }

    public boolean isCardio() {
        return "DURATION".equals(prescriptionType) || "INTERVALS".equals(prescriptionType);
    }
}