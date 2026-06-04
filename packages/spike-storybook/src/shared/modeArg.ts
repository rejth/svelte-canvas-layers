export const modeArgTypes = {
  mode: {
    name: 'mode',
    control: 'inline-radio',
    options: ['main', 'worker'],
    table: { defaultValue: { summary: 'main' } },
  },
} as const

export type Mode = 'main' | 'worker'
