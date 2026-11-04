export interface ProgressDotsProps {
  completed: number
  total: number
}

export function ProgressDots({ completed, total }: ProgressDotsProps) {
  return (
    <span aria-hidden="true" style={{ display: "flex", gap: 5 }}>
      {Array.from({ length: Math.max(0, Math.min(20, total)) }, (_, index) => (
        <span
          key={index}
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "3px solid #1B1030",
            background: index < completed ? "#3DDC6A" : "#FFFFFF",
          }}
        />
      ))}
    </span>
  )
}
