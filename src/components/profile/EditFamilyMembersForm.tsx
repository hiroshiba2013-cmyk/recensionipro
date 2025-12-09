import { useState, useEffect } from 'react';
import { Users, Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string;
  date_of_birth: string;
  tax_code: string;
}

interface EditFamilyMembersFormProps {
  customerId: string;
  onUpdate: () => void;
}

export function EditFamilyMembersForm({ customerId, onUpdate }: EditFamilyMembersFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFamilyMembers();
  }, [customerId]);

  const loadFamilyMembers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('customer_family_members')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });

    if (data) {
      setFamilyMembers(data);
    }
    setLoading(false);
  };

  const handleAddMember = () => {
    setFamilyMembers([
      ...familyMembers,
      {
        id: `new-${Date.now()}`,
        first_name: '',
        last_name: '',
        nickname: '',
        date_of_birth: '',
        tax_code: '',
      },
    ]);
  };

  const handleRemoveMember = async (id: string) => {
    if (id.startsWith('new-')) {
      setFamilyMembers(familyMembers.filter(m => m.id !== id));
    } else {
      if (!confirm('Sei sicuro di voler rimuovere questo membro?')) return;

      const { error } = await supabase
        .from('customer_family_members')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting family member:', error);
        alert('Errore durante l\'eliminazione');
      } else {
        setFamilyMembers(familyMembers.filter(m => m.id !== id));
        onUpdate();
      }
    }
  };

  const handleChange = (id: string, field: keyof FamilyMember, value: string) => {
    setFamilyMembers(familyMembers.map(member =>
      member.id === id ? { ...member, [field]: value } : member
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      for (const member of familyMembers) {
        if (member.id.startsWith('new-')) {
          const { error } = await supabase
            .from('customer_family_members')
            .insert({
              customer_id: customerId,
              first_name: member.first_name,
              last_name: member.last_name,
              nickname: member.nickname,
              date_of_birth: member.date_of_birth,
              tax_code: member.tax_code,
            });

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('customer_family_members')
            .update({
              first_name: member.first_name,
              last_name: member.last_name,
              nickname: member.nickname,
              date_of_birth: member.date_of_birth,
              tax_code: member.tax_code,
            })
            .eq('id', member.id);

          if (error) throw error;
        }
      }

      setIsEditing(false);
      await loadFamilyMembers();
      onUpdate();
    } catch (error) {
      console.error('Error updating family members:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    loadFamilyMembers();
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Membri della Famiglia</h2>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Modifica
          </button>
        </div>

        {familyMembers.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Nessun membro della famiglia aggiunto</p>
        ) : (
          <div className="space-y-6">
            {familyMembers.map((member, index) => (
              <div key={member.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Membro {index + 1}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Nome</p>
                    <p className="text-lg font-semibold text-gray-900">{member.first_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Cognome</p>
                    <p className="text-lg font-semibold text-gray-900">{member.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Nickname</p>
                    <p className="text-lg font-semibold text-gray-900">{member.nickname}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Data di Nascita</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(member.date_of_birth).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Codice Fiscale</p>
                    <p className="text-lg font-semibold text-gray-900">{member.tax_code}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Modifica Membri della Famiglia</h2>
        </div>
        <button
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-800"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6 mb-6">
          {familyMembers.map((member, index) => (
            <div key={member.id} className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900">Membro {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Rimuovi
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={member.first_name}
                    onChange={(e) => handleChange(member.id, 'first_name', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cognome
                  </label>
                  <input
                    type="text"
                    value={member.last_name}
                    onChange={(e) => handleChange(member.id, 'last_name', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nickname
                  </label>
                  <input
                    type="text"
                    value={member.nickname}
                    onChange={(e) => handleChange(member.id, 'nickname', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Data di Nascita
                  </label>
                  <input
                    type="date"
                    value={member.date_of_birth}
                    onChange={(e) => handleChange(member.id, 'date_of_birth', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Codice Fiscale
                  </label>
                  <input
                    type="text"
                    value={member.tax_code}
                    onChange={(e) => handleChange(member.id, 'tax_code', e.target.value.toUpperCase())}
                    required
                    maxLength={16}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddMember}
          className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold mb-6 w-full"
        >
          <Plus className="w-5 h-5" />
          Aggiungi Membro
        </button>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
