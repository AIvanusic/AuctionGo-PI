export function calculateBidStep(currentPrice) {
  return Math.max(5, Math.ceil(Number(currentPrice) * 0.05))
}

export function isBidValid(currentPrice, bidPrice) {
  const current = Number(currentPrice)
  const bid = Number(bidPrice)

  return !Number.isNaN(bid) && bid > current
}

export function formatPrice(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-'
  }

  return (
    Number(value).toLocaleString('hr-HR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' €'
  )
}

export function filterAuctionsByStatus(auctions, status, now = new Date()) {
  if (status === 'upcoming') {
    return auctions.filter((auction) => new Date(auction.aukcija_pocetak) > now)
  }

  if (status === 'finished') {
    return auctions.filter(
      (auction) =>
        auction.aukcija_status === 'zavrsena' ||
        auction.aukcija_statusend === 'uspjesno zavrsena' ||
        auction.aukcija_statusend === 'bez ponuda',
    )
  }

  return auctions.filter(
    (auction) =>
      new Date(auction.aukcija_pocetak) <= now &&
      new Date(auction.aukcija_kraj) > now &&
      auction.aukcija_status !== 'zavrsena',
  )
}
