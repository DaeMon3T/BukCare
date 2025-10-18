import { useState, useEffect } from "react";
import type { ProvinceData, CityData, BarangayData } from "../types";

const BASE_URL = "https://psgc.gitlab.io/api";

export const useLocationData = (selectedProvinceId: string, selectedCityId: string) => {
  const [provincesData, setProvincesData] = useState<ProvinceData[]>([]);
  const [citiesData, setCitiesData] = useState<CityData[]>([]);
  const [barangaysData, setBarangaysData] = useState<BarangayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/provinces.json`);
        const data = await res.json();
        const formatted: ProvinceData[] = data.map((p: any) => ({
          province_id: p.code,
          name: p.name,
        }));
        formatted.sort((a, b) => a.name.localeCompare(b.name));
        setProvincesData(formatted);
        setError("");
      } catch (err) {
        console.error("Failed to load provinces:", err);
        setError("Failed to load provinces");
      } finally {
        setLoading(false);
      }
    };
    fetchProvinces();
  }, []);

  // Load cities AND municipalities when province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setCitiesData([]);
      setBarangaysData([]);
      return;
    }

    const fetchCitiesAndMunicipalities = async () => {
      setLoading(true);
      try {
        const citiesUrl = `${BASE_URL}/provinces/${selectedProvinceId}/cities.json`;
        const municipalitiesUrl = `${BASE_URL}/provinces/${selectedProvinceId}/municipalities.json`;
        
        console.log("Fetching from:", citiesUrl);
        console.log("Fetching from:", municipalitiesUrl);

        const [citiesRes, municipalitiesRes] = await Promise.all([
          fetch(citiesUrl),
          fetch(municipalitiesUrl),
        ]);

        console.log("Cities response:", citiesRes.status);
        console.log("Municipalities response:", municipalitiesRes.status);

        const citiesData = citiesRes.ok ? await citiesRes.json() : [];
        const municipalitiesData = municipalitiesRes.ok ? await municipalitiesRes.json() : [];

        console.log("Cities data:", citiesData);
        console.log("Municipalities data:", municipalitiesData);

        const allCities: CityData[] = [
          ...citiesData.map((c: any) => ({
            city_id: c.code,
            name: c.name,
            zip_code: c.zip_code || "",
            province_id: selectedProvinceId,
          })),
          ...municipalitiesData.map((m: any) => ({
            city_id: m.code,
            name: m.name,
            zip_code: m.zip_code || "",
            province_id: selectedProvinceId,
          })),
        ];

        console.log("All cities combined:", allCities);
        
        allCities.sort((a, b) => a.name.localeCompare(b.name));
        setCitiesData(allCities);
        setBarangaysData([]);
        setError("");
      } catch (err) {
        console.error("Failed to load cities/municipalities:", err);
        setError("Failed to load cities/municipalities");
      } finally {
        setLoading(false);
      }
    };

    fetchCitiesAndMunicipalities();
  }, [selectedProvinceId]);

  // Load barangays when city changes
  useEffect(() => {
    if (!selectedCityId) {
      setBarangaysData([]);
      return;
    }

    const fetchBarangays = async () => {
      setLoading(true);
      try {
        // Try cities endpoint
        let res = await fetch(`${BASE_URL}/cities/${selectedCityId}/barangays.json`);
        let data = [];

        // If cities endpoint fails (404), try municipalities endpoint
        if (!res.ok) {
          res = await fetch(`${BASE_URL}/municipalities/${selectedCityId}/barangays.json`);
        }

        // Only parse if response is ok
        if (res.ok) {
          data = await res.json();
        }

        const formatted: BarangayData[] = data.map((b: any) => ({
          barangay_id: b.code,
          name: b.name,
          city_id: selectedCityId,
        }));
        formatted.sort((a, b) => a.name.localeCompare(b.name));
        setBarangaysData(formatted);
        setError("");
      } catch (err) {
        console.error("Failed to load barangays:", err);
        setError("Failed to load barangays");
      } finally {
        setLoading(false);
      }
    };

    fetchBarangays();
  }, [selectedCityId]);

  return {
    provincesData,
    citiesData,
    barangaysData,
    loading,
    error,
  };
};