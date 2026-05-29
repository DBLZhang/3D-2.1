import { Html } from "@react-three/drei";
import styled from "styled-components";
import { useConfigStore } from "../stores";
import type { ComponentProps } from "react";

const Label = styled(Html)<{ $color: string }>`
  pointer-events: none;
  width: max-content;
  display: flex;
  color: ${(props) => props.$color};
  font-family: "Outfit", "Inter", sans-serif;
  font-weight: 600;
  text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px ${(props) => props.$color}4d;
`;

export default function Index(props: Omit<ComponentProps<typeof Label>, "$color">) {
  const mapPlayComplete = useConfigStore((s) => s.mapPlayComplete);
  const labelColor = useConfigStore((s) => s.labelColor);

  return mapPlayComplete ? <Label $color={labelColor} {...props} /> : null;
}
