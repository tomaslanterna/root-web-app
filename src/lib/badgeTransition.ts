interface BadgeRect { left: number; top: number; width: number; height: number }
export function badgeTransitionFrames(source: BadgeRect, target: BadgeRect, opening: boolean) {
  const small = `translate(${source.left - target.left}px, ${source.top - target.top}px) scale(${source.width / target.width})`;
  const large = "translate(0px, 0px) scale(1)";
  return opening ? [{ transform: small }, { transform: large }] : [{ transform: large }, { transform: small }];
}
