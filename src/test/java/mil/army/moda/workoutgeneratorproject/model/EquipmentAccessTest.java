
package mil.army.moda.workoutgeneratorproject.model;

import org.junit.jupiter.api.Test;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EquipmentAccessTest {

    @Test
    void allowedEquipment_returnsCorrectEquipmentTypes() {

        assertEquals(
                List.of("Bodyweight"),
                EquipmentAccess.BODYWEIGHT.allowedEquipment()
        );

        assertEquals(
                List.of("Dumbbell", "Bodyweight"),
                EquipmentAccess.DUMBBELL.allowedEquipment()
        );

        assertEquals(
                List.of("Barbell", "Bodyweight"),
                EquipmentAccess.BARBELL.allowedEquipment()
        );

        assertEquals(
                List.of(
                        "Barbell",
                        "Dumbbell",
                        "Bodyweight",
                        "Cable",
                        "Machine",
                        "Kettlebell",
                        "Resistance Band"
                ),
                EquipmentAccess.FULL_GYM.allowedEquipment()
        );
    }
}
