
package mil.army.moda.workoutgeneratorproject.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import mil.army.moda.workoutgeneratorproject.model.WorkoutDay;

import java.util.List;

public record SaveProgramRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull @Valid GenerateProgramRequest preferences,
        @NotEmpty List<WorkoutDay> schedule
) {}
