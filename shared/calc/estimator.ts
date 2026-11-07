import { round } from './core'

export interface RateBand { minRate: number, maxRate: number }

export interface EstimateInput {
  floorAreas: number[]
  /** Cost per m² actually used (auto midpoint or user override). */
  ratePerM2: number
  band: RateBand
  labourPercent: number
  buildingFactor: number
  locationAdjustmentPercent: number
  addons: { key: string, label: string, percent: number }[]
  elements: { key: string, label: string, percent: number }[]
  budget?: number | null
}

export interface EstimateResult {
  totalArea: number
  ratePerM2: number
  materials: number
  labour: number
  construction: number
  addons: { key: string, label: string, percent: number, amount: number }[]
  total: number
  costPerM2AllIn: number
  range: { low: number, high: number }
  elements: { key: string, label: string, percent: number, amount: number }[]
  budget: null | { budget: number, difference: number, withinBudget: boolean, affordableArea: number }
}

/** Auto-selected cost per m²: band midpoint × location adjustment × building-type factor, to the nearest 100. */
export function autoRate(band: RateBand, locationAdjustmentPercent: number, buildingFactor: number): number {
  const mid = (band.minRate + band.maxRate) / 2
  return Math.round(mid * (1 + locationAdjustmentPercent / 100) * buildingFactor / 100) * 100
}

export function estimate(input: EstimateInput): EstimateResult {
  const totalArea = input.floorAreas.reduce((s, a) => s + (Number.isFinite(a) && a > 0 ? a : 0), 0)
  const labourFactor = 1 + input.labourPercent / 100
  const materials = totalArea * input.ratePerM2
  const labour = materials * input.labourPercent / 100
  const construction = materials + labour
  const addons = input.addons.map(a => ({ ...a, amount: round(construction * a.percent / 100) }))
  const addonPercent = input.addons.reduce((s, a) => s + a.percent, 0)
  const total = construction + addons.reduce((s, a) => s + a.amount, 0)
  const adj = (1 + input.locationAdjustmentPercent / 100) * input.buildingFactor
  const toTotal = (rate: number) => totalArea * rate * adj * labourFactor * (1 + addonPercent / 100)
  const splitTotal = input.elements.reduce((s, e) => s + e.percent, 0) || 100
  const elements = input.elements.map(e => ({ ...e, percent: round(e.percent / splitTotal * 100, 1), amount: round(construction * e.percent / splitTotal) }))

  let budget: EstimateResult['budget'] = null
  if (input.budget && input.budget > 0) {
    const perM2 = totalArea > 0 ? total / totalArea : input.ratePerM2 * labourFactor * (1 + addonPercent / 100)
    budget = {
      budget: input.budget,
      difference: round(input.budget - total),
      withinBudget: input.budget >= total,
      affordableArea: perM2 > 0 ? round(input.budget / perM2, 1) : 0
    }
  }

  return {
    totalArea: round(totalArea, 2),
    ratePerM2: input.ratePerM2,
    materials: round(materials),
    labour: round(labour),
    construction: round(construction),
    addons,
    total: round(total),
    costPerM2AllIn: totalArea > 0 ? round(total / totalArea) : 0,
    range: { low: round(toTotal(input.band.minRate)), high: round(toTotal(input.band.maxRate)) },
    elements,
    budget
  }
}
