
package mil.army.moda.workoutgeneratorproject.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record WorkoutSetInput(
        @NotNull Long exerciseId,
        @NotNull @Min(1) Integer setNumber,
        @NotNull @DecimalMin("0.0") BigDecimal weightLb,
        @NotNull @Min(1) Integer reps,
        @DecimalMin("1.0")
        @DecimalMax("10.0")
        Double actualRpe
) {}
