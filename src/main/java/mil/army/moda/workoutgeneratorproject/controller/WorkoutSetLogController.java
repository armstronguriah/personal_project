
package mil.army.moda.workoutgeneratorproject.controller;

import jakarta.validation.Valid;
import mil.army.moda.workoutgeneratorproject.dto.*;
import mil.army.moda.workoutgeneratorproject.service.WorkoutSetLogService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(
        "/api/programs/saved/{programId}/sessions/{sessionNumber}/sets"
)
public class WorkoutSetLogController {

    private final WorkoutSetLogService service;

    public WorkoutSetLogController(WorkoutSetLogService service) {
        this.service = service;
    }

    @GetMapping
    public List<WorkoutSetLogResponse> getLogs(
            @PathVariable Long programId,
            @PathVariable int sessionNumber
    ) {
        return service.getSessionLogs(programId, sessionNumber);
    }

    @PutMapping
    public List<WorkoutSetLogResponse> saveLogs(
            @PathVariable Long programId,
            @PathVariable int sessionNumber,
            @Valid @RequestBody SaveWorkoutSetsRequest request
    ) {
        return service.saveSessionLogs(
                programId,
                sessionNumber,
                request
        );
    }
}
