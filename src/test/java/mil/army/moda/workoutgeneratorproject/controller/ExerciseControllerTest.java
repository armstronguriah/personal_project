
package mil.army.moda.workoutgeneratorproject.controller;

import mil.army.moda.workoutgeneratorproject.exception.GlobalExceptionHandler;
import mil.army.moda.workoutgeneratorproject.model.Exercise;
import mil.army.moda.workoutgeneratorproject.model.MovementPattern;
import mil.army.moda.workoutgeneratorproject.repository.ExerciseRepository;
import mil.army.moda.workoutgeneratorproject.service.ExerciseService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ExerciseControllerTest {

    private ExerciseService service;
    private ExerciseController controller;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ExerciseService.class);
        controller = new ExerciseController(service);
        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getAllExercises_returnsExercisesAsJson() throws Exception {
        // Arrange

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller) //creates testing environment for controller
                .build();

        Exercise squat = new Exercise();
        squat.setName("Barbell Squat");

        when(service.getAllExercises())
                .thenReturn(List.of(squat));

        // Act & Assert
        mockMvc.perform(get("/api/exercises")) //Simulates a GET request to our endpoint.
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name") //$ is root, [0] first item, .name attribute
                        .value("Barbell Squat"));

        verify(service).getAllExercises();
    }

    @Test
    void getExerciseById_returnsExerciseWhenFound() throws Exception {
        // Arrange

        Exercise squat = new Exercise();
        squat.setId(1L);
        squat.setName("Barbell Squat");

        when(service.getExerciseById(1L))
                .thenReturn(Optional.of(squat));

        // Act & Assert
        mockMvc.perform(get("/api/exercises/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Barbell Squat"));

        verify(service).getExerciseById(1L);
    }

    @Test
    void getExerciseById_returns404WhenNotFound() throws Exception {
        // Arrange
        Long id = 999L;

        when(service.getExerciseById(id))
                .thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/exercises/{id}", id))
                .andExpect(status().isNotFound());

        verify(service).getExerciseById(id);
    }

    @Test
    void addExercise_returns201AndSavedExercise() throws Exception {
        // Arrange
        Exercise saved = new Exercise();
        saved.setId(1L);
        saved.setName("Barbell Squat");
        saved.setPrimaryMuscle("Quadriceps");
        saved.setEquipment("Barbell");

        when(service.addExercise(any(Exercise.class)))
                .thenReturn(saved);

        String requestBody = """
                {
                    "name": "Barbell Squat",
                    "primaryMuscle": "Quadriceps",
                    "equipment": "Barbell"
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Barbell Squat"));

        /*
        ArgumentCaptor.forClass(Exercise.class) creates a captor for Exercise objects.
        captor.capture() records the argument passed into service.addExercise().
        captor.getValue() retrieves that argument.
        assertEquals() verifies that the JSON fields were correctly converted into the object's properties.
         */

        ArgumentCaptor<Exercise> captor =
                ArgumentCaptor.forClass(Exercise.class);

        verify(service).addExercise(captor.capture());

        Exercise captured = captor.getValue();

        assertEquals("Barbell Squat", captured.getName());
        assertEquals("Quadriceps", captured.getPrimaryMuscle());
        assertEquals("Barbell", captured.getEquipment());

    }

    @Test
    void addExercise_returns400WhenNameIsBlank() throws Exception {
        // Arrange
        String requestBody = """
            {
                "name": "   ",
                "primaryMuscle": "Quadriceps",
                "equipment": "Barbell"
            }
            """;

        // Act & Assert
        mockMvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(service);
    }

    @Test
    void addExercise_returns400WhenEquipmentIsBlank() throws Exception {
        // Arrange
        String requestBody = """
            {
                "name": "Barbell Squat",
                "primaryMuscle": "Quadriceps",
                "equipment": ""
            }
            """;

        // Act & Assert
        mockMvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(service);
    }

    @Test
    void addExercise_returns400WhenPrimaryMuscleIsBlank() throws Exception {
        // Arrange
        String requestBody = """
            {
                "name": "Barbell Squat",
                "primaryMuscle": "",
                "equipment": "Barbell"
            }
            """;

        // Act & Assert
        mockMvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(service);
    }

    @Test
    void updateExercise_returnsUpdatedExerciseWhenFound() throws Exception {
        // Arrange
        Long id = 1L;

        Exercise updated = new Exercise();
        updated.setId(id);
        updated.setName("Front Squat");
        updated.setPrimaryMuscle("Quadriceps");
        updated.setEquipment("Barbell");

        when(service.updateExercise(eq(id), any(Exercise.class)))
                .thenReturn(Optional.of(updated));

        String requestBody = """
            {
                "name": "Front Squat",
                "primaryMuscle": "Quadriceps",
                "equipment": "Barbell"
            }
            """;

        // Act & Assert
        mockMvc.perform(put("/api/exercises/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Front Squat"));

        verify(service).updateExercise(eq(id), any(Exercise.class));
    }

    @Test
    void updateExercise_returns404WhenNotFound() throws Exception {
        // Arrange
        Long id = 999L;

        String requestBody = """
            {
                "name": "Front Squat",
                "primaryMuscle": "Quadriceps",
                "equipment": "Barbell"
            }
            """;

        when(service.updateExercise(eq(id), any(Exercise.class)))
                .thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(put("/api/exercises/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isNotFound());

        verify(service).updateExercise(eq(id), any(Exercise.class));
    }

    @Test
    void updateExercise_returns400WhenNameIsBlank() throws Exception {
        // Arrange
        Long id = 1L;

        String requestBody = """
            {
                "name": "",
                "primaryMuscle": "Quadriceps",
                "equipment": "Barbell"
            }
            """;

        // Act & Assert
        mockMvc.perform(put("/api/exercises/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(service);
    }

    @Test
    void deleteExercise_returns204WhenSuccessful() throws Exception {
        // Arrange
        Long id = 1L;

        Exercise existing = new Exercise();
        existing.setId(id);
        existing.setDeleted(true);

        when(service.deleteExercise(id))
                .thenReturn(Optional.of(existing));

        // Act & Assert
        mockMvc.perform(delete("/api/exercises/{id}", id))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        verify(service).deleteExercise(id);
    }

    @Test
    void deleteExercise_returns404WhenNotFound() throws Exception {
        // Arrange
        Long id = 999L;

        when(service.deleteExercise(id))
                .thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(delete("/api/exercises/{id}", id))
                .andExpect(status().isNotFound());

        verify(service).deleteExercise(id);
    }

    @Test
    void addExercise_ignoresServerManagedFields() throws Exception {
        // Arrange
        String requestBody = """
            {
                "id": 99,
                "name": "Push-up",
                "primaryMuscle": "Chest",
                "equipment": "Bodyweight",
                "deleted": true
            }
            """;

        Exercise saved = new Exercise();
        saved.setId(1L);
        saved.setName("Push-up");

        when(service.addExercise(any(Exercise.class)))
                .thenReturn(saved);

        // Act
        mockMvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated());

        // Assert
        ArgumentCaptor<Exercise> captor =
                ArgumentCaptor.forClass(Exercise.class);

        verify(service).addExercise(captor.capture());

        Exercise captured = captor.getValue();

        assertNull(captured.getId());
        assertFalse(captured.isDeleted());
        assertEquals("Push-up", captured.getName());
    }

    @Test
    void updateExercise_ignoresServerManagedFields() throws Exception {
        // Arrange
        Long id = 1L;

        String requestBody = """
            {
                "id": 99,
                "name": "Front Squat",
                "primaryMuscle": "Quadriceps",
                "equipment": "Barbell",
                "deleted": true
            }
            """;

        Exercise updated = new Exercise();
        updated.setId(id);
        updated.setName("Front Squat");

        when(service.updateExercise(eq(id), any(Exercise.class)))
                .thenReturn(Optional.of(updated));

        // Act
        mockMvc.perform(put("/api/exercises/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        // Assert
        ArgumentCaptor<Exercise> captor =
                ArgumentCaptor.forClass(Exercise.class);

        verify(service).updateExercise(eq(id), captor.capture());

        Exercise captured = captor.getValue();

        assertNull(captured.getId());
        assertFalse(captured.isDeleted());
        assertEquals("Front Squat", captured.getName());
    }

    @Test
    void addExercise_returns400WhenRequiredFieldIsMissing() throws Exception {
        // Arrange
        String requestBody = """
            {
                "name": "Barbell Squat",
                "equipment": "Barbell"
            }
            """;

        // Act & Assert
        mockMvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(service);
    }

    @Test
    void addExercise_returnsValidationErrorDetails() throws Exception {
        // Arrange
        String requestBody = """
            {
                "name": "Barbell Squat",
                "equipment": "Barbell"
            }
            """;

        // Act & Assert
        mockMvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.primaryMuscle")
                        .value("must not be blank"));

        verifyNoInteractions(service);
    }


    @Test
    void addExercise_returnsMultipleValidationErrors() throws Exception {
        // Arrange
        String requestBody = """
            {
                "name": "",
                "primaryMuscle": "Chest",
                "equipment": ""
            }
            """;

        // Act & Assert
        mockMvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name")
                        .value("must not be blank"))
                .andExpect(jsonPath("$.errors.equipment")
                        .value("must not be blank"));

        verifyNoInteractions(service);
    }

    @Test
    void addExercise_returns400WhenJsonIsMalformed() throws Exception {
        // Arrange
        String requestBody = """
            {
                "name": "Barbell Squat"
                "primaryMuscle": "Quadriceps",
                "equipment": "Barbell"
            }
            """;

        // Act & Assert
        mockMvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("Malformed JSON request"));

        verifyNoInteractions(service);
    }

    @Test
    void updateExercise_returns400WhenJsonIsMalformed() throws Exception {
        // Arrange
        Long id = 1L;

        String requestBody = """
            {
                "name": "Front Squat"
                "primaryMuscle": "Quadriceps",
                "equipment": "Barbell"
            }
            """;

        // Act & Assert
        mockMvc.perform(put("/api/exercises/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("Malformed JSON request"));

        verifyNoInteractions(service);
    }

    @Test
    void addExercise_returns400WhenNameExceedsMaxLength() throws Exception {
        // Arrange
        String longName = "A".repeat(101);

        String requestBody = """
            {
                "name": "%s",
                "primaryMuscle": "Quadriceps",
                "equipment": "Barbell"
            }
            """.formatted(longName);

        // Act & Assert
        mockMvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists());

        verifyNoInteractions(service);
    }

    @Test
    void updateExercise_returns400WhenNameExceedsMaxLength() throws Exception {
        // Arrange
        Long id = 1L;
        String longName = "A".repeat(101);

        String requestBody = """
            {
                "name": "%s",
                "primaryMuscle": "Quadriceps",
                "equipment": "Barbell"
            }
            """.formatted(longName);

        // Act & Assert
        mockMvc.perform(put("/api/exercises/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists());

        verifyNoInteractions(service);
    }


    @Test
    void updateExercise_acceptsNameAtMaxLength() throws Exception {
        // Arrange
        Long id = 1L;
        String maxLengthName = "A".repeat(100);

        String requestBody = """
            {
                "name": "%s",
                "primaryMuscle": "Quadriceps",
                "equipment": "Barbell"
            }
            """.formatted(maxLengthName);

        Exercise updated = new Exercise();
        updated.setId(id);
        updated.setName(maxLengthName);

        when(service.updateExercise(eq(id), any(Exercise.class)))
                .thenReturn(Optional.of(updated));

        // Act & Assert
        mockMvc.perform(put("/api/exercises/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(maxLengthName));

        verify(service).updateExercise(eq(id), any(Exercise.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {"primaryMuscle", "equipment"})
    void addExercise_returns400WhenFieldExceedsMaxLength(String field)
            throws Exception {

        // Arrange
        String requestBody = """
            {
                "name": "Barbell Squat",
                "primaryMuscle": "%s",
                "equipment": "%s"
            }
            """.formatted(
                field.equals("primaryMuscle")
                        ? "A".repeat(101) : "Quadriceps",
                field.equals("equipment")
                        ? "A".repeat(101) : "Barbell"
        );

        // Act & Assert
        mockMvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors." + field).exists());

        verifyNoInteractions(service);
    }


    @ParameterizedTest
    @ValueSource(strings = {"primaryMuscle", "equipment"})
    void updateExercise_returns400WhenFieldExceedsMaxLength(String field)
            throws Exception {

        // Arrange
        Long id = 1L;

        String requestBody = """
            {
                "name": "Barbell Squat",
                "primaryMuscle": "%s",
                "equipment": "%s"
            }
            """.formatted(
                field.equals("primaryMuscle")
                        ? "A".repeat(101) : "Quadriceps",
                field.equals("equipment")
                        ? "A".repeat(101) : "Barbell"
        );

        // Act & Assert
        mockMvc.perform(put("/api/exercises/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors." + field).exists());

        verifyNoInteractions(service);
    }

    @Test
    void addExercise_returns400WhenDescriptionExceedsMaxLength()
            throws Exception {

        // Arrange
        String longDescription = "A".repeat(501);

        String requestBody = """
            {
                "name": "Barbell Squat",
                "primaryMuscle": "Quadriceps",
                "equipment": "Barbell",
                "description": "%s"
            }
            """.formatted(longDescription);

        // Act & Assert
        mockMvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.description").exists());

        verifyNoInteractions(service);
    }

    @Test
    void updateExercise_returns400WhenDescriptionExceedsMaxLength()
            throws Exception {

        // Arrange
        Long id = 1L;
        String longDescription = "A".repeat(501);

        String requestBody = """
            {
                "name": "Barbell Squat",
                "primaryMuscle": "Quadriceps",
                "equipment": "Barbell",
                "description": "%s"
            }
            """.formatted(longDescription);

        // Act & Assert
        mockMvc.perform(put("/api/exercises/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.description").exists());

        verifyNoInteractions(service);
    }


    @Test
    void addExercise_acceptsMissingDescription() throws Exception {
        // Arrange
        String requestBody = """
            {
                "name": "Barbell Squat",
                "primaryMuscle": "Quadriceps",
                "equipment": "Barbell"
            }
            """;

        Exercise saved = new Exercise();
        saved.setId(1L);
        saved.setName("Barbell Squat");

        when(service.addExercise(any(Exercise.class)))
                .thenReturn(saved);

        // Act & Assert
        mockMvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated());

        ArgumentCaptor<Exercise> captor =
                ArgumentCaptor.forClass(Exercise.class);

        verify(service).addExercise(captor.capture());

        assertNull(captor.getValue().getDescription());
    }

    @Test
    void getAllExercises_filtersByEquipmentWhenProvided() throws Exception {
        // Arrange
        Exercise squat = new Exercise();
        squat.setId(1L);
        squat.setName("Barbell Squat");
        squat.setEquipment("Barbell");

        when(service.getExercisesByEquipment("barbell"))
                .thenReturn(List.of(squat));

        // Act & Assert
        mockMvc.perform(get("/api/exercises")
                        .param("equipment", "barbell"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name")
                        .value("Barbell Squat"));

        verify(service).getExercisesByEquipment("barbell");
        verify(service, never()).getAllExercises();
    }

    @Test
    void getAllExercises_returnsAllWhenEquipmentIsEmpty() throws Exception {
        // Arrange
        Exercise squat = new Exercise();
        squat.setName("Barbell Squat");

        when(service.getAllExercises())
                .thenReturn(List.of(squat));

        // Act & Assert
        mockMvc.perform(get("/api/exercises")
                        .param("equipment", ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name")
                        .value("Barbell Squat"));

        verify(service).getAllExercises();
        verify(service, never())
                .getExercisesByEquipment(anyString());
    }

    @ParameterizedTest
    @ValueSource(strings = {" ", "   ", "\t"})
    void getAllExercises_returnsAllWhenEquipmentIsBlank(
            String equipment) throws Exception {

        // Arrange
        Exercise squat = new Exercise();
        squat.setName("Barbell Squat");

        when(service.getAllExercises())
                .thenReturn(List.of(squat));

        // Act & Assert
        mockMvc.perform(get("/api/exercises")
                        .param("equipment", equipment))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name")
                        .value("Barbell Squat"));

        verify(service).getAllExercises();
        verify(service, never())
                .getExercisesByEquipment(anyString());
    }


    @Test
    void getAllExercises_trimsEquipmentParameter() throws Exception {
        // Arrange
        Exercise squat = new Exercise();
        squat.setName("Barbell Squat");
        squat.setEquipment("Barbell");

        when(service.getExercisesByEquipment("barbell"))
                .thenReturn(List.of(squat));

        // Act & Assert
        mockMvc.perform(get("/api/exercises")
                        .param("equipment", "  barbell  "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name")
                        .value("Barbell Squat"));

        verify(service).getExercisesByEquipment("barbell");
    }

    @Test
    void getAllExercises_filtersByPrimaryMuscleWhenProvided()
            throws Exception {

        // Arrange
        Exercise bench = new Exercise();
        bench.setId(1L);
        bench.setName("Bench Press");
        bench.setPrimaryMuscle("Chest");

        when(service.getExercisesByPrimaryMuscle("chest"))
                .thenReturn(List.of(bench));

        // Act & Assert
        mockMvc.perform(get("/api/exercises")
                        .param("primaryMuscle", "chest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name")
                        .value("Bench Press"));

        verify(service).getExercisesByPrimaryMuscle("chest");
        verify(service, never()).getAllExercises();
    }

    @Test
    void getAllExercises_filtersByEquipmentAndPrimaryMuscle()
            throws Exception {

        // Arrange
        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        bench.setEquipment("Barbell");
        bench.setPrimaryMuscle("Chest");

        when(service.getExercisesByEquipmentAndPrimaryMuscle(
                "barbell", "chest"))
                .thenReturn(List.of(bench));

        // Act & Assert
        mockMvc.perform(get("/api/exercises")
                        .param("equipment", "barbell")
                        .param("primaryMuscle", "chest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name")
                        .value("Bench Press"))
                .andExpect(jsonPath("$.length()").value(1));

        verify(service).getExercisesByEquipmentAndPrimaryMuscle(
                "barbell", "chest");
    }

    @Test
    void getAllExercises_filtersByEquipmentWhenMuscleIsBlank()
            throws Exception {

        // Arrange
        Exercise squat = new Exercise();
        squat.setName("Barbell Squat");
        squat.setEquipment("Barbell");

        when(service.getExercisesByEquipment("barbell"))
                .thenReturn(List.of(squat));

        // Act & Assert
        mockMvc.perform(get("/api/exercises")
                        .param("equipment", "barbell")
                        .param("primaryMuscle", ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name")
                        .value("Barbell Squat"));

        verify(service).getExercisesByEquipment("barbell");

        verify(service, never())
                .getExercisesByEquipmentAndPrimaryMuscle(
                        anyString(), anyString());
    }

    @Test
    void getAllExercises_filtersByMuscleWhenEquipmentIsBlank()
            throws Exception {

        // Arrange
        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        bench.setPrimaryMuscle("Chest");

        when(service.getExercisesByPrimaryMuscle("chest"))
                .thenReturn(List.of(bench));

        // Act & Assert
        mockMvc.perform(get("/api/exercises")
                        .param("equipment", "")
                        .param("primaryMuscle", "chest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name")
                        .value("Bench Press"));

        verify(service).getExercisesByPrimaryMuscle("chest");

        verify(service, never())
                .getExercisesByEquipmentAndPrimaryMuscle(
                        anyString(), anyString());
    }


    @ParameterizedTest
    @CsvSource({
            "'  barbell  ', '  chest  '",
            "'barbell', '  chest  '",
            "'  barbell  ', 'chest'"
    })
    void getAllExercises_trimsBothFilters(
            String equipment, String primaryMuscle) throws Exception {

        // Arrange
        Exercise bench = new Exercise();
        bench.setName("Bench Press");

        when(service.getExercisesByEquipmentAndPrimaryMuscle(
                "barbell", "chest"))
                .thenReturn(List.of(bench));

        // Act & Assert
        mockMvc.perform(get("/api/exercises")
                        .param("equipment", equipment)
                        .param("primaryMuscle", primaryMuscle))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name")
                        .value("Bench Press"));

        verify(service).getExercisesByEquipmentAndPrimaryMuscle(
                "barbell", "chest");
    }

    @Test
    void addExercise_mapsMovementPatternFromRequest() throws Exception {
        // Arrange
        String requestBody = """
            {
                "name": "Barbell Squat",
                "primaryMuscle": "Quadriceps",
                "equipment": "Barbell",
                "movementPattern": "SQUAT"
            }
            """;

        Exercise saved = new Exercise();
        saved.setId(1L);
        saved.setName("Barbell Squat");

        when(service.addExercise(any(Exercise.class)))
                .thenReturn(saved);

        // Act
        mockMvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated());

        // Assert
        ArgumentCaptor<Exercise> captor =
                ArgumentCaptor.forClass(Exercise.class);

        verify(service).addExercise(captor.capture());

        assertEquals(
                MovementPattern.SQUAT,
                captor.getValue().getMovementPattern()
        );
    }

    @Test
    void addExercise_rejectsInvalidMovementPattern() throws Exception {

        String requestBody = """
            {
                "name": "Bench Press",
                "primaryMuscle": "Chest",
                "equipment": "Barbell",
                "movementPattern": "FLYING"
            }
            """;

        mockMvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("Malformed JSON request"));

        verifyNoInteractions(service);
    }

    @Test
    void updateExercise_mapsMovementPatternFromRequest()
            throws Exception {

        String requestBody = """
            {
                "name": "Bench Press",
                "primaryMuscle": "Chest",
                "equipment": "Barbell",
                "movementPattern": "HORIZONTAL_PUSH"
            }
            """;

        Exercise saved = new Exercise();
        saved.setId(1L);
        saved.setName("Bench Press");
        saved.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);

        when(service.updateExercise(eq(1L), any(Exercise.class)))
                .thenReturn(Optional.of(saved));

        mockMvc.perform(put("/api/exercises/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movementPattern")
                        .value("HORIZONTAL_PUSH"));

        ArgumentCaptor<Exercise> captor =
                ArgumentCaptor.forClass(Exercise.class);

        verify(service).updateExercise(eq(1L), captor.capture());

        assertEquals(
                MovementPattern.HORIZONTAL_PUSH,
                captor.getValue().getMovementPattern()
        );
    }

    @Test
    void getAllExercises_filtersByMovementPattern()
            throws Exception {

        // Arrange
        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        bench.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);

        when(service.getExercisesByMovementPattern(
                MovementPattern.HORIZONTAL_PUSH))
                .thenReturn(List.of(bench));

        // Act & Assert
        mockMvc.perform(get("/api/exercises")
                        .param("movementPattern", "HORIZONTAL_PUSH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name")
                        .value("Bench Press"));

        verify(service).getExercisesByMovementPattern(
                MovementPattern.HORIZONTAL_PUSH);

        verify(service, never()).getAllExercises();
    }

    @Test
    void getAllExercises_filtersByEquipmentAndMovementPattern()
            throws Exception {

        // Arrange
        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        bench.setEquipment("Barbell");
        bench.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);

        when(service.getExercisesByEquipmentAndMovementPattern(
                "barbell", MovementPattern.HORIZONTAL_PUSH))
                .thenReturn(List.of(bench));

        // Act & Assert
        mockMvc.perform(get("/api/exercises")
                        .param("equipment", "barbell")
                        .param("movementPattern", "HORIZONTAL_PUSH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name")
                        .value("Bench Press"));

        verify(service).getExercisesByEquipmentAndMovementPattern(
                "barbell", MovementPattern.HORIZONTAL_PUSH);
    }

    @Test
    void getAllExercises_filtersByPrimaryMuscleAndMovementPattern()
            throws Exception {

        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        bench.setPrimaryMuscle("Chest");
        bench.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);

        when(service.getExercisesByPrimaryMuscleAndMovementPattern(
                "chest", MovementPattern.HORIZONTAL_PUSH))
                .thenReturn(List.of(bench));

        mockMvc.perform(get("/api/exercises")
                        .param("primaryMuscle", "chest")
                        .param("movementPattern", "HORIZONTAL_PUSH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name")
                        .value("Bench Press"));

        verify(service).getExercisesByPrimaryMuscleAndMovementPattern(
                "chest", MovementPattern.HORIZONTAL_PUSH);
    }

    @Test
    void getAllExercises_filtersByAllThreeParameters()
            throws Exception {

        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        bench.setEquipment("Barbell");
        bench.setPrimaryMuscle("Chest");
        bench.setMovementPattern(MovementPattern.HORIZONTAL_PUSH);

        when(service.getExercisesByAllThreeFilters(
                "barbell",
                "chest",
                MovementPattern.HORIZONTAL_PUSH))
                .thenReturn(List.of(bench));

        mockMvc.perform(get("/api/exercises")
                        .param("equipment", "  barbell  ")
                        .param("primaryMuscle", "chest")
                        .param("movementPattern", "HORIZONTAL_PUSH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name")
                        .value("Bench Press"))
                .andExpect(jsonPath("$.length()").value(1));

        verify(service).getExercisesByAllThreeFilters(
                "barbell",
                "chest",
                MovementPattern.HORIZONTAL_PUSH);
    }

}
