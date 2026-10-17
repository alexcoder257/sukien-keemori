"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPricing, updatePricing, type PricingInput } from "@/apis/pricing";

export const pricingQueryKeys = {
  all: ["pricing"] as const,
};

export function usePricingQuery() {
  return useQuery({
    queryKey: pricingQueryKeys.all,
    queryFn: getPricing,
  });
}

export function useUpdatePricingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PricingInput) => updatePricing(input),
    onSuccess: (saved) => queryClient.setQueryData(pricingQueryKeys.all, saved),
  });
}
