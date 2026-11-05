
package mil.army.moda.workoutgeneratorproject.service;

import mil.army.moda.workoutgeneratorproject.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class ProgramServiceTest {

    private ProgramService service;
    private ExerciseSelectionService selectionService;

    @BeforeEach
    void setUp() {
        selectionService = mock(ExerciseSelectionService.class);
        service = new ProgramService(selectionService);
    }

    @Test
    void createWeeklySplit_oneDay_returnsFullBody() {
        // Arrange
        int trainingDays = 1;

        // Act
        List<WorkoutType> result =
                service.createWeeklySplit(trainingDays);

        // Assert
        assertEquals(
                List.of(WorkoutType.FULL_BODY),
                result
        );
    }

    @Test
    void createWeeklySplit_twoDays_returnsTwoFullBodyWorkouts() {
        // Arrange
        int trainingDays = 2;

        // Act
        List<WorkoutType> result =
                service.createWeeklySplit(trainingDays);

        // Assert
        assertEquals(
                List.of(
                        WorkoutType.FULL_BODY,
                        WorkoutType.FULL_BODY
                ),
                result
        );
    }

    @Test
    void createWeeklySplit_threeDays_returnsThreeFullBodyWorkouts() {
        // Arrange
        int trainingDays = 3;

        // Act
        List<WorkoutType> result =
                service.createWeeklySplit(trainingDays);

        // Assert
        assertEquals(
                List.of(
                        WorkoutType.FULL_BODY,
                        WorkoutType.FULL_BODY,
                        WorkoutType.FULL_BODY
                ),
                result
        );
    }

    @Test
    void createWeeklySplit_fourDays_returnsUpperLowerSplit() {
        // Arrange
        int trainingDays = 4;

        // Act
        List<WorkoutType> result =
                service.createWeeklySplit(trainingDays);

        // Assert
        assertEquals(
                List.of(
                        WorkoutType.UPPER_BODY,
                        WorkoutType.LOWER_BODY,
                        WorkoutType.UPPER_BODY,
                        WorkoutType.LOWER_BODY
                ),
                result
        );
    }

    @Test
    void createWeeklySplit_fiveDays_returnsMixedSplit() {
        // Arrange
        int trainingDays = 5;

        // Act
        List<WorkoutType> result =
                service.createWeeklySplit(trainingDays);

        // Assert
        assertEquals(
                List.of(
                        WorkoutType.UPPER_BODY,
                        WorkoutType.LOWER_BODY,
                        WorkoutType.FULL_BODY,
                        WorkoutType.UPPER_BODY,
                        WorkoutType.LOWER_BODY
                ),
                result
        );
    }

    @Test
    void createWeeklySplit_sixDays_returnsPushPullLegsSplit() {
        // Arrange
        int trainingDays = 6;

        // Act
        List<WorkoutType> result =
                service.createWeeklySplit(trainingDays);

        // Assert
        assertEquals(
                List.of(
                        WorkoutType.PUSH,
                        WorkoutType.PULL,
                        WorkoutType.LEGS,
                        WorkoutType.PUSH,
                        WorkoutType.PULL,
                        WorkoutType.LEGS
                ),
                result
        );
    }

    @Test
    void createWeeklySplit_sevenDays_includesActiveRecovery() {
        // Arrange
        int trainingDays = 7;

        // Act
        List<WorkoutType> result =
                service.createWeeklySplit(trainingDays);

        // Assert
        assertEquals(
                List.of(
                        WorkoutType.PUSH,
                        WorkoutType.PULL,
                        WorkoutType.LEGS,
                        WorkoutType.PUSH,
                        WorkoutType.PULL,
                        WorkoutType.LEGS,
                        WorkoutType.ACTIVE_RECOVERY
                ),
                result
        );
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 8, -1})
    void createWeeklySplit_invalidDays_throwsException(int trainingDays) {
        // Act
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.createWeeklySplit(trainingDays)
        );

        // Assert
        assertEquals(
                "Training days must be between 1 and 7",
                exception.getMessage()
        );
    }

    @Test
    void createWeeklySchedule_fourDays_returnsNumberedWorkouts() {

        // Act
        List<WorkoutDay> result =
                service.createWeeklySchedule(
                        4,
                        List.of("Barbell", "Dumbbell", "Bodyweight")
                );

        // Assert
        assertEquals(
                List.of(
                        new WorkoutDay(1, WorkoutType.UPPER_BODY),
                        new WorkoutDay(2, WorkoutType.LOWER_BODY),
                        new WorkoutDay(3, WorkoutType.UPPER_BODY),
                        new WorkoutDay(4, WorkoutType.LOWER_BODY)
                ),
                result
        );
    }

    @Test
    void createFullBodyWorkout_includesSquatExercise() {
        // Arrange
        WorkoutExercise squat = new WorkoutExercise(
                1L, "Barbell Squat", 3, 8
        );

        when(selectionService.selectExercise(
                MovementPattern.SQUAT, 3, 8
        )).thenReturn(Optional.of(squat));

        // Act
        WorkoutDay result = service.createFullBodyWorkout(1);

        // Assert
        assertEquals(
                new WorkoutDay(
                        1,
                        WorkoutType.FULL_BODY,
                        List.of(squat)
                ),
                result
        );

        verify(selectionService).selectExercise(
                MovementPattern.SQUAT, 3, 8
        );
    }

    @Test
    void createWeeklySchedule_oneDay_includesSelectedExercise() {
        // Arrange
        WorkoutExercise squat = new WorkoutExercise(
                1L, "Barbell Squat", 3, 8
        );

        List<String> equipment = List.of("Barbell");

        when(selectionService.selectExercise(
                MovementPattern.SQUAT, equipment, 3, 8
        )).thenReturn(Optional.of(squat));

        // Act
        List<WorkoutDay> result = service.createWeeklySchedule(1, equipment);

        // Assert
        assertEquals(
                List.of(
                        new WorkoutDay(
                                1,
                                WorkoutType.FULL_BODY,
                                List.of(squat)
                        )
                ),
                result
        );

        verify(selectionService).selectExercise(
                MovementPattern.SQUAT, equipment, 3, 8
        );
    }

    @Test
    void createFullBodyWorkout_includesThreeMovementPatterns() {
        // Arrange
        WorkoutExercise squat = new WorkoutExercise(
                1L, "Barbell Squat", 3, 8
        );

        WorkoutExercise bench = new WorkoutExercise(
                2L, "Bench Press", 3, 8
        );

        WorkoutExercise row = new WorkoutExercise(
                3L, "Barbell Row", 3, 8
        );

        when(selectionService.selectExercise(
                MovementPattern.SQUAT, 3, 8
        )).thenReturn(Optional.of(squat));

        when(selectionService.selectExercise(
                MovementPattern.HORIZONTAL_PUSH, 3, 8
        )).thenReturn(Optional.of(bench));

        when(selectionService.selectExercise(
                MovementPattern.HORIZONTAL_PULL, 3, 8
        )).thenReturn(Optional.of(row));

        // Act
        WorkoutDay result = service.createFullBodyWorkout(1);

        // Assert
        assertEquals(1, result.sessionNumber());
        assertEquals(WorkoutType.FULL_BODY, result.workoutType());

        assertEquals(
                List.of(squat, bench, row),
                result.exercises()
        );

        verify(selectionService).selectExercise(
                MovementPattern.SQUAT, 3, 8
        );

        verify(selectionService).selectExercise(
                MovementPattern.HORIZONTAL_PUSH, 3, 8
        );

        verify(selectionService).selectExercise(
                MovementPattern.HORIZONTAL_PULL, 3, 8
        );
    }

    @Test
    void createFullBodyWorkout_usesAvailableEquipment() {
        // Arrange
        List<String> equipment = List.of(
                "Dumbbell",
                "Bodyweight"
        );

        WorkoutExercise squat = new WorkoutExercise(
                1L, "Goblet Squat", 3, 8
        );

        WorkoutExercise push = new WorkoutExercise(
                2L, "Dumbbell Bench Press", 3, 8
        );

        WorkoutExercise pull = new WorkoutExercise(
                3L, "Dumbbell Row", 3, 8
        );

        when(selectionService.selectExercise(
                MovementPattern.SQUAT, equipment, 3, 8
        )).thenReturn(Optional.of(squat));

        when(selectionService.selectExercise(
                MovementPattern.HORIZONTAL_PUSH, equipment, 3, 8
        )).thenReturn(Optional.of(push));

        when(selectionService.selectExercise(
                MovementPattern.HORIZONTAL_PULL, equipment, 3, 8
        )).thenReturn(Optional.of(pull));

        // Act
        WorkoutDay result = service.createFullBodyWorkout(
                1,
                equipment
        );

        // Assert
        assertEquals(
                List.of(squat, push, pull),
                result.exercises()
        );

        verify(selectionService).selectExercise(
                MovementPattern.SQUAT, equipment, 3, 8
        );

        verify(selectionService).selectExercise(
                MovementPattern.HORIZONTAL_PUSH, equipment, 3, 8
        );

        verify(selectionService).selectExercise(
                MovementPattern.HORIZONTAL_PULL, equipment, 3, 8
        );
    }

    @Test
    void createWeeklySchedule_usesAvailableEquipment() {
        // Arrange
        List<String> equipment = List.of(
                "Dumbbell",
                "Bodyweight"
        );

        WorkoutExercise squat = new WorkoutExercise(
                1L, "Goblet Squat", 3, 8
        );

        WorkoutExercise push = new WorkoutExercise(
                2L, "Dumbbell Bench Press", 3, 8
        );

        WorkoutExercise pull = new WorkoutExercise(
                3L, "Dumbbell Row", 3, 8
        );

        when(selectionService.selectExercise(
                MovementPattern.SQUAT, equipment, 3, 8
        )).thenReturn(Optional.of(squat));

        when(selectionService.selectExercise(
                MovementPattern.HORIZONTAL_PUSH, equipment, 3, 8
        )).thenReturn(Optional.of(push));

        when(selectionService.selectExercise(
                MovementPattern.HORIZONTAL_PULL, equipment, 3, 8
        )).thenReturn(Optional.of(pull));

        // Act
        List<WorkoutDay> result = service.createWeeklySchedule(
                1,
                equipment
        );

        // Assert
        assertEquals(
                List.of(
                        new WorkoutDay(
                                1,
                                WorkoutType.FULL_BODY,
                                List.of(squat, push, pull)
                        )
                ),
                result
        );

        verify(selectionService).selectExercise(
                MovementPattern.SQUAT, equipment, 3, 8
        );
    }

    @Test
    void createWeeklySchedule_fourDays_populatesUpperAndLowerWorkouts() {
        // Arrange
        List<String> equipment = List.of("Barbell", "Dumbbell");

        WorkoutExercise bench = new WorkoutExercise(
                1L, "Bench Press", 3, 8
        );

        WorkoutExercise row = new WorkoutExercise(
                2L, "Barbell Row", 3, 8
        );

        WorkoutExercise squat = new WorkoutExercise(
                3L, "Barbell Squat", 3, 8
        );

        WorkoutExercise deadlift = new WorkoutExercise(
                4L, "Romanian Deadlift", 3, 8
        );

        when(selectionService.selectExercise(
                MovementPattern.HORIZONTAL_PUSH, equipment, 3, 8
        )).thenReturn(Optional.of(bench));

        when(selectionService.selectExercise(
                MovementPattern.HORIZONTAL_PULL, equipment, 3, 8
        )).thenReturn(Optional.of(row));

        when(selectionService.selectExercise(
                MovementPattern.SQUAT, equipment, 3, 8
        )).thenReturn(Optional.of(squat));

        when(selectionService.selectExercise(
                MovementPattern.HINGE, equipment, 3, 8
        )).thenReturn(Optional.of(deadlift));

        // Act
        List<WorkoutDay> schedule =
                service.createWeeklySchedule(4, equipment);

        // Assert
        assertEquals(
                List.of(
                        new WorkoutDay(
                                1,
                                WorkoutType.UPPER_BODY,
                                List.of(bench, row)
                        ),
                        new WorkoutDay(
                                2,
                                WorkoutType.LOWER_BODY,
                                List.of(squat, deadlift)
                        ),
                        new WorkoutDay(
                                3,
                                WorkoutType.UPPER_BODY,
                                List.of(bench, row)
                        ),
                        new WorkoutDay(
                                4,
                                WorkoutType.LOWER_BODY,
                                List.of(squat, deadlift)
                        )
                ),
                schedule
        );

        verify(selectionService, times(2)).selectExercise(
                MovementPattern.HORIZONTAL_PUSH, equipment, 3, 8
        );

        verify(selectionService, times(2)).selectExercise(
                MovementPattern.SQUAT, equipment, 3, 8
        );
    }

    @Test
    void createWeeklySchedule_sixDays_generatesPushPullLegs() {
        // Arrange
        List<String> equipment = List.of(
                "Barbell", "Dumbbell", "Bodyweight"
        );

        WorkoutExercise bench =
                new WorkoutExercise(1L, "Bench Press", 3, 8);
        WorkoutExercise overheadPress =
                new WorkoutExercise(2L, "Overhead Press", 3, 8);
        WorkoutExercise row =
                new WorkoutExercise(3L, "Barbell Row", 3, 8);
        WorkoutExercise pullUp =
                new WorkoutExercise(4L, "Pull-up", 3, 8);
        WorkoutExercise squat =
                new WorkoutExercise(5L, "Barbell Squat", 3, 8);
        WorkoutExercise deadlift =
                new WorkoutExercise(6L, "Romanian Deadlift", 3, 8);
        WorkoutExercise lunge =
                new WorkoutExercise(7L, "Dumbbell Lunge", 3, 8);

        when(selectionService.selectExercise(
                MovementPattern.HORIZONTAL_PUSH, equipment, 3, 8
        )).thenReturn(Optional.of(bench));

        when(selectionService.selectExercise(
                MovementPattern.VERTICAL_PUSH, equipment, 3, 8
        )).thenReturn(Optional.of(overheadPress));

        when(selectionService.selectExercise(
                MovementPattern.HORIZONTAL_PULL, equipment, 3, 8
        )).thenReturn(Optional.of(row));

        when(selectionService.selectExercise(
                MovementPattern.VERTICAL_PULL, equipment, 3, 8
        )).thenReturn(Optional.of(pullUp));

        when(selectionService.selectExercise(
                MovementPattern.SQUAT, equipment, 3, 8
        )).thenReturn(Optional.of(squat));

        when(selectionService.selectExercise(
                MovementPattern.HINGE, equipment, 3, 8
        )).thenReturn(Optional.of(deadlift));

        when(selectionService.selectExercise(
                MovementPattern.LUNGE, equipment, 3, 8
        )).thenReturn(Optional.of(lunge));

        // Act
        List<WorkoutDay> schedule =
                service.createWeeklySchedule(6, equipment);

        // Assert
        assertEquals(6, schedule.size());

        assertEquals(
                List.of(bench, overheadPress),
                schedule.get(0).exercises()
        );

        assertEquals(
                List.of(row, pullUp),
                schedule.get(1).exercises()
        );

        assertEquals(
                List.of(squat, deadlift, lunge),
                schedule.get(2).exercises()
        );

        assertEquals(
                List.of(
                        WorkoutType.PUSH,
                        WorkoutType.PULL,
                        WorkoutType.LEGS,
                        WorkoutType.PUSH,
                        WorkoutType.PULL,
                        WorkoutType.LEGS
                ),
                schedule.stream()
                        .map(WorkoutDay::workoutType)
                        .toList()
        );

        // The second half repeats the same split
        assertEquals(
                schedule.get(0).exercises(),
                schedule.get(3).exercises()
        );

        assertEquals(
                schedule.get(1).exercises(),
                schedule.get(4).exercises()
        );

        assertEquals(
                schedule.get(2).exercises(),
                schedule.get(5).exercises()
        );
    }

    @Test
    void createFullBodyWorkout_usesStrengthGoalPrescription() {
        // Arrange
        List<String> equipment = List.of(
                "Barbell",
                "Dumbbell"
        );

        WorkoutExercise squat = new WorkoutExercise(
                1L, "Barbell Squat", 4, 5
        );

        when(selectionService.selectExercise(
                MovementPattern.SQUAT,
                equipment,
                4,
                5
        )).thenReturn(Optional.of(squat));

        // Act
        WorkoutDay result = service.createFullBodyWorkout(
                1,
                equipment,
                TrainingGoal.STRENGTH
        );

        // Assert
        assertEquals(
                new WorkoutDay(
                        1,
                        WorkoutType.FULL_BODY,
                        List.of(squat)
                ),
                result
        );

        verify(selectionService).selectExercise(
                MovementPattern.SQUAT,
                equipment,
                4,
                5
        );
    }

    @Test
    void createWeeklySchedule_strengthGoalChangesSetsAndReps() {
        // Arrange
        List<String> equipment = List.of("Barbell");

        WorkoutExercise bench = new WorkoutExercise(
                1L, "Bench Press", 4, 5
        );

        WorkoutExercise squat = new WorkoutExercise(
                2L, "Barbell Squat", 4, 5
        );

        when(selectionService.selectExercise(
                MovementPattern.HORIZONTAL_PUSH,
                equipment,
                4,
                5
        )).thenReturn(Optional.of(bench));

        when(selectionService.selectExercise(
                MovementPattern.SQUAT,
                equipment,
                4,
                5
        )).thenReturn(Optional.of(squat));

        // Act
        List<WorkoutDay> schedule = service.createWeeklySchedule(
                4,
                equipment,
                TrainingGoal.STRENGTH
        );

        // Assert
        assertEquals(4, schedule.size());

        assertEquals(
                List.of(bench),
                schedule.get(0).exercises()
        );

        assertEquals(
                List.of(squat),
                schedule.get(1).exercises()
        );

        verify(selectionService, times(2)).selectExercise(
                MovementPattern.HORIZONTAL_PUSH,
                equipment,
                4,
                5
        );

        verify(selectionService, times(2)).selectExercise(
                MovementPattern.SQUAT,
                equipment,
                4,
                5
        );
    }

    @Test
    void threeFullBodyDays_useDifferentMovementPatterns() {
        List<String> equipment = List.of("Barbell", "Dumbbell");

        // Return a test exercise named after each requested pattern
        when(selectionService.selectExercise(
                any(MovementPattern.class),
                eq(equipment),
                eq(3),
                eq(8)
        )).thenAnswer(invocation -> {
            MovementPattern pattern = invocation.getArgument(0);

            return Optional.of(new WorkoutExercise(
                    (long) pattern.ordinal() + 1,
                    pattern.name(),
                    3,
                    8
            ));
        });

        List<WorkoutDay> schedule = service.createWeeklySchedule(
                3,
                equipment,
                TrainingGoal.HYBRID
        );

        assertEquals(
                List.of("SQUAT", "HINGE", "HORIZONTAL_PUSH",
                        "HORIZONTAL_PULL", "CORE"),
                schedule.get(0).exercises().stream()
                        .map(WorkoutExercise::exerciseName)
                        .toList()
        );

        assertEquals(
                List.of("LUNGE", "HINGE", "VERTICAL_PUSH",
                        "VERTICAL_PULL", "CORE"),
                schedule.get(1).exercises().stream()
                        .map(WorkoutExercise::exerciseName)
                        .toList()
        );

        assertEquals(
                List.of("SQUAT", "LUNGE", "HORIZONTAL_PUSH",
                        "VERTICAL_PULL", "CORE"),
                schedule.get(2).exercises().stream()
                        .map(WorkoutExercise::exerciseName)
                        .toList()
        );
    }

    @Test
    void createWeeklySchedule_avoidsRepeatingExercises() {
        // Arrange
        List<String> equipment = List.of("Barbell");

        WorkoutExercise firstHinge = new WorkoutExercise(
                11L, "Romanian Deadlift", 3, 8
        );

        WorkoutExercise secondHinge = new WorkoutExercise(
                12L, "Barbell Hip Thrust", 3, 8
        );

        // The default selection is always Romanian Deadlift
        when(selectionService.selectExercise(
                MovementPattern.HINGE,
                equipment,
                3,
                8
        )).thenReturn(Optional.of(firstHinge));

        // When ID 11 has been used, return another exercise
        when(selectionService.selectExercise(
                MovementPattern.HINGE,
                equipment,
                3,
                8,
                Set.of(11L)
        )).thenReturn(Optional.of(secondHinge));

        // Act
        List<WorkoutDay> schedule =
                service.createWeeklySchedule(
                        3,
                        equipment,
                        TrainingGoal.HYBRID
                );

        // Assert
        assertEquals(
                List.of(firstHinge),
                schedule.get(0).exercises()
        );

        assertEquals(
                List.of(secondHinge),
                schedule.get(1).exercises()
        );

        verify(selectionService).selectExercise(
                MovementPattern.HINGE,
                equipment,
                3,
                8,
                Set.of(11L)
        );
    }

    @Test
    void sessionDurationAndExperience_changeExerciseCount() {
        // Arrange
        List<String> equipment = List.of("Barbell");

        when(selectionService.selectExercise(
                any(MovementPattern.class),
                eq(equipment),
                anyInt(),
                anyInt(),
                anySet(),
                nullable(String.class),
                anyList()
        )).thenAnswer(invocation -> {

            MovementPattern pattern = invocation.getArgument(0);
            int sets = invocation.getArgument(2);
            int reps = invocation.getArgument(3);

            return Optional.of(new WorkoutExercise(
                    (long) pattern.ordinal() + 1,
                    pattern.name(),
                    sets,
                    reps
            ));
        });

        // Act
        List<WorkoutDay> shortProgram =
                service.createWeeklySchedule(
                        1, equipment, TrainingGoal.HYBRID,
                        "BEGINNER", 30
                );

        List<WorkoutDay> beginnerProgram =
                service.createWeeklySchedule(
                        1, equipment, TrainingGoal.HYBRID,
                        "BEGINNER", 90
                );

        List<WorkoutDay> advancedProgram =
                service.createWeeklySchedule(
                        1, equipment, TrainingGoal.HYBRID,
                        "ADVANCED", 90
                );

        // Assert
        assertEquals(3, shortProgram.get(0).exercises().size());
        assertEquals(5, beginnerProgram.get(0).exercises().size());
        assertEquals(6, advancedProgram.get(0).exercises().size());
    }



}
