import type { Meta, StoryObj } from '@storybook/svelte'

import WorkerRenderDemo from './WorkerRenderDemo.svelte'

const meta = {
  title: 'Worker Render',
  component: WorkerRenderDemo,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<WorkerRenderDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
