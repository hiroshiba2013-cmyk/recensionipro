import { useState, useEffect } from 'react';
import { FileText, Upload, Download, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FamilyMemberResumeUploadProps {
  memberId: string;
  currentResumeUrl: string | null;
  memberName: string;
  onUpdate: () => void;
}

export function FamilyMemberResumeUpload({
  memberId,
  currentResumeUrl,
  memberName,
  onUpdate
}: FamilyMemberResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);

  useEffect(() => {
    if (currentResumeUrl) {
      const fileName = currentResumeUrl.split('/').pop() || 'curriculum.pdf';
      setResumeName(fileName);
    }
  }, [currentResumeUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Solo file PDF sono accettati');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Il file deve essere inferiore a 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const fileExt = 'pdf';
      const fileName = `family-member-${memberId}-${Date.now()}.${fileExt}`;
      const filePath = `family-members/${fileName}`;

      if (currentResumeUrl) {
        const oldPath = currentResumeUrl.split('/resumes/')[1];
        if (oldPath) {
          await supabase.storage.from('resumes').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('customer_family_members')
        .update({ resume_url: filePath })
        .eq('id', memberId);

      if (updateError) throw updateError;

      setResumeName(file.name);
      onUpdate();
    } catch (err) {
      console.error('Error uploading resume:', err);
      setError('Errore durante il caricamento del file');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDownload = async () => {
    if (!currentResumeUrl) return;

    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(currentResumeUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = resumeName || `curriculum-${memberName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading resume:', err);
      setError('Errore durante il download del file');
    }
  };

  const handleDelete = async () => {
    if (!currentResumeUrl || !confirm('Sei sicuro di voler eliminare il curriculum?')) return;

    setDeleting(true);
    try {
      const { error: deleteError } = await supabase.storage
        .from('resumes')
        .remove([currentResumeUrl]);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from('customer_family_members')
        .update({ resume_url: null })
        .eq('id', memberId);

      if (updateError) throw updateError;

      setResumeName(null);
      onUpdate();
    } catch (err) {
      console.error('Error deleting resume:', err);
      setError('Errore durante l\'eliminazione del file');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Curriculum Vitae</h4>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {currentResumeUrl && resumeName ? (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{resumeName}</p>
              <p className="text-xs text-gray-600">PDF caricato</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Scarica"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Elimina"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-3">
              File PDF, max 5MB
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer text-sm font-semibold">
              <Upload className="w-4 h-4" />
              {uploading ? 'Caricamento...' : 'Carica CV'}
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
