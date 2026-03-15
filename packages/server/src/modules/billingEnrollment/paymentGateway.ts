export type PaymentGatewayChargeInput = {
  billingAccountId: string;
  invoiceId: string;
  paymentMethodTokenId: string;
  amount: number;
};

export type PaymentGatewayChargeResult = {
  gatewayReferenceId: string;
  status: 'succeeded' | 'failed' | 'processing';
  message?: string;
};

export interface PaymentGatewayAdapter {
  charge(input: PaymentGatewayChargeInput): Promise<PaymentGatewayChargeResult>;
}

export class MockPaymentGatewayAdapter implements PaymentGatewayAdapter {
  async charge(input: PaymentGatewayChargeInput): Promise<PaymentGatewayChargeResult> {
    // Placeholder behavior for future real gateway integration.
    const lastDigit = Number.parseInt(input.invoiceId.replace(/\D/g, '').slice(-1) || '0', 10);
    const failed = lastDigit % 5 === 0;

    return {
      gatewayReferenceId: `gw-${input.invoiceId}-${Date.now()}`,
      status: failed ? 'failed' : 'succeeded',
      message: failed ? 'Gateway declined transaction (mock).' : 'Payment accepted (mock).'
    };
  }
}
