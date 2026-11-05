
package mil.army.moda.workoutgeneratorproject.service;

import mil.army.moda.workoutgeneratorproject.model.Exercise;
import mil.army.moda.workoutgeneratorproject.model.MovementPattern;
import mil.army.moda.workoutgeneratorproject.model.WorkoutExercise;
import mil.army.moda.workoutgeneratorproject.repository.ExerciseRepository;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class ExerciseSelectionServiceTest {

    ExerciseRepository repository;
    ExerciseSelectionService service;


    @BeforeEach
    void setUp(){
        repository = mock(ExerciseRepository.class);
        service = new ExerciseSelectionService(repository);
    }

    @Test
    void selectExercise_returnsSquatWithPrescribedSetsAndReps() {

        // Arrange


        Exercise squat = new Exercise();
        squat.setId(1L);
        squat.setName("Barbell Squat");
        squat.setMovementPattern(MovementPattern.SQUAT);

        when(repository.findByMovementPatternAndDeletedFalse(
                MovementPattern.SQUAT
        )).thenReturn(List.of(squat));

        // Act
        Optional<WorkoutExercise> result =
                service.selectExercise(MovementPattern.SQUAT, 3, 8);

        // Assert
        assertEquals(
                Optional.of(
                        new WorkoutExercise(1L, "Barbell Squat", 3, 8)
                ),
                result
        );

        verify(repository).findByMovementPatternAndDeletedFalse(
                MovementPattern.SQUAT
        );
    }

    @Test
    void selectExercise_noMatchingExercises_returnsEmptyOptional() {
        // Arrange
        when(repository.findByMovementPatternAndDeletedFalse(
                MovementPattern.SQUAT
        )).thenReturn(List.of());

        // Act
        Optional<WorkoutExercise> result =
                service.selectExercise(MovementPattern.SQUAT, 3, 8);

        // Assert
        assertTrue(result.isEmpty());

        verify(repository).findByMovementPatternAndDeletedFalse(
                MovementPattern.SQUAT
        );
    }

    @Test
    void selectExercise_withEquipment_returnsMatchingExercise() {
        // Arrange
        ExerciseRepository repository = mock(ExerciseRepository.class);
        ExerciseSelectionService service =
                new ExerciseSelectionService(repository);

        Exercise squat = new Exercise();
        squat.setId(2L);
        squat.setName("Bodyweight Squat");
        squat.setEquipment("Bodyweight");
        squat.setMovementPattern(MovementPattern.SQUAT);

        when(repository.findByEquipmentIgnoreCaseAndMovementPatternAndDeletedFalse(
                "Bodyweight",
                MovementPattern.SQUAT
        )).thenReturn(List.of(squat));

        // Act
        Optional<WorkoutExercise> result = service.selectExercise(
                MovementPattern.SQUAT,
                "Bodyweight",
                3,
                8
        );

        // Assert
        assertEquals(
                Optional.of(
                        new WorkoutExercise(2L, "Bodyweight Squat", 3, 8)
                ),
                result
        );

        verify(repository)
                .findByEquipmentIgnoreCaseAndMovementPatternAndDeletedFalse(
                        "Bodyweight",
                        MovementPattern.SQUAT
                );
    }


    @Test
    void selectExercise_withMultipleEquipmentTypes_returnsMatchingExercise() {
        // Arrange
        List<String> availableEquipment = List.of(
                "Dumbbell",
                "Bodyweight"
        );

        Exercise pushUp = new Exercise();
        pushUp.setId(5L);
        pushUp.setName("Push-up");
        pushUp.setEquipment("Bodyweight");
        pushUp.setMovementPattern(
                MovementPattern.HORIZONTAL_PUSH
        );

        when(repository
                .findByEquipmentInAndMovementPatternAndDeletedFalse(
                        availableEquipment,
                        MovementPattern.HORIZONTAL_PUSH
                )
        ).thenReturn(List.of(pushUp));

        // Act
        Optional<WorkoutExercise> result =
                service.selectExercise(
                        MovementPattern.HORIZONTAL_PUSH,
                        availableEquipment,
                        3,
                        10
                );

        // Assert
        assertEquals(
                Optional.of(
                        new WorkoutExercise(5L, "Push-up", 3, 10)
                ),
                result
        );

        verify(repository)
                .findByEquipmentInAndMovementPatternAndDeletedFalse(
                        availableEquipment,
                        MovementPattern.HORIZONTAL_PUSH
                );
    }


    @Test
    void selectExercise_avoidsPreviouslyUsedExercise() {
        // Arrange
        List<String> equipment = List.of("Barbell");

        Exercise backSquat = new Exercise();
        backSquat.setId(1L);
        backSquat.setName("Barbell Squat");
        backSquat.setEquipment("Barbell");
        backSquat.setMovementPattern(MovementPattern.SQUAT);

        Exercise frontSquat = new Exercise();
        frontSquat.setId(2L);
        frontSquat.setName("Front Squat");
        frontSquat.setEquipment("Barbell");
        frontSquat.setMovementPattern(MovementPattern.SQUAT);

        when(repository
                .findByEquipmentInAndMovementPatternAndDeletedFalse(
                        equipment,
                        MovementPattern.SQUAT
                )
        ).thenReturn(List.of(backSquat, frontSquat));

        // Barbell Squat has already been selected
        Set<Long> usedExerciseIds = Set.of(1L);

        // Act
        Optional<WorkoutExercise> result =
                service.selectExercise(
                        MovementPattern.SQUAT,
                        equipment,
                        3,
                        8,
                        usedExerciseIds
                );

        // Assert
        assertEquals(
                Optional.of(
                        new WorkoutExercise(2L, "Front Squat", 3, 8)
                ),
                result
        );
    }


    @Test
    void selectsDumbbellExerciseBeforeBarbellWhenPreferred() {
        List<String> equipment = List.of("Barbell", "Dumbbell");

        Exercise barbellRow = new Exercise();
        barbellRow.setId(1L);
        barbellRow.setName("Barbell Bent Over Row");
        barbellRow.setEquipment("Barbell");

        Exercise dumbbellRow = new Exercise();
        dumbbellRow.setId(2L);
        dumbbellRow.setName("Dumbbell One Arm Row");
        dumbbellRow.setEquipment("Dumbbell");

        when(repository
                .findByEquipmentInAndMovementPatternAndDeletedFalse(
                        equipment,
                        MovementPattern.HORIZONTAL_PULL
                )
        ).thenReturn(List.of(barbellRow, dumbbellRow));

        Optional<WorkoutExercise> result = service.selectExercise(
                MovementPattern.HORIZONTAL_PULL,
                equipment,
                3,
                8,
                Set.of(),
                null,
                List.of("Dumbbell", "Barbell")
        );

        assertEquals(
                "Dumbbell One Arm Row",
                result.orElseThrow().exerciseName()
        );
    }


}
