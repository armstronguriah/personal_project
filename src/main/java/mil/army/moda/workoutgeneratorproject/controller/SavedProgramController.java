
package mil.army.moda.workoutgeneratorproject.controller;

import jakarta.validation.Valid;
import mil.army.moda.workoutgeneratorproject.dto.*;
import mil.army.moda.workoutgeneratorproject.service.SavedProgramService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import mil.army.moda.workoutgeneratorproject.dto.SwapExerciseRequest;

import java.util.List;

@RestController
@RequestMapping("/api/programs/saved")
public class SavedProgramController {

    private final SavedProgramService service;

    public SavedProgramController(SavedProgramService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SavedProgramResponse save(
            @Valid @RequestBody SaveProgramRequest request
    ) {
        return service.save(request);
    }

    @GetMapping
    public List<SavedProgramResponse> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public SavedProgramResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PutMapping("/{id}/sessions/{sessionNumber}/completion")
    public SavedProgramResponse completeSession(
            @PathVariable Long id,
            @PathVariable int sessionNumber
    ) {
        return service.setSessionCompleted(
                id,
                sessionNumber,
                true
        );
    }

    @DeleteMapping("/{id}/sessions/{sessionNumber}/completion")
    public SavedProgramResponse undoCompletion(
            @PathVariable Long id,
            @PathVariable int sessionNumber
    ) {
        return service.setSessionCompleted(
                id,
                sessionNumber,
                false
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProgram(@PathVariable Long id) {
        service.deleteProgram(id);
    }


    @PutMapping("/{id}/sessions/{sessionNumber}/exercises/{exerciseId}")
    public SavedProgramResponse swapExercise(
            @PathVariable Long id,
            @PathVariable int sessionNumber,
            @PathVariable Long exerciseId,
            @Valid @RequestBody SwapExerciseRequest request
    ) {
        return service.swapExercise(
                id,
                sessionNumber,
                exerciseId,
                request.replacementExerciseId()
        );
    }



}
