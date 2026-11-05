
package mil.army.moda.workoutgeneratorproject.dto;

import jakarta.validation.constraints.*;

import java.util.List;

public record GenerateProgramRequest(

        @NotBlank
        @Pattern(regexp = "STRENGTH|HYPERTROPHY|ENDURANCE|HYBRID")
        String goal,

        @NotBlank
        @Pattern(regexp = "BEGINNER|INTERMEDIATE|ADVANCED")
        String experience,

        @NotNull
        @Min(1)
        @Max(7)
        Integer trainingDays,

        @NotNull
        @Min(30)
        @Max(120)
        Integer sessionMinutes,


        @NotEmpty
        List<
                @NotBlank
                @Pattern(regexp = "Barbell|Dumbbell|Bodyweight|Cable|Machine|Kettlebell|Resistance Band")
                        String
                > availableEquipment,


        @Min(1)
        @Max(8)
        Integer programWeeks
) {

        public GenerateProgramRequest(
                String goal,
                String experience,
                Integer trainingDays,
                Integer sessionMinutes,
                List<String> availableEquipment
        ) {
                this(
                        goal,
                        experience,
                        trainingDays,
                        sessionMinutes,
                        availableEquipment,
                        1
                );
        }
}
