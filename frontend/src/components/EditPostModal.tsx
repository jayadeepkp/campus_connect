import { useState } from "react"

export default function EditPostModal({ original, onSave, onCancel }) {
  const [text, setText] = useState(original);

  return (
    <div className="modal">
      <div className="modal-content">
        <h4>Edit Post</h4>
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
        <div className="modal-buttons">
          <button onClick={() => onSave(text)}>Save</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
