
package mil.army.moda.workoutgeneratorproject.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Set;
import java.util.HashSet;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import java.util.ArrayList;
import java.util.List;

@Entity
public class SavedProgram {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, columnDefinition = "text")
    private String preferencesJson;

    @Column(nullable = false, columnDefinition = "text")
    private String scheduleJson;

    @Column(nullable = false)
    private Instant createdAt;

    protected SavedProgram() {}
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "saved_program_completed_sessions",
            joinColumns = @JoinColumn(name = "saved_program_id"),
            uniqueConstraints = @UniqueConstraint(
                    columnNames = {
                            "saved_program_id",
                            "session_number"
                    }
            )
    )
    @Column(name = "session_number", nullable = false)
    private Set<Integer> completedSessions = new HashSet<>();
    @OneToMany(
            mappedBy = "savedProgram",
            cascade = CascadeType.REMOVE,
            orphanRemoval = true
    )
    private List<WorkoutSetLog> workoutSetLogs = new ArrayList<>();

    // Remove cardio notes when the parent saved program is deleted.
    @OneToMany(mappedBy = "savedProgram", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<CardioNote> cardioNotes = new ArrayList<>();


    public SavedProgram(
            String name,
            String preferencesJson,
            String scheduleJson
    ) {
        this.name = name;
        this.preferencesJson = preferencesJson;
        this.scheduleJson = scheduleJson;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getPreferencesJson() { return preferencesJson; }
    public String getScheduleJson() { return scheduleJson; }
    public Instant getCreatedAt() { return createdAt; }

    public Set<Integer> getCompletedSessions() {
        return Set.copyOf(completedSessions);
    }

    public void markSessionCompleted(int sessionNumber) {
        completedSessions.add(sessionNumber);
    }

    public void undoSessionCompletion(int sessionNumber) {
        completedSessions.remove(sessionNumber);
    }
    public void replaceScheduleJson(String scheduleJson) {
        this.scheduleJson = scheduleJson;
    }

}
