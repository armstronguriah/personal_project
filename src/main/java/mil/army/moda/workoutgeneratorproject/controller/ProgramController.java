
package mil.army.moda.workoutgeneratorproject.controller;

import jakarta.validation.Valid;
import mil.army.moda.workoutgeneratorproject.dto.GenerateProgramRequest;
import mil.army.moda.workoutgeneratorproject.model.TrainingGoal;
import mil.army.moda.workoutgeneratorproject.model.WorkoutDay;
import mil.army.moda.workoutgeneratorproject.service.ProgramService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/programs")
public class ProgramController {

    private final ProgramService programService;

    public ProgramController(ProgramService programService){
        this.programService = programService;
    }


    @PostMapping("/generate")
    public List<WorkoutDay> generateProgram(
            @Valid @RequestBody GenerateProgramRequest request
    ) {
        TrainingGoal goal = TrainingGoal.valueOf(
                request.goal()
        );

        int programWeeks = request.programWeeks() == null
                ? 1
                : request.programWeeks();

        return programService.createMultiWeekSchedule(
                programWeeks,
                request.trainingDays(),
                request.availableEquipment(),
                TrainingGoal.valueOf(request.goal()),
                request.experience(),
                request.sessionMinutes()
        );
    }

}
