### Create accounts
- Method: POST
- Path: `/accounts/create`
- Body:
```json
{ "userId": "<uuid>" }
```
- Returns: array of wallet accounts

Example:
```bash
curl -X POST http://localhost:3000/accounts/create \
  -H "Content-Type: application/json" \
  -d '{"userId":"00000000-0000-0000-0000-000000000000"}'
```

### Withdraw
- Method: POST
- Path: `/accounts/withdraw`
- Body:
```json
{
  "accountId": "<string>",
  "balanceId": "<string>",
  "coinId": "<string>",
  "toAddress": "<string>",
  "amount": 0
}
```
- Returns: updated balance

Example:
```bash
curl -X POST http://localhost:3000/accounts/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "acc_123",
    "balanceId": "bal_456",
    "coinId": "coin_eth",
    "toAddress": "0xabc...",
    "amount": 0.05
  }'
```