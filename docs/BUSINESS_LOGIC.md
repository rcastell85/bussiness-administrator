# Business Logic: SaaS Admin (VEN)

This document defines the core business rules, specifically addressing the bimonetary and inflationary environment of Venezuela.

## 1. Currency Management (Bimonetarismo)
The system operates with **USD** as the accounting currency (Moneda de Cuenta) and **VES** as the transaction currency (Moneda de Tránsito).

### Rule 1.1: Base Pricing
- All product costs and selling prices MUST be stored in **USD**.
- This protects the historical value of the inventory and reports against VES inflation.

### Rule 1.2: Exchange Rates (Tasas)
- **Global Rate**: The system administrator updates a global BCV rate daily.
- **Tenant Override**: Each business owner can override the global rate with their own custom rate.
- **Point of Sale Conversion**: When a sale is initiated, the system calculates the VES total using the current applicable rate.

## 2. Sales & POS Logic
### Rule 2.1: Tasa del Momento
- Every sale record MUST store the `tasa_momento` (the exchange rate used during the transaction).
- **Why?** For historical reporting and auditing. Even if the rate changes tomorrow, the record shows exactly how much VES was received today.

### Rule 2.2: Multi-payment Methods
- A single sale can be paid using multiple methods (Zelle, Cash USD, Pago Móvil VES).
- Each payment line records the currency and amount, ensuring the total matches the USD value of the sale.

## 3. Accounts Receivable ("Fiaos")
### Rule 3.1: Debt in USD
- When a customer "buys on credit" (Fiao), the debt is registered in **USD**.
- **Payment of Debt**: When the customer pays back, the amount in VES is converted to USD at the "Rate of the Day" to reduce the USD balance.

## 4. Taxes & Fees
### Rule 4.1: IGTF (Impuesto a las Grandes Transacciones Financieras)
- The system must support an optional 3% (or configurable) IGTF calculation for payments made in USD cash, as per local regulations.
