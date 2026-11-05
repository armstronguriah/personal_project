
package mil.army.moda.workoutgeneratorproject.dto;

import jakarta.validation.constraints.NotNull;

public record SwapExerciseRequest(
        @NotNull Long replacementExerciseId
) {
}
