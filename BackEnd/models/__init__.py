from core.database import Base  # Ensure all models use the same Base


# Explicitly import models in correct dependency order:
import models.location       # Defines Province, City, Barangay
import models.users          # Depends on Province/City/Barangay
import models.doctor         # Depends on users + location
import models.appointment    # Depends on users + doctor
import models.notification   # Depends on appointment