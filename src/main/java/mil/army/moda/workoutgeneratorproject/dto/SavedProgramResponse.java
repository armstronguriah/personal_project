

package mil.army.moda.workoutgeneratorproject.dto;

import mil.army.moda.workoutgeneratorproject.model.WorkoutDay;

import java.time.Instant;
import java.util.List;

public record SavedProgramResponse(
        Long id,
        String name,
        GenerateProgramRequest preferences,
        List<WorkoutDay> schedule,
        Instant createdAt,
        List<Integer> completedSessions
) {}

