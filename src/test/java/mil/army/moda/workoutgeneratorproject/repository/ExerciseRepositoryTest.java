
package mil.army.moda.workoutgeneratorproject.repository;

import mil.army.moda.workoutgeneratorproject.model.Exercise;

import mil.army.moda.workoutgeneratorproject.model.MovementPattern;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import jakarta.persistence.EntityManager;

import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class ExerciseRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres =
            new PostgreSQLContainer("postgres");

    @Autowired
    private ExerciseRepository repository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void findByDeletedFalse_returnsOnlyActiveExercises() {
        // Arrange
        Exercise squat = new Exercise();
        squat.setName("Barbell Squat");
        squat.setPrimaryMuscle("Quadriceps");
        squat.setEquipment("Barbell");

        Exercise deadlift = new Exercise();
        deadlift.setName("Deadlift");
        deadlift.setPrimaryMuscle("Back");
        deadlift.setEquipment("Barbell");
        deadlift.setDeleted(true);

        repository.saveAll(List.of(squat, deadlift));
        repository.flush();

        // Act
        List<Exercise> result = repository.findByDeletedFalse();

        // Assert
        assertEquals(1, result.size());
        assertEquals("Barbell Squat", result.get(0).getName());
    }


    @Test
    void findByDeletedFalse_excludesExerciseAfterSoftDelete() {
        // Arrange
        Exercise squat = new Exercise();
        squat.setName("Barbell Squat");
        squat.setPrimaryMuscle("Quadriceps");
        squat.setEquipment("Barbell");

        Exercise saved = repository.saveAndFlush(squat);

        // Verify the exercise is initially active
        assertEquals(1, repository.findByDeletedFalse().size());

        // Act - Soft delete the exercise
        saved.setDeleted(true);
        repository.saveAndFlush(saved);

        // Assert
        List<Exercise> activeExercises =
                repository.findByDeletedFalse();

        assertTrue(activeExercises.isEmpty());
    }

    @Test
    void findByEquipmentIgnoreCaseAndDeletedFalse_returnsMatchingActiveExercises() {
        // Arrange
        Exercise squat = new Exercise();
        squat.setName("Barbell Squat");
        squat.setPrimaryMuscle("Quadriceps");
        squat.setEquipment("Barbell");

        Exercise deadlift = new Exercise();
        deadlift.setName("Deadlift");
        deadlift.setPrimaryMuscle("Back");
        deadlift.setEquipment("Barbell");
        deadlift.setDeleted(true);

        Exercise curl = new Exercise();
        curl.setName("Dumbbell Curl");
        curl.setPrimaryMuscle("Biceps");
        curl.setEquipment("Dumbbell");

        repository.saveAllAndFlush(List.of(squat, deadlift, curl));

        // Act
        List<Exercise> result =
                repository.findByEquipmentIgnoreCaseAndDeletedFalse("barbell");

        // Assert
        assertEquals(1, result.size());
        assertEquals("Barbell Squat", result.get(0).getName());
    }

    @Test
    void findByPrimaryMuscleIgnoreCaseAndDeletedFalse_returnsMatchingActiveExercises() {
        // Arrange
        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        bench.setPrimaryMuscle("Chest");
        bench.setEquipment("Barbell");

        Exercise pushup = new Exercise();
        pushup.setName("Push-up");
        pushup.setPrimaryMuscle("Chest");
        pushup.setEquipment("Bodyweight");
        pushup.setDeleted(true);

        Exercise row = new Exercise();
        row.setName("Barbell Row");
        row.setPrimaryMuscle("Back");
        row.setEquipment("Barbell");

        repository.saveAllAndFlush(List.of(bench, pushup, row));

        // Act
        List<Exercise> result =
                repository.findByPrimaryMuscleIgnoreCaseAndDeletedFalse("chest");

        // Assert
        assertEquals(1, result.size());
        assertEquals("Bench Press", result.get(0).getName());
    }


    @Test
    void findByEquipmentAndPrimaryMuscle_returnsMatchingActiveExercises() {
        // Arrange
        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        bench.setEquipment("Barbell");
        bench.setPrimaryMuscle("Chest");

        Exercise fly = new Exercise();
        fly.setName("Dumbbell Fly");
        fly.setEquipment("Dumbbell");
        fly.setPrimaryMuscle("Chest");

        Exercise row = new Exercise();
        row.setName("Barbell Row");
        row.setEquipment("Barbell");
        row.setPrimaryMuscle("Back");

        Exercise incline = new Exercise();
        incline.setName("Incline Bench Press");
        incline.setEquipment("Barbell");
        incline.setPrimaryMuscle("Chest");
        incline.setDeleted(true);

        repository.saveAllAndFlush(
                List.of(bench, fly, row, incline)
        );

        // Act
        List<Exercise> result = repository
                .findByEquipmentIgnoreCaseAndPrimaryMuscleIgnoreCaseAndDeletedFalse(
                        "barbell", "chest"
                );

        // Assert
        assertEquals(1, result.size());
        assertEquals("Bench Press", result.get(0).getName());
    }

    @Test
    void saveExercise_persistsMovementPattern() {
        // Arrange

        Exercise squat = new Exercise();
        squat.setName("Barbell Squat");
        squat.setPrimaryMuscle("Quadriceps");
        squat.setEquipment("Barbell");
        squat.setMovementPattern(MovementPattern.SQUAT);

        // Act
        Exercise saved = repository.saveAndFlush(squat);

        entityManager.clear();

        Exercise retrieved = repository.findById(saved.getId())
                .orElseThrow();

        // Assert
        assertEquals(
                MovementPattern.SQUAT,
                retrieved.getMovementPattern()
        );
    }

    @Test
    void findByMovementPatternAndDeletedFalse_returnsMatchingExercises() {
        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        bench.setEquipment("Barbell");
        bench.setPrimaryMuscle("Chest");
        bench.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);

        Exercise pushup = new Exercise();
        pushup.setName("Push-up");
        pushup.setEquipment("Bodyweight");
        pushup.setPrimaryMuscle("Chest");
        pushup.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);
        pushup.setDeleted(true);

        Exercise squat = new Exercise();
        squat.setName("Squat");
        squat.setEquipment("Barbell");
        squat.setPrimaryMuscle("Quadriceps");
        squat.setMovementPattern(MovementPattern.SQUAT);

        repository.saveAllAndFlush(List.of(bench, pushup, squat));

        List<Exercise> result = repository
                .findByMovementPatternAndDeletedFalse(
                        MovementPattern.HORIZONTAL_PUSH
                );

        assertEquals(1, result.size());
        assertEquals("Bench Press", result.get(0).getName());
    }

    @Test
    void findByEquipmentAndMovementPattern_returnsMatchingActiveExercises() {

        // Arrange
        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        bench.setEquipment("Barbell");
        bench.setPrimaryMuscle("Chest");
        bench.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);

        Exercise dumbbellPress = new Exercise();
        dumbbellPress.setName("Dumbbell Press");
        dumbbellPress.setEquipment("Dumbbell");
        dumbbellPress.setPrimaryMuscle("Chest");
        dumbbellPress.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);

        Exercise row = new Exercise();
        row.setName("Barbell Row");
        row.setEquipment("Barbell");
        row.setPrimaryMuscle("Back");
        row.setMovementPattern(MovementPattern.HORIZONTAL_PULL);

        Exercise incline = new Exercise();
        incline.setName("Incline Bench Press");
        incline.setEquipment("Barbell");
        incline.setPrimaryMuscle("Chest");
        incline.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);
        incline.setDeleted(true);

        repository.saveAllAndFlush(
                List.of(bench, dumbbellPress, row, incline)
        );

        // Act
        List<Exercise> result = repository
                .findByEquipmentIgnoreCaseAndMovementPatternAndDeletedFalse(
                        "barbell",
                        MovementPattern.HORIZONTAL_PUSH
                );

        // Assert
        assertEquals(1, result.size());
        assertEquals("Bench Press", result.get(0).getName());
    }

    @Test
    void findByPrimaryMuscleAndMovementPattern_returnsMatchingActiveExercises() {

        // Arrange
        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        bench.setPrimaryMuscle("Chest");
        bench.setEquipment("Barbell");
        bench.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);

        Exercise fly = new Exercise();
        fly.setName("Dumbbell Fly");
        fly.setPrimaryMuscle("Chest");
        fly.setEquipment("Dumbbell");
        fly.setMovementPattern(MovementPattern.ISOLATION);

        Exercise pushup = new Exercise();
        pushup.setName("Push-up");
        pushup.setPrimaryMuscle("Chest");
        pushup.setEquipment("Bodyweight");
        pushup.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);
        pushup.setDeleted(true);

        Exercise shoulderPress = new Exercise();
        shoulderPress.setName("Shoulder Press");
        shoulderPress.setPrimaryMuscle("Shoulders");
        shoulderPress.setEquipment("Dumbbell");
        shoulderPress.setMovementPattern(MovementPattern.VERTICAL_PUSH);

        repository.saveAllAndFlush(
                List.of(bench, fly, pushup, shoulderPress)
        );

        // Act
        List<Exercise> result = repository
                .findByPrimaryMuscleIgnoreCaseAndMovementPatternAndDeletedFalse(
                        "chest",
                        MovementPattern.HORIZONTAL_PUSH
                );

        // Assert
        assertEquals(1, result.size());
        assertEquals("Bench Press", result.get(0).getName());
    }

    @Test
    void findByAllThreeFilters_returnsMatchingActiveExercises() {

        // Matches all three filters
        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        bench.setEquipment("Barbell");
        bench.setPrimaryMuscle("Chest");
        bench.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);

        // Wrong equipment
        Exercise dumbbellPress = new Exercise();
        dumbbellPress.setName("Dumbbell Press");
        dumbbellPress.setEquipment("Dumbbell");
        dumbbellPress.setPrimaryMuscle("Chest");
        dumbbellPress.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);

        // Wrong primary muscle
        Exercise row = new Exercise();
        row.setName("Barbell Row");
        row.setEquipment("Barbell");
        row.setPrimaryMuscle("Back");
        row.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);

        // Wrong movement pattern
        Exercise fly = new Exercise();
        fly.setName("Barbell Fly");
        fly.setEquipment("Barbell");
        fly.setPrimaryMuscle("Chest");
        fly.setMovementPattern(MovementPattern.ISOLATION);

        // Matches all filters but is deleted
        Exercise incline = new Exercise();
        incline.setName("Incline Bench Press");
        incline.setEquipment("Barbell");
        incline.setPrimaryMuscle("Chest");
        incline.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);
        incline.setDeleted(true);

        repository.saveAllAndFlush(
                List.of(bench, dumbbellPress, row, fly, incline)
        );

        // Act
        List<Exercise> result = repository
                .findByEquipmentIgnoreCaseAndPrimaryMuscleIgnoreCaseAndMovementPatternAndDeletedFalse(
                        "barbell",
                        "chest",
                        MovementPattern.HORIZONTAL_PUSH
                );

        // Assert
        assertEquals(1, result.size());
        assertEquals("Bench Press", result.get(0).getName());
    }

}
