import type { Meta, StoryObj } from '@storybook/svelte'

import { modeArgTypes } from '../shared/modeArg'

import LayerEvents from './LayerEvents/LayerEvents.svelte'

const meta = {
  title: 'Engine/Layer Events',
  component: LayerEvents,
  argTypes: { ...modeArgTypes },
  args: { mode: 'main' },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<LayerEvents>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const MainThread: Story = { args: { mode: 'main' } }
export const Worker: Story = { args: { mode: 'worker' } }
