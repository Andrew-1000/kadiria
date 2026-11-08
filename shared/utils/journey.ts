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
  /** The tool page for this stage. */
  to: string
  /** Working page inside the signed-in workspace, used when the banner is shown there. */
  appTo?: string
  /** What happens at this stage of a real construction project. */
  what: string
  /** Who is usually involved. */
  who: string
  /** What you walk away with. */
  output: string
  /** The main steps of the stage, in order. */
  steps: string[]
  /** How long the stage usually takes. */
  time: string
  /** One practical piece of advice. */
  tip: string
}

export const JOURNEY: JourneyStage[] = [
  {
    key: 'plan', no: 1, title: 'Plan & budget', icon: 'i-lucide-calculator', tool: 'Cost Calculator', to: '/estimate',
    what: 'Before any drawings, test whether the house you have in mind fits your money. Cost per m² for your town, house type and finish gives an order-of-cost figure.',
    who: 'You (the client), often with a quantity surveyor',
    output: 'An estimated total, a likely range and a budget check',
    steps: ['Decide the rooms and size you need', 'Choose your town, house type and finish level', 'Get an order-of-cost estimate', 'Compare it with your savings or financing', 'Keep about 10% aside for surprises'],
    time: 'One to two weeks',
    tip: 'Budget for more than materials and labour: professional fees, approvals and connections to water and power all cost money.'
  },
  {
    key: 'prepare', no: 2, title: 'Prepare documents', icon: 'i-lucide-drafting-compass', tool: 'Document check', to: '/prepare',
    what: 'An architect draws the plans, an engineer designs the structure and services, and approvals are applied for. A Bill of Quantities is measured from these documents.',
    who: 'Architect, structural & MEP engineers, county planning office',
    output: 'Drawings, structural design, specification and approvals',
    steps: ['Confirm the plot title and survey the boundaries', 'An architect draws the plans, sections and elevations', 'A structural engineer designs the foundations, slabs and beams', 'Plumbing, drainage and electrical layouts are designed', 'Plans go to the county for planning and building approval'],
    time: 'One to three months',
    tip: 'Do not start on site before the county approves the plans. Unapproved work can be stopped, fined or ordered down.'
  },
  {
    key: 'quantify', no: 3, title: 'Quantify materials', icon: 'i-lucide-boxes', tool: 'Material Calculators', to: '/calculators',
    what: 'Element by element, in the order they are built on site, work out the cement, sand, ballast, steel and stone needed, and what they cost in your area.',
    who: 'Quantity surveyor, contractor or fundi',
    output: 'Material quantities and costs for each element',
    steps: ['Work through the building in the order it is built', 'Take the size of each element from the drawings', 'Turn sizes into bags, tonnes, pieces and lengths', 'Add a little for wastage', 'Price everything at rates for your area'],
    time: 'A few days',
    tip: 'Buy in stages as the work moves on, so cash is not tied up and cement does not harden in a damp store.'
  },
  {
    key: 'bq', no: 4, title: 'Draft the BQ', icon: 'i-lucide-file-spreadsheet', tool: 'BQ wizard & editor', to: '/stage/draft', appTo: '/projects/new',
    what: 'Every piece of work is described, measured and priced in standard bills, from preliminaries to provisional sums, with contingency and VAT on top.',
    who: 'Quantity surveyor',
    output: 'A priced Bill of Quantities',
    steps: ['Measure every item by a standard method of measurement', 'Group the items into the nine standard bills', 'Price each line at current rates', 'Add preliminaries, provisional sums and contingency', 'Add VAT and total it on the grand summary'],
    time: 'One to three weeks',
    tip: 'A BQ is only as good as the drawings behind it. Missing details become provisional sums: allowances, not prices.'
  },
  {
    key: 'review', no: 5, title: 'Review & issue', icon: 'i-lucide-stamp', tool: 'BQ review workflow', to: '/stage/review', appTo: '/projects',
    what: 'A professional checks the quantities and rates, approves the BQ and issues it as a fixed, numbered revision that everyone prices against.',
    who: 'Senior QS / project manager',
    output: 'An issued BQ revision (locked)',
    steps: ['Check the quantities against the drawings', 'Check the rates against the market', 'Confirm assumptions and exclusions with the client', 'Approve the BQ', 'Issue it as a numbered revision'],
    time: 'About a week',
    tip: 'Once issued, the BQ is locked. Any change after that is recorded as a new revision, so everyone knows which version they priced.'
  },
  {
    key: 'build', no: 6, title: 'Tender & build', icon: 'i-lucide-hard-hat', tool: 'Print, PDF & CSV export', to: '/stage/tender', appTo: '/projects',
    what: 'Contractors price the issued BQ to tender. During construction it guides purchasing, interim valuations and payments, and any changes become a new revision.',
    who: 'Contractors, client, QS on site',
    output: 'A contract sum and a cost-control baseline',
    steps: ['Invite contractors to price the issued BQ', 'Compare the tenders line by line', 'Award the contract and sign it', 'Measure work done for interim payments', 'Price any changes from the BQ rates'],
    time: 'As long as construction takes',
    tip: 'Pay for work measured and done, not for time spent on site. The BQ is what makes that possible.'
  }
]

export function journeyStage(key: JourneyStage['key']): JourneyStage {
  return JOURNEY.find(s => s.key === key) ?? JOURNEY[0]!
}

export function prevStage(key: JourneyStage['key']): JourneyStage | null {
  const i = JOURNEY.findIndex(s => s.key === key)
  return i > 0 ? JOURNEY[i - 1]! : null
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
