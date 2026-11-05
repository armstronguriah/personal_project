package mil.army.moda.workoutgeneratorproject.repository;

import mil.army.moda.workoutgeneratorproject.model.Exercise;
import mil.army.moda.workoutgeneratorproject.model.MovementPattern;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

    List<Exercise> findByDeletedFalse();

    List<Exercise> findByEquipmentIgnoreCaseAndDeletedFalse(String equipment);

    List<Exercise> findByPrimaryMuscleIgnoreCaseAndDeletedFalse(String primaryMuscle);

    List<Exercise> findByEquipmentIgnoreCaseAndPrimaryMuscleIgnoreCaseAndDeletedFalse(
            String equipment,
            String primaryMuscle
    );

    List<Exercise> findByMovementPatternAndDeletedFalse(
            MovementPattern movementPattern
    );

    List<Exercise> findByEquipmentIgnoreCaseAndMovementPatternAndDeletedFalse(
            String equipment,
            MovementPattern movementPattern
    );

    List<Exercise> findByPrimaryMuscleIgnoreCaseAndMovementPatternAndDeletedFalse(
            String primaryMuscle,
            MovementPattern movementPattern
    );


    List<Exercise>
    findByEquipmentIgnoreCaseAndPrimaryMuscleIgnoreCaseAndMovementPatternAndDeletedFalse(
            String equipment,
            String primaryMuscle,
            MovementPattern movementPattern
    );

    List<Exercise> findByEquipmentInAndMovementPatternAndDeletedFalse(
            List<String> equipment,
            MovementPattern movementPattern
    );


    Optional<Exercise> findByIdAndDeletedFalse(Long id);



}