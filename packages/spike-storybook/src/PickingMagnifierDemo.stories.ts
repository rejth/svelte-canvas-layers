import type { Meta, StoryObj } from '@storybook/svelte'

import PickingMagnifierDemo from './PickingMagnifierDemo.svelte'

const meta = {
  title: 'Color Picking',
  component: PickingMagnifierDemo,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<PickingMagnifierDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
