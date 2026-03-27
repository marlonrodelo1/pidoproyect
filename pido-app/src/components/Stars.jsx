export default function Stars({ rating, size = 12 }) {
  return (
    <span style={{ color: '#F59E0B', fontSize: size }}>
      {'★'.repeat(Math.floor(rating))}
      <span style={{ color: 'var(--c-muted)', marginLeft: 4, fontSize: size }}>{rating}</span>
    </span>
  )
}
