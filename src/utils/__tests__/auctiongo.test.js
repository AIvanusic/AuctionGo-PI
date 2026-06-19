import { describe, expect, test } from 'vitest'
import { calculateBidStep, isBidValid, formatPrice, filterAuctionsByStatus } from '../auctionUtils'
import { getStoredUser } from '../userStorageUtils'

describe('AuctionGO unit testovi', () => {
  test('calculateBidStep vraća najmanji korak licitiranja od 5 eura', () => {
    expect(calculateBidStep(50)).toBe(5)
  })
})

test('isBidValid prihvaća samo ponudu veću od trenutne cijene', () => {
  expect(isBidValid(100, 120)).toBe(true)
  expect(isBidValid(100, 100)).toBe(false)
  expect(isBidValid(100, 90)).toBe(false)
})

test('formatPrice formatira cijenu u hrvatskom formatu', () => {
  expect(formatPrice(1234.5)).toBe('1.234,50 €')
})

test('filterAuctionsByStatus vraća samo najavljene aukcije', () => {
  const now = new Date('2026-06-18T12:00:00')

  const auctions = [
    {
      aukcija_sifra: 1,
      aukcija_pocetak: '2026-06-19T12:00:00',
      aukcija_kraj: '2026-06-20T12:00:00',
      aukcija_status: 'ceka',
    },
    {
      aukcija_sifra: 2,
      aukcija_pocetak: '2026-06-17T12:00:00',
      aukcija_kraj: '2026-06-19T12:00:00',
      aukcija_status: 'prvi poziv',
    },
  ]

  const result = filterAuctionsByStatus(auctions, 'upcoming', now)

  expect(result).toHaveLength(1)
  expect(result[0].aukcija_sifra).toBe(1)
})

test('getStoredUser vraća null za neispravan zapis korisnika', () => {
  expect(getStoredUser('undefined')).toBe(null)
  expect(getStoredUser('[object Object]')).toBe(null)
})
