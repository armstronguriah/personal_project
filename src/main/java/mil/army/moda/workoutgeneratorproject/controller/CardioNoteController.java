package mil.army.moda.workoutgeneratorproject.controller;

import jakarta.validation.Valid;
import mil.army.moda.workoutgeneratorproject.dto.SaveCardioNotesRequest;
import mil.army.moda.workoutgeneratorproject.service.CardioNoteService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/programs/saved/{programId}/sessions/{sessionNumber}/cardio-notes")
public class CardioNoteController {
    private final CardioNoteService service;

    public CardioNoteController(CardioNoteService service) {
        this.service = service;
    }

    @GetMapping
    public Map<Long, String> getNotes(@PathVariable Long programId,
                                      @PathVariable int sessionNumber) {
        return service.getNotes(programId, sessionNumber);
    }

    @PutMapping
    public Map<Long, String> saveNotes(@PathVariable Long programId,
                                       @PathVariable int sessionNumber,
                                       @Valid @RequestBody SaveCardioNotesRequest request) {
        return service.saveNotes(programId, sessionNumber, request.notes());
    }
}
