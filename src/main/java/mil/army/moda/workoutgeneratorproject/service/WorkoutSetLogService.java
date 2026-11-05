
package mil.army.moda.workoutgeneratorproject.service;

import mil.army.moda.workoutgeneratorproject.dto.*;
import mil.army.moda.workoutgeneratorproject.model.*;
import mil.army.moda.workoutgeneratorproject.repository.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.json.JsonMapper;

import java.util.*;

@Service
public class WorkoutSetLogService {

    private final WorkoutSetLogRepository logRepository;
    private final SavedProgramRepository programRepository;
    private final JsonMapper jsonMapper;

    public WorkoutSetLogService(
            WorkoutSetLogRepository logRepository,
            SavedProgramRepository programRepository,
            JsonMapper jsonMapper
    ) {
        this.logRepository = logRepository;
        this.programRepository = programRepository;
        this.jsonMapper = jsonMapper;
    }

    @Transactional(readOnly = true)
    public List<WorkoutSetLogResponse> getSessionLogs(
            Long programId,
            int sessionNumber
    ) {
        SavedProgram program = findProgram(programId);
        findSession(program, sessionNumber);

        return logRepository
                .findBySavedProgram_IdAndSessionNumberOrderByExerciseIdAscSetNumberAsc(
                        programId,
                        sessionNumber
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<WorkoutSetLogResponse> saveSessionLogs(
            Long programId,
            int sessionNumber,
            SaveWorkoutSetsRequest request
    ) {
        SavedProgram program = findProgram(programId);
        WorkoutDay session = findSession(program, sessionNumber);

        // Allowed set counts come from the saved prescription.
        Map<Long, Integer> prescribedSets = new HashMap<>();

        for (WorkoutExercise exercise : session.exercises()) {
            prescribedSets.put(
                    exercise.exerciseId(),
                    exercise.sets()
            );
        }

        // Prevent duplicate entries within the request.
        Set<String> seen = new HashSet<>();

        for (WorkoutSetInput input : request.sets()) {
            Integer maxSets = prescribedSets.get(input.exerciseId());

            if (maxSets == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Exercise is not part of this session"
                );
            }

            if (input.setNumber() > maxSets) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Set number exceeds the prescribed sets"
                );
            }

            String key = input.exerciseId() + ":" + input.setNumber();

            if (!seen.add(key)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Duplicate set entry"
                );
            }
        }

        // Replace this session's previous logs.
        // An empty list clears the session log.
        logRepository.deleteBySavedProgram_IdAndSessionNumber(
                programId,
                sessionNumber
        );

        logRepository.flush();

        List<WorkoutSetLog> newLogs = request.sets()
                .stream()
                .map(input -> new WorkoutSetLog(
                        program,
                        sessionNumber,
                        input.exerciseId(),
                        input.setNumber(),
                        input.weightLb(),
                        input.reps(),
                        input.actualRpe()
                ))
                .toList();

        logRepository.saveAll(newLogs);

        return logRepository
                .findBySavedProgram_IdAndSessionNumberOrderByExerciseIdAscSetNumberAsc(
                        programId,
                        sessionNumber
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private SavedProgram findProgram(Long programId) {
        return programRepository.findById(programId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Saved program not found"
                ));
    }

    private WorkoutDay findSession(
            SavedProgram program,
            int sessionNumber
    ) {
        WorkoutDay[] schedule = jsonMapper.readValue(
                program.getScheduleJson(),
                WorkoutDay[].class
        );

        return Arrays.stream(schedule)
                .filter(day -> day.sessionNumber() == sessionNumber)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Workout session not found"
                ));
    }

    private WorkoutSetLogResponse toResponse(WorkoutSetLog log) {
        return new WorkoutSetLogResponse(
                log.getExerciseId(),
                log.getSetNumber(),
                log.getWeightLb(),
                log.getReps(),
                log.getActualRpe()
        );
    }
}
