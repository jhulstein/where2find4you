export type BaseScoreInput = {
  wifiScore: number;
  workScore: number;
  quietScore: number;
  confidenceScore: number;
};

export type DiscoveryScoreInput = BaseScoreInput & {
  rooftopScore?: number | null;
  viewScore?: number | null;
};

export function calculateTotalScore({
  wifiScore,
  workScore,
  quietScore,
  confidenceScore,
}: BaseScoreInput) {
  return Math.round(
    wifiScore * 0.3 +
      workScore * 0.3 +
      quietScore * 0.2 +
      confidenceScore * 0.2,
  );
}

export function calculateDiscoveryScore(input: DiscoveryScoreInput) {
  if (input.rooftopScore == null && input.viewScore == null) {
    return calculateTotalScore(input);
  }

  const rooftopScore = input.rooftopScore ?? 0;
  const viewScore = input.viewScore ?? 0;

  return Math.round(
    input.wifiScore * 0.18 +
      input.workScore * 0.18 +
      input.quietScore * 0.14 +
      input.confidenceScore * 0.2 +
      rooftopScore * 0.15 +
      viewScore * 0.15,
  );
}
