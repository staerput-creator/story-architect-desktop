export default function ConditionsEditor({ conditions, onChange, variables }) {
  const patch = (index, value) => onChange(conditions.map((c, i) => i === index ? { ...c, ...value } : c));
  return <div className="condition-editor">
    {conditions.map((c, i) => <div key={i} style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
      {i > 0 && <select aria-label="Логический оператор" value={c.logicalOp || 'AND'} onChange={(e) => patch(i, { logicalOp: e.target.value })}><option>AND</option><option>OR</option></select>}
      <select aria-label="Переменная" value={c.varId} onChange={(e) => patch(i, { varId: e.target.value, value: variables.find((v) => v.id === e.target.value)?.type === 'boolean' ? true : 0 })}>
        {variables.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
      </select>
      <select aria-label="Сравнение" value={c.operator} onChange={(e) => patch(i, { operator: e.target.value })}>{['==', '!=', '>=', '>', '<=', '<'].map((op) => <option key={op}>{op}</option>)}</select>
      {variables.find((v) => v.id === c.varId)?.type === 'boolean'
        ? <select aria-label="Значение" value={String(c.value)} onChange={(e) => patch(i, { value: e.target.value === 'true' })}><option value="true">Да</option><option value="false">Нет</option></select>
        : <input aria-label="Значение" type="number" style={{ width: 75 }} value={c.value} onChange={(e) => patch(i, { value: Number(e.target.value) })} />}
      <button onClick={() => onChange(conditions.filter((_, index) => i !== index))}>×</button>
    </div>)}
    <button disabled={!variables.length} onClick={() => onChange([...conditions, { varId: variables[0].id, operator: '==', value: variables[0].type === 'boolean' ? true : 0, logicalOp: 'AND' }])}>+ Условие</button>
  </div>;
}