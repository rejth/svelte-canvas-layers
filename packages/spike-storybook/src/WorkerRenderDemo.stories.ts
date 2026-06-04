import type { Meta, StoryObj } from '@storybook/svelte'
import WorkerRenderDemo from './WorkerRenderDemo.svelte'

const meta = {
  title: 'Spike/001 Worker Render',
  component: WorkerRenderDemo,
} satisfies Meta<WorkerRenderDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
