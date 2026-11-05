
package mil.army.moda.workoutgeneratorproject.controller;

import mil.army.moda.workoutgeneratorproject.dto.ExerciseDbExercise;
import mil.army.moda.workoutgeneratorproject.model.Exercise;
import mil.army.moda.workoutgeneratorproject.repository.ExerciseRepository;
import mil.army.moda.workoutgeneratorproject.service.ExerciseDbService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseDbController {

    private final ExerciseRepository exerciseRepository;
    private final ExerciseDbService exerciseDbService;

    public ExerciseDbController(
            ExerciseRepository exerciseRepository,
            ExerciseDbService exerciseDbService
    ) {
        this.exerciseRepository = exerciseRepository;
        this.exerciseDbService = exerciseDbService;
    }

    @GetMapping("/{id}/external-matches")
    public List<ExerciseDbExercise> getExternalMatches(
            @PathVariable Long id
    ) {
        Exercise exercise = exerciseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Exercise not found"
                ));

        try {
            return exerciseDbService.searchExercises(
                    exercise.getName()
            );
        } catch (RestClientException | IllegalStateException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "ExerciseDB is temporarily unavailable",
                    ex
            );
        }
    }

    @GetMapping("/external/{externalId}")
    public ExerciseDbExercise getExternalExercise(
            @PathVariable String externalId
    ) {
        if (!externalId.matches("[A-Za-z0-9]{1,30}")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid external exercise ID"
            );
        }

        try {
            return exerciseDbService.getExerciseById(externalId);
        } catch (RestClientException | IllegalStateException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to load ExerciseDB details",
                    ex
            );
        }
    }

}
