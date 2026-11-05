
package mil.army.moda.workoutgeneratorproject.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import mil.army.moda.workoutgeneratorproject.model.MovementPattern;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UpdateExerciseRequest(
        @NotBlank
        @Size(max = 100)
        String name,

        @NotBlank
        @Size(max = 100)
        String primaryMuscle,

        @NotBlank
        @Size(max = 100)
        String equipment,

        @Size(max = 500)
        String description,

        MovementPattern movementPattern
) {
}
