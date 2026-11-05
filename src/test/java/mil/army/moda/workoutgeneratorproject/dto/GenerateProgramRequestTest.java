package mil.army.moda.workoutgeneratorproject.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class GenerateProgramRequestTest {

    @Test
    void invalidPreferences_failValidation() {
//        Arrange
        GenerateProgramRequest request =
                new GenerateProgramRequest(
                        "FLYING",
                        "INTERMEDIATE",
                        8,
                        15,
                        List.of("Barbell", "Bodyweight")
                );

        try(ValidatorFactory factory =
                    Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            // Act
            Set<String> invalidFields = validator.validate(request)
                    .stream()
                    .map(violation ->
                            violation.getPropertyPath().toString())
                    .collect(Collectors.toSet());

            // Assert
            assertEquals(
                    Set.of("goal", "trainingDays", "sessionMinutes"),
                    invalidFields
            );
        }
    }


    @Test
    void availableEquipment_rejectsEmptyAndUnsupportedValues() {

        // No equipment selected
        GenerateProgramRequest emptyRequest =
                new GenerateProgramRequest(
                        "STRENGTH",
                        "INTERMEDIATE",
                        4,
                        60,
                        List.of()
                );

        // One unsupported equipment type
        GenerateProgramRequest invalidRequest =
                new GenerateProgramRequest(
                        "STRENGTH",
                        "INTERMEDIATE",
                        4,
                        60,
                        List.of("Dumbbell", "Treadmill")
                );

        try (ValidatorFactory factory =
                     Validation.buildDefaultValidatorFactory()) {

            Validator validator = factory.getValidator();

            assertTrue(
                    validator.validate(emptyRequest)
                            .stream()
                            .anyMatch(violation ->
                                    violation.getPropertyPath()
                                            .toString()
                                            .startsWith("availableEquipment"))
            );

            assertTrue(
                    validator.validate(invalidRequest)
                            .stream()
                            .anyMatch(violation ->
                                    violation.getPropertyPath()
                                            .toString()
                                            .startsWith("availableEquipment"))
            );
        }
    }


}