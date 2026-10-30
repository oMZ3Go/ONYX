/** Shared visual only; Hero and Studio keep independent animation controllers. */
export function DesignerCursorGraphic() {
  return (
    <>
      <svg width="25" height="31" viewBox="0 0 25 31" fill="none">
        <path
          d="M2 2v23l6-6 5 10 5-3-5-9h9L2 2Z"
          fill="var(--onyx-white)"
          stroke="var(--onyx-canvas)"
          strokeWidth="1.5"
        />
      </svg>
      <span />
    </>
  );
}
