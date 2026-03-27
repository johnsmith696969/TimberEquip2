export type SellerPlanId = 'individual_seller' | 'dealer' | 'fleet_dealer';

const SELLER_PLAN_PRIORITY: Record<SellerPlanId, number> = {
  individual_seller: 1,
  dealer: 2,
  fleet_dealer: 3,
};

export function normalizeSellerPlanId(value: unknown): SellerPlanId | null {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'individual_seller' || normalized === 'dealer' || normalized === 'fleet_dealer') {
    return normalized;
  }
  return null;
}

export function getSellerPlanMarketingLabel(value: unknown): string {
  const planId = normalizeSellerPlanId(value);
  if (planId === 'individual_seller') return 'Owner-Operator';
  if (planId === 'dealer') return 'Dealer';
  if (planId === 'fleet_dealer') return 'Pro Dealer';
  return 'No active seller plan';
}

export function getSellerPlanPurchaseLabel(value: unknown): string {
  const planId = normalizeSellerPlanId(value);
  if (planId === 'individual_seller') return 'Owner-Operator Ad Program';
  if (planId === 'dealer') return 'Dealer';
  if (planId === 'fleet_dealer') return 'Pro Dealer';
  return 'Choose a Plan';
}

export function getSellerPlanChangeDirection(currentValue: unknown, nextValue: unknown): 'new' | 'same' | 'upgrade' | 'downgrade' {
  const currentPlanId = normalizeSellerPlanId(currentValue);
  const nextPlanId = normalizeSellerPlanId(nextValue);

  if (!currentPlanId || !nextPlanId) return 'new';
  if (currentPlanId === nextPlanId) return 'same';

  return SELLER_PLAN_PRIORITY[nextPlanId] > SELLER_PLAN_PRIORITY[currentPlanId]
    ? 'upgrade'
    : 'downgrade';
}
