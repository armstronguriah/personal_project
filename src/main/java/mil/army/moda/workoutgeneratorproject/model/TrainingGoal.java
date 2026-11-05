
package mil.army.moda.workoutgeneratorproject.model;

public enum TrainingGoal {

    STRENGTH(4, 5),
    HYPERTROPHY(3, 10),
    ENDURANCE(2, 15),
    HYBRID(3, 8);

    private final int sets;
    private final int reps;

    TrainingGoal(int sets, int reps) {
        this.sets = sets;
        this.reps = reps;
    }

    public int sets() {
        return sets;
    }

    public int reps() {
        return reps;
    }
}
