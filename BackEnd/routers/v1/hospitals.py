import math
import httpx
import time
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

# ─── IN-MEMORY CACHE ───
# Format: {(gridded_lat, grid_lng, radius): {"timestamp": float, "data": list}}
_OVERPASS_CACHE = {}
CACHE_TTL_SECONDS = 3600 * 24  # 24 hours

def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in km between two lat/lng points."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _get_cache_key(lat: float, lng: float, radius: int):
    # Rounding to 2 decimal places creates roughly a 1.1km x 1.1km grid bucket.
    return (round(lat, 2), round(lng, 2), radius)


@router.get("/nearby")
async def get_nearby_hospitals(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: int = Query(5000, description="Search radius in meters"),
):
    # Check Cache
    cache_key = _get_cache_key(lat, lng, radius)
    cached_entry = _OVERPASS_CACHE.get(cache_key)
    
    if cached_entry:
        if time.time() - cached_entry["timestamp"] < CACHE_TTL_SECONDS:
            # Re-sort distance strictly to the exact user coordinates despite regional cache hit
            results = cached_entry["data"]
            for r in results:
                r["distance_km"] = round(_haversine(lat, lng, r["lat"], r["lng"]), 1)
            results.sort(key=lambda x: x["distance_km"])
            return results[:20]

    # Build Overpass QL Query — search node, way, AND relation for both
    # "amenity" and "healthcare" tags so we never miss a facility.
    overpass_query = f"""
    [out:json][timeout:25];
    (
      node["amenity"~"hospital|clinic"](around:{radius},{lat},{lng});
      way["amenity"~"hospital|clinic"](around:{radius},{lat},{lng});
      relation["amenity"~"hospital|clinic"](around:{radius},{lat},{lng});
      node["healthcare"~"hospital|clinic|centre|center"](around:{radius},{lat},{lng});
      way["healthcare"~"hospital|clinic|centre|center"](around:{radius},{lat},{lng});
      relation["healthcare"~"hospital|clinic|centre|center"](around:{radius},{lat},{lng});
    );
    out center;
    """

    headers = {
        "User-Agent": "BukCareApp/1.0 (contact@bukcare.com) Python-httpx",
        "Accept": "application/json"
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        data = None
        last_error = None
        for url in OVERPASS_URLS:
            try:
                resp = await client.post(url, data={"data": overpass_query}, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                break  # Successful response, exit loop
            except Exception as e:
                print(f"[Warn] Overpass fallback failed on {url}: {e}")
                last_error = e

        if data is None:
            raise HTTPException(status_code=502, detail=f"All Overpass API mirrors failed. Last error: {last_error}")

    elements = data.get("elements", [])
    results = []
    seen_ids = set()  # deduplicate across overlapping amenity/healthcare matches

    for el in elements:
        el_id = el.get("id")
        if el_id in seen_ids:
            continue
        seen_ids.add(el_id)

        # Nodes have top-level lat/lon; ways and relations use center.lat/center.lon
        plat = el.get("lat") or (el.get("center", {}) or {}).get("lat")
        plng = el.get("lon") or (el.get("center", {}) or {}).get("lon")
        
        if plat is None or plng is None:
            continue
            
        tags = el.get("tags", {})
        name = tags.get("name", "Unnamed Medical Facility")
        
        dist = _haversine(lat, lng, plat, plng)
        
        # Inject Mock Image (Phase 1 requirement)
        # Using a reliable placeholder since raw OSM nodes lack photo_url data
        photo_url = "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=400&auto=format&fit=crop"
        
        # Inject mock rating because OSM lacks Google Reviews
        mock_rating = 4.0 + (len(name) % 10) / 10.0

        results.append({
            "place_id": str(el.get("id")),
            "name": name,
            "vicinity": tags.get("addr:full", tags.get("addr:street", "Local Area")),
            "rating": mock_rating,
            "total_ratings": 42 + (el.get("id") % 100),
            "photo_url": photo_url,
            "lat": plat,
            "lng": plng,
            "distance_km": round(dist, 1),
            "open_now": True,  # Hardcoded mock
        })
        
    # Standardize result cache sorting
    results.sort(key=lambda x: x["distance_km"])
    
    # Save to Cache
    _OVERPASS_CACHE[cache_key] = {
        "timestamp": time.time(),
        "data": results
    }

    return results[:20]
