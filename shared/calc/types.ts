export type Constants = Record<string, number>

export interface Mix {
  key: string
  name: string
  kind: 'concrete' | 'mortar'
  cement: number
  sand: number
  ballast: number
}

export interface InputOption { label: string, value: string | number }

export interface InputDef {
  key: string
  label: string
  unit?: string
  type?: 'number' | 'mix' | 'bar' | 'select'
  /** Default value; may be overridden by the admin (calc_modules.defaults). */
  default?: number | string
  min?: number
  max?: number
  step?: number
  required?: boolean
  mixKind?: 'concrete' | 'mortar'
  options?: InputOption[]
  help?: string
  group?: string
}

export interface ResultLine { label: string, value: number, unit: string, emphasis?: boolean }

export interface MaterialQty {
  materialKey: string
  label: string
  unit: string
  /** Quantity including wastage, rounded to a purchasable amount. */
  quantity: number
  /** Unrounded quantity before wastage (for transparency). */
  netQuantity: number
}

/** A line that can be pushed into a Bill of Quantities. */
export interface BqLine {
  billKey: string
  section?: string
  description: string
  unit: string
  quantity: number
  /** Look up the rate from the BQ library by this code. */
  libraryCode?: string
  /** If true, the module's material cost (+ labour uplift) is priced onto this line. */
  carriesMaterialCost?: boolean
  /** Material keys whose cost belongs to this line (e.g. formwork timber → the formwork line). */
  materials?: string[]
}

export interface ModuleResult {
  lines: ResultLine[]
  materials: MaterialQty[]
  bqLines: BqLine[]
  warnings: string[]
}

export interface ModuleContext {
  constants: Constants
  mixes: Mix[]
  wastagePercent: number
}

export type ModuleInputs = Record<string, number | string | undefined>

export interface ModuleDef {
  key: string
  name: string
  short: string
  description: string
  billKey: string
  icon: string
  /** Construction stage (Foundations, Superstructure, Finishes). */
  stage?: string
  /** What happens on site at this point in the construction sequence. */
  onSite?: string
  formula: string[]
  inputs: InputDef[]
  compute: (inputs: ModuleInputs, ctx: ModuleContext) => ModuleResult
}

export interface PricedMaterial extends MaterialQty {
  unitPrice: number | null
  amount: number | null
  priceSource: 'location' | 'national' | 'override' | 'missing'
  /** Date the applied admin price took effect (null for overrides or missing prices). */
  effectiveFrom?: string | null
}
