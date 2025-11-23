export interface Env {
	DB: D1Database;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const { pathname, searchParams } = new URL(request.url);
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// --- Endpoint: Duck Race ---
		if (pathname === '/api/duck-race') {
			// GET - Pobieranie rankingu Duck Race
			if (request.method === 'GET') {
				try {
					const playerName = searchParams.get('playerName');

					// Zmiana: Unikalni gracze w top 10
					const top10Stmt = env.DB.prepare(
						`SELECT player_name, MIN(completion_time_ms) as best_time
						 FROM duck_race
						 GROUP BY player_name
						 ORDER BY best_time ASC
						 LIMIT 10`
					);
					const top10Results = await top10Stmt.all();

					let userRankResult = null;
					if (playerName) {
						const bestScoreStmt = env.DB.prepare(`SELECT MIN(completion_time_ms) as best_time FROM duck_race WHERE player_name = ?`).bind(playerName);
						const bestScoreResult = await bestScoreStmt.first<{ best_time: number }>();

						if (bestScoreResult && bestScoreResult.best_time) {
							const rankStmt = env.DB.prepare(`SELECT COUNT(*) + 1 as rank FROM (SELECT MIN(completion_time_ms) as time FROM duck_race GROUP BY player_name) WHERE time < ?`).bind(bestScoreResult.best_time);
							const rankResult = await rankStmt.first<{ rank: number }>();
							userRankResult = { rank: rankResult?.rank || 1, time: bestScoreResult.best_time };
						}
					}

					const responsePayload = { top10: top10Results.results, userRank: userRankResult };
					return new Response(JSON.stringify(responsePayload), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
				}
			}

			// POST - Zapis wyniku Duck Race
			if (request.method === 'POST') {
				try {
					const { player_name, completion_time_ms, language } = await request.json<{ player_name: string; completion_time_ms: number; language?: string; }>();
					if (!player_name || typeof completion_time_ms !== 'number') return new Response('Invalid data', { status: 400, headers: corsHeaders });

					const stmt = env.DB.prepare('INSERT INTO duck_race (player_name, completion_time_ms, language) VALUES (?, ?, ?)');
					await stmt.bind(player_name, completion_time_ms, language || null).run();
					return new Response('Score added', { status: 201, headers: corsHeaders });
				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
				}
			}
		}

		// --- Endpoint: Vortex Game ---
		if (pathname === '/api/vortex-game') {
		  // GET - Top 10 i pozycja użytkownika (unikalni gracze po najlepszym czasie)
		  if (request.method === 'GET') {
		    try {
		      const playerName = searchParams.get('playerName');
		
		      const top10Stmt = env.DB.prepare(
		        `SELECT player_name, MIN(completion_time_ms) as best_time
		         FROM vortex_game
		         GROUP BY player_name
		         ORDER BY best_time ASC
		         LIMIT 10`
		      );
		      const top10Results = await top10Stmt.all();
		
		      let userRankResult = null;
		      if (playerName) {
		        const bestScoreStmt = env.DB.prepare(
		          `SELECT MIN(completion_time_ms) as best_time
		           FROM vortex_game
		           WHERE player_name = ?`
		        ).bind(playerName);
		        const bestScoreResult = await bestScoreStmt.first<{ best_time: number }>();
		
		        if (bestScoreResult && bestScoreResult.best_time) {
		          const rankStmt = env.DB.prepare(
		            `SELECT COUNT(*) + 1 as rank
		             FROM (SELECT MIN(completion_time_ms) as time
		                   FROM vortex_game
		                   GROUP BY player_name)
		             WHERE time < ?`
		          ).bind(bestScoreResult.best_time);
		          const rankResult = await rankStmt.first<{ rank: number }>();
		          userRankResult = { rank: rankResult?.rank || 1, time: bestScoreResult.best_time };
		        }
		      }
		
		      const responsePayload = { top10: top10Results.results, userRank: userRankResult };
		      return new Response(JSON.stringify(responsePayload), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
		
		    } catch (e: any) {
		      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
		    }
		  }
		
		  // POST - zapis wyniku
		  if (request.method === 'POST') {
		    try {
		      const { player_name, completion_time_ms, language } = await request.json<{
		        player_name: string;
		        completion_time_ms: number;
		        language?: string;
		      }>();
		
		      if (!player_name || typeof completion_time_ms !== 'number') {
		        return new Response('Invalid data', { status: 400, headers: corsHeaders });
		      }
		
		      const stmt = env.DB.prepare(
		        'INSERT INTO vortex_game (player_name, completion_time_ms, language) VALUES (?, ?, ?)'
		      );
		      await stmt.bind(player_name, completion_time_ms, language || null).run();
		
		      return new Response('Score added', { status: 201, headers: corsHeaders });
		    } catch (e: any) {
		      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
		    }
		  }
		}


		// --- Endpoint: River Guardian ---
		if (pathname === '/api/river-guardian') {
			if (request.method === 'POST') {
				try {
					const { player_name, score } = await request.json<{ player_name: string; score: number; }>();
					if (!player_name || typeof score !== 'number') {
						return new Response('Invalid data: player_name and score are required.', { status: 400, headers: corsHeaders });
					}

					// Sprawdź, czy gracz już istnieje
					const existingScoreStmt = env.DB.prepare('SELECT score FROM river_guardian_scores WHERE player_name = ?').bind(player_name);
					const existingScoreResult = await existingScoreStmt.first<{ score: number }>();

					if (existingScoreResult) {
						// Gracz istnieje, zaktualizuj wynik tylko jeśli nowy jest wyższy
						if (score > existingScoreResult.score) {
							const stmt = env.DB.prepare('UPDATE river_guardian_scores SET score = ?, last_updated = CURRENT_TIMESTAMP WHERE player_name = ?');
							await stmt.bind(score, player_name).run();
							return new Response('Score updated', { status: 200, headers: corsHeaders });
						} else {
							return new Response('Score not updated, new score is not higher', { status: 200, headers: corsHeaders });
						}
					} else {
						// Nowy gracz, wstaw nowy rekord
						const stmt = env.DB.prepare('INSERT INTO river_guardian_scores (player_name, score) VALUES (?, ?)');
						await stmt.bind(player_name, score).run();
						return new Response('Score added', { status: 201, headers: corsHeaders });
					}
				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
				}
			}
		}

		// --- NOWOŚĆ: Endpoint: Reynolds Challenge ---
		if (pathname === '/api/reynolds-challenge') {
			// GET - Pobieranie rankingu Reynolds
			if (request.method === 'GET') {
				try {
					const playerName = searchParams.get('playerName');
					// Pobierz Top 10 najlepszych graczy wg średniego flow_ratio (malejąco)
					const top10Stmt = env.DB.prepare(
						`SELECT player_name, MAX(flow_ratio_avg) as best_score
						 FROM reynolds_challenge
						 GROUP BY player_name
						 ORDER BY best_score DESC
						 LIMIT 10`
					);
					const top10Results = await top10Stmt.all();

					let userRankResult = null;
					if (playerName) {
						// Znajdź najlepszy wynik dla danego gracza
						const bestScoreStmt = env.DB.prepare(`SELECT MAX(flow_ratio_avg) as best_score FROM reynolds_challenge WHERE player_name = ?`).bind(playerName);
						const bestScoreResult = await bestScoreStmt.first<{ best_score: number }>();

						if (bestScoreResult && bestScoreResult.best_score) {
							// Oblicz pozycję w rankingu
							const rankStmt = env.DB.prepare(`SELECT COUNT(*) + 1 as rank FROM (SELECT MAX(flow_ratio_avg) as score FROM reynolds_challenge GROUP BY player_name) WHERE score > ?`).bind(bestScoreResult.best_score);
							const rankResult = await rankStmt.first<{ rank: number }>();
							userRankResult = { rank: rankResult?.rank || 1, score: bestScoreResult.best_score };
						}
					}

					const responsePayload = { top10: top10Results.results, userRank: userRankResult };
					return new Response(JSON.stringify(responsePayload), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
				}
			}

			// POST - Zapis wyniku Reynolds
			if (request.method === 'POST') {
				try {
					const body = await request.json<{
						player_name: string;
						completion_time_ms: number;
						peak_velocity: number;
						flow_ratio_avg: number;
						flow_ratio_3: number;
						flow_ratio_4: number;
						flow_ratio_5: number;
						language: string;
					}>();

					if (!body.player_name || typeof body.flow_ratio_avg !== 'number') {
						return new Response('Invalid data', { status: 400, headers: corsHeaders });
					}

					const stmt = env.DB.prepare(
						`INSERT INTO reynolds_challenge (player_name, completion_time_ms, peak_velocity, flow_ratio_avg, flow_ratio_3, flow_ratio_4, flow_ratio_5, language)
						 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
					);
					await stmt.bind(
						body.player_name, body.completion_time_ms, body.peak_velocity, body.flow_ratio_avg,
						body.flow_ratio_3, body.flow_ratio_4, body.flow_ratio_5, body.language
					).run();

					return new Response('Score added', { status: 201, headers: corsHeaders });
				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
				}
			}
		}

		return new Response('Not Found.', { status: 404 });
	},
};
