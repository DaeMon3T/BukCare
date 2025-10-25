# This file is deprecated - location models are now in models/location.py
# This file is kept for backward compatibility but should not be used
# All location-related models (Province, City, Barangay) are defined in models/location.py

# Avoid circular imports by using string references
__all__ = ['Province', 'City', 'Barangay']

# Re-export location models for backward compatibility
def __getattr__(name):
    if name in __all__:
        # Import only when needed to avoid circular imports
        from models.location import Province, City, Barangay
        return locals()[name]
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")