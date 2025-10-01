export interface Env {
    DB: D1Database;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // ... (CORS headers i obsługa OPTIONS bez zmian) ...
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }
        
        const { pathname } = new URL(request.url);

        // ... (Endpoint GET /api/scores bez zmian) ...
        if (pathname === '/api/scores' && request.method === 'GET') {
            // ...
        }

        // Endpoint do dodawania nowego wyniku
        if (pathname === '/api/scores' && request.method === 'POST') {
            try {
                // Oczekujemy teraz player_name i completion_time_ms
                const { player_name, completion_time_ms } = await request.json<{ player_name: string; completion_time_ms: number }>();
                
                if (!player_name || typeof completion_time_ms !== 'number') {
                    return new Response('Invalid data: player_name and completion_time_ms are required.', { status: 400, headers: corsHeaders });
                }

                const stmt = env.DB.prepare(
                    'INSERT INTO game_scores (player_name, completion_time_ms) VALUES (?, ?)'
                );
                await stmt.bind(player_name, completion_time_ms).run();

                return new Response('Score added successfully', { status: 201, headers: corsHeaders });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
            }
        }

        return new Response('Not Found', { status: 404 });
    },
};
