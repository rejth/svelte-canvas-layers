import type { Meta, StoryObj } from '@storybook/svelte'
import PickingMagnifierDemo from './PickingMagnifierDemo.svelte'

const meta = {
  title: 'Spike/002 Picking Magnifier',
  component: PickingMagnifierDemo,
} satisfies Meta<PickingMagnifierDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
