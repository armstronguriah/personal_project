
package mil.army.moda.workoutgeneratorproject.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
        name = "workout_set_logs",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {
                        "saved_program_id",
                        "session_number",
                        "exercise_id",
                        "set_number"
                }
        )
)
public class WorkoutSetLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "saved_program_id", nullable = false)
    private SavedProgram savedProgram;

    @Column(name = "session_number", nullable = false)
    private int sessionNumber;

    @Column(name = "exercise_id", nullable = false)
    private Long exerciseId;

    @Column(name = "set_number", nullable = false)
    private int setNumber;

    @Column(name = "weight_lb", nullable = false, precision = 8, scale = 2)
    private BigDecimal weightLb;

    @Column(nullable = false)
    private int reps;

    private Double actualRpe;

    @Column(nullable = false)
    private Instant loggedAt;

    protected WorkoutSetLog() {}

    public WorkoutSetLog(
            SavedProgram savedProgram,
            int sessionNumber,
            Long exerciseId,
            int setNumber,
            BigDecimal weightLb,
            int reps,
            Double actualRpe
    ) {
        this.savedProgram = savedProgram;
        this.sessionNumber = sessionNumber;
        this.exerciseId = exerciseId;
        this.setNumber = setNumber;
        this.weightLb = weightLb;
        this.reps = reps;
        this.actualRpe = actualRpe;
        this.loggedAt = Instant.now();
    }

    public Long getExerciseId() {
        return exerciseId;
    }

    public int getSetNumber() {
        return setNumber;
    }

    public BigDecimal getWeightLb() {
        return weightLb;
    }

    public int getReps() {
        return reps;
    }

    public Double getActualRpe() {
        return actualRpe;
    }
}
