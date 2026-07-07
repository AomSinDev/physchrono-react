const data = [6, 7, 9, 4, 3.5, 8, 4, 7, 8.5, 4, 3, 7, 10]
const MAX = 10

export default function BarChart() {
  return (
    <div className="bar-chart">
      {data.map((val, idx) => (
        <div className="bar" key={idx}>
          <div className="bar-val">{val}</div>
          <div
            className="bar-fill"
            style={{
              height: `${(val / MAX) * 100}%`,
              animationDelay: `${idx * 0.06}s`,
            }}
          />
        </div>
      ))}
    </div>
  )
}
