/**
 * Route ranking. Eligibility first, optimization second, as the routing
 * engine specifies: paused routes are never compared, only listed.
 */

export const PREFERENCES = Object.freeze({
  best: { label: "Best Route", weights: { cost: 0.3, speed: 0.3, security: 0.25, reliability: 0.15 } },
  cost: { label: "Cost", weights: { cost: 0.7, speed: 0.1, security: 0.1, reliability: 0.1 } },
  speed: { label: "Speed", weights: { cost: 0.1, speed: 0.7, security: 0.1, reliability: 0.1 } },
  security: { label: "Security", weights: { cost: 0.1, speed: 0.1, security: 0.6, reliability: 0.2 } },
});

export const isEligible = (route) => route.availability !== "paused";

/** Factor scores in 0..1, higher is better. */
export function factorScores(route, pool) {
  const minCost = Math.min(...pool.map((r) => r.costUsd));
  const minEta = Math.min(...pool.map((r) => r.etaSeconds));
  return {
    cost: route.costUsd > 0 ? minCost / route.costUsd : 1,
    speed: route.etaSeconds > 0 ? minEta / route.etaSeconds : 1,
    security: (route.securityTier ?? 1) / 3,
    reliability: (route.reliability ?? 0) * (route.availability === "degraded" ? 0.85 : 1),
  };
}

/**
 * Rank routes for a preference. Returns eligible routes by score, then the
 * ineligible ones with score null. The first eligible route is marked best.
 */
export function rankRoutes(routes, preference = "best") {
  const weights = (PREFERENCES[preference] ?? PREFERENCES.best).weights;
  const eligible = routes.filter(isEligible);
  const blocked = routes.filter((r) => !isEligible(r));

  const ranked = eligible
    .map((route) => {
      const factors = factorScores(route, eligible);
      const score = Object.entries(weights).reduce((sum, [key, w]) => sum + w * factors[key], 0);
      return { ...route, factors, score: Math.round(score * 1000) / 1000, eligible: true };
    })
    .sort((a, b) => b.score - a.score || a.costUsd - b.costUsd);

  if (ranked[0]) ranked[0] = { ...ranked[0], best: true };
  return [...ranked, ...blocked.map((route) => ({ ...route, score: null, eligible: false }))];
}

export function formatEta(seconds) {
  if (seconds < 60) return `${seconds} sec`;
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

export const formatUsd = (value) => `$${Number(value).toFixed(2)}`;
