import { StudioIcon } from "./studio-icon";
import type { SaveLifecycle, StudioCopy } from "../types";

export function SaveStatus({
  copy,
  state = "notSaved",
}: {
  copy: StudioCopy;
  state?: SaveLifecycle["state"];
}) {
  return (
    <p className="ds-save-status" role="status">
      <StudioIcon name="file" />
      {state === "notSaved" ? copy.notSaved : copy.saveStates[state]}
    </p>
  );
}
