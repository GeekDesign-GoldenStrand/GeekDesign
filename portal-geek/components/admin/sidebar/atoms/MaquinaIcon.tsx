/**
 * Sidebar icon for Máquinas. Inlined as JSX (rather than loaded via <Image>)
 * so the path fill can use `currentColor` and pick up the link's text color —
 * `text-[#575757]` when idle, `text-[#e42200]` on hover/active — matching the
 * behavior of every Phosphor icon in the sidebar. This is what lets us avoid
 * shipping separate -hover / -fill SVG variants.
 */
export function MaquinaIcon({ size = 30 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M26.26,28.78h-7.42l2.33-.79c.24-.08.37-.34.29-.57-.08-.23-.35-.36-.59-.28l-2.42.82,1.38-1.39c.18-.18.17-.46-.01-.64-.18-.17-.48-.16-.65.01l-2.7,2.72v-8.26h2.99c2.19,0,3.98-1.73,3.98-3.86v-.63c0-1.04-.43-1.98-1.11-2.67h1.94c.51,0,.93-.4.93-.9V1.28c0-.5-.41-.9-.93-.9H7.74c-.51,0-.93.4-.93.9v11.07c0,.5.41.9.93.9h1.94c-.69.69-1.11,1.63-1.11,2.67v.63c0,2.13,1.78,3.86,3.98,3.86h2.99v8.01l-2.46-2.48c-.18-.18-.47-.18-.65-.01-.18.17-.19.46-.01.64l1.38,1.39-2.42-.82c-.24-.08-.5.04-.59.28-.08.23.04.49.29.57l2.33.79h-7.66c-.25,0-.46.2-.46.45v1.94c0,.25.21.45.46.45h20.52c.25,0,.46-.2.46-.45v-1.94c0-.25-.21-.45-.46-.45ZM8.67,2.18h14.67v9.27h-14.67V2.18ZM10.42,16.55v-.63c0-1.14.95-2.06,2.13-2.06h6.91c1.17,0,2.13.93,2.13,2.06v.63c0,1.14-.95,2.06-2.13,2.06h-6.91c-1.17,0-2.13-.93-2.13-2.06ZM25.8,30.72H6.2v-1.04h19.6v1.04Z" />
    </svg>
  );
}
