// src/components/CreateGroupForm.tsx
import React, { useState, FormEvent } from 'react';

const API_BASE =
  ((import.meta as any).env?.VITE_API_BASE as string | undefined) ??
  'http://localhost:5050';

export function CreateGroupForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);

    if (!name.trim()) {
      setStatus('Group name is required.');
      return;
    }

    try {
      setSubmitting(true);

      // this assumes login stored the JWT token in localStorage
      const auth = localStorage.getItem('auth');
      const token = auth ? JSON.parse(auth).token : null;
      if (!token) {
        setStatus('You must be logged in to create a group.');
        return;
      }

      const resp = await fetch(`${API_BASE}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isPublic,
        }),
      });

      const data = await resp.json();

      if (!resp.ok || !data.ok) {
        setStatus(data.error || 'Failed to create group.');
        return;
      }

      setStatus('Group created successfully!');
      setName('');
      setDescription('');
      setIsPublic(true);
    } catch (err) {
      console.error(err);
      setStatus('Something went wrong while creating the group.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>Create a New Group</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label>
          Group name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="CS Freshman Hangout"
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this group is for"
            rows={3}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Make this group public (discoverable to others)
        </label>

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#ff00ff',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {submitting ? 'Creating...' : 'Create Group'}
        </button>

        {status && (
          <div style={{ marginTop: '0.75rem', color: 'white' }}>
            {status}
          </div>
        )}
      </form>
    </div>
  );
}
