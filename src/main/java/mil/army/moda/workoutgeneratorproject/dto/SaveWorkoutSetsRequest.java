
package mil.army.moda.workoutgeneratorproject.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record SaveWorkoutSetsRequest(
        @NotNull
        List<@NotNull @Valid WorkoutSetInput> sets
) {}
