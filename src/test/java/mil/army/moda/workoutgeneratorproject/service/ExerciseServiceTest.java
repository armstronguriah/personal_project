
package mil.army.moda.workoutgeneratorproject.service;

import mil.army.moda.workoutgeneratorproject.model.Exercise;
import mil.army.moda.workoutgeneratorproject.model.MovementPattern;
import mil.army.moda.workoutgeneratorproject.repository.ExerciseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ExerciseServiceTest {

    private ExerciseRepository repository;
    private ExerciseService service;

    @BeforeEach
    void setUp(){
        repository = mock(ExerciseRepository.class);
        service = new ExerciseService(repository);
    }

    @Test
    void getAllExercises_returnsActiveExercises() {

        // Arrange

        Exercise squat = new Exercise();
        Exercise bench = new Exercise();

        when(repository.findByDeletedFalse()).thenReturn(List.of(squat, bench));

        // Act
        List<Exercise> result = service.getAllExercises();

        // Assert
        assertEquals(2, result.size());
        assertEquals(squat, result.get(0));
        assertEquals(bench, result.get(1));
        verify(repository).findByDeletedFalse();
    }


    @Test
    void addExercise_savesAndReturnsExercise() {
        // Arrange

        Exercise exercise = new Exercise();
        exercise.setName("Barbell Squat");

        when(repository.save(exercise)).thenReturn(exercise);

        // Act
        Exercise result = service.addExercise(exercise);

        // Assert
        assertSame(exercise, result);
        verify(repository).save(exercise);
    }


    @Test
    void getExerciseById_returnsExerciseWhenFound() {
        // Arrange
        Exercise squat = new Exercise();
        squat.setName("Barbell Squat");

        when(repository.findById(1L))
                .thenReturn(Optional.of(squat));

        // Act
        Optional<Exercise> result = service.getExerciseById(1L);

        // Assert
        assertTrue(result.isPresent());
        assertSame(squat, result.get());
        verify(repository).findById(1L);
    }

    @Test
    void getExerciseById_returnsEmptyWhenNotFound() {
        // Arrange
        when(repository.findById(999L))
                .thenReturn(Optional.empty());

        // Act
        Optional<Exercise> result = service.getExerciseById(999L);

        // Assert
        assertTrue(result.isEmpty());
        verify(repository).findById(999L);
    }


    @Test
    void updateExercise_updatesExistingExercise() {
        // Arrange
        Exercise existing = new Exercise();
        existing.setId(1L);
        existing.setName("Barbell Squat");
        existing.setEquipment("Barbell");

        Exercise changes = new Exercise();
        changes.setName("Barbell Front Squat");
        changes.setEquipment("Barbell");

        when(repository.findById(1L))
                .thenReturn(Optional.of(existing));

        when(repository.save(existing))
                .thenReturn(existing);

        // Act
        Optional<Exercise> result =
                service.updateExercise(1L, changes);

        // Assert
        assertTrue(result.isPresent());
        assertEquals("Barbell Front Squat",
                result.get().getName());

        verify(repository).findById(1L);
        verify(repository).save(existing);
    }

    @Test
    void updateExercise_returnsEmptyWhenNotFound() {
        // Arrange
        Exercise changes = new Exercise();
        changes.setName("Front Squat");

        when(repository.findById(999L))
                .thenReturn(Optional.empty());

        // Act
        Optional<Exercise> result =
                service.updateExercise(999L, changes);

        // Assert
        assertTrue(result.isEmpty());

        verify(repository).findById(999L);
        verify(repository, never()).save(any(Exercise.class));
    }

    @Test
    void deleteExercise_deletesExistingExercise() {
        // Arrange
        Long id = 1L;

        Exercise existing = new Exercise();
        existing.setId(id);

        when(repository.findById(id))
                .thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        // Act
        Optional<Exercise> result = service.deleteExercise(id);

        // Assert
        assertTrue(result.isPresent());
        assertTrue(result.get().isDeleted());
        assertSame(existing, result.get());

        verify(repository).save(existing);
        verify(repository, never()).deleteById(anyLong());

    }

    @Test
    void deleteExercise_returnsEmptyWhenNotFound() {
        Long id = 999L;

        when(repository.findById(id)).thenReturn(Optional.empty());

        Optional<Exercise> result = service.deleteExercise(id);

        assertTrue(result.isEmpty());

        verify(repository).findById(id);
        verify(repository, never()).save(any(Exercise.class));
    }


    @Test
    void getExerciseById_returnsEmptyWhenDeleted() {
        // Arrange
        Long id = 1L;

        Exercise deadlift = new Exercise();
        deadlift.setId(id);
        deadlift.setDeleted(true);

        when(repository.findById(id))
                .thenReturn(Optional.of(deadlift));

        // Act
        Optional<Exercise> result = service.getExerciseById(id);

        // Assert
        assertTrue(result.isEmpty());
        verify(repository).findById(id);
    }


    @Test
    void updateExercise_returnsEmptyWhenDeleted() {
        // Arrange
        Long id = 1L;

        Exercise existing = new Exercise();
        existing.setId(id);
        existing.setName("Barbell Squat");
        existing.setDeleted(true);

        Exercise changes = new Exercise();
        changes.setName("Front Squat");

        when(repository.findById(id))
                .thenReturn(Optional.of(existing));

        // Act
        Optional<Exercise> result = service.updateExercise(id, changes);

        // Assert
        assertTrue(result.isEmpty());
        assertEquals("Barbell Squat", existing.getName());

        verify(repository).findById(id);
        verify(repository, never()).save(any(Exercise.class));
    }


    @Test
    void deleteExercise_returnsEmptyWhenAlreadyDeleted() {
        // Arrange
        Long id = 1L;

        Exercise existing = new Exercise();
        existing.setId(id);
        existing.setDeleted(true);

        when(repository.findById(id))
                .thenReturn(Optional.of(existing));

        when(repository.save(existing))
                .thenReturn(existing);

        // Act
        Optional<Exercise> result = service.deleteExercise(id);

        // Assert
        assertTrue(result.isEmpty());

        verify(repository).findById(id);
        verify(repository, never()).save(any(Exercise.class));
    }

    @Test
    void addExercise_ignoresClientProvidedId() {
        // Arrange
        Exercise exercise = new Exercise();
        exercise.setId(99L);
        exercise.setName("Barbell Squat");
        exercise.setPrimaryMuscle("Quadriceps");
        exercise.setEquipment("Barbell");

        // Act
        service.addExercise(exercise);

        // Assert
        verify(repository).save(
                argThat(saved -> saved.getId() == null)
        );
    }


    @Test
    void addExercise_ignoresClientProvidedDeletedStatus() {
        // Arrange
        Exercise exercise = new Exercise();
        exercise.setName("Push-up");
        exercise.setPrimaryMuscle("Chest");
        exercise.setEquipment("Bodyweight");
        exercise.setDeleted(true);

        // Act
        service.addExercise(exercise);

        // Assert
        verify(repository).save(
                argThat(saved -> !saved.isDeleted())
        );
    }

    @Test
    void getExercisesByEquipment_usesActiveEquipmentFilter() {
        // Arrange
        Exercise squat = new Exercise();
        squat.setName("Barbell Squat");
        squat.setEquipment("Barbell");

        when(repository.findByEquipmentIgnoreCaseAndDeletedFalse("barbell"))
                .thenReturn(List.of(squat));

        // Act
        List<Exercise> result =
                service.getExercisesByEquipment("barbell");

        // Assert
        assertEquals(1, result.size());
        assertSame(squat, result.get(0));

        verify(repository)
                .findByEquipmentIgnoreCaseAndDeletedFalse("barbell");
    }

    @Test
    void getExercisesByPrimaryMuscle_returnsActiveExercises() {
        // Arrange
        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        bench.setPrimaryMuscle("Chest");

        when(repository.findByPrimaryMuscleIgnoreCaseAndDeletedFalse("chest"))
                .thenReturn(List.of(bench));

        // Act
        List<Exercise> result =
                service.getExercisesByPrimaryMuscle("chest");

        // Assert
        assertEquals(1, result.size());
        assertSame(bench, result.get(0));

        verify(repository)
                .findByPrimaryMuscleIgnoreCaseAndDeletedFalse("chest");
    }

    @Test
    void updateExercise_updatesMovementPattern() {
        // Arrange
        Exercise existing = new Exercise();
        existing.setId(1L);
        existing.setMovementPattern(MovementPattern.SQUAT);

        Exercise changes = new Exercise();
        changes.setMovementPattern(MovementPattern.HINGE);

        when(repository.findById(1L))
                .thenReturn(Optional.of(existing));

        when(repository.save(existing))
                .thenReturn(existing);

        // Act
        Optional<Exercise> result =
                service.updateExercise(1L, changes);

        // Assert
        assertTrue(result.isPresent());

        assertEquals(
                MovementPattern.HINGE,
                result.get().getMovementPattern()
        );

        verify(repository).save(existing);
    }

    @Test
    void updateExercise_preservesMovementPatternWhenOmitted() {
        // Arrange
        Exercise existing = new Exercise();
        existing.setId(1L);
        existing.setMovementPattern(MovementPattern.SQUAT);

        Exercise changes = new Exercise();
        changes.setMovementPattern(null);

        when(repository.findById(1L))
                .thenReturn(Optional.of(existing));

        when(repository.save(existing))
                .thenReturn(existing);

        // Act
        Optional<Exercise> result =
                service.updateExercise(1L, changes);

        // Assert
        assertTrue(result.isPresent());

        assertEquals(
                MovementPattern.SQUAT,
                result.get().getMovementPattern()
        );

        verify(repository).save(existing);
    }

    @Test
    void getExercisesByMovementPattern_returnsMatchingExercises() {
        // Arrange
        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        bench.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);

        when(repository.findByMovementPatternAndDeletedFalse(
                MovementPattern.HORIZONTAL_PUSH))
                .thenReturn(List.of(bench));

        // Act
        List<Exercise> result = service.getExercisesByMovementPattern(
                MovementPattern.HORIZONTAL_PUSH
        );

        // Assert
        assertEquals(1, result.size());
        assertEquals("Bench Press", result.get(0).getName());

        verify(repository).findByMovementPatternAndDeletedFalse(
                MovementPattern.HORIZONTAL_PUSH
        );
    }



}
