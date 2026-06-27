function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.last_page <= 1) return null

  const { current_page, last_page } = pagination

  return (
    <div className="pagination">
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={current_page <= 1}
        onClick={() => onChange(current_page - 1)}
      >
        Précédent
      </button>
      <span className="muted">
        Page {current_page} / {last_page}
      </span>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={current_page >= last_page}
        onClick={() => onChange(current_page + 1)}
      >
        Suivant
      </button>
    </div>
  )
}

export default Pagination
