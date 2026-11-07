/**
 * The construction journey every tool in the system belongs to. Pages show where the user is,
 * what that stage means in a real building project, and what comes next.
 */
export interface JourneyStage {
  key: 'plan' | 'prepare' | 'quantify' | 'bq' | 'review' | 'build'
  no: number
  title: string
  icon: string
  /** The tool in this system that supports the stage. */
  tool: string
  to: string
  /** What happens at this stage of a real construction project. */
  what: string
  /** Who is usually involved. */
  who: string
  /** What you walk away with. */
  output: string
}

export const JOURNEY: JourneyStage[] = [
  {
    key: 'plan', no: 1, title: 'Plan & budget', icon: 'i-lucide-calculator', tool: 'Cost Calculator', to: '/estimate',
    what: 'Before any drawings, test whether the house you have in mind fits your money. Cost per m² for your town, house type and finish gives an order-of-cost figure.',
    who: 'You (the client), often with a quantity surveyor',
    output: 'An estimated total, a likely range and a budget check'
  },
  {
    key: 'prepare', no: 2, title: 'Prepare documents', icon: 'i-lucide-drafting-compass', tool: 'BQ checklist', to: '/#prerequisites',
    what: 'An architect draws the plans, an engineer designs the structure and services, and approvals are applied for. A Bill of Quantities is measured from these documents.',
    who: 'Architect, structural & MEP engineers, county planning office',
    output: 'Drawings, structural design, specification and approvals'
  },
  {
    key: 'quantify', no: 3, title: 'Quantify materials', icon: 'i-lucide-boxes', tool: 'Material Calculators', to: '/calculators',
    what: 'Element by element, in the order they are built on site, work out the cement, sand, ballast, steel and stone needed, and what they cost in your area.',
    who: 'Quantity surveyor, contractor or fundi',
    output: 'Material quantities and costs for each element'
  },
  {
    key: 'bq', no: 4, title: 'Draft the BQ', icon: 'i-lucide-file-spreadsheet', tool: 'BQ wizard & editor', to: '/projects/new',
    what: 'Every piece of work is described, measured and priced in standard bills, from preliminaries to provisional sums, with contingency and VAT on top.',
    who: 'Quantity surveyor',
    output: 'A priced Bill of Quantities'
  },
  {
    key: 'review', no: 5, title: 'Review & issue', icon: 'i-lucide-stamp', tool: 'BQ review workflow', to: '/projects',
    what: 'A professional checks the quantities and rates, approves the BQ and issues it as a fixed, numbered revision that everyone prices against.',
    who: 'Senior QS / project manager',
    output: 'An issued BQ revision (locked)'
  },
  {
    key: 'build', no: 6, title: 'Tender & build', icon: 'i-lucide-hard-hat', tool: 'Print, PDF & CSV export', to: '/projects',
    what: 'Contractors price the issued BQ to tender. During construction it guides purchasing, interim valuations and payments, and any changes become a new revision.',
    who: 'Contractors, client, QS on site',
    output: 'A contract sum and a cost-control baseline'
  }
]

export function journeyStage(key: JourneyStage['key']): JourneyStage {
  return JOURNEY.find(s => s.key === key) ?? JOURNEY[0]!
}

export function nextStage(key: JourneyStage['key']): JourneyStage | null {
  const i = JOURNEY.findIndex(s => s.key === key)
  return i >= 0 && i < JOURNEY.length - 1 ? JOURNEY[i + 1]! : null
}

/** Where a BQ project sits in the journey, from its workflow status. */
export function stageForStatus(status: string): JourneyStage['key'] {
  if (status === 'issued') return 'build'
  if (status === 'submitted' || status === 'approved') return 'review'
  return 'bq'
}
