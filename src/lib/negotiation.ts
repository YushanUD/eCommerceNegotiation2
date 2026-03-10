export type Feature = {
  id: string;
  templateId: string;
  name: string;
  type: "price" | "option";
  weightPercent: number;
};

export type FeatureOption = {
  id: string;
  featureId: string;
  label: string;
  utilityValue: number;
};

export type UserFeaturePref = {
  featureId: string;
  weightPercent: number;
};

export type UserOptionUtility = {
  featureOptionId: string;
  utilityValue: number;
};

export type OfferPayload = {
  selectedOptionsByFeatureId: Record<string, string>;
  priceValue: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const parsePayload = (payloadJson: string): OfferPayload => {
  try {
    return JSON.parse(payloadJson) as OfferPayload;
  } catch {
    return { selectedOptionsByFeatureId: {}, priceValue: 0 };
  }
};

export const computeUserUtility = ({
  payload,
  features,
  options,
  userFeaturePrefs,
  userOptionUtilities,
}: {
  payload: OfferPayload;
  features: Feature[];
  options: FeatureOption[];
  userFeaturePrefs: UserFeaturePref[];
  userOptionUtilities: UserOptionUtility[];
}): number => {
  if (!features.length) return 0;

  const prefWeights = new Map(
    userFeaturePrefs.map((pref) => [pref.featureId, pref.weightPercent]),
  );
  const optionUtilities = new Map(
    userOptionUtilities.map((entry) => [entry.featureOptionId, entry.utilityValue]),
  );

  const effectiveWeights = features.map((feature) => {
    const fromUser = prefWeights.get(feature.id);
    return {
      featureId: feature.id,
      weight: fromUser ?? feature.weightPercent ?? 0,
    };
  });
  const totalWeight =
    effectiveWeights.reduce((sum, item) => sum + Math.max(item.weight, 0), 0) || 1;

  let weightedUtility = 0;
  for (const feature of features) {
    const featureWeight =
      (effectiveWeights.find((item) => item.featureId === feature.id)?.weight ?? 0) /
      totalWeight;

    if (feature.type === "price") {
      const normalizedPriceUtility = clamp(100 - payload.priceValue / 20, 0, 100);
      weightedUtility += featureWeight * normalizedPriceUtility;
      continue;
    }

    const selectedOptionId = payload.selectedOptionsByFeatureId[feature.id];
    if (!selectedOptionId) continue;
    const fallbackUtility =
      options.find((option) => option.id === selectedOptionId)?.utilityValue ?? 0;
    const optionUtility = optionUtilities.get(selectedOptionId) ?? fallbackUtility;
    weightedUtility += featureWeight * clamp(optionUtility, 0, 100);
  }

  return Number(weightedUtility.toFixed(2));
};

export const generateAgentOfferPayload = ({
  features,
  options,
  concessionType,
  round,
}: {
  features: Feature[];
  options: FeatureOption[];
  concessionType: "linear" | "convex" | "concave";
  round: number;
}): OfferPayload => {
  const selectedOptionsByFeatureId: Record<string, string> = {};

  for (const feature of features.filter((feature) => feature.type === "option")) {
    const featureOptions = options
      .filter((option) => option.featureId === feature.id)
      .sort((a, b) => b.utilityValue - a.utilityValue);
    if (!featureOptions.length) continue;
    const concessionStep = concessionType === "concave" ? round * 0.5 : concessionType === "convex" ? round * 1.5 : round;
    const idx = Math.min(featureOptions.length - 1, Math.max(0, Math.floor(concessionStep)));
    selectedOptionsByFeatureId[feature.id] = featureOptions[idx].id;
  }

  const basePrice = 1500;
  const priceDrop =
    concessionType === "convex"
      ? 90 * (round + 1)
      : concessionType === "concave"
        ? 45 * (round + 1)
        : 65 * (round + 1);

  return {
    selectedOptionsByFeatureId,
    priceValue: Math.max(300, basePrice - priceDrop),
  };
};
