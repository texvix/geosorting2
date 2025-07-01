"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export default function Home() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [sortedAddresses, setSortedAddresses] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
      });

      const extractedAddresses = jsonData
        .slice(1) // skip header
        .map((row) => row[0])
        .filter(Boolean)
        .map((addr: string) => addr.trim());

      setAddresses(extractedAddresses);

      const sorted = [...extractedAddresses].sort((a, b) => {
        const extract = (str: string) => {
          const parts = str.match(/(.*?)(\d{5})/);
          return parts ? [parts[1].trim(), parts[2]] : [str, ""];
        };
        const [streetA, plzA] = extract(a);
        const [streetB, plzB] = extract(b);

        return plzA.localeCompare(plzB) || streetA.localeCompare(streetB);
      });

      setSortedAddresses(sorted);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Geosort Lauflisten</h1>

      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="mb-4"
      />

      {fileName && <p className="mb-4">Ausgewählte Datei: {fileName}</p>}

      {sortedAddresses.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-2">Sortierte Adressen:</h2>
          <ul className="bg-gray-100 rounded p-4 space-y-1 max-h-[400px] overflow-auto text-sm">
            {sortedAddresses.map((addr, i) => (
              <li key={i}>{addr}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
