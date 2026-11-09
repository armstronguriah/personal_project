package mil.army.moda.workoutgeneratorproject.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record SaveCardioNotesRequest(
        @NotNull Map<@NotNull Long, @NotNull @Size(max = 1000) String> notes
) { }
