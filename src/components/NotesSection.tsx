import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface NotesSectionProps {
  officeId: number | null;
  month: number;
  year: number;
  onDataLoaded?: (hasData: boolean) => void;
}

export default function NotesSection({ 
  officeId, 
  month, 
  year,
  onDataLoaded 
}: NotesSectionProps) {
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load notes when office/month changes
  useEffect(() => {
    if (officeId) {
      loadNotes();
    }
  }, [officeId, month, year]);

  const loadNotes = async () => {
    if (!officeId) return;
    
    setLoading(true);
    try {
      const notes = await invoke<string | null>('get_notes', {
        officeId,
        year,
        month,
      });

      if (notes) {
        setNoteText(notes);
        onDataLoaded?.(true);
      } else {
        setNoteText('');
        onDataLoaded?.(false);
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to load notes:', err);
      setNoteText('');
      onDataLoaded?.(false);
    } finally {
      setLoading(false);
    }
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteText(e.target.value);
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!officeId) return;

    setSaving(true);
    setSaveStatus('idle');

    try {
      await invoke('save_note', {
        officeId,
        year,
        month,
        noteText: noteText.trim(),
      });

      setSaveStatus('success');
      setHasUnsavedChanges(false);
      onDataLoaded?.(noteText.trim().length > 0);

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save notes:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (!officeId) {
    return (
      <div className="text-center text-gray-500 py-8">
        Please select an office to enter notes
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-8">
        Loading notes...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-end items-center gap-3">
        {hasUnsavedChanges && (
          <span className="text-sm text-yellow-600">● Unsaved changes</span>
        )}
        {saveStatus === 'success' && (
          <span className="text-sm text-green-600">✓ Saved successfully</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-sm text-red-600">✗ Save failed</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !hasUnsavedChanges}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Notes Textarea */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monthly Notes & Actions
        </label>
        <textarea
          value={noteText}
          onChange={handleNoteChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
          rows={8}
          placeholder="Add notes, observations, or action items for this month..."
        />
        <div className="text-xs text-gray-500 mt-2">
          {noteText.length} characters
        </div>
      </div>
    </div>
  );
}

