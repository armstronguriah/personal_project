package mil.army.moda.workoutgeneratorproject.model;

import jakarta.persistence.*;

@Entity
@Table(
        name = "cardio_notes",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"saved_program_id", "session_number", "exercise_id"}
        )
)
public class CardioNote {

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

    @Column(nullable = false, columnDefinition = "text")
    private String notes;

    protected CardioNote() { }

    public CardioNote(SavedProgram savedProgram, int sessionNumber, Long exerciseId, String notes) {
        this.savedProgram = savedProgram;
        this.sessionNumber = sessionNumber;
        this.exerciseId = exerciseId;
        this.notes = notes;
    }

    public Long getExerciseId() { return exerciseId; }
    public String getNotes() { return notes; }
}
