"use client";
import { useState } from "react";
import * as XLSX from "xlsx";

const GEOCODE_API = "https://api.openrouteservice.org/geocode/search";
const OPTIMIZE_API = "https://api.openrouteservice.org/optimization";
const API_KEY = "5b3ce3597851110001cf6248a3a146d50d7a4eac8b704b122cf4b402";

export default function Home() {
  const [fileName, setFileName] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [geocodedData, setGeocodedData] = useState([]);
  const [sortedData, setSortedData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      setPreviewData(data);
    };
    reader.readAsBinaryString(file);
  };

  const geocodeAddresses = async () => {
    if (previewData.length < 2) return;

    const headers = {
      Authorization: API_KEY,
      Accept: "application/json"
    };

    const rows = previewData.slice(1);
    const results = [];
    setLoading(true);

    for (const row of rows) {
      const address = `${row[0]} ${row[1]}, ${row[2]} ${row[3]}`;
      try {
        const res = await fetch(`${GEOCODE_API}?api_key=${API_KEY}&text=${encodeURIComponent(address)}&size=1`, { headers });
        const json = await res.json();
        if (json.features && json.features.length > 0) {
          const coords = json.features[0].geometry.coordinates;
          results.push([...row, coords[1], coords[0]]); // Lat, Lng
        } else {
          results.push([...row, null, null]);
        }
      } catch (err) {
        results.push([...row, null, null]);
      }
    }

    const geocoded = [[...previewData[0], "Latitude", "Longitude"], ...results];
    setGeocodedData(geocoded);
    setLoading(false);
  };

  const sortGeocodedData = async () => {
    if (geocodedData.length < 2) return;

    const jobs = geocodedData.slice(1).map((row, index) => ({
      id: index + 1,
      location: [row[row.length - 1], row[row.length - 2]], // [lng, lat]
      service: 300
    }));

    const body = {
      jobs,
      vehicles: [
        {
          id: 1,
          profile: "foot",
          start: jobs[0].location
        }
      ]
    };

    const headers = {
      Authorization: API_KEY,
      Accept: "application/json",
      "Content-Type": "application/json"
    };

    setLoading(true);
    try {
      const res = await fetch(OPTIMIZE_API, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });
      const json = await res.json();
      setLoading(false);

      if (json.routes && json.routes.length > 0) {
        const sorted = json.routes[0].steps.map((step: any) => {
          const jobId = step.job;
          return geocodedData[jobId + 1];
        });
        setSortedData([geocodedData[0], ...sorted]);
      }
    } catch (err) {
      console.error("Routing Fehler:", err);
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet(sortedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Geosortiert");
    XLSX.writeFile(wb, "geosortierte_laufliste.xlsx");
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">📍 Geosortierte Lauflisten</h1>

      <div className="mb-6 bg-white border rounded-md p-6 shadow-sm">
        <label className="block mb-2 font-medium">Excel-Datei hochladen (.xlsx)</label>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
        {fileName && <p className="mt-2 text-sm text-gray-500">Datei: {fileName}</p>}
      </div>

      {previewData.length > 0 && (
        <div className="mb-6 bg-white border rounded-md p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">📄 Vorschau (erste Zeilen)</h2>
          <table className="table-auto w-full text-sm mb-4 border">
            <thead>
              <tr>
                {previewData[0].map((col, idx) => (
                  <th key={idx} className="border px-2 py-1">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.slice(1, 6).map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell, i) => (
                    <td key={i} className="border px-2 py-1">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex gap-4">
            <button onClick={geocodeAddresses} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">
              {loading ? "Geokodieren..." : "Adressen geokodieren"}
            </button>
            <button onClick={sortGeocodedData} disabled={loading || geocodedData.length === 0} className="bg-green-500 text-white px-4 py-2 rounded">
              {loading ? "Sortieren..." : "Route optimieren"}
            </button>
            <button onClick={exportToExcel} disabled={sortedData.length === 0} className="bg-gray-600 text-white px-4 py-2 rounded">
              Excel exportieren
            </button>
          </div>
        </div>
      )}

      {sortedData.length > 0 && (
        <div className="mb-6 bg-white border rounded-md p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">✅ Geosortierte Liste</h2>
          <table className="table-auto w-full text-sm">
            <thead>
              <tr>
                {sortedData[0].map((col, idx) => (
                  <th key={idx} className="border px-2 py-1">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.slice(1).map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell, i) => (
                    <td key={i} className="border px-2 py-1">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
