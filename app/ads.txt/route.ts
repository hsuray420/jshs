export function GET() {
  return new Response("google.com, pub-7151625151498067, DIRECT, f08c47fec0942fa0\n", {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
