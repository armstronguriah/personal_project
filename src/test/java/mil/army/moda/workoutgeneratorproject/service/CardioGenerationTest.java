package mil.army.moda.workoutgeneratorproject.service;

import mil.army.moda.workoutgeneratorproject.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CardioGenerationTest {

    private ProgramService programService;

    @BeforeEach
    void setUp() {
        ExerciseSelectionService selection = mock(ExerciseSelectionService.class);
        when(selection.selectExercise(
                any(MovementPattern.class), anyList(), anyInt(), anyInt(),
                anySet(), nullable(String.class), anyList()
        )).thenAnswer(invocation -> {
            MovementPattern pattern = invocation.getArgument(0);
            // Simulates the matching, seeded exercise from the database.
            return Optional.of(new WorkoutExercise(
                    (long) pattern.ordinal() + 1, pattern.name(),
                    invocation.getArgument(2), invocation.getArgument(3)
            ));
        });
        programService = new ProgramService(selection);
    }

    @Test
    void enduranceHasSteadyRunsAndIntervals() {
        var program = programService.createMultiWeekSchedule(
                4, 2, List.of("Bodyweight"), TrainingGoal.ENDURANCE, "BEGINNER", 30);
        assertEquals(8, program.size());
        var steady = program.get(0).exercises().get(0);
        var intervals = program.get(1).exercises().get(0);
        assertEquals("DURATION", steady.prescriptionType());
        assertTrue(steady.durationMinutes() > 0);
        assertEquals(0, steady.sets());
        assertEquals("INTERVALS", intervals.prescriptionType());
        assertTrue(intervals.rounds() > 0);
        assertTrue(intervals.restSeconds() > 0);
        assertEquals(8, program.get(7).sessionNumber());
    }

    @Test
    void cardioDurationProgressesAndDeloads() {
        var program = programService.createMultiWeekSchedule(
                4, 1, List.of("Bodyweight"), TrainingGoal.ENDURANCE, "INTERMEDIATE", 45);
        var first = program.get(0).exercises().get(0);
        var second = program.get(1).exercises().get(0);
        var deload = program.get(3).exercises().get(0);
        assertTrue(second.durationMinutes() > first.durationMinutes());
        assertTrue(deload.durationMinutes() < second.durationMinutes());
    }

    @Test
    void hybridMixesResistanceWithCardio() {
        var program = programService.createWeeklySchedule(
                4, List.of("Bodyweight"), TrainingGoal.HYBRID, "INTERMEDIATE", 60);
        assertTrue(program.get(0).exercises().stream().noneMatch(WorkoutExercise::isCardio));
        assertTrue(program.get(1).exercises().stream().anyMatch(WorkoutExercise::isCardio));
        assertTrue(program.get(3).exercises().stream().anyMatch(WorkoutExercise::isCardio));
    }

    @Test
    void strengthDoesNotGetCardioByDefault() {
        var program = programService.createWeeklySchedule(
                4, List.of("Bodyweight"), TrainingGoal.STRENGTH, "INTERMEDIATE", 60);
        assertTrue(program.stream()
                .flatMap(day -> day.exercises().stream())
                .noneMatch(WorkoutExercise::isCardio));
    }
}
