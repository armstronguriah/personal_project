package mil.army.moda.workoutgeneratorproject.service;

import mil.army.moda.workoutgeneratorproject.model.Exercise;
import mil.army.moda.workoutgeneratorproject.model.MovementPattern;
import mil.army.moda.workoutgeneratorproject.repository.ExerciseRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ExerciseService {

    private final ExerciseRepository repository;

    public ExerciseService(ExerciseRepository repository) {
        this.repository = repository;
    }

    public List<Exercise> getAllExercises() {
        return repository.findByDeletedFalse();
    }

    public Exercise addExercise(Exercise exercise) {
        exercise.setId(null);
        exercise.setDeleted(false);
        return repository.save(exercise);
    }

    public Optional<Exercise> getExerciseById(Long id) {
        return repository.findById(id).
                filter(exercise -> !exercise.isDeleted());
    }

    public Optional<Exercise> updateExercise(Long id, Exercise changes) {
        Optional<Exercise> toUpdate = repository.findById(id);

        if (toUpdate.isEmpty() || toUpdate.get().isDeleted()) {
            return Optional.empty();
        }

        Exercise existing = toUpdate.get();

        existing.setName(changes.getName());
        existing.setDescription(changes.getDescription());
        existing.setEquipment(changes.getEquipment());
        existing.setPrimaryMuscle(changes.getPrimaryMuscle());

        if (changes.getMovementPattern() != null) {
            existing.setMovementPattern(changes.getMovementPattern());
        }

        Exercise savedExercise = repository.save(existing);

        return Optional.of(savedExercise);
    }

    public Optional<Exercise> deleteExercise(Long id){
        Optional<Exercise> toDelete = repository.findById(id);

        if (toDelete.isEmpty() || toDelete.get().isDeleted()) {
            return Optional.empty();
        }

        Exercise existing = toDelete.get();

        existing.setDeleted(true);

        Exercise deletedExercise = repository.save(existing);

        return Optional.of(deletedExercise);
    }

    public List<Exercise> getExercisesByEquipment(String equipment) {
        return repository.findByEquipmentIgnoreCaseAndDeletedFalse(equipment);
    }

    public List<Exercise> getExercisesByPrimaryMuscle(String primaryMuscle) {
        return repository.findByPrimaryMuscleIgnoreCaseAndDeletedFalse(primaryMuscle);
    }

    public List<Exercise> getExercisesByEquipmentAndPrimaryMuscle(
            String equipment, String primaryMuscle) {

        return repository
                .findByEquipmentIgnoreCaseAndPrimaryMuscleIgnoreCaseAndDeletedFalse(
                        equipment, primaryMuscle);
    }

    public List<Exercise> getExercisesByMovementPattern(
            MovementPattern movementPattern) {

        return repository.findByMovementPatternAndDeletedFalse(
                movementPattern
        );
    }

    public List<Exercise> getExercisesByEquipmentAndMovementPattern(
            String equipment,
            MovementPattern movementPattern) {

        return repository
                .findByEquipmentIgnoreCaseAndMovementPatternAndDeletedFalse(
                        equipment,
                        movementPattern
                );
    }

    public List<Exercise> getExercisesByPrimaryMuscleAndMovementPattern(
            String primaryMuscle,
            MovementPattern movementPattern) {

        return repository
                .findByPrimaryMuscleIgnoreCaseAndMovementPatternAndDeletedFalse(
                        primaryMuscle,
                        movementPattern
                );
    }


    public List<Exercise> getExercisesByAllThreeFilters(
            String equipment,
            String primaryMuscle,
            MovementPattern movementPattern) {

        return repository
                .findByEquipmentIgnoreCaseAndPrimaryMuscleIgnoreCaseAndMovementPatternAndDeletedFalse(
                        equipment,
                        primaryMuscle,
                        movementPattern
                );
    }


}
