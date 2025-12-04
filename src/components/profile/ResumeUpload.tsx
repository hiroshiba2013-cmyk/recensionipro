import { useState, useEffect } from 'react';
import { FileText, Upload, Download, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ResumeUploadProps {
  userId: string;
  currentResumeUrl: string | null;
  onUpdate: () => void;
}

export function ResumeUpload({ userId, currentResumeUrl, onUpdate }: ResumeUploadProps) {
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
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

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
        .from('profiles')
        .update({ resume_url: filePath })
        .eq('id', userId);

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
      a.download = resumeName || 'curriculum.pdf';
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
        .from('profiles')
        .update({ resume_url: null })
        .eq('id', userId);

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
    <div className="bg-white rounded-xl shadow-md p-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Curriculum Vitae</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {currentResumeUrl && resumeName ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-semibold text-gray-900">{resumeName}</p>
                <p className="text-sm text-gray-600">Documento PDF caricato</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Scarica
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Carica il tuo Curriculum
            </h3>
            <p className="text-gray-600 mb-4">
              File PDF, massimo 5MB
            </p>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-semibold">
              <Upload className="w-5 h-5" />
              {uploading ? 'Caricamento...' : 'Seleziona File'}
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
