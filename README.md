# Finance Tracker

A minimal personal finance tracker built with Next.js, PostgreSQL, and Plaid integration. Track your net worth, spending patterns, and manage manual crypto assets.

## Features

### Core Functionality
- **Net Worth Tracking**: Visual charts showing assets vs liabilities over time
- **Account Linking**: Connect bank accounts via Plaid (depository, credit, investment)
- **Transaction Sync**: Automatic transaction fetching with category detection
- **Manual Crypto Assets**: Add and manage crypto holdings without exchange integration
- **Spending Analysis**: Monthly cash flow and category breakdowns
- **Transfer Detection**: Automatically exclude internal transfers from spending

### Security & Privacy
- Email/password authentication with JWT tokens
- Encrypted storage of Plaid access tokens
- US-only, USD-only implementation
- No social sign-in or 2FA (v1 scope)

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Charts**: Recharts
- **Financial Data**: Plaid API
- **Scheduling**: node-cron for daily/weekly syncs

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Plaid developer account

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo>
   cd finance-tracker
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env` and configure:
   ```bash
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/finance_tracker"
   
   # JWT Secret
   JWT_SECRET="your-secure-jwt-secret-here"
   
   # Plaid Credentials
   PLAID_CLIENT_ID="your-plaid-client-id"
   PLAID_SECRET="your-plaid-secret"
   PLAID_ENV="sandbox"  # or "development" or "production"
   
   # Encryption Key (32 characters)
   ENCRYPTION_KEY="your-32-character-encryption-key"
   ```

3. **Database Setup**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## Plaid Integration Setup

1. **Create Plaid Developer Account**: Visit [Plaid Dashboard](https://dashboard.plaid.com)
2. **Get API Keys**: Copy Client ID and Secret from your app settings
3. **Configure Webhook URL** (optional): `https://yourdomain.com/api/webhooks/plaid`
4. **Enable Products**: Ensure Transactions and Auth products are enabled

## Scheduled Sync Jobs

The app includes automated daily/weekly sync jobs:

```bash
# Start sync jobs (in production)
npm run sync-jobs
```

**Sync Schedule**:
- **Daily users**: Every day at 2:00 AM server time
- **Weekly users**: Every Sunday at 2:00 AM server time

**What gets synced**:
- Account balances (with forward-fill for missing days)
- New transactions from the last 30 days
- Transfer detection and categorization

## Data Models

### Core Entities
- **Users**: Authentication, sync preferences
- **Institutions**: Plaid connection details (encrypted tokens)
- **Accounts**: Bank accounts and manual crypto assets
- **Transactions**: Categorized spending/income data
- **Balance Snapshots**: Daily account balance history
- **Manual Assets**: User-managed crypto holdings

### Key Business Logic
- **Net Worth Calculation**: Assets - Liabilities
- **Transfer Detection**: ±3% amount, ±1 day timing heuristic
- **Forward Fill**: Missing balance days use last known value
- **Category Mapping**: Plaid categories → simplified internal taxonomy

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Plaid Integration
- `POST /api/link/token` - Create Plaid Link token
- `POST /api/link/exchange` - Exchange public token for access token

### Accounts & Balances
- `GET /api/accounts` - List all accounts
- `PATCH /api/accounts/[id]` - Toggle account active/inactive
- `GET /api/accounts/[id]` - Get account balance history

### Transactions
- `GET /api/transactions` - List transactions with filters
- `PATCH /api/transactions/[id]` - Edit category/merchant name

### Manual Assets
- `GET /api/manual-assets` - List crypto assets
- `POST /api/manual-assets` - Add new asset
- `PATCH /api/manual-assets/[id]` - Update asset
- `DELETE /api/manual-assets/[id]` - Remove asset

### Analytics
- `GET /api/networth/series` - Net worth time series data
- `GET /api/spend/summary` - Monthly spending breakdown

## User Interface

### Dashboard
- Current net worth with monthly change indicator
- Interactive net worth chart (line + stacked area)
- Monthly cash flow bar chart (income vs spending)
- Category spending donut chart (clickable to filter transactions)

### Accounts Page
- Connected bank accounts with institution status
- Manual crypto asset summary
- Plaid Link integration for adding new accounts

### Transactions Page
- Searchable/filterable transaction list
- Inline editing of categories and merchant names
- Account and date range filtering

### Crypto Assets Page
- Manual crypto asset management
- Add/edit/delete functionality
- Total portfolio value tracking

## Error Handling & Edge Cases

### Plaid Connection Issues
- Institution status tracking (active, error, relink_required)
- Automatic error status updates on sync failures
- User-friendly error messages in UI

### Data Consistency
- Transaction deduplication by Plaid transaction ID
- Balance forward-filling for continuity
- Transfer detection to avoid double-counting

### Security Considerations
- Plaid access tokens encrypted at rest
- JWT tokens for API authentication
- Environment-based configuration secrets
- No PII logging

## Development & Testing

### Database Operations
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Create and run migrations
npm run db:migrate
```

### Testing with Plaid Sandbox
- Use Plaid Sandbox environment for development
- Test institutions: Chase, Bank of America, Wells Fargo, etc.
- Sample accounts automatically created
- No real financial data involved

## Production Deployment

### Environment Variables
Ensure all production environment variables are set:
- Strong JWT secret
- Production Plaid credentials
- Secure encryption key
- Production database URL

### Database Migration
```bash
npx prisma migrate deploy
```

### Sync Jobs
Deploy sync jobs as a separate process or cron job:
```bash
npm run sync-jobs
```

## Known Limitations (v1 Scope)

**Not Included**:
- Budgets and goal tracking
- Portfolio performance analysis
- Holdings-level investment data
- Retirement planning features
- Multi-currency support
- CSV import/export
- Email notifications
- Social sharing
- Mobile app
- 2FA authentication

**Future Extensions**:
- Plaid webhooks for real-time updates
- Investment holdings and performance
- Allocation charts and rebalancing
- Multi-user household support
- API rate limiting and caching
- Advanced categorization rules

## Support & Troubleshooting

### Common Issues

**Connection Problems**:
- Verify Plaid credentials in environment
- Check institution status in accounts page
- Look for "relink required" status

**Sync Issues**:
- Check sync job logs
- Verify accounts are marked as active
- Ensure Plaid tokens haven't expired

**Missing Data**:
- Forward-fill ensures chart continuity
- Transactions may take time to appear (pending → posted)
- Check date filters in transaction view

### Logs & Debugging
- Sync job output shows success/failure status
- API errors logged to console
- Plaid API responses include detailed error codes

## Contributing

This is a minimal v1 implementation. Future enhancements should:
1. Maintain backward compatibility
2. Follow existing patterns and conventions
3. Include appropriate tests
4. Update this documentation

## License

MIT License - see LICENSE file for details.