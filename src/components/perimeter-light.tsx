/** One inherited angle drives the crisp border, edge spill and diffused halo. */
export function PerimeterLight({ product = false }: { product?: boolean }) {
  return (
    <span
      className={product ? "perimeter-light product-edge" : "perimeter-light offer-edge"}
      data-ambient={product ? "product-edge" : "edge"}
      aria-hidden="true"
    >
      <span className="gradient-halo">
        <span />
      </span>
      <span className="gradient-spill">
        <span />
      </span>
      <span className="gradient-border" />
    </span>
  );
}
