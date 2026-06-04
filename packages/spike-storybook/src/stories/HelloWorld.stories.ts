import type { Meta, StoryObj } from '@storybook/svelte'

import { modeArgTypes } from '../shared/modeArg'

import HelloWorld from './HelloWorld.svelte'

const meta = {
  title: 'Engine/Hello World',
  component: HelloWorld,
  argTypes: { ...modeArgTypes },
  args: { mode: 'main' },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<HelloWorld>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const MainThread: Story = { args: { mode: 'main' } }
export const Worker: Story = { args: { mode: 'worker' } }
