import type { Meta, StoryObj } from '@storybook/svelte'

import type { Mode } from '../shared/modeArg'
import { modeArgTypes } from '../shared/modeArg'

import Demo from './Demo/Demo.svelte'

type DemoStoryArgs = {
  mode: Mode
}

const meta = {
  title: 'Engine/Demo',
  component: Demo,
  argTypes: { ...modeArgTypes },
  args: { mode: 'main' },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<DemoStoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const MainThread: Story = { args: { mode: 'main' } }
export const Worker: Story = { args: { mode: 'worker' } }
