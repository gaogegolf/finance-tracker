import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { plaidClient, encryptToken } from '@/lib/plaid'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { public_token } = await req.json()

    if (!public_token) {
      return NextResponse.json({ error: 'Public token required' }, { status: 400 })
    }

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token
    })

    const { access_token, item_id } = exchangeResponse.data

    const itemResponse = await plaidClient.itemGet({
      access_token
    })

    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: itemResponse.data.item.institution_id!,
      country_codes: ['US' as any]
    })

    const institution = await prisma.institution.create({
      data: {
        userId: user.id,
        plaidItemId: item_id,
        plaidAccessToken: encryptToken(access_token),
        institutionName: institutionResponse.data.institution.name
      }
    })

    const accountsResponse = await plaidClient.accountsGet({
      access_token
    })

    const validAccountTypes = ['depository', 'credit', 'investment']
    const filteredAccounts = accountsResponse.data.accounts.filter(account => 
      validAccountTypes.includes(account.type)
    )

    const accounts = await Promise.all(
      filteredAccounts.map(async (account) => {
        return prisma.account.create({
          data: {
            userId: user.id,
            institutionId: institution.id,
            plaidAccountId: account.account_id,
            name: account.name,
            officialName: account.official_name || null,
            mask: account.mask || null,
            type: account.type,
            subtype: account.subtype || null
          }
        })
      })
    )

    const balanceSnapshots = await Promise.all(
      accounts.map(async (account, index) => {
        const plaidAccount = filteredAccounts[index]
        return prisma.balanceSnapshot.create({
          data: {
            userId: user.id,
            accountId: account.id,
            date: new Date(),
            balance: plaidAccount.balances.current || 0
          }
        })
      })
    )

    return NextResponse.json({
      institution: {
        id: institution.id,
        name: institution.institutionName
      },
      accounts: accounts.map((account, index) => ({
        id: account.id,
        name: account.name,
        mask: account.mask,
        type: account.type,
        subtype: account.subtype,
        balance: balanceSnapshots[index].balance
      }))
    })
  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 })
  }
}