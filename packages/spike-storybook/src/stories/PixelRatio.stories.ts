import type { Meta, StoryObj } from '@storybook/svelte'

import { modeArgTypes } from '../shared/modeArg'

import PixelRatio from './PixelRatio.svelte'

const meta = {
  title: 'Engine/Pixel Ratio',
  component: PixelRatio,
  argTypes: { ...modeArgTypes },
  args: { mode: 'main' },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<PixelRatio>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const MainThread: Story = { args: { mode: 'main' } }
export const Worker: Story = { args: { mode: 'worker' } }
