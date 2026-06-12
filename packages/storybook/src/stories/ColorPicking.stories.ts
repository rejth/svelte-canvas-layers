import type { Meta, StoryObj } from '@storybook/svelte'

import { modeArgTypes } from '../shared/modeArg'

import ColorPicking from './ColorPicking.svelte'

const meta = {
  title: 'Engine/Color Picking',
  component: ColorPicking,
  argTypes: { ...modeArgTypes },
  args: { mode: 'main' },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<ColorPicking>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const MainThread: Story = { args: { mode: 'main' } }
export const Worker: Story = { args: { mode: 'worker' } }
