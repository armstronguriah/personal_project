package mil.army.moda.workoutgeneratorproject.controller;

import jakarta.validation.Valid;
import mil.army.moda.workoutgeneratorproject.model.Exercise;
import mil.army.moda.workoutgeneratorproject.model.MovementPattern;
import mil.army.moda.workoutgeneratorproject.service.ExerciseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestParam;
import mil.army.moda.workoutgeneratorproject.dto.CreateExerciseRequest;
import mil.army.moda.workoutgeneratorproject.dto.UpdateExerciseRequest;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {

    private final ExerciseService service;

    public ExerciseController(ExerciseService service){
        this.service = service;
    }

    private Exercise toExercise(
            String name,
            String primaryMuscle,
            String equipment,
            String description,
            MovementPattern movementPattern) {

        Exercise exercise = new Exercise();

        exercise.setName(name);
        exercise.setPrimaryMuscle(primaryMuscle);
        exercise.setEquipment(equipment);
        exercise.setDescription(description);
        exercise.setMovementPattern(movementPattern);

        return exercise;
    }

    @GetMapping
    public List<Exercise> getAllExercises(
            @RequestParam(required = false) String equipment,
            @RequestParam(required = false) String primaryMuscle,
            @RequestParam(required = false) MovementPattern movementPattern) {

        boolean hasEquipment =
                equipment != null && !equipment.isBlank();

        boolean hasPrimaryMuscle =
                primaryMuscle != null && !primaryMuscle.isBlank();


        if (movementPattern != null) {

            if (hasEquipment && hasPrimaryMuscle) {
                return service.getExercisesByAllThreeFilters(
                        equipment.strip(),
                        primaryMuscle.strip(),
                        movementPattern
                );
            }

            if (hasEquipment) {
                return service.getExercisesByEquipmentAndMovementPattern(
                        equipment.strip(),
                        movementPattern
                );
            }

            if (hasPrimaryMuscle) {
                return service.getExercisesByPrimaryMuscleAndMovementPattern(
                        primaryMuscle.strip(),
                        movementPattern
                );
            }

            return service.getExercisesByMovementPattern(movementPattern);
        }


        if (hasEquipment && hasPrimaryMuscle) {
            return service.getExercisesByEquipmentAndPrimaryMuscle(
                    equipment.strip(),
                    primaryMuscle.strip()
            );
        }

        if (hasEquipment) {
            return service.getExercisesByEquipment(equipment.strip());
        }

        if (hasPrimaryMuscle) {
            return service.getExercisesByPrimaryMuscle(primaryMuscle.strip());
        }

        return service.getAllExercises();
    }



    @GetMapping("/{id}")
    public ResponseEntity<Exercise> getExerciseById(
            @PathVariable("id") Long id) {
        return ResponseEntity.of(service.getExerciseById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Exercise addExercise(@Valid @RequestBody CreateExerciseRequest request) {

        Exercise exercise = toExercise(
                request.name(),
                request.primaryMuscle(),
                request.equipment(),
                request.description(),
                request.movementPattern()
        );

        return service.addExercise(exercise);
    }



    @PutMapping("/{id}")
    public ResponseEntity<Exercise> updateExercise(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateExerciseRequest request) {

        Exercise changes = toExercise(
                request.name(),
                request.primaryMuscle(),
                request.equipment(),
                request.description(),
                request.movementPattern()
        );

        return ResponseEntity.of(service.updateExercise(id, changes));
    }



    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExercise(
            @PathVariable("id") Long id) {

        Optional<Exercise> result = service.deleteExercise(id);

        if (result.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }

}
