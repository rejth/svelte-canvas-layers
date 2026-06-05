import type { Meta, StoryObj } from '@storybook/svelte'

import WorkerRender from './WorkerRender.svelte'

const meta = {
  title: 'Engine/Worker Render',
  component: WorkerRender,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<WorkerRender>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
