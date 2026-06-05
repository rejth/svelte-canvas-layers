<script lang="ts">
export let feature = 'Layer events'
export let width: number | null = null
export let height: number | null = null

$: widthStyle = width == null ? '100%' : `${width}px`
$: heightStyle = height == null ? '100%' : `${height}px`
</script>

<div
  style="width:{widthStyle};height:{heightStyle};display:flex;align-items:center;justify-content:center;
         text-align:center;padding:24px;box-sizing:border-box;border:1px dashed #cbd5e1;
         background:#fff;color:#475569;font-family:ui-sans-serif,system-ui;"
>
  <div>
    <div style="font-size:15px;color:#111827;margin-bottom:8px;">{feature}: not ported to worker mode yet</div>
    <div style="font-size:13px;line-height:1.5;">
      This specific story has not been ported to worker mode yet.<br />
      Switch <code>mode</code> back to <strong>main</strong> to interact.
    </div>
  </div>
</div>
