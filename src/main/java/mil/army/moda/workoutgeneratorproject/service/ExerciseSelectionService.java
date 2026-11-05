
package mil.army.moda.workoutgeneratorproject.service;

import mil.army.moda.workoutgeneratorproject.model.Exercise;
import mil.army.moda.workoutgeneratorproject.model.MovementPattern;
import mil.army.moda.workoutgeneratorproject.model.WorkoutExercise;
import mil.army.moda.workoutgeneratorproject.repository.ExerciseRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.Comparator;
import java.util.Set;

@Service
public class ExerciseSelectionService {

    private final ExerciseRepository repository;

    public ExerciseSelectionService(ExerciseRepository repository) {
        this.repository = repository;
    }

    public Optional<WorkoutExercise> selectExercise(
            MovementPattern pattern,
            int sets,
            int reps
    ) {
        return repository
                .findByMovementPatternAndDeletedFalse(pattern)
                .stream()
                .findFirst()
                .map(exercise -> new WorkoutExercise(
                        exercise.getId(),
                        exercise.getName(),
                        sets,
                        reps
                ));
    }


    public Optional<WorkoutExercise> selectExercise(
            MovementPattern pattern,
            String equipment,
            int sets,
            int reps
    ) {
        return repository
                .findByEquipmentIgnoreCaseAndMovementPatternAndDeletedFalse(
                        equipment,
                        pattern
                )
                .stream()
                .findFirst()
                .map(exercise -> new WorkoutExercise(
                        exercise.getId(),
                        exercise.getName(),
                        sets,
                        reps
                ));
    }


    public Optional<WorkoutExercise> selectExercise(
            MovementPattern pattern,
            List<String> availableEquipment,
            int sets,
            int reps
    ) {
        return selectExercise(
                pattern,
                availableEquipment,
                sets,
                reps,
                Set.of()
        );
    }

    public Optional<WorkoutExercise> selectExercise(
            MovementPattern pattern,
            List<String> availableEquipment,
            int sets,
            int reps,
            Set<Long> usedExerciseIds
    ) {
        if (availableEquipment == null || availableEquipment.isEmpty()) {
            return Optional.empty();
        }

        List<Exercise> candidates = repository
                .findByEquipmentInAndMovementPatternAndDeletedFalse(
                        availableEquipment,
                        pattern
                );

        Optional<Exercise> selected = candidates.stream()
                .filter(exercise ->
                        !usedExerciseIds.contains(exercise.getId())
                )
                .findFirst();

        if (selected.isEmpty()) {
            selected = candidates.stream().findFirst();
        }

        return selected.map(exercise -> new WorkoutExercise(
                exercise.getId(),
                exercise.getName(),
                sets,
                reps
        ));
    }


    public Optional<WorkoutExercise> selectExercise(
            MovementPattern pattern,
            List<String> availableEquipment,
            int sets,
            int reps,
            Set<Long> excludedIds,
            String primaryMuscle,
            List<String> equipmentPriority
    ) {
        if (availableEquipment == null || availableEquipment.isEmpty()) {
            return Optional.empty();
        }

        return repository
                .findByEquipmentInAndMovementPatternAndDeletedFalse(
                        availableEquipment,
                        pattern
                )
                .stream()
                .filter(exercise ->
                        !excludedIds.contains(exercise.getId())
                )
                .filter(exercise ->
                        primaryMuscle == null ||
                                primaryMuscle.equalsIgnoreCase(
                                        exercise.getPrimaryMuscle()
                                )
                )
                .min(
                        Comparator
                                .comparingInt((Exercise exercise) -> {
                                    int rank = equipmentPriority.indexOf(
                                            exercise.getEquipment()
                                    );

                                    return rank == -1
                                            ? equipmentPriority.size()
                                            : rank;
                                })
                                .thenComparing(Exercise::getName)
                )
                .map(exercise -> new WorkoutExercise(
                        exercise.getId(),
                        exercise.getName(),
                        sets,
                        reps
                ));
    }



}
