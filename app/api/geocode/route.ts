// app/api/geocode/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { address } = await req.json();

  if (!address) {
    return NextResponse.json({ error: "Keine Adresse angegeben." }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTESERVICE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API-Key fehlt in der Umgebungsvariable." }, { status: 500 });
  }

  const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}&size=1`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Fehler bei der Anfrage an OpenRouteService." }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Serverfehler bei der Geokodierung." }, { status: 500 });
  }
}
