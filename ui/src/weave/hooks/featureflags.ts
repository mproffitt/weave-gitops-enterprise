import { useContext } from "react";
import { CoreClientContext, CoreClientContextType } from "../contexts/CoreClientContext";

export type FeatureFlags = { [key: string]: string };

export function useFeatureFlags() {
  const { featureFlags } = useContext(CoreClientContext) as CoreClientContextType;

  const isFlagEnabled = (flag: string) => featureFlags?.[flag] === "true";

  return { isFlagEnabled, flags: featureFlags || {} };
}
