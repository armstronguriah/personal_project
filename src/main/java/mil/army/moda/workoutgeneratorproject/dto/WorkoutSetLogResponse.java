
package mil.army.moda.workoutgeneratorproject.dto;

import java.math.BigDecimal;

public record WorkoutSetLogResponse(
        Long exerciseId,
        int setNumber,
        BigDecimal weightLb,
        int reps,
        Double actualRpe
) {}
