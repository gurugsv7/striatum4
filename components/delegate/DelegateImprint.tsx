import { cn } from "@/lib/utils/cn";

export type DelegateImprintState = "unassigned" | "pending" | "rejected" | "active";

export interface DelegateImprintProps {
  state: DelegateImprintState;
  delegateId?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_PX: Record<NonNullable<DelegateImprintProps["size"]>, number> = {
  sm: 120,
  md: 180,
  lg: 240,
};

/**
 * Hand-authored branch paths radiating from the identification axis.
 * Deterministic — fixed coordinates, no Math.random, so server and client
 * render identically.
 */
const BRANCHES = [
  { d: "M100,100 C74,92 44,74 22,42", node: [22, 42] },
  { d: "M100,100 C126,92 156,74 178,42", node: [178, 42] },
  { d: "M100,100 C78,122 48,142 26,166", node: [26, 166] },
  { d: "M100,100 C122,122 152,142 174,166", node: [174, 166] },
  { d: "M100,64 C82,54 58,40 38,24", node: [38, 24] },
  { d: "M100,136 C118,148 142,158 162,174", node: [162, 174] },
] as const;

export function DelegateImprint({
  state,
  delegateId,
  size = "md",
  className,
}: DelegateImprintProps) {
  const px = SIZE_PX[size];

  const idLine =
    state === "active" && delegateId
      ? `ID / ${delegateId}`
      : state === "pending"
        ? "ID / PENDING"
        : state === "rejected"
          ? "ID / ——————"
          : "ID / ——————";

  const identityLine =
    state === "active"
      ? "IDENTITY / VERIFIED"
      : state === "pending"
        ? "IDENTITY / UNDER REVIEW"
        : state === "rejected"
          ? "IDENTITY / VERIFICATION FAILED"
          : "IDENTITY / UNASSIGNED";

  const accessLine =
    state === "active"
      ? "ACCESS / GRANTED"
      : state === "rejected"
        ? "ACCESS / DENIED"
        : state === "pending"
          ? "ACCESS / PENDING"
          : "ACCESS / LOCKED";

  const branchColor =
    state === "unassigned"
      ? "var(--ice-700)"
      : state === "pending"
        ? "var(--signal-600)"
        : state === "rejected"
          ? "var(--ice-700)"
          : "var(--signal-500)";

  const nodeColor =
    state === "active"
      ? "var(--signal-400)"
      : state === "pending"
        ? "var(--signal-500)"
        : state === "rejected"
          ? "var(--warning)"
          : "var(--ice-700)";

  const dashed = state === "unassigned";
  const breathing = state === "pending";
  const propagate = state === "active";

  return (
    <div className={cn("inline-flex flex-col items-start gap-3", className)}>
      <svg
        role="img"
        aria-label={`Delegate imprint: ${state}`}
        width={px}
        height={px}
        viewBox="0 0 200 200"
        className={cn(breathing && "[animation:signal-breathe_2800ms_ease-in-out_infinite]")}
      >
        {/* membrane / cellular contour lines */}
        <ellipse
          cx={100}
          cy={100}
          rx={78}
          ry={90}
          fill="none"
          stroke="var(--line-200)"
          strokeWidth={1}
          strokeDasharray="1 7"
          opacity={0.6}
        />
        <ellipse
          cx={100}
          cy={100}
          rx={54}
          ry={64}
          fill="none"
          stroke="var(--line-200)"
          strokeWidth={1}
          strokeDasharray="1 6"
          opacity={0.4}
        />

        {/* neural branch paths */}
        {BRANCHES.map((branch, i) => {
          const isBroken = state === "rejected" && i === 1;
          if (isBroken) {
            return (
              <g key={branch.d}>
                <path
                  d="M100,100 C114,96 132,88 146,78"
                  fill="none"
                  stroke={branchColor}
                  strokeWidth={1.25}
                />
                <circle cx={146} cy={78} r={3} fill="var(--warning)" />
                <path
                  d="M160,66 C169,58 174,50 178,42"
                  fill="none"
                  stroke="var(--warning)"
                  strokeWidth={1}
                  strokeDasharray="1 4"
                  opacity={0.7}
                />
              </g>
            );
          }
          return (
            <g key={branch.d}>
              <path
                d={branch.d}
                fill="none"
                stroke={branchColor}
                strokeWidth={1.25}
                strokeDasharray={dashed ? "1 5" : undefined}
                pathLength={propagate ? 1 : undefined}
                style={
                  propagate
                    ? {
                        strokeDasharray: 1,
                        strokeDashoffset: 1,
                        animation: `imprint-propagate 1100ms cubic-bezier(0.16,1,0.3,1) ${i * 90}ms forwards`,
                      }
                    : undefined
                }
              />
              <circle
                cx={branch.node[0]}
                cy={branch.node[1]}
                r={state === "unassigned" ? 1.5 : 2.5}
                fill={nodeColor}
                opacity={state === "unassigned" ? 0.5 : 1}
              />
            </g>
          );
        })}

        {/* identification axis */}
        <line
          x1={100}
          y1={16}
          x2={100}
          y2={184}
          stroke={state === "unassigned" ? "var(--line-200)" : nodeColor}
          strokeWidth={1}
          strokeDasharray={state === "unassigned" ? "1 5" : undefined}
        />
        {[32, 66, 100, 134, 168].map((y) => (
          <line
            key={y}
            x1={96}
            y1={y}
            x2={104}
            y2={y}
            stroke={state === "unassigned" ? "var(--line-200)" : nodeColor}
            strokeWidth={1}
            opacity={0.7}
          />
        ))}

        {/* origin / signal seed */}
        <circle
          cx={100}
          cy={100}
          r={state === "unassigned" ? 2 : 3}
          fill={nodeColor}
        />
      </svg>

      <div className="flex flex-col gap-0.5 font-mono text-xs tracking-[0.04em] text-ice-500">
        <span>{idLine}</span>
        <span
          className={cn(
            state === "active" && "text-signal-500",
            state === "rejected" && "text-warning",
          )}
        >
          {identityLine}
        </span>
        <span>{accessLine}</span>
        {state === "active" ? (
          <span className="mt-1 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-signal-500">
            ACTIVE
          </span>
        ) : null}
      </div>
    </div>
  );
}
