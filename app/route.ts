// app/api/geocode/route.ts
export async function POST(req: Request) {
  const { address } = await req.json();

  const response = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=5b3ce3597851110001cf6248a3a146d50d7a4eac8b704b122cf4b402&text=${encodeURIComponent(address)}&size=1`);

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
