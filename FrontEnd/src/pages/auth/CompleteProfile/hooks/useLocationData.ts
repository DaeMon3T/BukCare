// ============================================
// FILE 2: hooks/useLocationData.ts
// ============================================
import { useState, useEffect } from "react";
import { provinces as getProvinces, citiesMunicipalities, barangays as getBarangays } from "ph-locations";
import type { ProvinceData, CityData, BarangayData, PhCity, PhBarangay, PhProvince } from "../types";

export const useLocationData = (selectedProvinceId: string, selectedCityId: string) => {
  const [provincesData, setProvincesData] = useState<ProvinceData[]>([]);
  const [citiesData, setCitiesData] = useState<CityData[]>([]);
  const [barangaysData, setBarangaysData] = useState<BarangayData[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [allCitiesCache, setAllCitiesCache] = useState<PhCity[]>([]);
  const [allBarangaysCache, setAllBarangaysCache] = useState<PhBarangay[]>([]);
  const [error, setError] = useState("");

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const phProvinces = getProvinces as unknown as PhProvince[];
        const formattedProvinces: ProvinceData[] = phProvinces
          .map((province) => ({
            province_id: String(province.code),
            name: province.name,
          }))
          .filter((p): p is ProvinceData => p.province_id && p.name);

        formattedProvinces.sort((a, b) => a.name.localeCompare(b.name));
        setProvincesData(formattedProvinces);

        const allCities = Array.isArray(citiesMunicipalities) ? citiesMunicipalities : [];
        const allBarangays = Array.isArray(getBarangays) ? getBarangays : [];

        setAllCitiesCache(allCities as unknown as PhCity[]);
        setAllBarangaysCache(allBarangays as unknown as PhBarangay[]);
        setError("");
      } catch (err) {
        console.error("Error loading location data:", err);
        setError("Failed to load location data.");
      } finally {
        setLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, []);

  // Filter cities based on selected province
  useEffect(() => {
    if (!selectedProvinceId || allCitiesCache.length === 0) {
      setCitiesData([]);
      setBarangaysData([]);
      return;
    }

    const phCities = allCitiesCache.filter((city) => {
      const cityProvince = String(city.province || city.province_code || "").trim();
      const selected = String(selectedProvinceId).trim();
      return cityProvince === selected || cityProvince.includes(selected);
    });

    const formattedCities: CityData[] = phCities
      .map((city) => ({
        city_id: String(city.code),
        name: city.name || city.fullName || "",
        zip_code: city.zip_code || "",
        province_id: String(city.province || city.province_code || ""),
      }))
      .filter((c): c is CityData => c.city_id && c.name);

    formattedCities.sort((a, b) => a.name.localeCompare(b.name));
    setCitiesData(formattedCities);
    setBarangaysData([]);
  }, [selectedProvinceId, allCitiesCache]);

  // Filter barangays based on selected city
  useEffect(() => {
    if (!selectedCityId || allBarangaysCache.length === 0) {
      setBarangaysData([]);
      return;
    }

    const phBarangays = allBarangaysCache.filter((barangay) => {
      const barangayCity = String(barangay.city_code || "").trim();
      const selected = String(selectedCityId).trim();
      return barangayCity === selected || barangayCity.includes(selected);
    });

    const formattedBarangays: BarangayData[] = phBarangays
      .map((barangay) => ({
        barangay_id: String(barangay.code),
        name: barangay.name,
        city_id: String(barangay.city_code),
      }))
      .filter((b): b is BarangayData => b.barangay_id && b.name);

    formattedBarangays.sort((a, b) => a.name.localeCompare(b.name));
    setBarangaysData(formattedBarangays);
  }, [selectedCityId, allBarangaysCache]);

  return {
    provincesData,
    citiesData,
    barangaysData,
    loadingProvinces,
    error,
  };
};