
package mil.army.moda.workoutgeneratorproject.controller;

import mil.army.moda.workoutgeneratorproject.exception.GlobalExceptionHandler;
import mil.army.moda.workoutgeneratorproject.model.TrainingGoal;
import mil.army.moda.workoutgeneratorproject.model.WorkoutDay;
import mil.army.moda.workoutgeneratorproject.model.WorkoutExercise;
import mil.army.moda.workoutgeneratorproject.model.WorkoutType;
import mil.army.moda.workoutgeneratorproject.service.ProgramService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProgramControllerTest {

    private MockMvc mockMvc;
    private ProgramService programService;

    @BeforeEach
    void setUp() {
        programService = mock(ProgramService.class);

        mockMvc = MockMvcBuilders
                .standaloneSetup(
                        new ProgramController(programService)
                )
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void generateProgram_rejectsInvalidPreferences() throws Exception {

        String requestBody = """
            {
                "goal": "STRENGTH",
                "experience": "INTERMEDIATE",
                "trainingDays": 8,
                "sessionMinutes": 121,
                "availableEquipment": ["Barbell", "Bodyweight"]
            }
            """;

        mockMvc.perform(post("/api/programs/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.trainingDays").exists())
                .andExpect(jsonPath("$.errors.sessionMinutes").exists());
    }


    @Test
    void generateProgram_returnsGeneratedSchedule() throws Exception {
        // Arrange
        List<String> equipment = List.of(
                "Dumbbell",
                "Bodyweight"
        );

        WorkoutExercise squat = new WorkoutExercise(
                1L, "Goblet Squat", 3, 8, 7.5
        );

        WorkoutDay workout = new WorkoutDay(
                1,
                WorkoutType.FULL_BODY,
                List.of(squat)
        );

        // Mock the NEW multi-week generation method
        when(programService.createMultiWeekSchedule(
                1,                       // programWeeks
                1,                       // trainingDays
                equipment,
                TrainingGoal.STRENGTH,
                "INTERMEDIATE",
                60
        )).thenReturn(List.of(workout));

        // Act & Assert
        mockMvc.perform(post("/api/programs/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                    {
                        "goal": "STRENGTH",
                        "experience": "INTERMEDIATE",
                        "trainingDays": 1,
                        "sessionMinutes": 60,
                        "programWeeks": 1,
                        "availableEquipment": [
                            "Dumbbell",
                            "Bodyweight"
                        ]
                    }
                    """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sessionNumber").value(1))
                .andExpect(jsonPath("$[0].workoutType")
                        .value("FULL_BODY"))
                .andExpect(jsonPath("$[0].exercises[0].exerciseName")
                        .value("Goblet Squat"))
                .andExpect(jsonPath("$[0].exercises[0].sets").value(3))
                .andExpect(jsonPath("$[0].exercises[0].reps").value(8))
                .andExpect(jsonPath("$[0].exercises[0].targetRpe")
                        .value(7.5));

        // Verify the correct service method was called
        verify(programService).createMultiWeekSchedule(
                1,
                1,
                equipment,
                TrainingGoal.STRENGTH,
                "INTERMEDIATE",
                60
        );
    }



}
