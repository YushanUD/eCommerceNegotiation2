import { i } from "@instantdb/react";

const schema = i.schema({
  entities: {
    negotiationTemplates: i.entity({
      name: i.string(),
      topic: i.string(),
      createdAt: i.date(),
      createdByUserId: i.string(),
    }),
    templateFeatures: i.entity({
      templateId: i.string(),
      name: i.string(),
      type: i.string<"price" | "option">(),
      weightPercent: i.number(),
      createdAt: i.date(),
    }),
    featureOptions: i.entity({
      featureId: i.string(),
      label: i.string(),
      utilityValue: i.number(),
      createdAt: i.date(),
    }),
    agentProfiles: i.entity({
      templateId: i.string(),
      name: i.string(),
      avatarPreset: i.string(),
      concessionType: i.string<"linear" | "convex" | "concave">(),
      utilityFormulaText: i.string(),
      createdAt: i.date(),
    }),
    userProfiles: i.entity({
      fullName: i.string(),
      ageRange: i.string(),
      gender: i.string(),
      createdAt: i.date(),
    }),
    userFeaturePrefs: i.entity({
      userId: i.string(),
      featureId: i.string(),
      weightPercent: i.number(),
      createdAt: i.date(),
    }),
    userOptionUtilities: i.entity({
      userId: i.string(),
      featureOptionId: i.string(),
      utilityValue: i.number(),
      createdAt: i.date(),
    }),
    negotiationSessions: i.entity({
      templateId: i.string(),
      userId: i.string(),
      agentProfileId: i.string(),
      status: i.string<"active" | "accepted" | "ended">(),
      finalOutcome: i.string(),
      createdAt: i.date(),
      endedAt: i.date(),
    }),
    offers: i.entity({
      sessionId: i.string(),
      senderType: i.string<"user" | "agent">(),
      priceValue: i.number(),
      computedUtility: i.number(),
      payloadJson: i.string(),
      createdAt: i.date(),
    }),
  },
  links: {
    templateToFeatures: {
      forward: { on: "templateFeatures", has: "one", label: "template" },
      reverse: { on: "negotiationTemplates", has: "many", label: "features" },
    },
    templateToAgentProfile: {
      forward: { on: "agentProfiles", has: "one", label: "template" },
      reverse: { on: "negotiationTemplates", has: "many", label: "agentProfiles" },
    },
    featureToOptions: {
      forward: { on: "featureOptions", has: "one", label: "feature" },
      reverse: { on: "templateFeatures", has: "many", label: "options" },
    },
    sessionToTemplate: {
      forward: { on: "negotiationSessions", has: "one", label: "template" },
      reverse: { on: "negotiationTemplates", has: "many", label: "sessions" },
    },
    sessionToAgent: {
      forward: { on: "negotiationSessions", has: "one", label: "agentProfile" },
      reverse: { on: "agentProfiles", has: "many", label: "sessions" },
    },
    sessionToOffers: {
      forward: { on: "offers", has: "one", label: "session" },
      reverse: { on: "negotiationSessions", has: "many", label: "offers" },
    },
    userPrefToFeature: {
      forward: { on: "userFeaturePrefs", has: "one", label: "feature" },
      reverse: { on: "templateFeatures", has: "many", label: "userPrefs" },
    },
    userOptionUtilityToOption: {
      forward: { on: "userOptionUtilities", has: "one", label: "featureOption" },
      reverse: { on: "featureOptions", has: "many", label: "userUtilities" },
    },
  },
});

export default schema;
