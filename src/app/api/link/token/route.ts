import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { plaidClient } from '@/lib/plaid'
import { CountryCode, Products } from 'plaid'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: user.id
      },
      client_name: 'Finance Tracker',
      products: [Products.Transactions, Products.Auth],
      country_codes: [CountryCode.Us],
      language: 'en',
      account_filters: {
        depository: {
          account_subtypes: ['checking', 'savings', 'money_market', 'cd'] as any
        },
        credit: {
          account_subtypes: ['credit_card'] as any
        },
        investment: {
          account_subtypes: ['brokerage', '401k', 'ira', 'roth_ira'] as any
        }
      }
    })

    return NextResponse.json({ link_token: response.data.link_token })
  } catch (error) {
    console.error('Link token creation error:', error)
    return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 })
  }
}